# Phase 4: Frontend Production Integration

> **Status**: Complete
> **Date**: 2026-08-28
> **Goal**: Bridge the scheduling UI to the real publishing backend — real-time status, cancel/retry, timezone-aware UTC scheduling, pre-publish validation, and a post detail view with job history.

## New Files

```
api/
  _lib/
    scheduler.ts              # UTC conversion, validation, job queueing helpers
  social-posts/[id]/
    schedule.ts               # POST — validate + persist schedule + create PublishingJobs
    cancel.ts                 # POST — mark platforms/jobs cancelled
    retry.ts                  # POST — re-queue failed platforms with reset retry state

src/
  utils/
    timezones.ts              # IANA list + Intl-based local→UTC conversion (no dep)
  components/social/
    PostDetailModal.tsx       # Per-platform status, error/retry UI, job history
```

## Modified Files

| File | Change |
|---|---|
| `api/_lib/models/PublishingJob.ts` | Job status now includes `cancelled` (handled by cancel flow) |
| `src/store/schema.ts` | `PublishingJobStatus` includes `'cancelled'` |
| `src/lib/api/social-posts.ts` | Added `schedule`, `cancel`, `retry` + `publishingJobsApi` |
| `src/lib/hooks/useSocialPosts.ts` | `jobs` state, `schedulePost`/`cancelPost`/`retryPost`, `refreshJobs`, `refreshPost`, 10s real-time polling, `_id`→`id` normalization |
| `src/store/useStore.ts` | Expose `socialJobs`, `scheduleSocialPost`, `cancelSocialPost`, `retrySocialPost`, `refreshSocialJobs`, `refreshSocialPost` |
| `src/store/StoreProvider.tsx` | Delegate new social methods to the hook |
| `src/components/social/ComposeModal.tsx` | Timezone selector, publishing preview panel, async schedule flow |
| `src/components/social/SocialDashboard.tsx` | Row click opens PostDetailModal (Edit → ComposeModal) |
| `src/components/social/SocialCalendarView.tsx` | Card click opens PostDetailModal |

## Scheduling Flow

1. User fills compose form, picks date/time/timezone, clicks **Schedule**.
2. `ComposeModal` persists the post (create/update) then calls `POST /api/social-posts/[id]/schedule` with local date/time/timezone.
3. Backend converts the wall-clock time to UTC using `Intl.DateTimeFormat` (DST-correct, no dependency), runs each enabled platform's `publisher.validate()`, and returns validation results.
4. On success, backend stores `scheduledAt` (UTC) + `timezone`, marks platforms `scheduled`, and creates a queued `PublishingJob` per platform with `nextRetryAt` set to the scheduled time.
5. The Vercel cron `*/1 * * * *` picks up each job only when `nextRetryAt <= now`.

## Cancel / Retry

- **Cancel** → `POST /api/social-posts/[id]/cancel` marks enabled `scheduled`/`publishing` platforms as `cancelled` and sets queued/locked/publishing jobs to `cancelled` (they're no longer processed by the cron).
- **Retry** → `POST /api/social-posts/[id]/retry` targets `failed` platforms, resets `retryCount`/error state to `scheduled`, cancels stale failed jobs, and creates a fresh queued job (immediately if the scheduled time has passed, otherwise at the original time).

## Real-Time Status

The `useSocialPosts` hook polls every 10 seconds while any post is `publishing` (or has an enabled platform `publishing`), refreshing the post and its jobs. `PostDetailModal` reflects these updates live (status badges, error text, retry counts, job history timestamps).

## Key Bug Fixed

Previously the `PublishingJob` created on schedule had `nextRetryAt = now`, so the cron published posts **immediately** regardless of their scheduled time. Now `nextRetryAt` is set to the scheduled UTC instant, so publishing only fires when due.

## Verification Checklist

- [ ] `/api/social-posts/[id]/schedule` validates via publisher rules and creates jobs at the schedule time
- [ ] `/api/social-posts/[id]/cancel` cancels pending jobs (cron skips them)
- [ ] `/api/social-posts/[id]/retry` re-queues failed platforms
- [ ] ComposeModal timezone selector converts local time to UTC correctly (incl. DST)
- [ ] PostDetailModal shows per-platform status, errors, retry counts, and job history
- [ ] Status updates in real time while a post is publishing
- [ ] `npm run build` succeeds
