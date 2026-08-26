import type { NextApiRequest, NextApiResponse } from 'next'
import { connectDB } from '../../../_lib/mongodb'
import { SocialAccount } from '../../../_lib/models/SocialAccount'
import {
  exchangeFacebookCode,
  exchangeForLongLivedToken,
  getFacebookPages,
  encryptToken,
} from '../../../_lib/oauth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ ok: false, error: 'Method not allowed' })
    }

    const { code, state, error: authError } = req.query

    if (authError) {
      return res.redirect(`/?error=facebook_auth_denied&reason=${authError}`)
    }

    if (!code || typeof code !== 'string') {
      return res.redirect('/?error=facebook_auth_missing_code')
    }

    // Verify state
    const cookies = req.headers.cookie?.split(';').reduce((acc, c) => {
      const [key, val] = c.trim().split('=')
      if (key && val) acc[key] = val
      return acc
    }, {} as Record<string, string>)

    if (state !== cookies?.facebook_oauth_state) {
      return res.redirect('/?error=facebook_auth_invalid_state')
    }

    // Exchange code for short-lived token
    const shortToken = await exchangeFacebookCode(code)

    // Exchange for long-lived token (~60 days)
    const longToken = await exchangeForLongLivedToken(shortToken.access_token)

    // Get pages the user manages
    const pages = await getFacebookPages(longToken.access_token)

    if (pages.length === 0) {
      return res.redirect('/?error=facebook_no_pages')
    }

    // Store all pages as separate accounts
    await connectDB()

    for (const page of pages) {
      await SocialAccount.findOneAndUpdate(
        { platform: 'facebook', platformAccountId: page.id },
        {
          platform: 'facebook',
          platformAccountId: page.id,
          accountName: page.name,
          accountUsername: page.name,
          profileImageUrl: '',
          accessToken: encryptToken(page.access_token),
          refreshToken: encryptToken(longToken.access_token),
          tokenExpiresAt: new Date(Date.now() + longToken.expires_in * 1000),
          scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
          status: 'active',
        },
        { upsert: true, new: true },
      )
    }

    // Clear state cookie and redirect
    res.setHeader('Set-Cookie', 'facebook_oauth_state=; Path=/; HttpOnly; Max-Age=0')
    res.redirect(`/?success=facebook_connected&pages=${pages.length}`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    res.redirect(`/?error=facebook_auth_failed&message=${encodeURIComponent(message)}`)
  }
}
