import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { SocialPost } from '../../_lib/models/SocialPost'
import { success, error } from '../../_lib/response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB()
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invalid post ID' })
    }

    if (req.method === 'GET') {
      const post = await SocialPost.findById(id).lean()
      if (!post) {
        return res.status(404).json({ ok: false, error: 'Post not found' })
      }
      return res.status(200).json({ ok: true, data: post })
    }

    if (req.method === 'PUT') {
      const body = req.body
      // Prevent overwriting timestamps
      delete body.createdAt
      delete body._id

      const post = await SocialPost.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean()
      if (!post) {
        return res.status(404).json({ ok: false, error: 'Post not found' })
      }
      return res.status(200).json({ ok: true, data: post })
    }

    if (req.method === 'DELETE') {
      const post = await SocialPost.findByIdAndDelete(id).lean()
      if (!post) {
        return res.status(404).json({ ok: false, error: 'Post not found' })
      }
      return res.status(200).json({ ok: true, data: { deleted: true } })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
