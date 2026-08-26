import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../_lib/mongodb'
import { SocialAccount } from '../_lib/models/SocialAccount'
import { success, error } from '../_lib/response'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    await connectDB()

    if (req.method === 'GET') {
      const accounts = await SocialAccount.find()
        .select('-accessToken -refreshToken') // Never expose tokens to frontend
        .lean()
      return res.status(200).json({ ok: true, data: accounts })
    }

    if (req.method === 'POST') {
      const body = req.body

      if (!body.platform || !body.platformAccountId || !body.accountName || !body.accessToken) {
        return res.status(400).json({
          ok: false,
          error: 'platform, platformAccountId, accountName, and accessToken are required',
        })
      }

      // Upsert: update if account already exists, create otherwise
      const account = await SocialAccount.findOneAndUpdate(
        { platform: body.platform, platformAccountId: body.platformAccountId },
        {
          platform: body.platform,
          platformAccountId: body.platformAccountId,
          accountName: body.accountName,
          accountUsername: body.accountUsername || '',
          profileImageUrl: body.profileImageUrl || '',
          accessToken: body.accessToken,
          refreshToken: body.refreshToken || '',
          tokenExpiresAt: body.tokenExpiresAt || null,
          scopes: body.scopes || [],
          status: 'active',
        },
        { new: true, upsert: true },
      ).select('-accessToken -refreshToken')

      return res.status(201).json({ ok: true, data: account })
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
