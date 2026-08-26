import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../_lib/mongodb'
import { SocialPost } from '../_lib/models/SocialPost'
import { success, error } from '../_lib/response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const { status, platform, date } = req.query

      const filter: Record<string, unknown> = {}

      if (status && typeof status === 'string') {
        filter.status = status
      }

      if (platform && typeof platform === 'string') {
        filter.platforms = { $elemMatch: { platform, enabled: true } }
      }

      if (date && typeof date === 'string') {
        const dayStart = new Date(date)
        const dayEnd = new Date(date)
        dayEnd.setDate(dayEnd.getDate() + 1)
        filter.scheduledAt = { $gte: dayStart, $lt: dayEnd }
      }

      const posts = await SocialPost.find(filter).sort({ scheduledAt: 1, createdAt: -1 }).lean()
      return res.status(200).json({ ok: true, data: posts })
    }

    if (req.method === 'POST') {
      const body = req.body

      if (!body.title || typeof body.title !== 'string') {
        return res.status(400).json({ ok: false, error: 'Title is required' })
      }

      const post = await SocialPost.create({
        title: body.title,
        caption: body.caption || '',
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        timezone: body.timezone || 'UTC',
        status: body.status || 'draft',
        platforms: body.platforms || [],
        media: body.media || [],
        cardId: body.cardId || undefined,
        repeat: body.repeat || 'none',
        repeatUntil: body.repeatUntil || undefined,
        tags: body.tags || [],
        aiGeneration: body.aiGeneration || undefined,
      })

      return res.status(201).json({ ok: true, data: post })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
