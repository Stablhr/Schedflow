import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../../_lib/mongodb'
import { SocialAccount } from '../../../_lib/models/SocialAccount'
import {
  exchangeFacebookCode,
  exchangeForLongLivedToken,
  getInstagramBusinessAccounts,
  encryptToken,
} from '../../../_lib/oauth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    const { code, state, error: authError } = req.query

    if (authError) {
      return res.redirect(`/?error=instagram_auth_denied&reason=${authError}`)
    }

    if (!code || typeof code !== 'string') {
      return res.redirect('/?error=instagram_auth_missing_code')
    }

    // Verify state
    const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=')
      if (key && val) acc[key] = val
      return acc
    }, {} as Record<string, string>)

    if (state !== cookies?.instagram_oauth_state) {
      return res.redirect('/?error=instagram_auth_invalid_state')
    }

    // Exchange code for short-lived token (same as Facebook flow)
    const shortToken = await exchangeFacebookCode(code)

    // Exchange for long-lived token
    const longToken = await exchangeForLongLivedToken(shortToken.access_token)

    // Get Instagram Business Accounts linked to Facebook Pages
    const pages = await getInstagramBusinessAccounts(longToken.access_token)

    const igAccounts = pages.filter((p) => p.instagram_business_account)

    if (igAccounts.length === 0) {
      return res.redirect('/?error=instagram_no_business_account')
    }

    // Store each Instagram account
    await connectDB()

    for (const page of igAccounts) {
      const ig = page.instagram_business_account!
      await SocialAccount.findOneAndUpdate(
        { platform: 'instagram', platformAccountId: ig.id },
        {
          platform: 'instagram',
          platformAccountId: ig.id,
          accountName: ig.name || ig.username,
          accountUsername: ig.username,
          profileImageUrl: '',
          // Store the Facebook Page access token (needed for Instagram Graph API)
          accessToken: encryptToken(page.access_token),
          refreshToken: encryptToken(longToken.access_token),
          tokenExpiresAt: new Date(Date.now() + longToken.expires_in * 1000),
          scopes: ['instagram_basic', 'instagram_content_publish', 'pages_read_engagement'],
          status: 'active',
        },
        { upsert: true, new: true },
      )
    }

    res.setHeader('Set-Cookie', 'instagram_oauth_state=; Path=/; HttpOnly; Max-Age=0')
    res.redirect(`/?success=instagram_connected&accounts=${igAccounts.length}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.redirect(`/?error=instagram_auth_failed&message=${encodeURIComponent(message)}`)
  }
}
