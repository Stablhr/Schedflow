import type { Platform } from '../../../src/store/schema'

export interface MediaReference {
  id: string
  type: 'image' | 'video' | 'audio'
  name: string
  storageUrl: string
  thumbnailUrl?: string
  size: number
  mimeType: string
  duration?: number
  width?: number
  height?: number
}

export interface SocialPostPlatformData {
  platform: Platform
  caption: string
  hashtags: string[]
  mentions: string[]
  visibility: string
  location?: string
  altText?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface PublishResult {
  success: boolean
  externalPostId?: string
  publishedUrl?: string
  error?: string
  errorCode?: string
  retryable?: boolean
}

export interface PostStatus {
  status: 'pending' | 'publishing' | 'posted' | 'failed'
  externalPostId?: string
  publishedUrl?: string
  error?: string
}

export interface PlatformPublisher {
  platform: Platform
  validate(post: SocialPostPlatformData, media: MediaReference[]): ValidationResult
  publish(
    post: SocialPostPlatformData,
    media: MediaReference[],
    accessToken: string,
  ): Promise<PublishResult>
}
