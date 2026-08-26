import type { PlatformPublisher, SocialPostPlatformData, MediaReference, ValidationResult, PublishResult } from './types'
import { PLATFORM_LIMITS } from '../../../src/store/schema'

export const instagramPublisher: PlatformPublisher = {
  platform: 'instagram',

  validate(post: SocialPostPlatformData, media: MediaReference[]): ValidationResult {
    const errors: string[] = []
    const limits = PLATFORM_LIMITS.instagram

    if (post.caption.length > limits.maxCaption) {
      errors.push(`Caption exceeds ${limits.maxCaption} characters`)
    }
    if (post.hashtags.length > limits.maxHashtags) {
      errors.push(`Too many hashtags (max ${limits.maxHashtags})`)
    }

    const imageMedia = media.filter((m) => m.type === 'image')
    const videoMedia = media.filter((m) => m.type === 'video')

    if (imageMedia.length === 0 && videoMedia.length === 0) {
      errors.push('Instagram requires at least one image or video')
    }
    if (videoMedia.length > 1) {
      errors.push('Instagram supports only one video per post')
    }
    if (imageMedia.length > 10) {
      errors.push('Instagram supports max 10 images per carousel')
    }

    for (const m of media) {
      if (m.type === 'image' && m.size > 8 * 1024 * 1024) {
        errors.push(`Image "${m.name}" exceeds 8 MB limit`)
      }
      if (m.type === 'video' && m.size > 300 * 1024 * 1024) {
        errors.push(`Video "${m.name}" exceeds 300 MB limit`)
      }
    }

    return { valid: errors.length === 0, errors }
  },

  async publish(
    post: SocialPostPlatformData,
    media: MediaReference[],
    accessToken: string,
  ): Promise<PublishResult> {
    try {
      const imageMedia = media.filter((m) => m.type === 'image')
      const videoMedia = media.filter((m) => m.type === 'video')
      const caption = formatCaption(post)

      if (videoMedia.length > 0) {
        return await publishVideo(videoMedia[0], caption, accessToken)
      }

      if (imageMedia.length > 1) {
        return await publishCarousel(imageMedia, caption, accessToken)
      }

      if (imageMedia.length === 1) {
        return await publishPhoto(imageMedia[0], caption, post.altText, accessToken)
      }

      return { success: false, error: 'No suitable media found', retryable: false }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      const retryable = !message.includes('invalid') && !message.includes('OAuthException')
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

// Get the IG User ID from the access token (we need it for API calls)
async function getIGUserId(accessToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/me/accounts?fields=instagram_business_account{id}&access_token=${accessToken}&limit=1`,
  )
  if (!res.ok) throw new Error('Could not fetch Instagram Business Account')
  const data = await res.json()
  const igAccount = data.data?.[0]?.instagram_business_account
  if (!igAccount?.id) throw new Error('No Instagram Business Account connected to this Facebook Page')
  return igAccount.id
}

async function publishPhoto(
  media: MediaReference,
  caption: string,
  altText: string | undefined,
  accessToken: string,
): Promise<PublishResult> {
  const igUserId = await getIGUserId(accessToken)

  // Step 1: Create container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: media.storageUrl,
        caption,
        alt_text: altText,
        access_token: accessToken,
      }),
    },
  )

  if (!containerRes.ok) {
    const err = await containerRes.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Failed to create container',
      retryable: containerRes.status >= 500,
    }
  }

  const containerData = await containerRes.json()
  const containerId = containerData.id

  // Step 2: Publish container
  return await publishContainer(igUserId, containerId, accessToken)
}

async function publishCarousel(
  media: MediaReference[],
  caption: string,
  accessToken: string,
): Promise<PublishResult> {
  const igUserId = await getIGUserId(accessToken)

  // Step 1: Create child containers for each image
  const childIds: string[] = []
  for (const m of media.slice(0, 10)) {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: m.storageUrl,
          is_carousel_item: true,
          access_token: accessToken,
        }),
      },
    )
    if (res.ok) {
      const data = await res.json()
      if (data.id) childIds.push(data.id)
    }
  }

  if (childIds.length === 0) {
    return { success: false, error: 'Failed to create any carousel items', retryable: true }
  }

  // Step 2: Create carousel container
  const carouselRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'CAROUSEL',
        children: childIds,
        caption,
        access_token: accessToken,
      }),
    },
  )

  if (!carouselRes.ok) {
    const err = await carouselRes.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Failed to create carousel container',
      retryable: carouselRes.status >= 500,
    }
  }

  const containerData = await carouselRes.json()
  return await publishContainer(igUserId, containerData.id, accessToken)
}

async function publishVideo(
  media: MediaReference,
  caption: string,
  accessToken: string,
): Promise<PublishResult> {
  const igUserId = await getIGUserId(accessToken)

  // Step 1: Create video container
  const containerRes = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: media.storageUrl,
        caption,
        access_token: accessToken,
      }),
    },
  )

  if (!containerRes.ok) {
    const err = await containerRes.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Failed to create video container',
      retryable: containerRes.status >= 500,
    }
  }

  const containerData = await containerRes.json()
  const containerId = containerData.id

  // Step 2: Poll until video is processed (up to 5 minutes)
  const maxAttempts = 30
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 10000)) // Wait 10s between polls

    const statusRes = await fetch(
      `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`,
    )
    if (!statusRes.ok) continue

    const statusData = await statusRes.json()
    if (statusData.status_code === 'FINISHED') {
      return await publishContainer(igUserId, containerId, accessToken)
    }
    if (statusData.status_code === 'ERROR') {
      return {
        success: false,
        error: 'Video processing failed on Instagram',
        retryable: true,
      }
    }
    // Still processing — continue polling
  }

  return { success: false, error: 'Video processing timed out', retryable: true }
}

async function publishContainer(
  igUserId: string,
  containerId: string,
  accessToken: string,
): Promise<PublishResult> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    },
  )

  if (!res.ok) {
    // Instagram has ~10% false failures on media_publish
    // Check container status before concluding failure
    const containerStatus = await fetch(
      `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`,
    )
    if (containerStatus.ok) {
      const statusData = await containerStatus.json()
      if (statusData.status_code === 'FINISHED') {
        // False failure — post actually succeeded
        return {
          success: true,
          externalPostId: containerId,
          publishedUrl: `https://www.instagram.com/p/${containerId}`,
        }
      }
    }

    const err = await res.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Failed to publish container',
      retryable: res.status >= 500,
    }
  }

  const data = await res.json()
  return {
    success: true,
    externalPostId: data.id ?? containerId,
    publishedUrl: `https://www.instagram.com/p/${data.id ?? containerId}`,
  }
}
