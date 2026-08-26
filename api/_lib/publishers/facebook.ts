import type { PlatformPublisher, SocialPostPlatformData, MediaReference, ValidationResult, PublishResult } from './types'
import { PLATFORM_LIMITS } from '../../../src/store/schema'

export const facebookPublisher: PlatformPublisher = {
  platform: 'facebook',

  validate(post: SocialPostPlatformData, media: MediaReference[]): ValidationResult {
    const errors: string[] = []
    const limits = PLATFORM_LIMITS.facebook

    if (post.caption.length > limits.maxCaption) {
      errors.push(`Caption exceeds ${limits.maxCaption} characters`)
    }
    if (post.hashtags.length > limits.maxHashtags) {
      errors.push(`Too many hashtags (max ${limits.maxHashtags})`)
    }

    for (const m of media) {
      if (m.type === 'image' && m.size > 10 * 1024 * 1024) {
        errors.push(`Image "${m.name}" exceeds 10 MB limit`)
      }
      if (m.type === 'video' && m.size > 4 * 1024 * 1024 * 1024) {
        errors.push(`Video "${m.name}" exceeds 4 GB limit`)
      }
    }

    return { valid: errors.length === 0, errors }
  },

  async publish(
    post: SocialPostPlatformData,
    media: MediaReference[],
    pageAccessToken: string,
  ): Promise<PublishResult> {
    try {
      const pageId = await getPageId(pageAccessToken)
      if (!pageId) {
        return { success: false, error: 'Could not determine page ID', retryable: false }
      }

      const message = formatCaption(post)
      const imageMedia = media.filter((m) => m.type === 'image')
      const videoMedia = media.filter((m) => m.type === 'video')

      if (videoMedia.length > 0) {
        return await publishVideo(pageId, videoMedia[0], message, pageAccessToken)
      }

      if (imageMedia.length > 1) {
        return await publishCarousel(pageId, imageMedia, message, pageAccessToken)
      }

      if (imageMedia.length === 1) {
        return await publishPhoto(pageId, imageMedia[0], message, pageAccessToken)
      }

      // Text-only post
      return await publishTextPost(pageId, message, pageAccessToken)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      const retryable = !message.includes('invalid') && !message.includes('expired')
      return { success: false, error: message, retryable }
    }
  },
}

function formatCaption(post: SocialPostPlatformData): string {
  const parts: string[] = []
  if (post.caption) parts.push(post.caption)
  if (post.hashtags.length > 0) {
    parts.push(post.hashtags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '))
  }
  return parts.join('\n\n')
}

async function getPageId(accessToken: string): Promise<string | null> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}&limit=1`,
  )
  if (!res.ok) return null
  const data = await res.json()
  return data.data?.[0]?.id ?? null
}

async function publishTextPost(
  pageId: string,
  message: string,
  accessToken: string,
): Promise<PublishResult> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, access_token: accessToken }),
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Publish failed',
      retryable: res.status >= 500,
    }
  }

  const data = await res.json()
  return {
    success: true,
    externalPostId: data.id,
    publishedUrl: `https://facebook.com/${data.id}`,
  }
}

async function publishPhoto(
  pageId: string,
  media: MediaReference,
  message: string,
  accessToken: string,
): Promise<PublishResult> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/photos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: media.storageUrl,
        message,
        access_token: accessToken,
      }),
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Photo publish failed',
      retryable: res.status >= 500,
    }
  }

  const data = await res.json()
  return {
    success: true,
    externalPostId: data.id,
    publishedUrl: `https://facebook.com/${data.id}`,
  }
}

async function publishCarousel(
  pageId: string,
  media: MediaReference[],
  message: string,
  accessToken: string,
): Promise<PublishResult> {
  // Facebook carousel: post multiple photos attached to a single post
  const attachedMedia: Array<{ media_fbid: string }> = []

  for (const m of media.slice(0, 10)) {
    const uploadRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: m.storageUrl,
          published: false,
          access_token: accessToken,
        }),
      },
    )
    if (!uploadRes.ok) continue
    const data = await uploadRes.json()
    if (data.id) attachedMedia.push({ media_fbid: data.id })
  }

  if (attachedMedia.length === 0) {
    return { success: false, error: 'Failed to upload any images for carousel', retryable: true }
  }

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/feed`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        attached_media: attachedMedia,
        access_token: accessToken,
      }),
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Carousel publish failed',
      retryable: res.status >= 500,
    }
  }

  const data = await res.json()
  return {
    success: true,
    externalPostId: data.id,
    publishedUrl: `https://facebook.com/${data.id}`,
  }
}

async function publishVideo(
  pageId: string,
  media: MediaReference,
  description: string,
  accessToken: string,
): Promise<PublishResult> {
  // Step 1: Initiate video upload
  const initRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}/videos`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        upload_phase: 'start',
        access_token: accessToken,
      }),
    },
  )

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Failed to initiate video upload',
      retryable: initRes.status >= 500,
    }
  }

  const { upload_url, video_id } = await initRes.json()

  // Fetch video from our storage
  const videoRes = await fetch(media.storageUrl)
  if (!videoRes.ok || !videoRes.body) {
    return { success: false, error: 'Failed to fetch video from storage', retryable: true }
  }

  // Upload binary to Facebook
  const uploadRes = await fetch(upload_url, {
    method: 'POST',
    headers: {
      offset: '0',
      file_size: String(media.size),
    },
    body: videoRes.body,
  })

  if (!uploadRes.ok) {
    return { success: false, error: 'Video binary upload failed', retryable: true }
  }

  // Publish the uploaded video
  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${video_id}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: media.name,
        description: description,
        published: true,
        access_token: accessToken,
      }),
    },
  )

  if (!publishRes.ok) {
    const err = await publishRes.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Video publish failed',
      retryable: publishRes.status >= 500,
    }
  }

  return {
    success: true,
    externalPostId: video_id,
    publishedUrl: `https://facebook.com/${pageId}/posts/${video_id}`,
  }
}
