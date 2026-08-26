import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { SocialAccount } from '../../_lib/models/SocialAccount'
import { success, error } from '../../_lib/response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB()
    const { id } = req.query

    if (!id || typeof id !== 'string') {
      return res.status(400).json({ ok: false, error: 'Invalid account ID' })
    }

    if (req.method === 'GET') {
      const account = await SocialAccount.findById(id)
        .select('-accessToken -refreshToken')
        .lean()
      if (!account) {
        return res.status(404).json({ ok: false, error: 'Account not found' })
      }
      return res.status(200).json({ ok: true, data: account })
    }

    if (req.method === 'DELETE') {
      const account = await SocialAccount.findByIdAndDelete(id).lean()
      if (!account) {
        return res.status(404).json({ ok: false, error: 'Account not found' })
      }
      return res.status(200).json({ ok: true, data: { deleted: true } })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
