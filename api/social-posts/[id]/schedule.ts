import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { SocialPost } from '../../_lib/models/SocialPost'
import {
  localDateTimeToUTC,
  validatePostPlatforms,
  makeIdempotencyKey,
  queuePublishJob,
  computeRecurrence,
} from '../../_lib/scheduler'
import { youtubePublisher } from '../../_lib/publishers/youtube'
import { facebookPublisher } from '../../_lib/publishers/facebook'
import { instagramPublisher } from '../../_lib/publishers/instagram'
import { tiktokPublisher } from '../../_lib/publishers/tiktok'

const publishers = {
  youtube: youtubePublisher,
  facebook: facebookPublisher,
  instagram: instagramPublisher,
  tiktok: tiktokPublisher,
}

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

    const { scheduledDate, scheduledTime, timezone, repeat, repeatUntil } = req.body

    if (!scheduledDate) {
      return res.status(400).json({ ok: false, error: 'scheduledDate is required' })
    }

    const tz: string = timezone || post.timezone || 'UTC'
    let scheduledAt: Date
    try {
      scheduledAt = localDateTimeToUTC(scheduledDate, scheduledTime, tz)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid schedule'
      return res.status(400).json({ ok: false, error: message })
    }

    // Compute per-platform validation using each publisher's validate() rules.
    const validation = validatePostPlatforms(post, publishers)
    const invalid = validation.filter((v) => !v.valid)

    if (invalid.length > 0) {
      return res.status(400).json({
        ok: false,
        error: 'Post failed pre-publish validation',
        data: { scheduledAt: scheduledAt.toISOString(), validation },
      })
    }

    // Persist schedule info on the post.
    post.scheduledAt = scheduledAt
    post.timezone = tz
    post.status = 'scheduled'
    if (typeof repeat === 'string') post.repeat = repeat
    if (repeatUntil) post.repeatUntil = repeatUntil
    for (const pEntry of post.platforms) {
      if (pEntry.enabled && pEntry.status !== 'cancelled') {
        pEntry.status = 'scheduled'
        pEntry.error = undefined
        pEntry.errorCode = undefined
      }
    }
    await post.save()

    // Create a queued job for each enabled platform, scheduled to fire at the due time.
    const jobs: string[] = []
    const failedJobs: string[] = []

    // For recurring posts, pre-create jobs for each occurrence up to repeatUntil.
    const occurrences: Date[] = [scheduledAt]
    if (typeof repeat === 'string' && repeat !== 'none') {
      occurrences.push(...computeRecurrence(scheduledAt, repeat, post.repeatUntil))
    }

    const dueTimes = new Map<string, boolean>()
    for (const occ of occurrences) {
      const occKey = occ.toISOString()
      if (dueTimes.has(occKey)) continue
      dueTimes.set(occKey, true)
      for (const p of post.platforms) {
        if (!p.enabled || p.status === 'cancelled') continue
        const key = makeIdempotencyKey(String(post._id), p.platform, occKey)
        const job = await queuePublishJob(String(post._id), p.platform, occ, key)
        if (job) jobs.push(String(job._id))
        else failedJobs.push(`${p.platform}@${occKey}`)
      }
    }

    const lean: Record<string, unknown> = {
      ...(post as unknown as Record<string, unknown>),
      scheduledAt: post.scheduledAt?.toISOString(),
    }

    return res.status(200).json({
      ok: true,
      data: {
        post: lean,
        scheduledAt: scheduledAt.toISOString(),
        timezone: tz,
        jobsCreated: jobs,
        jobsSkipped: failedJobs,
        validation,
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
