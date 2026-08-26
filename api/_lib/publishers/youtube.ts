import type { PlatformPublisher, SocialPostPlatformData, MediaReference, ValidationResult, PublishResult } from './types'
import { PLATFORM_LIMITS } from '../../../src/store/schema'

export const youtubePublisher: PlatformPublisher = {
  platform: 'youtube',

  validate(post: SocialPostPlatformData, media: MediaReference[]): ValidationResult {
    const errors: string[] = []
    const limits = PLATFORM_LIMITS.youtube

    if (post.caption.length > limits.maxCaption) {
      errors.push(`Caption exceeds ${limits.maxCaption} characters`)
    }
    if (post.hashtags.length > limits.maxHashtags) {
      errors.push(`Too many hashtags (max ${limits.maxHashtags})`)
    }

    const videoMedia = media.filter((m) => m.type === 'video')
    const imageMedia = media.filter((m) => m.type === 'image')

    if (videoMedia.length === 0 && imageMedia.length === 0) {
      errors.push('YouTube requires at least one video or image')
    }
    if (videoMedia.length > 1) {
      errors.push('YouTube supports only one video per post')
    }

    // Check video file size (256 GB max, but let's be reasonable — 10 GB)
    for (const v of videoMedia) {
      if (v.size > 10 * 1024 * 1024 * 1024) {
        errors.push('Video file too large (max 10 GB)')
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
      const imageMedia = media.find((m) => m.type === 'image')

      // Build video metadata
      const title = post.caption.slice(0, 100) || 'Untitled'
      const description = post.caption
      const tags = post.hashtags.join(', ')

      const metadata = {
        snippet: {
          title,
          description,
          tags: tags ? tags.split(',').map((t) => t.trim()) : [],
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: post.visibility === 'private' ? 'private' : 'public',
          selfDeclaredMadeForKids: false,
        },
      }

      if (videoMedia) {
        // Upload video via resumable upload
        return await uploadVideo(videoMedia, metadata, accessToken)
      }

      if (imageMedia) {
        // For images, we create a community post or use the image as a thumbnail
        // YouTube doesn't natively support image-only posts via API
        // We'll upload as a short video with the image
        return {
          success: false,
          error: 'YouTube requires video content. Image-only posts are not supported via API.',
          retryable: false,
        }
      }

      return { success: false, error: 'No suitable media found', retryable: false }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      const retryable = !message.includes('invalid') && !message.includes('forbidden')
      return { success: false, error: message, retryable }
    }
  },
}

async function uploadVideo(
  media: MediaReference,
  metadata: Record<string, unknown>,
  accessToken: string,
): Promise<PublishResult> {
  // Step 1: Initiate resumable upload session
  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': media.mimeType || 'video/mp4',
        'X-Upload-Content-Length': String(media.size),
      },
      body: JSON.stringify(metadata),
    },
  )

  if (!initRes.ok) {
    const err = await initRes.text()
    return { success: false, error: `Failed to initiate upload: ${err}`, retryable: initRes.status >= 500 }
  }

  const uploadUrl = initRes.headers.get('Location')
  if (!uploadUrl) {
    return { success: false, error: 'No upload URL returned', retryable: true }
  }

  // Step 2: Fetch the video from our storage and upload to YouTube
  const videoRes = await fetch(media.storageUrl)
  if (!videoRes.ok || !videoRes.body) {
    return { success: false, error: 'Failed to fetch video from storage', retryable: true }
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': media.mimeType || 'video/mp4' },
    body: videoRes.body,
  })

  if (!uploadRes.ok) {
    const err = await uploadRes.text()
    return { success: false, error: `Upload failed: ${err}`, retryable: uploadRes.status >= 500 }
  }

  const result = await uploadRes.json()
  const videoId = result.id
  if (!videoId) {
    return { success: false, error: 'No video ID in response', retryable: true }
  }

  return {
    success: true,
    externalPostId: videoId,
    publishedUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}
