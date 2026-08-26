# Phase 3: Instagram + TikTok + Resilience

> **Status**: In Progress
> **Date**: 2026-08-26
> **Goal**: Instagram & TikTok publishers, OAuth for both, token refresh, resilience improvements

## New Files

```
api/
  _lib/
    publishers/
      instagram.ts          # Two-step container publish
      tiktok.ts             # Direct Post flow
  auth/
    instagram/
      start.ts              # Redirects via Facebook Login
      callback.ts           # Gets IG user ID + long-lived token
    tiktok/
      start.ts              # Redirects to TikTok OAuth
      callback.ts           # Stores tokens
  cron/
    refresh-tokens.ts       # Background token refresh (every 6 hours)

src/
  components/
    social/
      PublishStatusBadge.tsx  # Already exists — no changes needed
```

## Modified Files

| File | Change |
|---|---|
| api/cron/publish.ts | Register Instagram + TikTok publishers |
| api/_lib/oauth.ts | Add Instagram + TikTok OAuth helpers |
| api/auth/refresh.ts | Handle Instagram + TikTok token refresh |
| src/components/social/AccountConnectionPanel.tsx | Add Instagram + TikTok sections |
| vercel.json | Add token refresh cron |
| .env.local / .env.example | Add TikTok client credentials |

## Instagram Flow (via Facebook Login)

1. User clicks Connect Instagram
2. Redirect to Facebook Login with `instagram_basic,instagram_content_publish,pages_read_engagement`
3. Callback exchanges code → long-lived token
4. Fetch Instagram Business Account ID via `GET /me/accounts?fields=instagram_business_account`
5. Store as `SocialAccount` with platform=`instagram`

### Publishing (Two-Step)
1. `POST /{ig-user-id}/media` — create container with image_url/caption
2. For video: poll `GET /{container_id}?fields=status_code` until `FINISHED`
3. `POST /{ig-user-id}/media_publish` — publish container
4. Handle ~10% false failures: check container status_code before retrying

## TikTok Flow

1. User clicks Connect TikTok
2. Redirect to `https://www.tiktok.com/v2/auth/authorize/` with `video.publish` scope
3. Callback exchanges code for access + refresh tokens
4. Store as `SocialAccount` with platform=`tiktok`

### Publishing (Direct Post)
1. `POST /v2/post/publish/creator_info/query/` — get creator info
2. `POST /v2/post/publish/video/init/` — initialize with post_info + source_info
3. PUT video binary to returned `upload_url`
4. `POST /v2/post/publish/status/fetch/` — poll until done

## Token Refresh Cron

Runs every 6 hours via Vercel cron:
- YouTube: refresh if expires within 1 hour
- Facebook/Instagram: refresh long-lived tokens (60-day expiry)
- TikTok: refresh if expires within 1 hour

## Verification Checklist

- [ ] /api/auth/instagram/start redirects via Facebook Login
- [ ] /api/auth/instagram/callback stores IG account
- [ ] /api/auth/tiktok/start redirects to TikTok OAuth
- [ ] /api/auth/tiktok/callback stores tokens
- [ ] Instagram publisher creates container + publishes
- [ ] TikTok publisher runs Direct Post flow
- [ ] Cron handles all 4 platforms
- [ ] Token refresh cron runs
- [ ] AccountConnectionPanel shows all 4 platforms
- [ ] npm run build succeeds
