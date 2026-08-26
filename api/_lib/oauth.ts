import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY environment variable is required')
  return Buffer.from(key, 'hex')
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // Format: iv:authTag:ciphertext (all hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptToken(encryptedToken: string): string {
  const key = getKey()
  const [ivHex, authTagHex, ciphertextHex] = encryptedToken.split(':')
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Invalid encrypted token format')
  }
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const ciphertext = Buffer.from(ciphertextHex, 'hex')
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return decrypted.toString('utf8')
}

// YouTube OAuth helpers

export function getYouTubeAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID!,
    redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeYouTubeCode(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
  scope: string
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      redirect_uri: process.env.YOUTUBE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`YouTube token exchange failed: ${err}`)
  }
  return res.json()
}

export async function refreshYouTubeToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
  scope: string
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.YOUTUBE_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`YouTube token refresh failed: ${err}`)
  }
  return res.json()
}

export async function getYouTubeChannelInfo(accessToken: string): Promise<{
  id: string
  title: string
  thumbnails: { default: { url: string } }
}> {
  const res = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch YouTube channel info')
  const data = await res.json()
  return data.items?.[0]
}

// Facebook OAuth helpers

export function getFacebookAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.FACEBOOK_REDIRECT_URI!,
    scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,pages_read_user_content',
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
}

export async function exchangeFacebookCode(code: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(process.env.FACEBOOK_REDIRECT_URI!)}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`,
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Facebook token exchange failed: ${err}`)
  }
  return res.json()
}

export async function exchangeForLongLivedToken(shortToken: string): Promise<{
  access_token: string
  token_type: string
  expires_in: number
}> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortToken}`,
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Facebook long-lived token exchange failed: ${err}`)
  }
  return res.json()
}

export async function getFacebookPages(accessToken: string): Promise<
  Array<{
    id: string
    name: string
    access_token: string
    category: string
  }>
> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`,
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to fetch Facebook pages: ${err}`)
  }
  const data = await res.json()
  return data.data ?? []
}

// Instagram OAuth helpers (uses Facebook Login)

export function getInstagramAuthUrl(state: string): string {
  // Instagram uses Facebook Login with instagram_content_publish scope
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID!,
    redirect_uri: process.env.INSTAGRAM_REDIRECT_URI || process.env.FACEBOOK_REDIRECT_URI!,
    scope: 'instagram_basic,instagram_content_publish,pages_read_engagement,pages_manage_posts',
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
}

export async function getInstagramBusinessAccounts(accessToken: string): Promise<
  Array<{
    id: string
    name: string
    instagram_business_account?: { id: string; name: string; username: string }
  }>
> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id,name,username}&access_token=${accessToken}`,
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Failed to fetch Instagram business accounts: ${err}`)
  }
  const data = await res.json()
  return data.data ?? []
}

// TikTok OAuth helpers

export function getTikTokAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY!,
    redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    response_type: 'code',
    scope: 'video.publish',
    state,
  })
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`
}

export async function exchangeTikTokCode(code: string): Promise<{
  access_token: string
  open_id: string
  expires_in: number
  scope: string
  refresh_token: string
  refresh_expires_in: number
}> {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      code,
      grant_type: 'authorization_code',
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TikTok token exchange failed: ${err}`)
  }
  const data = await res.json()
  if (data.error) {
    throw new Error(`TikTok token exchange error: ${data.error.message}`)
  }
  return data.data
}

export async function refreshTikTokToken(refreshToken: string): Promise<{
  access_token: string
  expires_in: number
  refresh_token: string
  refresh_expires_in: number
}> {
  const res = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      client_secret: process.env.TIKTOK_CLIENT_SECRET!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`TikTok token refresh failed: ${err}`)
  }
  const data = await res.json()
  if (data.error) {
    throw new Error(`TikTok token refresh error: ${data.error.message}`)
  }
  return data.data
}

export async function getTikTokUserInfo(accessToken: string): Promise<{
  open_id: string
  display_name: string
  avatar_url: string
}> {
  const res = await fetch('https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) throw new Error('Failed to fetch TikTok user info')
  const data = await res.json()
  return data.data?.user
}
