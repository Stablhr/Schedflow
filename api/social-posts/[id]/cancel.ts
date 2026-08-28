import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { SocialPost } from '../../_lib/models/SocialPost'
import { cancelPendingJobs } from '../../_lib/scheduler'

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

    // Cancel queued/locked/publishing jobs for the post (optionally a single platform).
    await cancelPendingJobs(id, platform || undefined)

    if (platform) {
      const p = post.platforms.find((pl) => pl.platform === platform)
      if (p) p.status = 'cancelled'
    } else {
      for (const p of post.platforms) {
        if (p.enabled && (p.status === 'scheduled' || p.status === 'publishing')) {
          p.status = 'cancelled'
        }
      }
    }

    // Compute overall status from per-platform statuses.
    const enabled = post.platforms.filter((p) => p.enabled)
    const allCancelled = enabled.length > 0 && enabled.every((p) => p.status === 'cancelled')
    const anyActive = enabled.some((p) => p.status === 'scheduled' || p.status === 'publishing')
    const anyPosted = enabled.some((p) => p.status === 'posted')
    if (allCancelled) {
      post.status = 'cancelled'
    } else if (!anyActive) {
      post.status = anyPosted ? 'posted' : enabled.length === 0 ? 'draft' : 'failed'
    }

    await post.save()

    const lean: Record<string, unknown> = {
      ...(post as unknown as Record<string, unknown>),
      scheduledAt: post.scheduledAt ? post.scheduledAt.toISOString() : undefined,
    }

    return res.status(200).json({ ok: true, data: { post: lean } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
