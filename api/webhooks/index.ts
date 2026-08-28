import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../_lib/mongodb'
import { Webhook } from '../_lib/models/Webhook'
import { WEBHOOK_EVENTS } from '../_lib/webhooks'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const webhooks = await Webhook.find().sort({ createdAt: -1 }).lean()
      return res.status(200).json({ ok: true, data: webhooks })
    }

    if (req.method === 'POST') {
      const { name, url, events, secret } = req.body
      if (!name || !url || !Array.isArray(events) || events.length === 0) {
        return res.status(400).json({ ok: false, error: 'name, url, and events are required' })
      }
      const invalidEvent = events.find((e: string) => !WEBHOOK_EVENTS.includes(e))
      if (invalidEvent) {
        return res.status(400).json({ ok: false, error: `Unknown event: ${invalidEvent}` })
      }
      if (!/^https?:\/\//.test(url)) {
        return res.status(400).json({ ok: false, error: 'url must start with http(s)://' })
      }
      const webhook = await Webhook.create({ name, url, secret: secret ?? '', events, enabled: true })
      return res.status(201).json({ ok: true, data: webhook })
    }

    if (req.method === 'PUT') {
      const { id } = req.query
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ ok: false, error: 'Invalid webhook id' })
      }
      const updated = await Webhook.findByIdAndUpdate(id, req.body, { new: true }).lean()
      if (!updated) return res.status(404).json({ ok: false, error: 'Webhook not found' })
      return res.status(200).json({ ok: true, data: updated })
    }

    if (req.method === 'DELETE') {
      const { id } = req.query
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ ok: false, error: 'Invalid webhook id' })
      }
      await Webhook.findByIdAndDelete(id)
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
