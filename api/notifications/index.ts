import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { TaskNotification } from '../../_lib/models/TaskNotification'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const { unreadOnly, limit } = req.query
      const filter: Record<string, unknown> = {}
      if (unreadOnly === 'true') filter.read = false

      const notifications = await TaskNotification.find(filter)
        .sort({ createdAt: -1 })
        .limit(Number(limit) || 100)
        .lean()

      return res.status(200).json({ ok: true, data: notifications })
    }

    if (req.method === 'POST') {
      const { id } = req.body
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ ok: false, error: 'Notification id is required' })
      }

      const notification = await TaskNotification.findByIdAndUpdate(
        id,
        { read: true },
        { new: true },
      ).lean()

      if (!notification) {
        return res.status(404).json({ ok: false, error: 'Notification not found' })
      }
      return res.status(200).json({ ok: true, data: notification })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
