import type { SocialPost, SocialAnalytics, Platform } from '../store/schema'

const MOCK_REACH: Record<Platform, [number, number]> = {
  youtube: [800, 12000],
  facebook: [200, 5000],
  tiktok: [500, 20000],
  instagram: [300, 8000],
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateForPlatform(platform: Platform): SocialAnalytics {
  const [minReach, maxReach] = MOCK_REACH[platform]
  const reach = rand(minReach, maxReach)
  const likes = rand(Math.floor(reach * 0.02), Math.floor(reach * 0.12))
  const comments = rand(Math.floor(likes * 0.05), Math.floor(likes * 0.3))
  const shares = rand(Math.floor(likes * 0.02), Math.floor(likes * 0.15))
  const clicks = rand(Math.floor(reach * 0.01), Math.floor(reach * 0.08))
  const impressions = rand(Math.floor(reach * 1.2), Math.floor(reach * 2.5))
  const engagementRate = reach > 0 ? (likes + comments + shares) / reach : 0

  return {
    platform,
    reach,
    likes,
    comments,
    shares,
    clicks,
    impressions,
    engagementRate: Math.round(engagementRate * 1000) / 1000,
    fetchedAt: new Date().toISOString(),
    isDemo: true,
  }
}

export function generateMockAnalytics(post: SocialPost): SocialAnalytics[] {
  return post.platforms
    .filter((p) => p.enabled)
    .map((p) => generateForPlatform(p.platform))
}

export function generateAllMockAnalytics(posts: SocialPost[]): SocialAnalytics[] {
  return posts
    .filter((p) => p.status === 'posted')
    .flatMap((p) => generateMockAnalytics(p))
}

export interface AnalyticsSummary {
  totalReach: number
  totalEngagements: number
  totalImpressions: number
  avgEngagementRate: number
  platformBreakdown: { platform: Platform; reach: number; engagements: number }[]
  topPosts: { post: SocialPost; reach: number; engagementRate: number }[]
}

export function computeSummary(posts: SocialPost[], allAnalytics: SocialAnalytics[]): AnalyticsSummary {
  const totalReach = allAnalytics.reduce((s, a) => s + a.reach, 0)
  const totalEngagements = allAnalytics.reduce((s, a) => s + a.likes + a.comments + a.shares, 0)
  const totalImpressions = allAnalytics.reduce((s, a) => s + a.impressions, 0)
  const avgEngagementRate = allAnalytics.length > 0
    ? allAnalytics.reduce((s, a) => s + a.engagementRate, 0) / allAnalytics.length
    : 0

  const platformMap = new Map<Platform, { reach: number; engagements: number }>()
  for (const a of allAnalytics) {
    const existing = platformMap.get(a.platform) ?? { reach: 0, engagements: 0 }
    platformMap.set(a.platform, {
      reach: existing.reach + a.reach,
      engagements: existing.engagements + a.likes + a.comments + a.shares,
    })
  }
  const platformBreakdown = Array.from(platformMap.entries()).map(([platform, data]) => ({
    platform,
    ...data,
  }))

  const postAnalytics = new Map<string, { reach: number; engagementRate: number }>()
  for (const a of allAnalytics) {
    // Find which post this analytics belongs to by matching platform
    for (const post of posts) {
      if (post.platforms.some((p) => p.platform === a.platform && p.enabled)) {
        const existing = postAnalytics.get(post.id) ?? { reach: 0, engagementRate: 0 }
        postAnalytics.set(post.id, {
          reach: existing.reach + a.reach,
          engagementRate: a.engagementRate,
        })
        break
      }
    }
  }

  const topPosts = posts
    .filter((p) => postAnalytics.has(p.id))
    .map((p) => ({
      post: p,
      ...(postAnalytics.get(p.id) ?? { reach: 0, engagementRate: 0 }),
    }))
    .sort((a, b) => b.reach - a.reach)
    .slice(0, 5)

  return {
    totalReach,
    totalEngagements,
    totalImpressions,
    avgEngagementRate: Math.round(avgEngagementRate * 1000) / 1000,
    platformBreakdown,
    topPosts,
  }
}

export function analyticsToCsv(posts: SocialPost[], allAnalytics: SocialAnalytics[]): string {
  const header = ['Post Title', 'Status', 'Platform', 'Reach', 'Likes', 'Comments', 'Shares', 'Clicks', 'Impressions', 'Engagement Rate']
  const rows: string[][] = [header]

  // Map analytics -> the post it belongs to via enabled platform match (mirrors computeSummary).
  const postByPlatform: Record<string, SocialPost[]> = {}
  for (const post of posts) {
    for (const p of post.platforms.filter((x) => x.enabled)) {
      postByPlatform[p.platform] = postByPlatform[p.platform] ?? []
      postByPlatform[p.platform].push(post)
    }
  }

  for (const a of allAnalytics) {
    const post = postByPlatform[a.platform]?.[0]
    rows.push([
      post?.title || 'Untitled',
      post?.status || '',
      a.platform,
      String(a.reach),
      String(a.likes),
      String(a.comments),
      String(a.shares),
      String(a.clicks),
      String(a.impressions),
      `${(a.engagementRate * 100).toFixed(2)}%`,
    ])
  }
  return rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
