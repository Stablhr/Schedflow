# Phase 2: OAuth + Publishing Core

> **Status**: In Progress
> **Date**: 2026-08-26
> **Goal**: OAuth for YouTube/Facebook, platform publishers, publishing job scheduler, frontend account connection UI

## Architecture

```
Frontend                          Vercel Serverless API                    Platforms
───────                          ─────────────────────                    ─────────
Connect Account ──►  /api/auth/youtube/start  ──►  Google OAuth ──►  /api/auth/youtube/callback
                    /api/auth/facebook/start ──►  Facebook OAuth ──► /api/auth/facebook/callback

Schedule Post ───►  /api/social-posts/:id  (status: scheduled)
                    └── Creates PublishingJob

Cron (every 1min) ─► /api/cron/publish
                    ├── Finds due PublishingJobs
                    ├── Calls platform publisher adapter
                    ├── Updates SocialPost + PublishingJob status
                    └── Handles retries with exponential backoff
```

## New Files

```
api/
  _lib/
    models/
      PublishingJob.ts       # Mongoose schema for audit trail
    oauth.ts                 # OAuth token exchange, refresh, encryption
    publishers/
      youtube.ts             # YouTube Data API v3 publisher
      facebook.ts            # Facebook Graph API publisher
      types.ts               # Shared publisher interface
  auth/
    youtube/
      start.ts               # GET → redirect to Google OAuth
      callback.ts            # GET → handle callback, store tokens
    facebook/
      start.ts               # GET → redirect to Facebook OAuth
      callback.ts            # GET → handle callback, get page token
    refresh.ts               # POST → refresh expired tokens
  cron/
    publish.ts               # GET → Vercel cron, process due jobs
  publishing-jobs/
    index.ts                 # GET (list) + POST (create)

src/
  components/
    social/
      AccountConnectionPanel.tsx   # Connect/disconnect platform accounts
      PublishStatusBadge.tsx       # Per-platform publish status indicator
```

## Modified Files

| File | Change |
|---|---|
| vercel.json | Add cron schedule |
| .env.local | Add OAuth client IDs/secrets |
| .env.example | Add OAuth env vars |
| api/_lib/models/SocialAccount.ts | Add token encryption fields |
| src/store/schema.ts | Add publishing job types |
| src/components/social/SocialDashboard.tsx | Add account connection panel |

## OAuth Scopes Required

| Platform | Scopes |
|---|---|
| YouTube | `youtube.upload`, `youtube.force-ssl` |
| Facebook | `pages_manage_posts`, `pages_read_engagement`, `pages_show_list`, `pages_read_user_content` |

## Publisher Interface

```typescript
interface PlatformPublisher {
  platform: Platform
  validate(post: SocialPostPlatform, media: MediaReference[]): ValidationResult
  publish(post: SocialPostPlatform, media: MediaReference[], account: SocialAccount): Promise<PublishResult>
  getStatus(externalPostId: string, account: SocialAccount): Promise<PostStatus>
}

interface PublishResult {
  success: boolean
  externalPostId?: string
  publishedUrl?: string
  error?: string
  errorCode?: string
  retryable?: boolean
}
```

## Scheduler Flow

1. Vercel Cron triggers `/api/cron/publish` every minute
2. Query `PublishingJob` for jobs with `status: 'queued'` and `nextRetryAt <= now`
3. For each job:
   a. Lock the job (atomic update to prevent double-processing)
   b. Look up the SocialPost + SocialAccount
   c. Call the platform publisher adapter
   d. Update SocialPostPlatform status based on result
   e. If failed + retryable: increment retryCount, set nextRetryAt with exponential backoff
   f. If failed + permanent: mark as failed, notify user
   g. If succeeded: mark as posted, store externalPostId + publishedUrl
   h. Unlock the job

## Retry Backoff

| Retry # | Delay |
|---|---|
| 1 | 1 minute |
| 2 | 5 minutes |
| 3 | 30 minutes |
| 4 | 2 hours |
| 5+ | 12 hours (max) |

## Required Environment Variables

```
# YouTube OAuth
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=https://yourapp.vercel.app/api/auth/youtube/callback

# Facebook OAuth
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=https://yourapp.vercel.app/api/auth/facebook/callback

# Token encryption
TOKEN_ENCRYPTION_KEY=  # 32-byte hex string for AES-256-GCM
```

## Verification Checklist

- [ ] /api/auth/youtube/start redirects to Google OAuth
- [ ] /api/auth/youtube/callback stores encrypted tokens
- [ ] /api/auth/facebook/start redirects to Facebook OAuth
- [ ] /api/auth/facebook/callback exchanges for long-lived + page token
- [ ] Account appears in connected accounts list
- [ ] /api/cron/publish processes due jobs
- [ ] YouTube publisher calls videos.insert API
- [ ] Facebook publisher calls page feed API
- [ ] Failed jobs retry with exponential backoff
- [ ] SocialPost status updates correctly through lifecycle
- [ ] Frontend shows connected accounts
- [ ] Frontend shows per-platform publish status
- [ ] npm run build succeeds
