import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../../_lib/mongodb'
import { SocialAccount } from '../../../_lib/models/SocialAccount'
import { exchangeYouTubeCode, getYouTubeChannelInfo, encryptToken } from '../../../_lib/oauth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    const { code, state, error: authError } = req.query

    if (authError) {
      return res.redirect(`/?error=youtube_auth_denied&reason=${authError}`)
    }

    if (!code || typeof code !== 'string') {
      return res.redirect('/?error=youtube_auth_missing_code')
    }

    // Verify state (CSRF protection)
    const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=')
      if (key && val) acc[key] = val
      return acc
    }, {} as Record<string, string>)

    if (state !== cookies?.youtube_oauth_state) {
      return res.redirect('/?error=youtube_auth_invalid_state')
    }

    // Exchange code for tokens
    const tokenData = await exchangeYouTubeCode(code)

    // Get channel info
    const channel = await getYouTubeChannelInfo(tokenData.access_token)

    if (!channel) {
      return res.redirect('/?error=youtube_channel_not_found')
    }

    // Store account in database
    await connectDB()

    await SocialAccount.findOneAndUpdate(
      { platform: 'youtube', platformAccountId: channel.id },
      {
        platform: 'youtube',
        platformAccountId: channel.id,
        accountName: channel.title,
        accountUsername: channel.title,
        profileImageUrl: channel.thumbnails?.default?.url || '',
        accessToken: encryptToken(tokenData.access_token),
        refreshToken: encryptToken(tokenData.refresh_token),
        tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        scopes: tokenData.scope.split(' '),
        status: 'active',
      },
      { upsert: true, new: true },
    )

    // Clear the state cookie and redirect to success
    res.setHeader('Set-Cookie', 'youtube_oauth_state=; Path=/; HttpOnly; Max-Age=0')
    res.redirect('/?success=youtube_connected')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.redirect(`/?error=youtube_auth_failed&message=${encodeURIComponent(message)}`)
  }
}
