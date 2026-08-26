import type { NextApiRequest, NextApiResponse } from 'next'
import { getYouTubeAuthUrl } from '../../../_lib/oauth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  // Generate a random state token for CSRF protection
  const state = Math.random().toString(36).slice(2) + Date.now().toString(36)

  // Store state in a cookie (simple CSRF protection for single-user mode)
  res.setHeader('Set-Cookie', `youtube_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`)

  const authUrl = getYouTubeAuthUrl(state)
  res.redirect(authUrl)
}
