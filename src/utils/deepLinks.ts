import type { Platform } from '../store/schema'

const DEEP_LINKS: Record<Platform, string> = {
  youtube: 'https://youtube.com',
  facebook: 'https://facebook.com',
  tiktok: 'https://tiktok.com',
  instagram: 'https://instagram.com',
}

export const PLATFORM_LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  instagram: 'Instagram',
}

export function openPlatformApp(platform: Platform) {
  window.open(DEEP_LINKS[platform], '_blank', 'noopener,noreferrer')
}
