import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { PublishingJob } from '../../_lib/models/PublishingJob'
import { SocialPost } from '../../_lib/models/SocialPost'
import { SocialAccount } from '../../_lib/models/SocialAccount'
import { createNotification } from '../../_lib/models/TaskNotification'
import { decryptToken } from '../../_lib/oauth'
import { youtubePublisher } from '../../_lib/publishers/youtube'
import { facebookPublisher } from '../../_lib/publishers/facebook'
import { instagramPublisher } from '../../_lib/publishers/instagram'
import { tiktokPublisher } from '../../_lib/publishers/tiktok'
import type { PlatformPublisher } from '../../_lib/publishers/types'

const publishers: Record<string, PlatformPublisher> = {
  youtube: youtubePublisher,
  facebook: facebookPublisher,
  instagram: instagramPublisher,
  tiktok: tiktokPublisher,
}

// Retry backoff: 1min, 5min, 30min, 2hr, 12hr
const RETRY_DELAYS = [60_000, 300_000, 1_800_000, 7_200_000, 43_200_000]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify this is a Vercel cron request
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Also allow in development without auth
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ ok: false, error: 'Unauthorized' })
    }
  }

  try {
    await connectDB()

    // Find all due queued jobs (not locked, nextRetryAt <= now)
    const dueJobs = await PublishingJob.find({
      status: { $in: ['queued'] },
      nextRetryAt: { $lte: new Date() },
    }).limit(10) // Process max 10 jobs per cron tick

    const results: Array<{ jobId: string; platform: string; status: string; error?: string }> = []

    for (const job of dueJobs) {
      // Lock the job (atomic update)
      const locked = await PublishingJob.findOneAndUpdate(
        { _id: job._id, status: 'queued' },
        { status: 'locked', lockedAt: new Date(), lockedBy: `cron-${Date.now()}` },
        { new: true },
      )

      if (!locked) continue // Another worker got it

      try {
        // Get the social post
        const post = await SocialPost.findById(job.socialPostId)
        if (!post) {
          await PublishingJob.findByIdAndUpdate(job._id, {
            status: 'failed',
            error: 'Social post not found',
            completedAt: new Date(),
          })
          results.push({ jobId: String(job._id), platform: job.platform, status: 'failed', error: 'Post not found' })
          continue
        }

        // Find the platform entry in the post
        const platformEntry = post.platforms.find(
          (p) => p.platform === job.platform && p.enabled,
        )
        if (!platformEntry) {
          await PublishingJob.findByIdAndUpdate(job._id, {
            status: 'failed',
            error: 'Platform not enabled on this post',
            completedAt: new Date(),
          })
          results.push({ jobId: String(job._id), platform: job.platform, status: 'failed', error: 'Platform not enabled' })
          continue
        }

        // Get the connected account for this platform
        const account = await SocialAccount.findOne({
          platform: job.platform,
          status: 'active',
        })
        if (!account) {
          await PublishingJob.findByIdAndUpdate(job._id, {
            status: 'failed',
            error: 'No connected account for this platform',
            completedAt: new Date(),
          })
          // Mark platform as failed
          platformEntry.status = 'failed'
          platformEntry.error = 'No connected account'
          await post.save()
          results.push({ jobId: String(job._id), platform: job.platform, status: 'failed', error: 'No account' })
          continue
        }

        // Get the publisher adapter
        const publisher = publishers[job.platform]
        if (!publisher) {
          await PublishingJob.findByIdAndUpdate(job._id, {
            status: 'failed',
            error: `No publisher adapter for ${job.platform}`,
            completedAt: new Date(),
          })
          results.push({ jobId: String(job._id), platform: job.platform, status: 'failed', error: 'No adapter' })
          continue
        }

        // Update post status to publishing
        post.status = 'publishing'
        platformEntry.status = 'publishing'
        await post.save()

        // Decrypt access token and publish
        const accessToken = decryptToken(account.accessToken)

        const result = await publisher.publish(
          {
            platform: platformEntry.platform,
            caption: platformEntry.caption || post.caption,
            hashtags: platformEntry.hashtags,
            mentions: platformEntry.mentions,
            visibility: platformEntry.visibility,
            location: platformEntry.location,
            altText: platformEntry.altText,
          },
          post.media.filter((m) => m.storageUrl), // Only media with cloud URLs
          accessToken,
        )

        if (result.success) {
          // Mark as posted
          platformEntry.status = 'posted'
          platformEntry.externalPostId = result.externalPostId
          platformEntry.publishedUrl = result.publishedUrl
          platformEntry.publishedAt = new Date().toISOString()
          platformEntry.error = undefined
          platformEntry.errorCode = undefined

          // Check if all platforms are done
          const allDone = post.platforms.every(
            (p) => !p.enabled || p.status === 'posted' || p.status === 'cancelled',
          )
          const anyFailed = post.platforms.some((p) => p.status === 'failed')
          post.status = allDone ? 'posted' : anyFailed ? 'partially_published' : 'publishing'

          await post.save()

          // Notify on publish success / partial failure
          const postedCount = post.platforms.filter((p) => p.enabled && p.status === 'posted').length
          if (allDone && !anyFailed) {
            await createNotification({
              type: 'publish_success',
              message: `${job.platform} post "${post.title}" published successfully`,
              socialPostId: String(post._id),
              platform: job.platform,
              severity: 'success',
            })
          } else if (anyFailed) {
            await createNotification({
              type: 'partial_success',
              message: `${postedCount} of ${post.platforms.filter((p) => p.enabled).length} platforms published for "${post.title}"`,
              socialPostId: String(post._id),
              platform: job.platform,
              severity: 'warning',
            })
          }

          await PublishingJob.findByIdAndUpdate(job._id, {
            status: 'completed',
            completedAt: new Date(),
            publishResult: {
              externalPostId: result.externalPostId,
              publishedUrl: result.publishedUrl,
            },
          })

          results.push({ jobId: String(job._id), platform: job.platform, status: 'completed' })
        } else {
          // Handle failure
          platformEntry.retryCount = (platformEntry.retryCount || 0) + 1
          platformEntry.lastAttemptAt = new Date().toISOString()
          platformEntry.error = result.error
          platformEntry.errorCode = result.errorCode

          if (result.retryable && platformEntry.retryCount < (platformEntry.maxRetries || 3)) {
            // Schedule retry
            const delay = RETRY_DELAYS[Math.min(platformEntry.retryCount, RETRY_DELAYS.length - 1)]
            const nextRetry = new Date(Date.now() + delay)
            platformEntry.nextRetryAt = nextRetry.toISOString()
            platformEntry.status = 'scheduled'

            await PublishingJob.findByIdAndUpdate(job._id, {
              status: 'queued',
              retryCount: job.retryCount + 1,
              nextRetryAt: nextRetry,
              error: result.error,
              errorCode: result.errorCode,
              lockedAt: undefined,
              lockedBy: undefined,
            })

            // Check if post should be partially_published
            const anyFailed = post.platforms.some((p) => p.status === 'failed')
            if (anyFailed) post.status = 'partially_published'
            else post.status = 'scheduled'

            await post.save()
            await createNotification({
              type: 'retry_scheduled',
              message: `Retrying ${job.platform} publish for "${post.title}" in ${Math.round(delay / 60000)} min`,
              socialPostId: String(post._id),
              platform: job.platform,
              severity: 'info',
            })
            results.push({ jobId: String(job._id), platform: job.platform, status: 'retry_scheduled' })
          } else {
            // Permanent failure
            platformEntry.status = 'failed'

            const allDone = post.platforms.every(
              (p) => !p.enabled || p.status === 'posted' || p.status === 'failed' || p.status === 'cancelled',
            )
            post.status = allDone ? (post.platforms.some((p) => p.status === 'posted') ? 'partially_published' : 'failed') : 'publishing'
            await post.save()

            // Notify on failure; flag all_failed if no platform succeeded.
            const anyPosted = post.platforms.some((p) => p.status === 'posted')
            await createNotification({
              type: anyPosted ? 'publish_failed' : 'all_failed',
              message: `${job.platform} publish failed for "${post.title}": ${result.error ?? 'error'}`,
              socialPostId: String(post._id),
              platform: job.platform,
              severity: 'error',
            })

            await PublishingJob.findByIdAndUpdate(job._id, {
              status: 'failed',
              completedAt: new Date(),
              error: result.error,
              errorCode: result.errorCode,
            })

            results.push({ jobId: String(job._id), platform: job.platform, status: 'failed' })
          }
        }
      } catch (err) {
        // Unexpected error — unlock job for retry
        const message = err instanceof Error ? err.message : 'Unknown error'
        await PublishingJob.findByIdAndUpdate(job._id, {
          status: 'queued',
          lockedAt: undefined,
          lockedBy: undefined,
          nextRetryAt: new Date(Date.now() + RETRY_DELAYS[0]),
          error: message,
        })
        results.push({ jobId: String(job._id), platform: job.platform, status: 'error', error: message })
      }
    }

    return res.status(200).json({ ok: true, data: { processed: results.length, results } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
