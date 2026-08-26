import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { SocialAccount } from '../../_lib/models/SocialAccount'
import { decryptToken, encryptToken, refreshYouTubeToken, refreshTikTokToken } from '../../_lib/oauth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    const { accountId } = req.body
    if (!accountId) {
      return res.status(400).json({ ok: false, error: 'accountId is required' })
    }

    await connectDB()
    const account = await SocialAccount.findById(accountId)
    if (!account) {
      return res.status(404).json({ ok: false, error: 'Account not found' })
    }

    if (account.platform === 'youtube') {
      const refreshToken = decryptToken(account.refreshToken)
      const tokenData = await refreshYouTubeToken(refreshToken)

      account.accessToken = encryptToken(tokenData.access_token)
      account.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
      account.status = 'active'
      await account.save()

      return res.status(200).json({ ok: true, data: { refreshed: true } })
    }

    if (account.platform === 'facebook' || account.platform === 'instagram') {
      // Facebook/Instagram long-lived tokens: validate, mark expired if needed
      const token = decryptToken(account.accessToken)
      const testRes = await fetch(
        `https://graph.facebook.com/v19.0/me?access_token=${token}`,
      )
      if (testRes.ok) {
        return res.status(200).json({ ok: true, data: { refreshed: false, stillValid: true } })
      }
      account.status = 'expired'
      await account.save()
      return res.status(200).json({ ok: true, data: { refreshed: false, expired: true } })
    }

    if (account.platform === 'tiktok') {
      const refreshToken = decryptToken(account.refreshToken)
      try {
        const tokenData = await refreshTikTokToken(refreshToken)

        account.accessToken = encryptToken(tokenData.access_token)
        account.refreshToken = encryptToken(tokenData.refresh_token)
        account.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
        account.status = 'active'
        await account.save()

        return res.status(200).json({ ok: true, data: { refreshed: true } })
      } catch {
        account.status = 'expired'
        await account.save()
        return res.status(200).json({ ok: true, data: { refreshed: false, expired: true } })
      }
    }

    return res.status(400).json({ ok: false, error: 'Unsupported platform' })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
