# Phase 5 & 6 — Notifications, Polish & Advanced Features

Status: **Complete** (scoped for the current single-user/single-workspace architecture).

## Phase 5 — Notifications & Polish

### Notification service (backend)
- `api/_lib/models/TaskNotification.ts` — Mongoose model + `createNotification` helper.
  Types: `publish_success | publish_failed | retry_scheduled | token_expired | token_revoked | partial_success | all_failed | info`; severity `success|error|warning|info`.
- `api/notifications/index.ts` — `GET` (optional `unreadOnly`, `limit`) and `POST {id}` to mark read.

### Notification emission
- `api/cron/publish.ts` — emits on full success, partial success, permanent failure (`publish_failed`/`all_failed`), and retry scheduling.
- `api/cron/refresh-tokens.ts` — emits `token_expired` / `token_revoked` when a platform token can't be refreshed; marks account `expired`.

### Frontend
- `src/lib/api/notifications.ts` + `src/lib/hooks/useNotifications.ts` — client + 15s polling.
- `src/components/social/NotificationsPanel.tsx` — slide-over/modal with unread badge, mark-read, mark-all, severity icons.
- Social dashboard header gets a bell button with unread count.

### Dashboard widgets + error recovery
- `src/components/social/SocialOverviewWidgets.tsx` — Scheduled Today / This Week / Failed / Connected Accounts cards, with **Retry all** (bulk re-queue) and **Clear** (delete dead-letter posts) actions.

### Analytics export
- `src/utils/analytics.ts` — added `analyticsToCsv` + `downloadCsv`.
- `AnalyticsView` — "Export CSV" button. Note: analytics remain **demo data** because real metrics require per-platform OAuth analytics scopes + long-lived credentials (deferred).

## Phase 6 — Advanced Features

### Recurring posts
- `api/_lib/scheduler.ts` — `computeRecurrence(baseScheduledAt, repeat, repeatUntil)` supporting `daily | weekdays | weekly | biweekly | monthly` (monthly clamps to last valid day).
- `api/social-posts/[id]/schedule.ts` — accepts `repeat`/`repeatUntil`, persists on the post, and pre-creates a queued `PublishingJob` for each occurrence.
- `ComposeModal` — repeat + repeat-until selectors; passes them through scheduling.

### Bulk scheduling
- `src/components/social/BulkScheduleModal.tsx` — batch date/time/timezone scheduler.
- `SocialDashboard` — multi-select checkboxes (per-row + select-all), bulk action bar.

### Content / media library
- `src/lib/hooks/useMediaLibrary.ts` — localStorage-backed library (capped), cross-tab listener.
- `src/components/social/MediaLibraryPanel.tsx` — browse/manage/reuse.
- `ComposeModal` — "Save to library" per item + "Library" button to add reused media.

### Webhooks
- `api/_lib/models/Webhook.ts` — `Webhook` + `WebhookEvent` models.
- `api/_lib/webhooks.ts` — `dispatchWebhookEvent` with per-webhook events, HMAC-SHA256 `X-SchedFlow-Signature`, 10s timeout, delivery logging.
- `api/webhooks/index.ts` — CRUD; supported events: `post.scheduled | post.published | post.failed | post.cancelled`.
- Dispatch wired into schedule, publish cron, and cancel endpoints.
- `src/lib/api/webhooks.ts` + `src/components/social/WebhooksPanel.tsx` — UI to create/enable/delete.

## Not built (future work, out of architecture)
- Team collaboration (multi-user auth/roles/approval), advanced analytics (trends/best-time/A-B), A/B testing, Google/Outlook calendar sync. These require multi-user backend infra, analytics-API scopes, and third-party integrators.

## Verification
- `npm run build` (`tsc -b && vite build`) passes clean; only the pre-existing Vite chunk-size warning remains.
