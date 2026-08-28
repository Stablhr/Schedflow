import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { SocialPost } from '../../_lib/models/SocialPost'
import { PublishingJob } from '../../_lib/models/PublishingJob'
import { makeIdempotencyKey } from '../../_lib/scheduler'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  try {
    await connectDB()
    const { id } = req.query
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invalid post ID' })
    }

    const post = await SocialPost.findById(id)
    if (!post) {
      return res.status(404).json({ ok: false, error: 'Post not found' })
    }

    const { platform } = req.body as { platform?: string }

    // Which platforms to retry: failed ones (optionally a single requested platform).
    const targets = post.platforms.filter(
      (p) => p.enabled && p.status === 'failed' && (!platform || p.platform === platform),
    )

    if (targets.length === 0) {
      return res.status(400).json({ ok: false, error: 'No failed platforms to retry' })
    }

    const now = new Date()
    const scheduledAt = post.scheduledAt && post.scheduledAt > now ? post.scheduledAt : now

    const jobsCreated: string[] = []
    const jobsSkipped: string[] = []

    for (const p of targets) {
      // Reset per-platform retry bookkeeping.
      p.retryCount = 0
      p.maxRetries = 3
      p.error = undefined
      p.errorCode = undefined
      p.lastAttemptAt = undefined
      p.nextRetryAt = undefined
      p.status = 'scheduled'

      const key = makeIdempotencyKey(String(post._id), p.platform, `${scheduledAt.toISOString()}-retry-${Date.now()}`)

      // Mark any previous failed job for this platform as superseded.
      await PublishingJob.updateMany(
        { socialPostId: id, platform: p.platform, status: 'failed' },
        { $set: { status: 'cancelled' } },
      )

      const existing = await PublishingJob.findOne({
        socialPostId: id,
        platform: p.platform,
        status: { $in: ['queued', 'locked', 'publishing'] },
      })
      if (existing) {
        jobsSkipped.push(p.platform)
        continue
      }

      const job = await PublishingJob.create({
        socialPostId: id,
        platform: p.platform,
        idempotencyKey: key,
        status: 'queued',
        retryCount: 0,
        nextRetryAt: scheduledAt,
      })
      jobsCreated.push(String(job._id))
    }

    post.status = targets.some((t) => t.status === 'scheduled') ? 'scheduled' : post.status
    await post.save()

    const lean: Record<string, unknown> = {
      ...(post as unknown as Record<string, unknown>),
      scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : undefined,
    }

    return res.status(200).json({
      ok: true,
      data: {
        post: lean,
        retried: targets.map((t) => t.platform),
        jobsCreated,
        jobsSkipped,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
