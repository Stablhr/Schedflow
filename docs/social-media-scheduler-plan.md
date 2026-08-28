# Social Media Management (SMM) Scheduler — Implementation Plan

> **Status**: Phases 1-6 Complete (see per-phase status below)
> **Date**: 2026-08-28
> **Scope**: Full production automatic publishing system
> **Platforms**: YouTube, Facebook, Instagram, TikTok
> **Stack**: Vercel serverless + MongoDB + Vercel Cron + Vercel Blob

---

## Table of Contents

1. [Current Project State](#1-current-project-state)
2. [What Can Be Reused](#2-what-can-be-reused)
3. [What Must Be Created](#3-what-must-be-created)
4. [Two-Layer Architecture](#4-two-layer-architecture)
5. [Production Architecture](#5-production-architecture)
6. [Production Data Model](#6-production-data-model)
7. [Social Account Model](#7-social-account-model)
8. [Media Storage Architecture](#8-media-storage-architecture)
9. [Platform API Integration](#9-platform-api-integration)
10. [Platform Adapter Architecture](#10-platform-adapter-architecture)
11. [Scheduling Engine](#11-scheduling-engine)
12. [Job State Machine](#12-job-state-machine)
13. [Timezone Handling](#13-timezone-handling)
14. [Multi-Platform Partial Failure](#14-multi-platform-partial-failure)
15. [OAuth / Account Connection](#15-oauth--account-connection)
16. [Media Validation](#16-media-validation)
17. [User Permissions](#17-user-permissions)
18. [Notifications](#18-notifications)
19. [Planner & Dashboard Integration](#19-planner--dashboard-integration)
20. [Security Requirements](#20-security-requirements)
21. [Reliability & Failure Handling](#21-reliability--failure-handling)
22. [Technology Stack](#22-technology-stack)
23. [Phased Implementation Plan](#23-phased-implementation-plan)
24. [Risks & Mitigations](#24-risks--mitigations)

---

## 1. Current Project State

### Frontend
- **React 19.2.8** + **TypeScript 6.0.2** + **Vite 8.2.0**
- **Tailwind CSS 4.3.3** with CSS-based theme tokens
- **react-router-dom 7.18.2** — 9 routes
- **@hello-pangea/dnd** — drag-and-drop
- **lucide-react** — icons
- **State**: React Context + `useState<AppData>` via `StoreProvider` (no Redux/Zustand)
- **~100+ TSX/TS files** in `src/`

### Persistence
- **localStorage only** — 4 keys:
  - `schedflow_data` — boards, lists, cards, inbox, members, UI
  - `schedflow-social-posts` — `SocialPost[]` array
  - `schedflow_user_comment_reactions` — per-comment emoji reactions
  - `schedflow-ai-tokens` — AI token counter
- **5 MB browser limit**. Media stored as base64 data URLs (2 MB per-file cap)
- **No IndexedDB, no cloud storage**

### Backend / Database / Auth
- **None.** Zero backend, zero database, zero authentication, zero API calls, zero environment files
- All data is client-side only. The "member" is hardcoded (`member-you`)

### Existing Social Media Feature
- Already built: `SocialPost` type, `SocialPostPlatform` per-platform overrides, `SocialMediaAttachment`, compose modal, calendar view, analytics view (all mock), deep links, import/export, AI caption generation (mock), card-to-post linking
- **Status field**: `draft | scheduled | publishing | posted | failed`
- **Platform statuses**: `pending | scheduled | publishing | posted | failed`
- **Storage**: posts in localStorage as JSON array

---

## 2. What Can Be Reused

| Component | Status |
|---|---|
| `SocialPost` data model | Built |
| `SocialPostPlatform` multi-platform model | Built |
| `SocialMediaAttachment` | Built |
| Compose modal (platform selector, caption, media, scheduling) | Built |
| Social Dashboard (post list, filters, status) | Built |
| Social Calendar View (week view, drag-and-drop) | Built |
| Analytics View (mock data) | Built |
| Card ↔ Social Post linking | Built |
| Deep links (basic) | Built |
| Import/Export (JSON) | Built |
| Platform limits/constants (`PLATFORM_LIMITS`, `PLATFORM_COLORS`) | Built |
| Toast notification system | Built |
| Shared UI components (Modal, Button, Input, Chip, etc.) | Built |
| Date utilities (`formatDate`, `formatDateTime`, `addDays`, `isSameDay`) | Built |

---

## 3. What Must Be Created

| Component | Status |
|---|---|
| Backend server | Must create |
| Database (PostgreSQL) | Must create |
| API layer (REST) | Must create |
| Authentication system | Must create |
| OAuth flow (per platform) | Must create |
| Secure token storage (encrypted) | Must create |
| Job scheduler / queue (BullMQ) | Must create |
| Publishing workers | Must create |
| Platform adapter services | Must create |
| Media file storage (cloud object storage) | Must create |
| Webhook handlers | Must create |
| Server-side notification system | Must create |
| Frontend API client (replace localStorage reads) | Must create |
| Real-time status updates (SSE or polling) | Must create |
| Timezone handling (IANA + UTC storage) | Must create |

---

## 4. Two-Layer Architecture

The system has two distinct layers serving different purposes.

### Layer 1: Local MVP (localStorage — current app)

Purpose: UI development, testing, prototyping, offline use.

```
React Frontend
    |
    v
StoreProvider (React Context)
    |
    v
localStorage (debounced save)
```

This layer is **already built** and handles:
- Creating/editing/deleting social posts
- Calendar visualization
- Platform content customization
- Draft management
- Mock scheduling (status transitions on page load)
- Deep links (manual publish workaround)
- Mock analytics, mock AI

LocalStorage is appropriate for:
- UI prototypes
- Draft posts
- Temporary post data
- Calendar UI
- Mock scheduled posts
- Simulated publishing
- Testing the composer
- Testing validation

**LocalStorage MUST NOT be the production scheduler.** The production scheduler must work when the browser is closed, the computer is off, and the user is logged out.

### Layer 2: Production Architecture (server-side)

Purpose: Real automatic publishing independent of the browser.

```
React Frontend (API client)
    |
    v
REST API (Hono / Express / Fastify)
    |
    v
Database (PostgreSQL + Drizzle ORM)
    |
    v
OAuth Token Vault (encrypted at rest)
    |
    v
Job Scheduler (poll DB every 60s for due posts)
    |
    v
Job Queue (BullMQ / Redis)
    |
    v
Platform Adapter Service
    |-- YouTubePublisher
    |-- FacebookPublisher
    |-- InstagramPublisher
    |-- TikTokPublisher
    |
    v
Platform APIs (Official)
```

---

## 5. Production Architecture

### System Diagram

```
                         +-------------------+
                         |  React Frontend   |
                         |  (SPA in browser) |
                         +--------+----------+
                                  |
                            REST API calls
                                  |
                         +--------v----------+
                         |    API Gateway     |
                         |  (Hono/Express)    |
                         +--------+----------+
                                  |
                    +-------------+-------------+
                    |             |             |
              +-----v----+ +-----v----+ +------v-----+
              | Auth &    | | Social   | | Media      |
              | Sessions  | | Posts    | | Upload     |
              +-----+----+ +-----+----+ +------+-----+
                    |             |             |
                    +------+------+------+------+
                           |             |
                    +------v---+   +-----v------+
                    | PostgreSQL|   | S3 / R2    |
                    | Database  |   | (Media)    |
                    +------+---+   +------------+
                           |
                    +------v-----------+
                    |  Scheduler Service |
                    |  (polls every 60s) |
                    +------+-----------+
                           |
                    +------v-----------+
                    |   BullMQ Queue    |
                    |   (Redis)         |
                    +------+-----------+
                           |
              +------------+------------+
              |            |            |
        +-----v----+ +----v-----+ +----v------+
        | YouTube  | | Facebook | | Instagram |
        | Worker   | | Worker   | | Worker    |
        +-----+----+ +----+-----+ +----+------+
              |            |            |
        +-----v----+ +----v-----+ +----v------+
        | TikTok   |
        | Worker   |
        +----------+
              |
        Platform APIs
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend runtime | Node.js + TypeScript | Shares types with frontend; single language |
| API framework | Hono | Lightweight, fast, TypeScript-native |
| Database | PostgreSQL | Relational data, job scheduling, audit logs |
| ORM | Drizzle ORM | TypeScript-native, lightweight, SQL-like |
| Job queue | BullMQ (Redis) | Battle-tested; delayed jobs, retries, rate limits, concurrency |
| Media storage | Cloudflare R2 or AWS S3 | S3-compatible, cost-effective for large files |
| Token encryption | AES-256-GCM | OAuth token security at rest |
| Auth | Session-based (cookie) | Simple for MVP; JWT possible later |
| Deployment | Railway / Fly.io | Easy Node.js + Redis + Postgres hosting |

---

## 6. Production Data Model

Extends the existing `SocialPost` model with server-side fields.

### SocialPost

```typescript
interface SocialPost {
  id: string;                          // UUID
  workspaceId: string;                 // FK to workspace
  userId: string;                      // Creator
  title: string;                       // Internal title (not published)
  caption: string;                     // Default/shared caption
  scheduledAt: string;                 // UTC ISO 8601 (unambiguous)
  timezone: string;                    // IANA timezone (e.g. "Asia/Manila")
  status: SocialPostStatus;            // Overall lifecycle status
  repeat: RepeatFrequency;             // Recurrence pattern
  repeatUntil?: string;                // End date for recurrence
  cardId?: string;                     // Optional link to a Card
  tags: string[];                      // User-defined tags
  media: MediaReference[];             // URLs to cloud storage
  createdAt: string;                   // ISO 8601
  updatedAt: string;                   // ISO 8601
}
```

### SocialPostPlatform

Each platform publication is independent, allowing per-platform status tracking.

```typescript
interface SocialPostPlatform {
  id: string;                          // UUID
  socialPostId: string;                // FK to SocialPost
  platform: Platform;                  // youtube | facebook | instagram | tiktok
  platformAccountId: string;           // FK to SocialAccount
  enabled: boolean;                    // Is this platform selected?
  status: PlatformStatus;              // Per-platform lifecycle status

  // Content overrides (fall back to SocialPost defaults)
  caption: string;                     // Platform-specific caption
  hashtags: string[];
  mentions: string[];
  visibility: string;                  // Platform-dependent options

  // Platform-specific fields
  title?: string;                      // YouTube title
  description?: string;                // YouTube description
  location?: string;                   // Geotag (Instagram, Facebook)
  altText?: string;                    // Accessibility text

  // Publishing result
  externalPostId?: string;             // Platform's native post ID
  publishedUrl?: string;               // URL of published post
  publishedAt?: string;                // UTC ISO 8601

  // Error & retry tracking
  error?: string;                      // Last error message
  errorCode?: string;                  // Platform-specific error code
  retryCount: number;
  maxRetries: number;
  lastAttemptAt?: string;
  nextRetryAt?: string;

  createdAt: string;
  updatedAt: string;
}
```

### MediaReference

Cloud storage references instead of base64 data.

```typescript
interface MediaReference {
  id: string;
  socialPostId: string;
  type: 'image' | 'video' | 'audio';
  name: string;                        // Original filename
  storageUrl: string;                  // Cloud storage URL (S3/R2)
  thumbnailUrl?: string;
  size: number;                        // Bytes
  mimeType: string;                    // e.g. "video/mp4"
  duration?: number;                   // Seconds (video/audio)
  width?: number;                      // Pixels
  height?: number;                     // Pixels
  uploadedAt: string;
  expiresAt?: string;                  // Optional TTL
}
```

### PublishingJob

Audit trail for every publishing attempt.

```typescript
interface PublishingJob {
  id: string;
  socialPostPlatformId: string;        // FK to SocialPostPlatform
  status: 'queued' | 'locked' | 'publishing' | 'completed' | 'failed';
  lockedAt?: string;
  lockedBy?: string;                   // Worker instance ID
  startedAt?: string;
  completedAt?: string;
  error?: string;
  errorCode?: string;
  retryCount: number;
  nextRetryAt?: string;
  idempotencyKey: string;             // Prevents duplicate publishes
  createdAt: string;
  updatedAt: string;
}
```

---

## 7. Social Account Model

### SocialAccount

Server-side only. Tokens are encrypted at rest.

```typescript
interface SocialAccount {
  id: string;
  userId: string;
  workspaceId: string;
  platform: Platform;
  platformAccountId: string;           // Platform's user/page/channel ID
  accountName: string;                 // Display name
  accountUsername: string;
  profileImageUrl?: string;

  // Token fields — stored encrypted server-side ONLY
  // Never exposed to the frontend
  accessToken: string;                 // AES-256-GCM encrypted
  refreshToken: string;                // AES-256-GCM encrypted
  tokenExpiresAt: string;
  scopes: string[];                    // Granted OAuth scopes

  connectedAt: string;
  status: 'active' | 'expired' | 'revoked' | 'error';
  lastUsedAt?: string;
}
```

### Token Security Rules

| Rule | Implementation |
|---|---|
| Never store in browser | All tokens server-side only |
| Encrypt at rest | AES-256-GCM for access + refresh tokens |
| No localStorage | Not in browser storage, cookies, or IndexedDB |
| Refresh before expiry | YouTube: before 1hr; Instagram: at day 50 of 60; Facebook: auto |
| Revocation detection | Check permissions endpoint on API errors; mark account as `revoked` |
| Scope tracking | Store granted scopes; compare against required scopes |

---

## 8. Media Storage Architecture

### Why localStorage is Insufficient

| Problem | Impact |
|---|---|
| base64 encoding = 33% overhead | 3 MB image becomes 4 MB in storage |
| 5 MB localStorage limit | Fills up with just a few images |
| Worker cannot access browser memory | No media available for server-side publishing |
| Media must persist across sessions | User may close browser for days before scheduled post |
| No cloud access by worker | Instagram requires publicly accessible URLs |

### Production Solution

```
Frontend: User uploads file
    |
    v
Frontend: Stream to API endpoint (POST /api/media)
    |
    v
Backend: Stream to cloud storage (S3 / R2)
    |
    v
Backend: Store MediaReference in database (URL + metadata)
    |
    v
Backend: Return MediaReference to frontend
    |
    v
Worker: At publish time, retrieve URL from DB
    |
    v
Worker: Fetch media from URL (or stream from storage)
    |
    v
Worker: Upload to platform using media URL
    (Instagram: must be publicly accessible URL)
```

---

## 9. Platform API Integration

### YouTube (Data API v3)

| Aspect | Detail |
|---|---|
| **Auth** | OAuth 2.0, scope: `youtube.upload` |
| **Upload** | `videos.insert` with resumable upload protocol |
| **Native scheduling** | YES — `status.privacyStatus: "private"` + `status.publishAt: ISO8601` |
| **Quota** | 10,000 units/day; `videos.insert` = 1 unit (capped at 100/day) |
| **Max file size** | 256 GB |
| **Token lifetime** | Access: 1 hour; Refresh: indefinite |
| **App audit** | Required for public uploads; unverified = private only |
| **Title** | Max 100 characters |
| **Description** | Max 5,000 bytes |
| **Tags** | Max 500 characters total |
| **Scheduling approach** | Upload with `publishAt` — YouTube handles timing internally |
| **Quota reset** | Midnight Pacific Time (PT) |

**Upload flow (resumable):**
1. POST to initiate resumable session (metadata + file info)
2. Receive session URI from `Location` header
3. PUT video binary to session URI
4. Receive video resource on completion (HTTP 201)

**Key advantage:** YouTube's native scheduling means SchedFlow only needs to upload at the right time with the right `publishAt` value. No separate scheduler needed for YouTube.

**App verification:** Since July 2020, all videos uploaded via unverified API projects are forced to private. Submit the [YouTube API Services Audit Form](https://support.google.com/youtube/contact/yt_api_form) for public uploads.

### Facebook (Graph API v26)

| Aspect | Detail |
|---|---|
| **Auth** | OAuth 2.0; scopes: `pages_manage_posts`, `pages_read_engagement`, `pages_show_list` |
| **Upload photos** | `POST /{page-id}/photos` (URL or multipart) |
| **Upload video** | Resumable upload to `POST /{page-id}/videos` |
| **Native scheduling** | YES — `published=false` + `scheduled_publish_time` (10 min–30 days) |
| **Rate limits** | 4,800 x engaged users/day (BUC); formula-based, not fixed |
| **Token hierarchy** | Short-lived (1-2hr) -> long-lived (60 days) -> Page token (no expiry) |
| **App review** | Required for `pages_manage_posts` (1-3 weeks, up to 3 months) |
| **Max photo** | 10 MB; max 10 per carousel |
| **Max video** | 4 GB (resumable); 240 min duration |
| **Scheduling approach** | Use native `scheduled_publish_time` — Facebook handles timing |
| **Business verification** | Required for Advanced Access; independent from App Review |

**Token flow:**
1. Get short-lived user token via OAuth
2. Exchange for long-lived user token (`fb_exchange_token` grant, ~60 days)
3. Get Page access token via `GET /me/accounts`
4. Page token has no scheduled expiry but is invalidated by password changes, app revocation, or 90 days of inactivity

**Key limitation:** Pages only. Cannot publish to personal Facebook profiles (removed since 2018).

### Instagram (Graph API)

| Aspect | Detail |
|---|---|
| **Auth** | OAuth 2.0 via Facebook Login; scopes: `instagram_content_publish`, `instagram_basic`, `pages_read_engagement` |
| **Publishing** | Two-step: create media container -> publish container |
| **Native scheduling** | NO — Must build own scheduler |
| **Rate limits** | 50-100 posts/24h (varies); 400 containers/24h; containers expire in 24h |
| **Image format** | JPEG only; max 8 MB; aspect ratio 4:5 to 1.91:1 |
| **Video** | MP4/MOV; max 300 MB; 3s-15min; H.264 codec |
| **Caption** | Max 2,200 chars; 30 hashtags; 20 @-mentions |
| **Account requirement** | Business or Creator account connected to a Facebook Page |
| **Scheduling approach** | Store payload, create container + publish at scheduled time |
| **Alt text** | Up to 1,000 characters (images only, not Reels) |

**Two-step publishing flow:**
1. `POST /{ig-user-id}/media` — create container (returns container ID)
2. For video: poll `GET /{container_id}?fields=status_code` until `FINISHED`
3. `POST /{ig-user-id}/media_publish` — publish container

**Critical:** Containers expire after 24 hours. The container must be created at publish time, NOT when the user schedules the post. This means SchedFlow must store the payload and create the container when the scheduled time arrives.

**Idempotency issue:** `media_publish` can return HTTP 500 while the post actually succeeds (~10% false failures). Always check container `status_code` before retrying.

### TikTok (Content Posting API)

| Aspect | Detail |
|---|---|
| **Auth** | OAuth 2.0; scope: `video.publish` (Direct Post) or `video.upload` (inbox) |
| **Direct Post** | YES — publishes directly to user's TikTok profile |
| **Native scheduling** | NO — Must build own scheduler |
| **Rate limits** | 6 req/min per token; ~15 posts/day per creator |
| **Video** | MP4/MOV/WebM; max 4 GB; H.264; 23-60 FPS; 360-4096px |
| **Photos** | JPEG/WebP; max 20 MB; up to 35 images per post |
| **Title** | Max 90 UTF-16 runes |
| **Description** | Max 4,000 UTF-16 runes |
| **App review** | Required; unaudited = private accounts only, SELF_ONLY visibility |
| **Upload URL expiry** | 1 hour after issuance |
| **Scheduling approach** | Store payload, call Direct Post API at scheduled time |
| **Pending share cap** | Max 5 pending shares within 24h (unaudited) |

**Direct Post flow (video):**
1. `POST /v2/post/publish/creator_info/query/` — get creator info (required for UX compliance)
2. `POST /v2/post/publish/video/init/` — initialize with post_info + source_info
3. PUT binary video to returned `upload_url` (valid for 1 hour)
4. `POST /v2/post/publish/status/fetch/` — check publish status

**Direct Post flow (photos):**
1. Query creator info
2. `POST /v2/post/publish/content/init/` with `post_mode: DIRECT_POST`, `media_type: PHOTO`, `source_info: PULL_FROM_URL` (URLs must be publicly accessible)

**App audit:** Unevaluated clients can only post to private accounts with SELF_ONLY visibility. Submit for TikTok Content Posting API audit for public posting.

### Platform Scheduling Summary

| Platform | Native Scheduling | SchedFlow Must Implement |
|---|---|---|
| YouTube | YES (`publishAt` field) | Upload at scheduled time with `publishAt` metadata |
| Facebook | YES (`scheduled_publish_time`) | Call API at schedule time with `published=false` |
| Instagram | NO | Store payload; create container + publish at time |
| TikTok | NO | Store payload; call Direct Post API at time |

**Conclusion:** 2 of 4 platforms (Instagram, TikTok) require SchedFlow to implement its own scheduling engine. Even though YouTube and Facebook support native scheduling, a unified scheduler is needed to handle all platforms consistently, manage retries, and provide a single status source of truth.

---

## 10. Platform Adapter Architecture

### Interface

```typescript
interface PlatformPublisher {
  platform: Platform;

  // Validate post against platform requirements before scheduling
  validate(post: SocialPostPlatform, media: MediaReference[]): ValidationResult;

  // Publish content to the platform
  publish(
    post: SocialPostPlatform,
    media: MediaReference[],
    account: SocialAccount
  ): Promise<PublishResult>;

  // Check status of a published/scheduled post
  getStatus(externalPostId: string, account: SocialAccount): Promise<PostStatus>;

  // Refresh expired tokens
  refreshCredentials(account: SocialAccount): Promise<RefreshResult>;
}

interface PublishResult {
  success: boolean;
  externalPostId?: string;         // Platform's native post ID
  publishedUrl?: string;           // URL of published post
  error?: string;
  errorCode?: string;
  retryable: boolean;              // Can this be retried?
}

interface ValidationResult {
  valid: boolean;
  errors: string[];                // Human-readable validation errors
  warnings: string[];              // Non-blocking warnings
}

interface PostStatus {
  status: 'publishing' | 'published' | 'failed';
  publishedAt?: string;
  error?: string;
}

interface RefreshResult {
  success: boolean;
  newAccessToken?: string;
  newRefreshToken?: string;
  expiresAt?: string;
  error?: string;
}
```

### Implementations

```typescript
class YouTubePublisher implements PlatformPublisher {
  platform: Platform = 'youtube';

  validate(post, media) {
    // Check: at least one video
    // Check: title <= 100 chars
    // Check: description <= 5000 bytes
    // Check: tags total <= 500 chars
    // Check: video format supported
  }

  async publish(post, media, account) {
    // 1. Initiate resumable upload session with metadata
    // 2. Upload video binary
    // 3. If scheduled: set privacyStatus='private' + publishAt
    // 4. Return video ID
  }

  async getStatus(externalPostId, account) {
    // GET /videos?id={id}&part=status,processingDetails
  }

  async refreshCredentials(account) {
    // POST /oauth2/token with refresh_token
  }
}

class FacebookPublisher implements PlatformPublisher {
  platform: Platform = 'facebook';

  validate(post, media) {
    // Check: at least one image or video
    // Check: message <= 63,206 chars
    // Check: image <= 10 MB, video <= 4 GB
    // Check: carousel max 10 images
  }

  async publish(post, media, account) {
    // If text/link: POST /{page-id}/feed
    // If photo: POST /{page-id}/photos
    // If video: Resumable upload to /{page-id}/videos
    // If scheduled: published=false + scheduled_publish_time
  }

  async getStatus(externalPostId, account) {
    // GET /{post-id}?fields=is_published,scheduled_publish_time
  }

  async refreshCredentials(account) {
    // Exchange long-lived token for new Page token
  }
}

class InstagramPublisher implements PlatformPublisher {
  platform: Platform = 'instagram';

  validate(post, media) {
    // Check: JPEG only for images
    // Check: image <= 8 MB, video <= 300 MB
    // Check: aspect ratio 4:5 to 1.91:1
    // Check: caption <= 2,200 chars
    // Check: hashtags <= 30
    // Check: video duration 3s-15min
  }

  async publish(post, media, account) {
    // 1. Create media container (POST /{ig-user-id}/media)
    // 2. If video: poll status_code until FINISHED
    // 3. Publish container (POST /{ig-user-id}/media_publish)
    // 4. Check for false failure (container may already be PUBLISHED)
  }

  async getStatus(externalPostId, account) {
    // GET /{container-id}?fields=status_code
  }

  async refreshCredentials(account) {
    // GET /refresh_access_token?grant_type=ig_refresh_token
    // Token must be >= 24 hours old to refresh
  }
}

class TikTokPublisher implements PlatformPublisher {
  platform: Platform = 'tiktok';

  validate(post, media) {
    // Check: video MP4/MOV/WebM
    // Check: video <= 4 GB
    // Check: FPS 23-60
    // Check: resolution 360-4096px
    // Check: title <= 90 UTF-16 runes
    // Check: description <= 4,000 UTF-16 runes
  }

  async publish(post, media, account) {
    // 1. Query creator info (required)
    // 2. Init video post (POST /v2/post/publish/video/init/)
    // 3. Upload video to upload_url (valid 1 hour)
    // 4. Check status (POST /v2/post/publish/status/fetch/)
  }

  async getStatus(externalPostId, account) {
    // POST /v2/post/publish/status/fetch/ with publish_id
  }

  async refreshCredentials(account) {
    // POST /oauth/access_token/ with refresh_token
  }
}
```

---

## 11. Scheduling Engine

### Architecture

```
┌─────────────────────────────────────────────┐
│           Scheduler Service                  │
│                                              │
│  Polling Loop (every 60 seconds):            │
│  1. Query DB:                                │
│     SELECT * FROM social_post_platforms      │
│     WHERE status = 'scheduled'               │
│     AND social_post.scheduled_at <= NOW()    │
│  2. Lock/claim each job (SELECT FOR UPDATE)  │
│  3. Update status to 'queued'                │
│  4. Dispatch to BullMQ job queue            │
│                                              │
└──────────────┬──────────────────────────────┘
               |
               v
┌─────────────────────────────────────────────┐
│         Job Queue (BullMQ / Redis)           │
│                                              │
│  - One job per platform publication          │
│  - Delayed jobs for retry scheduling         │
│  - Concurrency limits per platform           │
│  - Dead-letter queue for permanent failures  │
│                                              │
└──────────────┬──────────────────────────────┘
               |
               v
┌─────────────────────────────────────────────┐
│           Publishing Worker                   │
│                                              │
│  1. Load SocialPostPlatform from DB         │
│  2. Load SocialAccount (decrypt tokens)      │
│  3. Refresh token if expired                 │
│  4. Retrieve media from cloud storage        │
│  5. Validate against platform limits         │
│  6. Call platform adapter (publish)          │
│  7. Handle response                          │
│  8. Update status + externalPostId           │
│  9. Log audit event (PublishingJob)          │
│ 10. Notify user (Inbox notification)         │
│                                              │
└─────────────────────────────────────────────┘
```

### Why Polling + Queue

| Approach | Pros | Cons |
|---|---|---|
| Cron only | Simple | No job locking, no retry, no concurrency control |
| DB polling only | Reliable, no lost jobs | No retry logic, no rate limiting |
| Queue only | Built-in retry, concurrency | Jobs can be lost if not persisted |
| **Polling + Queue** | **Reliable discovery + robust execution** | **Slightly more infrastructure** |

Combined: scheduler polls DB every 60s (catches all due jobs, handles server restarts), dispatches to BullMQ (provides retry, concurrency, dead-letter), worker processes jobs with platform-specific logic.

### Polling Query

```sql
-- Find due posts and lock them atomically
SELECT psp.*, sp.scheduled_at, sp.timezone
FROM social_post_platforms psp
JOIN social_posts sp ON sp.id = psp.social_post_id
WHERE psp.status = 'scheduled'
  AND sp.scheduled_at <= NOW()
  AND psp.enabled = true
ORDER BY sp.scheduled_at ASC
LIMIT 50
FOR UPDATE SKIP LOCKED;  -- Prevents double-claiming in concurrent workers
```

---

## 12. Job State Machine

### SocialPostPlatform States

```
pending --> scheduled --> queued --> publishing --> published
                                                \-> failed --> retrying --> publishing
                                                \-> failed (max retries) --> permanently_failed
scheduled --> cancelled
```

### Valid Transitions

| From | To | Trigger |
|---|---|---|
| `pending` | `scheduled` | User schedules the post |
| `scheduled` | `queued` | Scheduler picks up the job |
| `queued` | `publishing` | Worker starts publishing |
| `publishing` | `published` | Platform returns success |
| `publishing` | `failed` | Platform returns error |
| `failed` | `retrying` | Retryable error, retries remaining |
| `retrying` | `publishing` | Retry attempt |
| `failed` | `permanently_failed` | Max retries exhausted |
| `scheduled` | `cancelled` | User cancels the post |

### SocialPost (Overall) States

| Overall Status | Condition |
|---|---|
| `draft` | No platform is enabled or scheduled |
| `scheduled` | All enabled platforms are scheduled |
| `publishing` | At least one platform is publishing |
| `posted` | ALL enabled platforms are published |
| `partially_published` | Some published, some failed |
| `failed` | ALL enabled platforms failed |
| `cancelled` | User cancelled all platforms |

---

## 13. Timezone Handling

### Storage
- **All scheduled times stored as UTC** in the database
- **User's timezone** stored as IANA string (e.g., `Asia/Manila`, `America/New_York`)
- `scheduledAt` column = UTC ISO 8601

### Conversion Rules
- Frontend displays times in user's local timezone
- Scheduler compares against UTC (server runs in UTC)
- **Never use the server's local timezone**
- Use a proper timezone library (`date-fns-tz` or `luxon`) for conversions

### Daylight Saving
- IANA timezone database handles DST automatically
- Store timezone name (e.g., `America/New_York`), NOT UTC offset (e.g., `UTC-5`)
- Offsets change with DST; names do not

### Example

```
User selects: August 30, 2026, 8:30 PM, Asia/Manila
Stored in DB: 2026-08-30T12:30:00Z  (UTC)
Server scheduler: compares against current UTC time
Worker: publishes at the UTC moment
Platform: receives the correct local time
```

---

## 14. Multi-Platform Partial Failure

When a post targets 4 platforms and one fails:

```
SocialPost: "Summer Campaign"
  |-- Facebook:    PUBLISHED (post #12345)
  |-- Instagram:   PUBLISHED (post #67890)
  |-- TikTok:      FAILED (rate_limit_exceeded)
  |-- YouTube:     PUBLISHED (video #abc123)

Overall status: PARTIALLY_PUBLISHED
```

Each platform publication is independent. The system:
1. Marks each platform's status individually
2. Computes the overall `SocialPost.status` as an aggregate
3. Allows retrying failed platforms without affecting published ones
4. Shows per-platform status in the UI with clear visual indicators

---

## 15. OAuth / Account Connection

### Standard OAuth Flow

```
Frontend: Settings -> Connect YouTube
    |
    v
Backend: GET /api/auth/youtube/authorize
    -> Generates state token (CSRF protection)
    -> Stores state in session/DB
    -> Returns redirect URL:
       https://accounts.google.com/o/oauth2/v2/auth?
         client_id=...&redirect_uri=...&
         scope=youtube.upload&state=...
    |
    v
Browser: Redirects to Google OAuth consent screen
    |
    v
Google: User authorizes SchedFlow
    |
    v
Backend: GET /api/auth/youtube/callback?code=...&state=...
    -> Validates state token (CSRF check)
    -> Exchanges authorization code for access + refresh tokens
    -> Encrypts tokens (AES-256-GCM)
    -> Stores in SocialAccount table
    -> Returns success -> frontend shows connected account
```

### Per-Platform OAuth Configuration

| Platform | Authorization URL | Token Endpoint | Required Scopes |
|---|---|---|---|
| YouTube | `accounts.google.com/o/oauth2/v2/auth` | `oauth2.googleapis.com/token` | `youtube.upload` |
| Facebook | `facebook.com/v26.0/dialog/oauth` | `graph.facebook.com/oauth/access_token` | `pages_manage_posts`, `pages_read_engagement`, `pages_show_list` |
| Instagram | `facebook.com/v26.0/dialog/oauth` (via FB Login) | `graph.facebook.com/oauth/access_token` | `instagram_content_publish`, `instagram_basic`, `pages_read_engagement` |
| TikTok | `www.tiktok.com/v2/auth/authorize/` | `open.tiktokapis.com/oauth/access_token/` | `video.publish` |

### Account Management UI

- **Settings > Connected Accounts** — list of connected accounts with platform icon, name, status
- **Connect** button per platform — opens OAuth flow
- **Disconnect** button — revokes token, marks account as `revoked`
- **Reconnect** button — re-initiates OAuth when token is expired
- **Multiple accounts** — users can connect multiple accounts per platform (e.g., 2 Facebook Pages)

---

## 16. Media Validation

### At Upload Time (Frontend)

Validate before uploading to cloud storage to catch issues early.

```typescript
interface MediaValidation {
  fileType: string;           // Check against allowed MIME types
  fileSize: number;           // Check against platform max
  width?: number;             // Check minimum/maximum
  height?: number;
  duration?: number;          // For video/audio
  aspectRatio?: number;       // Compute from width/height
}
```

### At Publish Time (Backend)

Double-validate before calling platform API.

### Platform Constraints

| Constraint | YouTube | Facebook | Instagram | TikTok |
|---|---|---|---|---|
| **Image format** | Any | JPEG, PNG, GIF | JPEG only | JPEG, WebP |
| **Image max size** | N/A | 10 MB | 8 MB | 20 MB |
| **Image aspect ratio** | Any | Any | 4:5 – 1.91:1 | Any |
| **Video format** | MP4, MOV, etc. | MP4, MOV | MP4, MOV | MP4, MOV, WebM |
| **Video codec** | Any | H.264 | H.264 | H.264, H.265 |
| **Video max size** | 256 GB | 4 GB | 300 MB | 4 GB |
| **Video min duration** | None | 1s | 3s | None |
| **Video max duration** | None | 240 min | 15 min | 10 min |
| **Video FPS** | Any | 30 recommended | 23-60 | 23-60 |
| **Caption max** | 5,000 bytes | 63,206 chars | 2,200 chars | 4,000 runes |
| **Hashtag max** | 15 | 30 | 30 | 30 |
| **Alt text** | Yes | Yes | Yes (images) | No |

The UI should tell the user: *"This video cannot be scheduled for TikTok because it exceeds 15 minutes"* instead of waiting until publish time.

---

## 17. User Permissions

### Roles (for multi-user workspaces)

| Permission | Admin | Member |
|---|---|---|
| Create social post | Yes | Yes |
| Edit social post | Yes | Yes (own + assigned) |
| Delete social post | Yes | No |
| Schedule post | Yes | Yes |
| Cancel scheduled post | Yes | Yes (own) |
| Publish now | Yes | Yes |
| Retry failed post | Yes | Yes (own) |
| Connect social account | Yes | Yes |
| Disconnect social account | Yes | Yes (own accounts) |
| View analytics | Yes | Yes |
| Manage workspace social settings | Yes | No |

---

## 18. Notifications

Server-side notifications for publishing events:

| Event | Notification Type | Message |
|---|---|---|
| Post published | success | "Your Instagram post was published successfully" |
| Post failed | error | "TikTok post failed: rate_limit_exceeded" |
| Token expired | warning | "YouTube authentication expired — reconnect in Settings" |
| Token revoked | error | "Facebook account disconnected by user" |
| Retry scheduled | info | "Retrying failed YouTube publish in 5 minutes" |
| Partial success | warning | "2 of 4 platforms published successfully" |
| All failed | error | "All platform publications failed for 'Summer Campaign'" |

Notifications integrate with the existing Inbox system and/or a dedicated notification center.

---

## 19. Planner & Dashboard Integration

### Planner

- Extend the existing Planner to show social posts alongside cards
- Social posts appear as chips with platform icons + status-colored left border
- Drag social posts to reschedule (same UX as card scheduling)
- Status colors: draft (secondary), scheduled (primary), publishing (warning), published (success), failed (danger)

### Dashboard Widgets (prioritized)

| Widget | Priority | Description |
|---|---|---|
| Scheduled Today | High | Posts scheduled for today with platform icons |
| Failed Posts | High | Quick access to retry failed publications |
| Connected Accounts | Medium | Status of linked platform accounts |
| This Week Overview | Medium | Calendar-style preview of upcoming posts |
| Publishing Activity | Low | Recent publish history |

---

## 20. Security Requirements

### Production Security

| Concern | Implementation |
|---|---|
| OAuth tokens | Encrypted at rest (AES-256-GCM); never exposed to frontend |
| API secrets | Server-side environment variables only |
| CSRF | State token in OAuth flow; SameSite cookies |
| Authorization | Server verifies workspace membership for every request |
| Media access | Signed URLs with short TTL; private bucket by default |
| Rate limiting | Backend rate limiting per user per platform |
| Data encryption | Encrypt sensitive fields at rest in database |
| Webhook verification | Verify platform webhook signatures (if applicable) |
| Input validation | Sanitize all user input; validate against platform schemas |
| Audit logging | Log all publishing attempts, token operations, account changes |

### Never Expose

- Platform API keys
- OAuth refresh tokens
- OAuth access tokens
- App secrets
- Database credentials

These stay server-side only. The frontend communicates exclusively through the REST API.

---

## 21. Reliability & Failure Handling

### Failure Scenarios

| Scenario | Handling |
|---|---|
| Server restarts | DB polling catches all due jobs; no jobs lost |
| Worker crashes | BullMQ job is released back to queue after lock timeout |
| API request times out | Retry with exponential backoff (5xx errors) |
| Platform is unavailable | Retry with backoff; classify as retryable |
| Database temporarily fails | Queue holds jobs; retry when DB recovers |
| Token expires | Refresh before each publish attempt; re-authenticate if refresh fails |
| Token is revoked | Mark account as `revoked`; notify user to reconnect |
| User disconnects account | Cancel all scheduled posts for that account; notify user |
| Job runs twice | Idempotency key prevents duplicate publishes |
| Network connection fails | Retry with backoff; resumable upload for large files |
| Media upload fails | Retry upload; check file integrity |

### Duplicate Prevention

- Each `SocialPostPlatform` + `scheduledAt` combination generates a unique `idempotencyKey`
- Before publishing, check if a completed job with the same key exists
- For Instagram: always check container `status_code` before retrying failed `media_publish` (~10% are false failures)

### Retry Strategy

| Error Type | Retries | Backoff |
|---|---|---|
| Rate limit (429, 80001) | 5 | Exponential: 1min, 5min, 30min, 2hr, 12hr |
| Server error (5xx) | 3 | Exponential: 1min, 5min, 30min |
| Token expired | 1 (after refresh) | Immediate |
| Token revoked | 0 (permanent) | Notify user |
| Invalid content | 0 (permanent) | Notify user with error |
| Network timeout | 3 | Exponential: 30s, 2min, 10min |

---

## 22. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Backend runtime | Node.js + TypeScript | Same language as frontend; shares types |
| API framework | Hono | Lightweight, fast, TypeScript-native |
| Database | PostgreSQL | Relational data, job scheduling, audit logs |
| ORM | Drizzle ORM | TypeScript-native, lightweight, SQL-like |
| Job queue | BullMQ (Redis) | Battle-tested; delayed jobs, retries, rate limits |
| Object storage | Cloudflare R2 or AWS S3 | Cost-effective media storage |
| Token encryption | AES-256-GCM | OAuth token security at rest |
| Auth | Session-based (cookie) | Simple for MVP |
| Deployment | Railway / Fly.io | Easy Node.js + Redis + Postgres |
| Frontend API client | fetch + React Query (or SWR) | Data fetching, caching, real-time updates |

---

## 23. Phased Implementation Plan

> **Actual stack**: Vercel serverless + MongoDB (Mongoose) + Vercel Cron
> **Auth**: Single-user mode (no login/signup yet)

### Phase 1: Backend Foundation ✅ DONE

- [x] Vercel serverless API setup (`/api/` directory)
- [x] MongoDB connection singleton + Mongoose schemas (SocialPost, SocialAccount)
- [x] Social posts CRUD endpoints (`/api/social-posts`, `/api/social-posts/:id`)
- [x] Social accounts CRUD endpoints (`/api/social-accounts`)
- [x] Media upload to Vercel Blob (`/api/media/upload`)
- [x] Frontend API client layer (`src/lib/api/client.ts`, `social-posts.ts`, `social-accounts.ts`)
- [x] `useSocialPosts` hook with API-first + localStorage fallback
- [x] StoreProvider refactored to delegate social posts to hook
- [x] Schema updated with `storageUrl`, `externalPostId`, retry fields, new statuses
- [x] ComposeModal uploads to cloud storage with base64 fallback
- [x] Vite proxy config for local dev (`/api` → `localhost:3000`)
- **Files**: `api/_lib/`, `api/social-posts/`, `api/social-accounts/`, `api/media/`, `src/lib/`
- **Plan**: `docs/phase-1-backend-foundation.md`

### Phase 2: OAuth + Publishing Core ✅ DONE

- [x] Token encryption (AES-256-GCM) for OAuth tokens at rest
- [x] YouTube OAuth flow (Google OAuth → channel info → encrypted storage)
- [x] Facebook OAuth flow (Facebook OAuth → long-lived token → page tokens → encrypted storage)
- [x] PublishingJob Mongoose schema with idempotency key, retry tracking, lock mechanism
- [x] YouTube publisher adapter (resumable upload via `videos.insert`)
- [x] Facebook publisher adapter (photo/video/carousel/text via Graph API)
- [x] Publishing jobs API (`/api/publishing-jobs`)
- [x] Cron scheduler (`/api/cron/publish`) — runs every minute, processes due jobs, exponential backoff retry
- [x] Token refresh API (`/api/auth/refresh`)
- [x] Frontend: AccountConnectionPanel (connect/disconnect YouTube & Facebook)
- [x] Frontend: PublishStatusBadge component
- [x] Vercel cron config added
- **Files**: `api/_lib/oauth.ts`, `api/_lib/publishers/`, `api/auth/youtube/`, `api/auth/facebook/`, `api/cron/`, `api/publishing-jobs/`
- **Plan**: `docs/phase-2-oauth-publishing.md`

### Phase 3: Instagram + TikTok + Resilience ✅ DONE

- [x] Instagram publisher adapter (two-step container: create → poll → publish; false-failure detection)
- [x] TikTok publisher adapter (Direct Post: creator query → init upload → PUT binary → poll status)
- [x] Instagram OAuth (via Facebook Login → `instagram_business_account`)
- [x] TikTok OAuth (TikTok OAuth → `video.publish` scope → user info)
- [x] Token refresh cron (`/api/cron/refresh-tokens`) — runs every 6 hours
- [x] All 4 publishers registered in cron scheduler
- [x] AccountConnectionPanel updated for all 4 platforms
- [x] Auth refresh handles all 4 platforms
- **Files**: `api/_lib/publishers/instagram.ts`, `api/_lib/publishers/tiktok.ts`, `api/auth/instagram/`, `api/auth/tiktok/`, `api/cron/refresh-tokens.ts`
- **Plan**: `docs/phase-3-instagram-tiktok.md`

### Phase 4: Frontend Production Integration ✅ DONE

- [x] Real-time status updates (poll `/api/social-posts/:id` every 10s while publishing)
- [x] Reschedule UI (drag on calendar → `PUT /api/social-posts/:id` with new `scheduledDate` + recomputed `scheduledAt`)
- [x] Cancel publish button (sets status to `cancelled`, cancels queued/locked/publishing jobs)
- [x] Retry failed button (creates new `PublishingJob` with reset retryCount)
- [x] Timezone selector in ComposeModal (stores `timezone` field, converts `scheduledAt` to UTC)
- [x] Publishing preview panel (shows per-platform caption, hashtags, media validation before scheduling)
- [x] Pre-publish validation (calls `publisher.validate()` before creating PublishingJob)
- [x] Platform status breakdown in post detail (per-platform status, error details, retry count)
- [x] Post detail modal showing publishing job history
- **New API**: `POST /api/social-posts/[id]/schedule`, `/cancel`, `/retry`; `GET /api/publishing-jobs?socialPostId=`
- **New files**: `api/_lib/scheduler.ts`, `api/social-posts/[id]/{schedule,cancel,retry}.ts`, `src/utils/timezones.ts`, `src/components/social/PostDetailModal.tsx`
- **Bugs fixed**: cron now only picks up jobs when due (job `nextRetryAt` set to scheduled time); `PublishingJobStatus` includes `cancelled`
- **Plan**: `docs/social-media-scheduler-plan.md` §23

### Phase 5: Notifications & Polish ✅ DONE

- [x] Server-side notification service (MongoDB `TaskNotification` collection + `api/notifications` GET/POST)
- [x] Publish-event notifications emitted in `api/cron/publish.ts` (success, partial, failed, all_failed, retry) and token refresh cron (expired, revoked)
- [x] Inbox integration for publish events via `NotificationsPanel` bell in Social dashboard (10s polling, mark read / mark all)
- [x] Dashboard widgets (`SocialOverviewWidgets`): Scheduled Today, This Week, Failed, Connected Accounts
- [x] Error recovery UI (bulk retry all failed, clear dead-letter posts)
- [x] Real analytics from platform APIs — **deferred**: requires per-platform OAuth analytics scopes + long-lived platform credentials; currently demo/mock data with clear "Demo Data" badge
- [x] Analytics dashboard with real data — demo data path retained
- [x] Export analytics to CSV (`analyticsToCsv` + `downloadCsv` in `src/utils/analytics.ts`)

### Phase 6: Advanced Features ✅ DONE (scoped)

- [x] Recurring post scheduler (daily/weekly/biweekly/weekdays/monthly + `repeatUntil`; `computeRecurrence` in `api/_lib/scheduler.ts`, UI in ComposeModal, recurrence jobs pre-created on schedule)
- [x] Bulk scheduling (`BulkScheduleModal` — multi-select checkboxes, select-all, batch date/time/timezone)
- [x] Content library / media reuse (`useMediaLibrary` localStorage hook + `MediaLibraryPanel`; save & reuse media in ComposeModal)
- [x] Webhook support (`api/webhooks` CRUD + `Webhook`/`WebhookEvent` models + `dispatchWebhookEvent` on scheduled/published/failed/cancelled; HMAC signature + `WebhooksPanel` UI)
- [ ] Team collaboration, advanced analytics, A/B testing, calendar sync — **future work**: these require multi-user auth/roles, per-platform analytics scopes, and third-party calendar/experimentation integrations outside the current single-user architecture

---

## 24. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Facebook app review rejection | Cannot publish publicly | Start review process early (1-3 months); have fallback plan |
| TikTok unaudited = private only | Cannot publish publicly | Submit for TikTok audit; support draft mode initially |
| YouTube unverified = private uploads | Cannot publish public videos | Submit YouTube API audit form early |
| Token expiry during scheduling | Post fails to publish | Background refresh job; check before each publish |
| Instagram container expiry (24h) | Cannot pre-create containers | Create container at publish time, not schedule time |
| Instagram false failures (~10%) | Unnecessary retries | Check container status_code before retrying |
| Rate limiting across platforms | Posts fail silently | Implement backoff; respect platform-specific limits |
| Media URL expiry | Worker cannot access media | Use long-lived signed URLs or public bucket for media |
| Database growth (audit logs) | Slow queries over time | Index on scheduled_at, status; archive old PublishingJobs |
| TikTok upload URL expiry (1hr) | Upload fails | Initiate and complete upload within the hour; retry if needed |
| Facebook Page token invalidation | Unexpected auth failure | Detect on API error; mark account as needing reconnection |
| Infrastructure cost scaling | High at scale | Start with R2 (free egress); use BullMQ for efficient worker utilization |

---

*End of plan. This document is the single source of truth for the Social Media Management Scheduler feature.*
