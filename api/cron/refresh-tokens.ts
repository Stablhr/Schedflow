import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../_lib/mongodb'
import { SocialAccount } from '../../_lib/models/SocialAccount'
import { createNotification } from '../../_lib/models/TaskNotification'
import { decryptToken, encryptToken, refreshYouTubeToken, refreshTikTokToken } from '../../_lib/oauth'

const REFRESH_BUFFER_MS = 60 * 60 * 1000 // 1 hour before expiry

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron auth
  const authHeader = req.headers.authorization
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  try {
    await connectDB()

    const now = new Date()
    const refreshThreshold = new Date(now.getTime() + REFRESH_BUFFER_MS)

    // Find accounts that need token refresh
    const accounts = await SocialAccount.find({
      status: 'active',
      tokenExpiresAt: { $lte: refreshThreshold },
    })

    const results: Array<{ id: string; platform: string; status: string; error?: string }> = []

    for (const account of accounts) {
      try {
        if (account.platform === 'youtube') {
          const refreshToken = decryptToken(account.refreshToken)
          const tokenData = await refreshYouTubeToken(refreshToken)

          account.accessToken = encryptToken(tokenData.access_token)
          account.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
          account.status = 'active'
          await account.save()
          results.push({ id: String(account._id), platform: 'youtube', status: 'refreshed' })
        } else if (account.platform === 'tiktok') {
          const refreshToken = decryptToken(account.refreshToken)
          const tokenData = await refreshTikTokToken(refreshToken)

          account.accessToken = encryptToken(tokenData.access_token)
          account.refreshToken = encryptToken(tokenData.refresh_token)
          account.tokenExpiresAt = new Date(Date.now() + tokenData.expires_in * 1000)
          account.status = 'active'
          await account.save()
          results.push({ id: String(account._id), platform: 'tiktok', status: 'refreshed' })
        } else if (account.platform === 'facebook' || account.platform === 'instagram') {
          // Facebook/Instagram: check validity, mark expired if needed
          const token = decryptToken(account.accessToken)
          const testRes = await fetch(
            `https://graph.facebook.com/v19.0/me?access_token=${token}`,
          )
          if (testRes.ok) {
            results.push({ id: String(account._id), platform: account.platform, status: 'still_valid' })
          } else {
            account.status = 'expired'
            await account.save()
            await createNotification({
              type: 'token_expired',
              message: `${account.platform} authentication for "${account.accountName}" expired — reconnect in Settings`,
              accountId: String(account._id),
              platform: account.platform,
              severity: 'warning',
            })
            results.push({ id: String(account._id), platform: account.platform, status: 'expired' })
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        // A refresh attempt that throws means the refresh token is likely revoked/invalid.
        account.status = 'expired'
        await account.save()
        await createNotification({
          type: 'token_revoked',
          message: `${account.platform} authentication for "${account.accountName}" could not be refreshed — reconnect in Settings (${message})`,
          accountId: String(account._id),
          platform: account.platform,
          severity: 'error',
        })
        results.push({ id: String(account._id), platform: account.platform, status: 'failed', error: message })
      }
    }

    return res.status(200).json({
      ok: true,
      data: { checked: accounts.length, results },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return res.status(500).json({ ok: false, error: message })
  }
}
