import type { NextApiRequest, NextApiResponse } from 'next'
import { getInstagramAuthUrl } from '../../../_lib/oauth'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' })
  }

  const state = Math.random().toString(36).slice(2) + Date.now().toString(36)

  res.setHeader('Set-Cookie', `instagram_oauth_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`)

  const authUrl = getInstagramAuthUrl(state)
  res.redirect(authUrl)
}
