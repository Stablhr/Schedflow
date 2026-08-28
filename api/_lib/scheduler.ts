import { PublishingJob } from './models/PublishingJob'
import { SocialPost } from './models/SocialPost'
import type { MediaReference, PlatformPublisher } from './publishers/types'
import type { Platform } from '../../src/store/schema'

// Convert a local wall-clock time (YYYY-MM-DD + HH:MM) in a given IANA timezone to a UTC Date.
// Uses Intl.DateTimeFormat with timeZone to compute the UTC offset for the exact instant,
// correctly handling DST and historical offset changes. No external dependency.
export function localDateTimeToUTC(
  dateStr: string,
  timeStr: string | undefined,
  timezone: string,
): Date {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [hh, mi] = (timeStr || '00:00').split(':').map(Number)

  // The user's local wall clock, treated numerically as UTC (no browser-zone influence).
  const wallAsUtc = Date.UTC(y, mo - 1, d, isNaN(hh) ? 0 : hh, isNaN(mi) ? 0 : mi, 0)
  if (isNaN(wallAsUtc)) throw new Error(`Invalid local date/time: ${dateStr} ${timeStr ?? ''}`)

  const ref = new Date(wallAsUtc)

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(ref)
      .reduce<Record<string, number>>((acc, part) => {
        if (part.type !== 'literal') acc[part.type] = Number(part.value)
        return acc
      }, {})

    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    )
    // East-positive offset at the reference instant.
    const offsetMs = asUtc - ref.getTime()
    // UTC instant = wall clock as UTC minus the offset.
    return new Date(wallAsUtc - offsetMs)
  } catch {
    // Fallback: treat the timezone as UTC offset 0
    return new Date(wallAsUtc)
  }
}

export interface ScheduledPlatformValidation {
  platform: Platform
  valid: boolean
  errors: string[]
}

// Validate a post against all connected enabled platforms' publisher rules.
// Returns a map of platform -> validation result.
export function validatePostPlatforms(
  post: InstanceType<typeof SocialPost>,
  publishers: Record<string, PlatformPublisher>,
): ScheduledPlatformValidation[] {
  const media: MediaReference[] = (post.media ?? [])
    .filter((m) => m && m.storageUrl)
    .map((m: { id?: string; type?: string; name?: string; storageUrl?: string; thumbnailUrl?: string; size?: number; mimeType?: string; duration?: number; width?: number; height?: number }) => ({
      id: m.id ?? '',
      type: (m.type as MediaReference['type']) ?? 'image',
      name: m.name ?? '',
      storageUrl: m.storageUrl ?? '',
      thumbnailUrl: m.thumbnailUrl,
      size: m.size ?? 0,
      mimeType: m.mimeType ?? '',
      duration: m.duration,
      width: m.width,
      height: m.height,
    }))

  return (post.platforms ?? [])
    .filter((p: { enabled?: boolean; platform?: string }) => p.enabled)
    .map((p: { platform?: string }) => {
      const publisher = publishers[(p.platform ?? '') as Platform]
      if (!publisher) {
        return { platform: (p.platform ?? '') as Platform, valid: false, errors: [`No publisher adapter for ${p.platform}`] }
      }
      const result = publisher.validate(
        {
          platform: p.platform as Platform,
          caption: (p as { caption?: string }).caption ?? '',
          hashtags: (p as { hashtags?: string[] }).hashtags ?? [],
          mentions: (p as { mentions?: string[] }).mentions ?? [],
          visibility: (p as { visibility?: string }).visibility ?? 'public',
        },
        media,
      )
      return { platform: p.platform as Platform, valid: result.valid, errors: result.errors }
    })
}

export function makeIdempotencyKey(postId: string, platform: string, scheduledAt: string): string {
  return `${postId}:${platform}:${scheduledAt}`
}

// Create a queued PublishingJob for a platform, scheduled to fire when due.
// Returns null if an existing (non-completed/failed) job already exists.
export async function queuePublishJob(
  socialPostId: string,
  platform: string,
  scheduledAt: Date,
  idempotencyKey: string,
): Promise<InstanceType<typeof PublishingJob> | null> {
  const existing = await PublishingJob.findOne({
    socialPostId,
    platform,
    idempotencyKey,
    status: { $in: ['queued', 'locked', 'publishing', 'completed'] },
  })
  if (existing) return null

  const job = await PublishingJob.create({
    socialPostId,
    platform,
    idempotencyKey,
    status: 'queued',
    nextRetryAt: scheduledAt, // cron picks this up only when due
  })

  return job as unknown as InstanceType<typeof PublishingJob>
}

// Mark all queued jobs for a post+platform as cancelled (used by cancel action).
export async function cancelPendingJobs(socialPostId: string, platform?: string): Promise<number> {
  const filter: Record<string, unknown> = {
    socialPostId,
    status: { $in: ['queued', 'locked', 'publishing'] },
  }
  if (platform) filter.platform = platform

  const result = await PublishingJob.updateMany(filter, {
    $set: { status: 'cancelled' },
  })
  return result.modifiedCount
}

export const SCHEDULED_STATUSES = ['queued', 'locked', 'publishing'] as const
