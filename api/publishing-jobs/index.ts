import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { PublishingJob } from '../../_lib/models/PublishingJob'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const { socialPostId, status } = req.query
      const filter: Record<string, unknown> = {}
      if (socialPostId && typeof socialPostId === 'string') filter.socialPostId = socialPostId
      if (status && typeof status === 'string') filter.status = status

      const jobs = await PublishingJob.find(filter).sort({ createdAt: -1 }).lean()
      return res.status(200).json({ ok: true, data: jobs })
    }

    if (req.method === 'POST') {
      const { socialPostId, platform, idempotencyKey } = req.body
      if (!socialPostId || !platform || !idempotencyKey) {
        return res.status(400).json({ ok: false, error: 'socialPostId, platform, and idempotencyKey are required' })
      }

      // Check for existing job with same idempotency key
      const existing = await PublishingJob.findOne({ idempotencyKey })
      if (existing) {
        return res.status(200).json({ ok: true, data: existing })
      }

      const job = await PublishingJob.create({
        socialPostId,
        platform,
        idempotencyKey,
        status: 'queued',
        nextRetryAt: new Date(),
      })

      return res.status(201).json({ ok: true, data: job })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
