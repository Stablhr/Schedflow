import type { PlatformPublisher, SocialPostPlatformData, MediaReference, ValidationResult, PublishResult } from './types'
import { PLATFORM_LIMITS } from '../../../src/store/schema'

const TIKTOK_BASE = 'https://open.tiktokapis.com'

export const tiktokPublisher: PlatformPublisher = {
  platform: 'tiktok',

  validate(post: SocialPostPlatformData, media: MediaReference[]): ValidationResult {
    const errors: string[] = []
    const limits = PLATFORM_LIMITS.tiktok

    if (post.caption.length > limits.maxCaption) {
      errors.push(`Caption exceeds ${limits.maxCaption} characters`)
    }
    if (post.hashtags.length > limits.maxHashtags) {
      errors.push(`Too many hashtags (max ${limits.maxHashtags})`)
    }

    const videoMedia = media.filter((m) => m.type === 'video')
    const imageMedia = media.filter((m) => m.type === 'image')

    if (videoMedia.length === 0 && imageMedia.length === 0) {
      errors.push('TikTok requires at least one video or image')
    }
    if (videoMedia.length > 1) {
      errors.push('TikTok supports only one video per post')
    }

    for (const v of videoMedia) {
      if (v.size > 4 * 1024 * 1024 * 1024) {
        errors.push(`Video "${v.name}" exceeds 4 GB limit`)
      }
    }
    for (const m of imageMedia) {
      if (m.size > 20 * 1024 * 1024) {
        errors.push(`Image "${m.name}" exceeds 20 MB limit`)
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
      const videoMedia = media.find((m) => m.type === 'video')
      const imageMedia = media.filter((m) => m.type === 'image')

      if (videoMedia) {
        return await publishVideo(videoMedia, post, accessToken)
      }

      if (imageMedia.length > 0) {
        return await publishPhotos(imageMedia, post, accessToken)
      }

      return { success: false, error: 'No suitable media found', retryable: false }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      const retryable = !message.includes('invalid') && !message.includes('access_token')
      return { success: false, error: message, retryable }
    }
  },
}

async function queryCreatorInfo(accessToken: string): Promise<{ creator: { creator_id: string } }> {
  const res = await fetch(`${TIKTOK_BASE}/v2/post/publish/creator_info/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  })
  if (!res.ok) throw new Error('Failed to query TikTok creator info')
  const data = await res.json()
  if (data.error?.message) throw new Error(data.error.message)
  return data.data
}

async function publishVideo(
  media: MediaReference,
  post: SocialPostPlatformData,
  accessToken: string,
): Promise<PublishResult> {
  // Step 1: Query creator info (required by TikTok UX policy)
  const creatorInfo = await queryCreatorInfo(accessToken)
  const creatorId = creatorInfo.creator?.creator_id

  // Step 2: Initialize video upload
  const description = formatDescription(post)
  const initRes = await fetch(`${TIKTOK_BASE}/v2/post/publish/video/init/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: description.slice(0, 90),
        privacy_level: post.visibility === 'private' ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: media.size,
      },
      creator_id: creatorId,
    }),
  })

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Failed to initialize video upload',
      retryable: initRes.status >= 500,
    }
  }

  const initData = await initRes.json()
  const { upload_url, publish_id } = initData.data

  if (!upload_url) {
    return { success: false, error: 'No upload URL returned', retryable: true }
  }

  // Step 3: Upload video binary (valid for 1 hour)
  const videoRes = await fetch(media.storageUrl)
  if (!videoRes.ok || !videoRes.body) {
    return { success: false, error: 'Failed to fetch video from storage', retryable: true }
  }

  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: {
      'Content-Type': media.mimeType || 'video/mp4',
      'Content-Range': `bytes 0-${media.size - 1}/${media.size}`,
    },
    body: videoRes.body,
  })

  if (!uploadRes.ok) {
    return { success: false, error: 'Video upload failed', retryable: true }
  }

  // Step 4: Poll publish status
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10000))

    const statusRes = await fetch(`${TIKTOK_BASE}/v2/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publish_id }),
    })

    if (!statusRes.ok) continue
    const statusData = await statusRes.json()
    const status = statusData.data?.status

    if (status === 'PUBLISH_SUCCESS') {
      return {
        success: true,
        externalPostId: publish_id,
        publishedUrl: `https://www.tiktok.com/@me/video/${publish_id}`,
      }
    }
    if (status === 'PUBLISH_FAILED') {
      return {
        success: false,
        error: statusData.data?.fail_reason ?? 'Publish failed',
        retryable: true,
      }
    }
    // Still processing
  }

  return { success: false, error: 'Publish status check timed out', retryable: true }
}

async function publishPhotos(
  media: MediaReference[],
  post: SocialPostPlatformData,
  accessToken: string,
): Promise<PublishResult> {
  const creatorInfo = await queryCreatorInfo(accessToken)
  const creatorId = creatorInfo.creator?.creator_id

  const description = formatDescription(post)

  const initRes = await fetch(`${TIKTOK_BASE}/v2/post/publish/content/init/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: description.slice(0, 90),
        privacy_level: post.visibility === 'private' ? 'SELF_ONLY' : 'PUBLIC_TO_EVERYONE',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'PULL_FROM_URL',
        photo_urls: media.map((m) => m.storageUrl),
      },
      creator_id: creatorId,
    }),
  })

  if (!initRes.ok) {
    const err = await initRes.json().catch(() => ({ error: { message: 'Unknown error' } }))
    return {
      success: false,
      error: err.error?.message ?? 'Failed to initialize photo post',
      retryable: initRes.status >= 500,
    }
  }

  const initData = await initRes.json()
  const publishId = initData.data?.publish_id

  // Poll for completion
  for (let i = 0; i < 15; i++) {
    await new Promise((r) => setTimeout(r, 5000))

    const statusRes = await fetch(`${TIKTOK_BASE}/v2/post/publish/status/fetch/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publish_id: publishId }),
    })

    if (!statusRes.ok) continue
    const statusData = await statusRes.json()
    const status = statusData.data?.status

    if (status === 'PUBLISH_SUCCESS') {
      return {
        success: true,
        externalPostId: publishId,
        publishedUrl: `https://www.tiktok.com/@me/photo/${publishId}`,
      }
    }
    if (status === 'PUBLISH_FAILED') {
      return {
        success: false,
        error: statusData.data?.fail_reason ?? 'Publish failed',
        retryable: true,
      }
    }
  }

  return { success: false, error: 'Publish status check timed out', retryable: true }
}

function formatDescription(post: SocialPostPlatformData): string {
  const parts: string[] = []
  if (post.caption) parts.push(post.caption)
  if (post.hashtags.length > 0) {
    parts.push(post.hashtags.map((t) => (t.startsWith('#') ? t : `#${t}`)).join(' '))
  }
  return parts.join('\n')
}
