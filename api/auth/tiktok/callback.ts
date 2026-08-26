import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../../_lib/mongodb'
import { SocialAccount } from '../../../_lib/models/SocialAccount'
import { exchangeTikTokCode, getTikTokUserInfo, encryptToken } from '../../../_lib/oauth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    const { code, state, error: authError } = req.query

    if (authError) {
      return res.redirect(`/?error=tiktok_auth_denied&reason=${authError}`)
    }

    if (!code || typeof code !== 'string') {
      return res.redirect('/?error=tiktok_auth_missing_code')
    }

    // Verify state
    const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=')
      if (key && val) acc[key] = val
      return acc
    }, {} as Record<string, string>)

    if (state !== cookies?.tiktok_oauth_state) {
      return res.redirect('/?error=tiktok_auth_invalid_state')
    }

    // Exchange code for tokens
    const tokenData = await exchangeTikTokCode(code)

    // Get user info
    const user = await getTikTokUserInfo(tokenData.access_token)

    // Store account
    await connectDB()

    await SocialAccount.findOneAndUpdate(
      { platform: 'tiktok', platformAccountId: tokenData.open_id },
      {
        platform: 'tiktok',
        platformAccountId: tokenData.open_id,
        accountName: user.display_name,
        accountUsername: user.display_name,
        profileImageUrl: user.avatar_url,
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: encryptToken(tokenData.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        scopes: tokenData.scope.split(','),
        status: 'active',
      },
      { upsert: true, new: true },
    )

    res.setHeader('Set-Cookie', 'tiktok_oauth_state=; Path=/; HttpOnly; Max-Age=0')
    res.redirect('/?success=tiktok_connected')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.redirect(`/?error=tiktok_auth_failed&message=${encodeURIComponent(message)}`)
  }
}
