# Social Media Post Scheduler — Implementation Plan

> **Status**: Planning  
> **Date**: 2026-08-25  
> **Scope**: React/TypeScript/Vite SPA — no backend  
> **Principle**: All features are local-first prototype. Real API publishing, OAuth, and backend infrastructure are explicitly out-of-scope for MVP.

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Goals](#2-goals)
3. [Non-Goals](#3-non-goals)
4. [Architecture Overview](#4-architecture-overview)
5. [Data Model](#5-data-model)
6. [Platform Models](#6-platform-models)
7. [Store Methods](#7-store-methods)
8. [Composer UX](#8-composer-ux)
9. [Calendar UX](#9-calendar-ux)
10. [Card ↔ Social Post Interlinking](#10-card--social-post-interlinking)
11. [Media Attachments](#11-media-attachments)
12. [Platform Content Overrides](#12-platform-content-overrides)
13. [Draft Saves](#13-draft-saves)
14. [Scheduling & Smart Schedule](#14-scheduling--smart-schedule)
15. [Deep Linking & Platform Apps](#15-deep-linking--platform-apps)
16. [Analytics Dashboard](#16-analytics-dashboard)
17. [Undo / Redo](#17-undo--redo)
18. [JSON Import / Export](#18-json-import--export)
19. [AI Caption Generation](#19-ai-caption-generation)
20. [Browser Extension (Future)](#20-browser-extension-future)
21. [Import from Other Tools (Future)](#21-import-from-other-tools-future)
22. [Mobile Interface / Responsive Design](#22-mobile-interface--responsive-design)
23. [Navigation & Routing](#23-navigation--routing)
24. [localStorage Persistence](#24-localstorage-persistence)
25. [Schema Versioning & Migration](#25-schema-versioning--migration)
26. [Shared Components to Reuse](#26-shared-components-to-reuse)
27. [New Components to Create](#27-new-components-to-create)
28. [Platform-Specific Considerations](#28-platform-specific-considerations)
29. [Security Considerations](#29-security-considerations)
30. [Phased Implementation](#30-phased-implementation)
31. [Risks & Open Questions](#31-risks--open-questions)

---

## 1. Feature Overview

The Social Media Post Scheduler is a new top-level feature of SchedFlow that allows users to compose, customize, schedule, and track social media posts across YouTube, Facebook, TikTok, and Instagram — all from a single interface.

The scheduler provides:
- A **composer** for creating posts with per-platform content overrides
- A **drag-and-drop calendar** for visual scheduling
- A **deep linking** system to open platform apps from the browser
- An **analytics dashboard** (demo data in local mode)
- **Card interlinking** to tie social posts back to SchedFlow cards
- **AI caption generation** (simulated locally, real API in production)
- **Cross-platform scheduling** — one compose flow, multiple platforms simultaneously

---

## 2. Goals

| Goal | Description |
|------|-------------|
| **Unified scheduling** | One interface to create, customize, and schedule posts across all 4 platforms |
| **Per-platform customization** | Each platform gets its own caption length, hashtags, tone, and content overrides |
| **Visual scheduling** | Drag-and-drop calendar to rearrange and manage scheduled posts |
| **Cross-platform** | Single compose → schedule to N platforms simultaneously |
| **Draft support** | Auto-save drafts; resume later |
| **Card integration** | Link social posts to existing SchedFlow cards for project context |
| **Mobile-ready** | Responsive layout; usable on phones via browser (not native app) |
| **Local-first** | All data persists in localStorage; works fully offline |
| **Prototype-first** | Every feature ships as a working local prototype before any real API integration |
| **Extensible** | Architecture supports adding new platforms (Twitter/X, LinkedIn, etc.) later |

---

## 3. Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Real OAuth flows | No backend; platform login is simulated via manual token paste or QR codes |
| Actual API publishing | No server to hold API keys or relay requests; posts stay local until future backend |
| Native mobile apps | Responsive web only; no React Native or Capacitor |
| Real analytics | Demo/mock data only; real analytics require API integrations |
| Server-side scheduling | Scheduling is client-side (setTimeout / page-open check); no cron jobs |
| Browser extension | Deferred to future phase; requires separate extension project |
| AI caption generation (real) | Local mock/simulated; real API calls require backend proxy to hold API keys |
| Import from other tools | Deferred to future phase; requires platform-specific import logic |
| Real-time collaboration on social posts | Social posts are user-scoped, not board-scoped like cards |
| Monetization / billing | Not applicable |

---

## 4. Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                     App Shell (AppShell.tsx)              │
│  ┌─────────┐  ┌──────────────────────────────────────┐   │
│  │ Sidebar  │  │  Content Area (react-router-dom)     │   │
│  │          │  │                                      │   │
│  │ Dashboard│  │  /social          → SocialDashboard  │   │
│  │ Boards   │  │  /social/compose  → ComposeModal     │   │
│  │ Planner  │  │  /social/calendar → CalendarView     │   │
│  │ Social   │──│  /social/:id      → PostDetail       │   │
│  │ Archive  │  │                                      │   │
│  └─────────┘  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│         StoreProvider (Context)       │
│  socialPosts: SocialPost[]           │
│  addSocialPost / updateSocialPost    │
│  deleteSocialPost / moveSocialPost   │
│  ... (see §7)                        │
└──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│        localStorage (storage.ts)     │
│  Key: "schedflow-social-posts"       │
│  Schema version: 2                   │
└──────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State management** | Extend existing `StoreProvider` context | Consistent with current pattern; no new libraries |
| **Persistence** | Separate localStorage key `schedflow-social-posts` | Keeps board data clean; allows independent schema versioning |
| **Routing** | New top-level `/social` route group | Social scheduler is independent of boards; not a board sub-view |
| **Platform overrides** | Array of `SocialPostPlatform` child entities | Clean per-platform separation; supports JSON export; avoids deeply nested objects |
| **Calendar** | Reuse planner patterns (WeekColumns + DayColumn) | Proven drag-and-drop with `@hello-pangea/dnd`; familiar UX |
| **Deep links** | `window.open()` with platform URL schemes | Simple; works on mobile and desktop; fallback to browser |
| **Analytics** | Mock data generator in local mode | Allows full UI without real API; swap to real API later |

---

## 5. Data Model

All types live in `src/store/schema.ts`. The social post system introduces a new top-level entity alongside `Board`, `Card`, `List`, etc.

### SocialPost

```typescript
type SocialPostStatus = 'draft' | 'scheduled' | 'publishing' | 'posted' | 'failed';

type RepeatFrequency = 'none' | 'daily' | 'weekdays' | 'weekly' | 'biweekly' | 'monthly';

interface SocialPost {
  id: string;                          // crypto.randomUUID()
  title: string;                       // Internal title (not published)
  caption: string;                     // Default/shared caption
  platforms: SocialPostPlatform[];     // Per-platform overrides (§6)
  media: SocialMediaAttachment[];      // Images, videos, audio (§11)
  cardId?: string;                     // Optional link to a Card (§10)
  scheduledDate?: string;              // ISO date string (YYYY-MM-DD) or null for unscheduled
  scheduledTime?: string;              // HH:MM (24h) or null
  status: SocialPostStatus;            // Current lifecycle status
  repeat: RepeatFrequency;             // Recurrence pattern
  repeatUntil?: string;                // End date for recurrence
  analytics?: SocialAnalytics;         // Mock analytics data (§16)
  aiGeneration?: AIGenerationMeta;     // AI caption metadata (§19)
  tags: string[];                      // User-defined tags for filtering
  createdAt: string;                   // ISO timestamp
  updatedAt: string;                   // ISO timestamp
}
```

### SocialMediaAttachment

```typescript
type MediaType = 'image' | 'video' | 'audio';

interface SocialMediaAttachment {
  id: string;
  type: MediaType;
  name: string;                        // Original filename
  dataUrl: string;                     // base64 data URL (localStorage compatible)
  size: number;                        // Bytes
  thumbnail?: string;                  // Base64 data URL for video thumbnails
  duration?: number;                   // Duration in seconds (video/audio)
  platformCompat: Platform[];          // Which platforms this media is compatible with
}
```

### SocialAnalytics

```typescript
interface SocialAnalytics {
  platform: Platform;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  impressions: number;
  engagementRate: number;              // (likes + comments + shares) / reach
  fetchedAt: string;                   // ISO timestamp of last fetch
  isDemo: boolean;                     // true = mock data, false = real API data
}
```

### AIGenerationMeta

```typescript
interface AIGenerationMeta {
  model: string;                       // e.g. "gpt-4", "claude-3", "local-mock"
  prompt: string;                      // The prompt used
  tokensUsed: number;                  // Token count (0 for mock)
  generatedAt: string;                 // ISO timestamp
  version: number;                     // Incremented on regenerate
}
```

### Schema Additions

These fields are added to the existing `Board` type to support card interlinking:

```typescript
// Added to Board interface
interface Board {
  // ... existing fields ...
  socialPostIds?: string[];            // IDs of linked social posts
}
```

---

## 6. Platform Models

### Platform Enum

```typescript
type Platform = 'youtube' | 'facebook' | 'tiktok' | 'instagram';
```

### SocialPostPlatform

Each entry in `SocialPost.platforms` represents one platform's customized version of the post:

```typescript
type PlatformStatus = 'pending' | 'scheduled' | 'publishing' | 'posted' | 'failed';

interface SocialPostPlatform {
  platform: Platform;
  enabled: boolean;                    // Is this platform selected for this post?
  status: PlatformStatus;              // Per-platform lifecycle status
  caption: string;                     // Platform-specific caption override (falls back to SocialPost.caption)
  hashtags: string[];                  // Platform-specific hashtags
  mentions: string[];                  // @mentions for this platform
  location?: string;                   // Geotag (Instagram, Facebook)
  altText?: string;                    // Accessibility alt text for images
  visibility: 'public' | 'private' | 'friends' | 'unlisted';
  deepLink?: string;                   // Platform app deep link URL
  publishedUrl?: string;               // URL after publishing (for analytics)
  platformPostId?: string;             // Platform's native post ID (for analytics)
  error?: string;                      // Last error message if status = 'failed'
  publishedAt?: string;                // ISO timestamp of actual publish time
}
```

### Platform Defaults

Each platform has default settings that are applied when creating a new `SocialPostPlatform`:

```typescript
const PLATFORM_DEFAULTS: Record<Platform, Partial<SocialPostPlatform>> = {
  youtube: {
    caption: '',                       // YouTube supports long descriptions (5000 chars)
    visibility: 'public',
    hashtags: [],
  },
  facebook: {
    caption: '',                       // Facebook supports long text (63,206 chars)
    visibility: 'public',
    hashtags: [],
  },
  tiktok: {
    caption: '',                       // TikTok: 2,200 chars recommended (4,000 max)
    visibility: 'public',
    hashtags: [],
  },
  instagram: {
    caption: '',                       // Instagram: 2,200 chars max
    visibility: 'public',
    hashtags: [],
  },
};
```

### Platform Constraints (for validation)

```typescript
const PLATFORM_LIMITS: Record<Platform, { maxCaption: number; maxHashtags: number; supportedMedia: MediaType[] }> = {
  youtube:   { maxCaption: 5000,  maxHashtags: 15, supportedMedia: ['image', 'video'] },
  facebook:  { maxCaption: 63206, maxHashtags: 30, supportedMedia: ['image', 'video', 'audio'] },
  tiktok:    { maxCaption: 2200,  maxHashtags: 30, supportedMedia: ['video', 'image'] },
  instagram: { maxCaption: 2200,  maxHashtags: 30, supportedMedia: ['image', 'video'] },
};
```

---

## 7. Store Methods

All social post CRUD operations live in `useStore.ts` / `StoreProvider.tsx`, following the existing `mutate()` pattern.

### New Methods on `StoreContextType`

```typescript
interface StoreContextType {
  // ... existing methods ...

  // Social Posts
  socialPosts: SocialPost[];
  addSocialPost(post: Omit<SocialPost, 'id' | 'createdAt' | 'updatedAt'>): SocialPost;
  updateSocialPost(id: string, updates: Partial<SocialPost>): void;
  deleteSocialPost(id: string): void;
  duplicateSocialPost(id: string): SocialPost | null;
  moveSocialPost(id: string, newDate: string, newTime?: string): void;
  getSocialPostsByDate(date: string): SocialPost[];
  getSocialPostsByPlatform(platform: Platform): SocialPost[];
  getSocialPostsByStatus(status: SocialPostStatus): SocialPost[];
  getSocialPostsByCard(cardId: string): SocialPost[];
  getUnscheduledPosts(): SocialPost[];

  // Social Post Platforms
  addPlatformToPost(postId: string, platform: Platform): void;
  removePlatformFromPost(postId: string, platform: Platform): void;
  updatePostPlatform(postId: string, platform: Platform, updates: Partial<SocialPostPlatform>): void;
  togglePlatformEnabled(postId: string, platform: Platform): void;

  // Media
  addMediaToPost(postId: string, media: Omit<SocialMediaAttachment, 'id'>): void;
  removeMediaFromPost(postId: string, mediaId: string): void;

  // Analytics
  updatePostAnalytics(postId: string, platform: Platform, analytics: SocialAnalytics): void;
  getPostAnalytics(postId: string): SocialAnalytics[];
}
```

### Persistence Pattern

Social posts are persisted in a separate localStorage key to keep board data isolated:

```typescript
// In storage.ts
const SOCIAL_POSTS_KEY = 'schedflow-social-posts';
const SOCIAL_POSTS_VERSION = 1;

export function loadSocialPosts(): SocialPost[] {
  // ... similar to loadData() but for social posts ...
}

export function saveSocialPosts(posts: SocialPost[]): void {
  // ... similar to saveData() but for social posts ...
}
```

The `StoreProvider` calls `loadSocialPosts()` on mount and `saveSocialPosts()` via `mutate()` on every social post mutation.

---

## 8. Composer UX

The composer is the primary interface for creating and editing social posts.

### Entry Points

1. **Social Dashboard** — "New Post" button
2. **Calendar View** — Click on an empty time slot
3. **Card Modal** — "Create Social Post" action button (links the new post to the card)
4. **Unscheduled Pool** — Drag a card to the social scheduler area

### Composer Layout

```
┌────────────────────────────────────────────────────────────────┐
│  Compose Social Post                                  [×]     │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌─ Platform Selector ──────────────────────────────────────┐ │
│  │ [✓ YT] [✓ FB] [✓ TT] [✓ IG]     [+ Add Platform]      │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Caption Area ───────────────────────────────────────────┐ │
│  │ Title:  [____________________________]                   │ │
│  │                                                           │ │
│  │ Default Caption:                                          │ │
│  │ ┌───────────────────────────────────────────────────┐    │ │
│  │ │ Write your caption here...                         │    │ │
│  │ │                                                     │    │ │
│  │ │                              [AI Generate ✨]       │    │ │
│  │ └───────────────────────────────────────────────────┘    │ │
│  │ Character count: 0/2200                                  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Media ─────────────────────────────────────────────────┐  │
│  │ [+ Image] [+ Video] [+ Audio]                           │  │
│  │ ┌──────┐ ┌──────┐ ┌──────┐                              │  │
│  │ │ img1 │ │ vid1 │ │      │                              │  │
│  │ │  ✕   │ │  ✕   │ │      │                              │  │
│  │ └──────┘ └──────┘ └──────┘                              │  │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Per-Platform Overrides ─────────────────────────────────┐ │
│  │ YouTube    [Edit ▾]  Caption: 45/5000  |  Hashtags: 3    │ │
│  │ Facebook   [Edit ▾]  Caption: 45/63206 |  Hashtags: 3    │ │
│  │ TikTok     [Edit ▾]  Caption: 45/2200  |  Hashtags: 3    │ │
│  │ Instagram  [Edit ▾]  Caption: 45/2200  |  Hashtags: 3    │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Scheduling ────────────────────────────────────────────┐  │
│  │ Date: [2026-08-26]  Time: [14:00]                       │  │
│  │ [ ] Repeat: [Daily ▾] until [2026-09-26]               │  │
│  │                                                           │  │
│  │ 💡 Smart Schedule: Best times → Tue 10:00, Thu 14:00    │  │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Linked Card ────────────────────────────────────────────┐ │
│  │ [+ Link to Card]    or    [Card: "Launch Campaign" ✕]   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Tags ───────────────────────────────────────────────────┐ │
│  │ [+ Add tag]  [marketing] [launch] [promo]               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌─ Actions ────────────────────────────────────────────────┐ │
│  │ [Save Draft]  [Schedule]  [Schedule to All]  [Preview]  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### Behavior

- **Default caption** is shared across all platforms; per-platform overrides inherit from it unless overridden
- **Platform selector** toggles which platforms are included; adding a platform creates a new `SocialPostPlatform` entry
- **AI Generate** button opens a small modal to enter a prompt, select a model, and generate a caption (§19)
- **Save Draft** persists with `status: 'draft'` and no scheduled date
- **Schedule** validates date/time, sets `status: 'scheduled'`, and saves
- **Schedule to All** enables all selected platforms and schedules them simultaneously
- **Preview** shows a mock preview of how the post would look on each platform
- Auto-save draft every 30 seconds if the form has unsaved changes

---

## 9. Calendar UX

### Layout

The calendar view occupies the main content area when navigating to `/social/calendar`.

```
┌──────────────────────────────────────────────────────────────────┐
│  Social Calendar                                    [Month ▾]   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Unscheduled Pool ─────────────────────────────────────────┐ │
│  │  [Post 1]  [Post 2]  [Post 3]  ...                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Week View ───────────────────────────────────────────────┐  │
│  │  Mon 25    Tue 26    Wed 27    Thu 28    Fri 29    Sat 30  │  │
│  │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌────┐ │  │
│  │ │       │ │ Post  │ │       │ │ Post  │ │       │ │    │ │  │
│  │ │       │ │ 1 ✓   │ │       │ │ 2 ✓   │ │       │ │    │ │  │
│  │ │       │ │ YT FB │ │       │ │ IG TT │ │       │ │    │ │  │
│  │ │       │ │       │ │       │ │       │ │       │ │    │ │  │
│  │ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └────┘ │  │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ← Previous Week    Today    Next Week →                        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Features

- **Drag-and-drop** between days and from unscheduled pool (uses `@hello-pangea/dnd`)
- **Platform color coding** on each post chip (YouTube=red, Facebook=blue, TikTok=black/cyan, Instagram=purple/pink gradient)
- **Status indicators**: draft (grey), scheduled (blue), posting (yellow spinner), posted (green checkmark), failed (red)
- **Click to open** composer in edit mode
- **Week navigation** with arrow keys and "Today" button
- **Month view** toggle (optional; week view is primary)
- **New post** button opens composer; if clicking a date slot, pre-fills the date

### Drag-and-Drop

- Source: `DragDropContext` wrapping the week grid
- `Droppable` for each day column + unscheduled pool
- `Draggable` for each post chip
- On drop: call `moveSocialPost(postId, newDate, newTime)`
- Visual feedback: dragged post shows platform icons and truncated caption

---

## 10. Card ↔ Social Post Interlinking

### How It Works

- A `SocialPost` can optionally link to a `Card` via `cardId`
- A `Card` can optionally track linked social posts via `socialPostIds[]` (array on Board or Card)
- Bidirectional linking: when you link a post to a card, the card's `socialPostIds` is also updated

### UX in Card Modal

- New action button in card toolbar: "Create Social Post"
  - Opens composer with `cardId` pre-set
  - On save, updates `card.socialPostIds` in the board
- New action button: "Link Existing Social Post"
  - Opens a search/select modal listing unscheduled and draft posts
  - On select, creates the bidirectional link

### UX in Social Post Composer

- "Link to Card" section at bottom of composer
- Click to open card search modal
- Shows linked card title with unlink button

### Display

- Card modal shows a "Social Posts" section listing linked posts with status badges
- Social post detail view shows linked card with board/list context

### Storage

Social post IDs are stored on the `Board` object in `board.socialPostIds[]`. When a social post is deleted, the corresponding ID is removed from the board's array. This keeps the social post system decoupled from board storage while maintaining the link.

---

## 11. Media Attachments

### Upload Flow

1. User clicks "+ Image" / "+ Video" / "+ Audio" in the media section
2. File input opens with platform-appropriate accept filter
3. File is read as base64 data URL via `FileReader.readAsDataURL()`
4. Thumbnail is generated for videos using `<canvas>` element
5. `SocialMediaAttachment` is created and added to `SocialPost.media[]`
6. Media is stored inline as base64 in localStorage

### Platform Compatibility

Each media attachment tracks which platforms it's compatible with:

| Media Type | YouTube | Facebook | TikTok | Instagram |
|------------|---------|----------|--------|-----------|
| Image      | ✅      | ✅       | ✅     | ✅        |
| Video      | ✅      | ✅       | ✅     | ✅        |
| Audio      | ❌      | ✅       | ❌     | ❌        |

### Constraints

- **Max file size**: 10MB per file (enforced in UI; localStorage has ~5MB total limit per origin)
- **Max total media per post**: 10 files
- **Video max duration**: 60 seconds (Instagram), 10 minutes (YouTube), 3 minutes (TikTok), 240 minutes (Facebook) — warnings shown in UI
- **Image formats**: JPEG, PNG, GIF, WebP
- **Video formats**: MP4, MOV, WebM
- **Audio formats**: MP3, WAV, AAC

### localStorage Warning

Since base64-encoded media can quickly consume localStorage (5MB limit), the UI should:
- Show total storage usage in settings
- Warn when approaching 80% capacity
- Allow deleting media from posts without deleting the post
- Consider future: IndexedDB for larger media storage

---

## 12. Platform Content Overrides

### Per-Platform Customization

Each `SocialPostPlatform` entry allows independent customization of:

1. **Caption** — Platform-specific text (falls back to `SocialPost.caption` if empty)
2. **Hashtags** — Array of strings; platform-specific limits enforced
3. **Mentions** — @mentions (platform-specific formatting)
4. **Location** — Geotag string (Instagram, Facebook)
5. **Alt Text** — Accessibility text for images
6. **Visibility** — Public, private, friends-only, unlisted (platform-dependent options)

### Override UX

In the composer, the "Per-Platform Overrides" section shows a collapsed summary for each enabled platform. Clicking "Edit" expands a sub-form with that platform's specific fields.

```
YouTube    [Edit ▾]
  ┌─ YouTube Overrides ──────────────────────────────────┐
  │ Caption:    [___________________________________]    │
  │             0/5000 chars                             │
  │ Hashtags:   [#youtube] [#content] [+]                │
  │ Visibility: [Public ▾]                               │
  │ Alt Text:   [___________________________________]    │
  └──────────────────────────────────────────────────────┘
```

### Inheritance Rules

1. If `SocialPostPlatform.caption` is empty → use `SocialPost.caption`
2. If `SocialPostPlatform.hashtags` is empty → use `SocialPost.tags` as hashtags
3. If `SocialPostPlatform.visibility` is not set → use platform default (`public`)

### JSON Export Format

Platform overrides export cleanly as structured JSON:

```json
{
  "title": "Launch Announcement",
  "caption": "Excited to announce our new feature!",
  "platforms": [
    {
      "platform": "youtube",
      "caption": "Full video walkthrough of our new feature. Link in description!",
      "hashtags": ["tutorial", "newfeature", "launch"],
      "visibility": "public"
    },
    {
      "platform": "instagram",
      "caption": "It's here! 🎉 Swipe up for the full demo.",
      "hashtags": ["launch", "newfeature", "instadaily"],
      "visibility": "public"
    }
  ]
}
```

---

## 13. Draft Saves

### Auto-Save

- Composer auto-saves as draft every **30 seconds** when there are unsaved changes
- Auto-save creates or updates a draft `SocialPost` with `status: 'draft'`
- Draft posts appear in the "Drafts" section of the Social Dashboard
- Visual indicator: "Draft saved at 14:32" shown in composer footer

### Manual Save

- "Save Draft" button in composer actions
- Saves immediately with `status: 'draft'`
- Confirms with toast notification: "Draft saved"

### Draft Behavior

- Drafts have no `scheduledDate` or `scheduledTime`
- Drafts are not shown on the calendar (only in drafts list or unscheduled pool)
- Drafts can be edited, deleted, or scheduled later
- Drafts persist across sessions via localStorage

### Draft Recovery

- If the user closes the composer with unsaved changes, show a confirmation dialog:
  "You have unsaved changes. Save as draft?"
- On browser crash/reload, the last auto-saved draft is recoverable from localStorage

---

## 14. Scheduling & Smart Schedule

### Manual Scheduling

- User selects a date and time in the composer
- On "Schedule", the post's `status` changes to `'scheduled'` and `scheduledDate`/`scheduledTime` are set
- Post appears on the calendar at the specified slot

### Smart Schedule Suggestions

A mock "smart schedule" system suggests optimal posting times based on demo engagement data:

```typescript
const SMART_SCHEDULE_DATA: Record<Platform, { day: number; hour: number; score: number }[]> = {
  youtube: [
    { day: 2, hour: 14, score: 0.92 },  // Tuesday 2 PM
    { day: 4, hour: 10, score: 0.88 },  // Thursday 10 AM
    { day: 6, hour: 12, score: 0.85 },  // Saturday 12 PM
  ],
  facebook: [
    { day: 3, hour: 9, score: 0.90 },   // Wednesday 9 AM
    { day: 5, hour: 13, score: 0.87 },   // Friday 1 PM
  ],
  tiktok: [
    { day: 6, hour: 19, score: 0.95 },  // Saturday 7 PM
    { day: 0, hour: 10, score: 0.88 },   // Sunday 10 AM
    { day: 4, hour: 18, score: 0.86 },   // Friday 6 PM
  ],
  instagram: [
    { day: 1, hour: 11, score: 0.93 },  // Monday 11 AM
    { day: 5, hour: 20, score: 0.91 },   // Friday 8 PM
    { day: 0, hour: 14, score: 0.87 },   // Sunday 2 PM
  ],
};
```

The composer shows a "Smart Schedule" hint below the date/time picker with the top 2-3 suggested slots for the selected platforms.

### Recurrence

- `repeat: RepeatFrequency` allows posts to repeat on a schedule
- `repeatUntil` defines the end date
- Recurring posts auto-generate copies with updated `scheduledDate` for each occurrence
- The recurrence engine runs on app load (not via cron), checking for missed recurrences

### Scheduling Execution

Since there is no backend, scheduling is simulated:
- On app load, check all `'scheduled'` posts
- If `scheduledDate + scheduledTime` is in the past, transition status to `'posting'` → `'posted'` (simulated after 2-second delay)
- Show a notification/toast: "Post [title] has been published to [platforms]!"
- In production, this would be replaced by actual API calls

---

## 15. Deep Linking & Platform Apps

### Deep Link URL Schemes

| Platform   | Mobile App Deep Link | Web Fallback |
|------------|---------------------|--------------|
| YouTube    | `youtube://`         | `https://youtube.com` |
| Facebook   | `fb://`              | `https://facebook.com` |
| TikTok     | `snssdk1233://`      | `https://tiktok.com` |
| Instagram  | `instagram://`       | `https://instagram.com` |

### UX Flow

1. User clicks "Open in [Platform]" button on a posted/scheduled social post
2. `window.open(deepLinkUrl, '_blank')` attempts to open the native app
3. If the app is not installed, the browser falls back to the web URL
4. A confirmation dialog explains: "This will open [Platform]. Publish your post there."

### Deep Link Generation

Deep links are generated per-platform and stored in `SocialPostPlatform.deepLink`. For example:

```typescript
function generateDeepLink(platform: Platform, caption: string, mediaUrl?: string): string {
  switch (platform) {
    case 'instagram':
      return `instagram://library?AssetPickerAssetType=2`;
    case 'tiktok':
      return `snssdk1233://camera`;
    case 'facebook':
      return `fb://`;
    case 'youtube':
      return `youtube://`;
    default:
      return '#';
  }
}
```

> **Note**: True deep linking with pre-filled content requires platform SDKs and OAuth. The local prototype version opens the app; the user manually pastes content. Production version would use platform APIs to pre-fill.

---

## 16. Analytics Dashboard

### Overview

The analytics dashboard shows performance metrics for published posts. In local mode, all data is **mock/demo data**. In production, data comes from real platform APIs.

### Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│  Social Analytics                                  [This Week ▾] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─ Summary Cards ─────────────────────────────────────────────┐ │
│  │  Total Reach    │  Total Engagements │  Growth              │ │
│  │  12,450         │  1,234 (9.9%)      │  +340 followers      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Platform Breakdown ───────────────────────────────────────┐  │
│  │  YouTube   ████████████████░░░░  8,200 reach  (66%)        │  │
│  │  Instagram ████████░░░░░░░░░░░░  3,100 reach  (25%)        │  │
│  │  TikTok    ███░░░░░░░░░░░░░░░░░    850 reach  ( 7%)        │  │
│  │  Facebook  █░░░░░░░░░░░░░░░░░░░    300 reach  ( 2%)        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─ Top Posts ────────────────────────────────────────────────┐  │
│  │  1. "Launch Announcement" — 2,340 reach, 4.2% engagement   │  │
│  │  2. "Behind the Scenes"   — 1,890 reach, 6.1% engagement   │  │
│  │  3. "Tutorial: Feature X" — 1,560 reach, 3.8% engagement   │  │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌─ Engagement Over Time ─────────────────────────────────────┐ │
│  │  [Line chart placeholder — renders with CSS/divs]          │ │
│  │  Mon  Tue  Wed  Thu  Fri  Sat  Sun                         │ │
│  │   ·    ·    ·    ·    ·    ·    ·                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Mock Data Generation

```typescript
function generateMockAnalytics(post: SocialPost): SocialAnalytics[] {
  return post.platforms
    .filter(p => p.enabled && p.status === 'posted')
    .map(p => ({
      platform: p.platform,
      reach: Math.floor(Math.random() * 5000) + 500,
      likes: Math.floor(Math.random() * 500) + 50,
      comments: Math.floor(Math.random() * 100) + 5,
      shares: Math.floor(Math.random() * 200) + 10,
      clicks: Math.floor(Math.random() * 300) + 20,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      engagementRate: 0,
      fetchedAt: new Date().toISOString(),
      isDemo: true,
    }))
    .map(a => ({ ...a, engagementRate: (a.likes + a.comments + a.shares) / a.reach }));
}
```

### Analytics Display

- **Summary cards**: Total reach, total engagements, engagement rate, follower growth (mock)
- **Platform breakdown**: Horizontal bar chart per platform
- **Top posts**: Ranked list by reach
- **Engagement over time**: Simple line chart (CSS-based, no chart library)
- All mock data clearly labeled with "Demo Data" badge

---

## 17. Undo / Redo

### Implementation

Undo/redo is implemented via a **command pattern** with an undo stack:

```typescript
interface UndoableAction {
  type: string;                        // e.g. 'CREATE_POST', 'UPDATE_POST', 'DELETE_POST'
  timestamp: number;
  before: Partial<SocialPost>;         // State before the action
  after: Partial<SocialPost>;          // State after the action
  postId: string;                      // Affected post ID
}
```

### Scope

- **Undoable**: Creating, updating, deleting, moving social posts; adding/removing platforms
- **Not undoable**: Analytics refresh, media upload (too complex; would need file re-read)

### UX

- **Keyboard shortcuts**: `Ctrl+Z` (undo), `Ctrl+Shift+Z` (redo)
- **Toolbar buttons**: Undo / Redo icons in the composer and calendar toolbar
- **Toast notification**: "Undid: Delete Post 'Launch Announcement'" on undo
- **Stack limit**: Last 50 actions

### Storage

Undo/redo stacks are **in-memory only** (not persisted to localStorage). They reset on page reload. This is acceptable for a local prototype.

---

## 18. JSON Import / Export

### Export

- **Single post**: Export button in post detail/composer → downloads `.json` file with full `SocialPost` object
- **Bulk export**: Export all social posts from Social Dashboard → downloads `.json` file with `SocialPost[]`
- **Board-scoped export**: Export all posts linked to a specific board → included in board export (future)

### Export Format

```json
{
  "version": 1,
  "exportedAt": "2026-08-25T14:30:00Z",
  "posts": [
    {
      "id": "...",
      "title": "Launch Announcement",
      "caption": "Excited to announce!",
      "platforms": [...],
      "media": [...],
      "scheduledDate": "2026-08-26",
      "status": "scheduled",
      "tags": ["marketing"]
    }
  ]
}
```

### Import

- **Import button** in Social Dashboard → file input accepts `.json`
- Validates JSON structure and schema version
- Imports posts with `status: 'draft'` to avoid accidental re-scheduling
- Handles duplicates by checking `id` — skips posts that already exist
- Shows import summary: "Imported 5 posts, skipped 2 duplicates"

### Validation

```typescript
function validateImportData(data: unknown): { valid: boolean; errors: string[] } {
  // Check structure: must be { version: number, posts: SocialPost[] }
  // Validate each post has required fields
  // Check for duplicate IDs
}
```

---

## 19. AI Caption Generation

### Local Mode (MVP)

In local mode, AI caption generation is **simulated** with a mock system:

1. User clicks "AI Generate" in the composer
2. Modal opens with:
   - Prompt textarea: "Write a caption for a product launch post..."
   - Model selector: "Mock AI (local)" only
   - Token counter: "0 tokens used"
3. User clicks "Generate"
4. After a 1-2 second simulated delay, a pre-built caption template is returned
5. Caption is inserted into the text area
6. `AIGenerationMeta` is saved on the `SocialPost`

### Mock Templates

```typescript
const MOCK_CAPTIONS: Record<string, string[]> = {
  'product launch': [
    "Excited to announce our latest feature! Stay tuned for more details. #launch #newfeature",
    "It's here! We've been working hard on this and can't wait for you to try it. #launch",
    "Big news! Our newest update is live. Check it out and let us know what you think!",
  ],
  'tutorial': [
    "Here's how to get started with our latest feature. Step by step guide inside!",
    "Quick tip: Here's everything you need to know about [topic]. Save this for later!",
  ],
  'default': [
    "Check out our latest update! We're always improving to serve you better.",
    "New post! Don't forget to like and share if you find this useful.",
  ],
};
```

### Production Mode (Future)

In production, the AI caption system would:
1. Call a backend API endpoint (e.g., `POST /api/ai/caption`)
2. Backend proxies to OpenAI/Anthropic API (holds API keys server-side)
3. Returns generated caption with token usage
4. Supports model selection, temperature, and platform-specific prompts

### Token Tracking

- Each generation records `tokensUsed` in `AIGenerationMeta`
- Dashboard shows total tokens used this month (mock counter in local mode)
- Production: token budget limits, usage alerts

---

## 20. Browser Extension (Future)

> **Status**: Deferred. Not implemented in MVP.

### Concept

A browser extension that allows one-click scheduling from any webpage:

- Right-click on an image → "Schedule to Social Media"
- Extension popup with quick composer
- Auto-imports page title, URL, and selected text as caption
- Deep links back to SchedFlow web app for full editing

### Requirements (Future)

- Separate Chrome/Firefox extension project
- Communication with SchedFlow via `chrome.storage` or `postMessage`
- Content scripts for page scraping
- Background script for scheduling notifications

---

## 21. Import from Other Tools (Future)

> **Status**: Deferred. Not implemented in MVP.

### Supported Sources (Future)

| Tool | Import Method |
|------|---------------|
| Buffer | Export CSV → parse → map to SocialPost |
| Hootsuite | Export CSV → parse → map to SocialPost |
| Later | Export JSON → parse → map to SocialPost |
| CoSchedule | Export CSV → parse → map to SocialPost |

### Import Flow (Future)

1. User uploads CSV/JSON from external tool
2. Parser maps fields to `SocialPost` structure
3. User reviews and confirms import
4. Posts imported as drafts

---

## 22. Mobile Interface / Responsive Design

### Breakpoints

Following the existing SchedFlow responsive patterns:

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Mobile     | < 640px | Single column; stacked composer; full-width calendar |
| Tablet     | 640-1024px | Two-column where possible; compact calendar |
| Desktop    | > 1024px | Full layout; side-by-side panels |

### Mobile-Specific UX

- **Composer**: Full-screen modal; fields stacked vertically
- **Calendar**: Day view (not week view); swipe between days
- **Analytics**: Summary cards stacked; charts full-width
- **Deep links**: Primary CTA; opens platform apps directly
- **Navigation**: Hamburger menu for sidebar; social scheduler accessible via bottom nav or sidebar

### Touch Interactions

- **Drag-and-drop**: Long-press to initiate drag on calendar (mobile `@hello-pangea/dnd` support)
- **Swipe**: Swipe left/right on calendar days
- **Pull-to-refresh**: Refresh analytics data (mock)

---

## 23. Navigation & Routing

### New Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/social` | `SocialDashboard` | Main social scheduler dashboard |
| `/social/compose` | `ComposeModal` (full-screen) | Create/edit social post |
| `/social/compose/:id` | `ComposeModal` (full-screen) | Edit existing social post |
| `/social/calendar` | `SocialCalendarView` | Calendar scheduling view |
| `/social/analytics` | `AnalyticsView` | Analytics dashboard |
| `/social/post/:id` | `PostDetailView` | View single post details |

### Sidebar Navigation

Add a new top-level item in the sidebar between "Planner" and "Archive":

```typescript
// In Sidebar.tsx
{
  label: 'Social',
  icon: Share2,  // from lucide-react
  path: '/social',
}
```

### App.tsx Route Registration

```tsx
<Route path="/social" element={<SocialDashboard />} />
<Route path="/social/compose" element={<ComposeModal />} />
<Route path="/social/compose/:id" element={<ComposeModal />} />
<Route path="/social/calendar" element={<SocialCalendarView />} />
<Route path="/social/analytics" element={<AnalyticsView />} />
<Route path="/social/post/:id" element={<PostDetailView />} />
```

### ViewsMenu Integration

The Social Dashboard includes its own sub-navigation tabs:
- **Posts** (all posts with filters)
- **Calendar** (week/day view)
- **Analytics** (dashboard)
- **Drafts** (draft-only list)

---

## 24. localStorage Persistence

### Storage Keys

| Key | Value | Version |
|-----|-------|---------|
| `schedflow-data` | Board data (existing) | 2 |
| `schedflow-social-posts` | SocialPost[] (new) | 1 |
| `schedflow-ui` | UI preferences (dark mode, etc.) | 1 |

### Read/Write Pattern

Following the existing `storage.ts` pattern:

```typescript
const SOCIAL_POSTS_KEY = 'schedflow-social-posts';
const SOCIAL_POSTS_VERSION = 1;

export function loadSocialPosts(): SocialPost[] {
  try {
    const raw = localStorage.getItem(SOCIAL_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (parsed.version !== SOCIAL_POSTS_VERSION) {
      return migrateSocialPosts(parsed.data);
    }
    return Array.isArray(parsed.data) ? parsed.data : [];
  } catch {
    return [];
  }
}

export function saveSocialPosts(posts: SocialPost[]): void {
  const payload = { version: SOCIAL_POSTS_VERSION, data: posts };
  localStorage.setItem(SOCIAL_POSTS_KEY, JSON.stringify(payload));
}
```

### Storage Limits

- localStorage per origin: ~5MB
- Current board data usage: varies (estimate ~500KB-1MB for active users)
- Social posts with media: each image ~100KB-1MB in base64
- **Strategy**: Keep media small; show storage meter in settings; warn at 80% capacity

---

## 25. Schema Versioning & Migration

### Version Tracking

Social posts have their own schema version, independent of board data:

```typescript
const SOCIAL_POSTS_VERSION = 1;
```

### Migration Function

```typescript
function migrateSocialPosts(data: unknown): SocialPost[] {
  if (!Array.isArray(data)) return [];

  return data.map(post => {
    let migrated = { ...post };

    // v0 → v1: Add missing fields
    if (!migrated.tags) migrated.tags = [];
    if (!migrated.repeat) migrated.repeat = 'none';
    if (!migrated.createdAt) migrated.createdAt = new Date().toISOString();
    if (!migrated.updatedAt) migrated.updatedAt = new Date().toISOString();
    if (!migrated.platforms) migrated.platforms = [];
    if (!migrated.media) migrated.media = [];

    // Ensure each platform has required fields
    migrated.platforms = migrated.platforms.map(p => ({
      enabled: true,
      status: 'pending' as PlatformStatus,
      caption: '',
      hashtags: [],
      mentions: [],
      visibility: 'public' as const,
      ...p,
    }));

    return migrated;
  });
}
```

### Future Migrations

When schema changes are needed:
1. Increment `SOCIAL_POSTS_VERSION`
2. Add migration logic in `migrateSocialPosts()` for the previous version → new version
3. `loadSocialPosts()` detects version mismatch and runs migration

---

## 26. Shared Components to Reuse

| Component | Location | Reuse In |
|-----------|----------|----------|
| `Modal` | `src/components/shared/Modal.tsx` | Composer wrapper, analytics modals |
| `Button` | `src/components/shared/Button.tsx` | All action buttons |
| `Input` | `src/components/shared/Input.tsx` | Composer fields, search |
| `Chip` | `src/components/shared/Chip.tsx` | Platform tags, status badges, hashtags |
| `SectionLabel` | `src/components/shared/SectionLabel.tsx` | Composer section headers |
| `DueBadge` | `src/components/shared/DueBadge.tsx` | Post status badges |
| `CardAttachments` | `src/components/card-modal/CardAttachments.tsx` | Media upload/display pattern |
| `CardCover` | `src/components/card-modal/CardCover.tsx` | Media preview rendering |
| `CoverPanel` | `src/components/card-modal/CoverPanel.tsx` | Media gallery layout |
| `MoveCardDialog` | `src/components/card-modal/MoveCardDialog.tsx` | Dialog pattern for move/schedule |
| `ErrorBoundary` | `src/components/shared/ErrorBoundary.tsx` | Route-level error handling |

### Utility Functions

| Utility | Location | Reuse In |
|---------|----------|----------|
| `uid()` | `src/utils/id.ts` | ID generation for all new entities |
| `formatSize()` | `src/utils/format.ts` | Media file size display |
| `addDays()`, `formatDate()`, `isSameDay()` | `src/utils/dates.ts` | Calendar date logic |
| `PLATFORM_COLORS` | `src/utils/color.ts` | Platform color coding |
| `getContrastColor()` | `src/utils/contrast.ts` | Text contrast on platform colors |

---

## 27. New Components to Create

### `src/components/social/`

| Component | File | Description |
|-----------|------|-------------|
| `SocialDashboard` | `SocialDashboard.tsx` | Main dashboard with post list, filters, actions |
| `SocialCalendarView` | `SocialCalendarView.tsx` | Calendar view with drag-and-drop scheduling |
| `ComposeModal` | `ComposeModal.tsx` | Full composer for creating/editing posts |
| `PlatformSelector` | `PlatformSelector.tsx` | Platform toggle chips with icons |
| `PlatformOverrides` | `PlatformOverrides.tsx` | Per-platform content customization panels |
| `MediaUploader` | `MediaUploader.tsx` | File upload with preview and constraints |
| `MediaGallery` | `MediaGallery.tsx` | Grid of attached media with remove/edit |
| `SmartScheduleHint` | `SmartScheduleHint.tsx` | Optimal time suggestions display |
| `PostCard` | `PostCard.tsx` | Post summary card for lists and calendar |
| `PostDetailView` | `PostDetailView.tsx` | Full post detail view |
| `AnalyticsView` | `AnalyticsView.tsx` | Analytics dashboard |
| `AnalyticsCard` | `AnalyticsCard.tsx` | Summary metric card |
| `PlatformBreakdown` | `PlatformBreakdown.tsx` | Per-platform analytics bar chart |
| `DraftsList` | `DraftsList.tsx` | Draft posts list view |
| `TagInput` | `TagInput.tsx` | Tag/chip input component |
| `CaptionEditor` | `CaptionEditor.tsx` | Rich caption textarea with character count |
| `AIGenerateModal` | `AIGenerateModal.tsx` | AI caption generation modal |
| `DeepLinkButton` | `DeepLinkButton.tsx` | Platform deep link open button |
| `PostPreviewModal` | `PostPreviewModal.tsx` | Preview of how post looks on each platform |
| `ImportExportPanel` | `ImportExportPanel.tsx` | JSON import/export UI |
| `CardLinker` | `CardLinker.tsx` | Search and link cards to social posts |
| `UnscheduledPool` | `UnscheduledPool.tsx` | Drag source for unscheduled posts |

---

## 28. Platform-Specific Considerations

### YouTube
- **Video required**: YouTube posts should have at least one video attachment
- **Title field**: YouTube requires a separate title (use `SocialPost.title`)
- **Description**: Long-form caption (5000 chars)
- **Hashtags**: Up to 15; displayed above title
- **Thumbnail**: Custom thumbnail upload (future; use video frame for MVP)
- **Deep link**: `youtube://` opens YouTube app

### Facebook
- **Long text**: Facebook supports very long captions (63K chars)
- **Image/video**: Both supported; carousel for multiple images
- **Visibility options**: Public, Friends, Only Me, Custom
- **Location**: Geotag supported
- **Deep link**: `fb://` opens Facebook app

### TikTok
- **Video-first**: TikTok is primarily video; images shown as slideshow
- **Short captions**: 2200 chars recommended (4000 max)
- **Hashtags**: Critical for discovery; up to 30
- **Sounds**: Not supported via API (manual in-app only)
- **Duration limits**: 15s, 60s, 3min, 10min options
- **Deep link**: `snssdk1233://` opens TikTok app

### Instagram
- **Visual-first**: Images and Reels (video) are primary
- **Caption limit**: 2200 chars
- **Hashtags**: Up to 30; 5-15 recommended for optimal engagement
- **Alt text**: Important for accessibility
- **Location**: Geotag supported
- **Carousel**: Up to 10 images/videos per post
- **Stories**: Not supported via basic API (manual in-app only)
- **Deep link**: `instagram://` opens Instagram app

### Cross-Platform Media Compatibility Matrix

| Feature | YouTube | Facebook | TikTok | Instagram |
|---------|---------|----------|--------|-----------|
| Image posts | ✅ | ✅ | ⚠️ Slideshow | ✅ |
| Video posts | ✅ | ✅ | ✅ (primary) | ✅ Reels |
| Audio only | ❌ | ✅ | ❌ | ❌ |
| Carousel | ❌ | ✅ | ❌ | ✅ |
| Custom thumbnail | ✅ | ✅ | ❌ | ❌ |
| Alt text | ✅ | ✅ | ❌ | ✅ |
| Geotag | ❌ | ✅ | ❌ | ✅ |

---

## 29. Security Considerations

### Local Mode (MVP)

| Concern | Mitigation |
|---------|------------|
| **localStorage limits** | Show storage meter; warn at 80%; cap media file sizes |
| **Base64 media in storage** | Compress images before encoding; limit total media per post |
| **No authentication** | Local-only; no user accounts; single-user app |
| **XSS via caption rendering** | Sanitize all user input before rendering; use React's default escaping |
| **Deep link injection** | Validate deep link URLs against known platform URL patterns |
| **JSON import validation** | Validate schema on import; reject malformed data; sanitize strings |

### Production Mode (Future)

| Concern | Mitigation |
|---------|------------|
| **API keys** | Never store in frontend; use backend proxy |
| **OAuth tokens** | Store encrypted in backend; refresh tokens server-side |
| **CSRF** | Backend CSRF protection on API endpoints |
| **Rate limiting** | Backend rate limiting per user per platform |
| **Data encryption** | Encrypt sensitive data at rest in backend database |

---

## 30. Phased Implementation

### Phase 1: Data Layer & Core UI (MVP Foundation)

**Duration**: 2-3 days  
**Goal**: Social posts can be created, stored, and displayed

| Task | Files | Priority |
|------|-------|----------|
| Define `SocialPost`, `SocialPostPlatform`, `SocialMediaAttachment`, `SocialAnalytics`, `AIGenerationMeta` types | `schema.ts` | High |
| Add social post localStorage persistence (`loadSocialPosts`, `saveSocialPosts`) | `storage.ts` | High |
| Add `migrateSocialPosts()` function | `storage.ts` | High |
| Add social post CRUD methods to store (`addSocialPost`, `updateSocialPost`, `deleteSocialPost`, etc.) | `useStore.ts`, `StoreProvider.tsx` | High |
| Add `/social` route and Social Dashboard page | `App.tsx`, new `SocialDashboard.tsx` | High |
| Add "Social" nav item to sidebar | `Sidebar.tsx` | High |
| Basic post list view with status badges | `SocialDashboard.tsx` | High |
| Post detail view | `PostDetailView.tsx` | Medium |
| "New Post" button opens basic composer | `ComposeModal.tsx` | Medium |

### Phase 2: Composer & Platform Overrides

**Duration**: 2-3 days  
**Goal**: Full composer with per-platform content customization

| Task | Files | Priority |
|------|-------|----------|
| Platform selector chips | `PlatformSelector.tsx` | High |
| Caption editor with character count | `CaptionEditor.tsx` | High |
| Per-platform override panels | `PlatformOverrides.tsx` | High |
| Hashtag and mention inputs | `TagInput.tsx` | High |
| Media upload and gallery | `MediaUploader.tsx`, `MediaGallery.tsx` | High |
| Visibility selector per platform | `PlatformOverrides.tsx` | Medium |
| Draft auto-save | `ComposeModal.tsx` | High |
| Save draft / schedule buttons | `ComposeModal.tsx` | High |
| Form validation (required fields, character limits) | `ComposeModal.tsx` | Medium |
| Post preview modal | `PostPreviewModal.tsx` | Medium |

### Phase 3: Calendar & Drag-and-Drop

**Duration**: 2-3 days  
**Goal**: Visual scheduling with drag-and-drop

| Task | Files | Priority |
|------|-------|----------|
| Calendar week view | `SocialCalendarView.tsx` | High |
| Day columns with post chips | `SocialCalendarView.tsx` | High |
| Drag-and-drop between days | `SocialCalendarView.tsx` | High |
| Unscheduled pool as drag source | `UnscheduledPool.tsx` | High |
| Week navigation (prev/next/today) | `SocialCalendarView.tsx` | High |
| Platform color coding on post chips | `PostCard.tsx` | Medium |
| Status indicators on post chips | `PostCard.tsx` | Medium |
| Click post chip to open composer | `SocialCalendarView.tsx` | Medium |
| Click empty slot to create post on that date | `SocialCalendarView.tsx` | Medium |
| Smart schedule hints | `SmartScheduleHint.tsx` | Medium |

### Phase 4: Card Integration & Deep Linking

**Duration**: 1-2 days  
**Goal**: Posts link to cards; deep links open platform apps

| Task | Files | Priority |
|------|-------|----------|
| "Create Social Post" action in Card Modal | `CardModal.tsx` | High |
| "Link Existing Post" action in Card Modal | `CardModal.tsx` | Medium |
| Card linker in composer | `CardLinked.tsx` | Medium |
| Linked card display in post detail | `PostDetailView.tsx` | Medium |
| Deep link button on posted/scheduled posts | `DeepLinkButton.tsx` | High |
| Platform deep link URL generation | `DeepLinkButton.tsx` | Medium |
| "Open in [Platform]" confirmation dialog | `DeepLinkButton.tsx` | Medium |

### Phase 5: Analytics, AI, Import/Export

**Duration**: 2-3 days  
**Goal**: Analytics dashboard, AI mock, import/export

| Task | Files | Priority |
|------|-------|----------|
| Analytics view with summary cards | `AnalyticsView.tsx`, `AnalyticsCard.tsx` | Medium |
| Platform breakdown bar chart | `PlatformBreakdown.tsx` | Medium |
| Top posts ranking | `AnalyticsView.tsx` | Medium |
| Mock analytics data generation | `analytics.ts` (new util) | Medium |
| AI caption generation modal (mock) | `AIGenerateModal.tsx` | Medium |
| Mock caption templates | `aiCaptions.ts` (new util) | Low |
| Token usage tracking (mock counter) | `AIGenerateModal.tsx` | Low |
| JSON export (single post + bulk) | `ImportExportPanel.tsx` | Medium |
| JSON import with validation | `ImportExportPanel.tsx` | Medium |
| Undo/redo system | `undo.ts` (new util) | Low |

### Phase 6: Polish & Responsive

**Duration**: 1-2 days  
**Goal**: Mobile responsive, polish, accessibility

| Task | Files | Priority |
|------|-------|----------|
| Mobile responsive layout | All social components | High |
| Touch drag-and-drop support | `SocialCalendarView.tsx` | Medium |
| Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z) | `ComposeModal.tsx`, `SocialCalendarView.tsx` | Low |
| Accessibility (ARIA labels, focus management) | All social components | Medium |
| Loading states and empty states | All social components | Medium |
| Toast notifications for actions | All social components | Medium |
| Post recurrence engine | `recurrence.ts` (new util) | Low |
| Storage meter in settings | `SettingsModal.tsx` | Low |

---

## 31. Risks & Open Questions

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **localStorage 5MB limit** | Media-heavy posts could fill storage quickly | Compress images; show storage meter; consider IndexedDB for future |
| **No backend = no real publishing** | Users may expect actual posting | Clearly label as "prototype"; deep links as workaround |
| **Base64 media is inefficient** | Large storage footprint per image | Compress to JPEG quality 0.7; resize to max 1200px width |
| **`@hello-pangea/dnd` mobile support** | Touch drag may be buggy | Test on mobile early; provide tap-to-move fallback |
| **Schema migration complexity** | Future schema changes need migration logic | Keep schema simple; version carefully; test migrations |
| **Analytics mock may confuse users** | Users may think data is real | Clearly label "Demo Data" with visual badge |
| **Deep links may not work on all devices** | Some platforms block deep links | Always provide web fallback URL |
| **Undo/redo memory usage** | 50-action stack with large posts | Limit to 50 actions; store only diffs, not full copies |

### Open Questions

| Question | Impact | Decision Needed |
|----------|--------|-----------------|
| Should social posts be board-scoped or global? | Data organization | **Decision: Global** — Social posts are independent of boards; linked via `cardId` |
| Should we use IndexedDB for media storage? | Storage capacity | Defer to Phase 6+; localStorage sufficient for MVP |
| Should the calendar show time slots or just days? | Calendar UX | **Decision: Days only** for MVP; time is set in composer, not on calendar grid |
| Should analytics auto-refresh or manual? | UX | **Decision: Manual** — "Refresh Analytics" button; no auto-polling |
| How should recurring posts be displayed on calendar? | Calendar UX | Show each occurrence as a separate chip; linked by `repeat` group ID |
| Should we support scheduling in different timezones? | Complexity | **Decision: No** — Use local browser timezone for MVP |
| Should the AI generator support multiple languages? | Feature scope | Defer to production; MVP is English-only mock |
| Should we add a "Social" view to the board calendar? | Integration | Defer to Phase 4; board calendar stays card-only for now |

---

## Appendix: File Structure

```
src/
  components/
    social/
      SocialDashboard.tsx
      SocialCalendarView.tsx
      ComposeModal.tsx
      PlatformSelector.tsx
      PlatformOverrides.tsx
      MediaUploader.tsx
      MediaGallery.tsx
      SmartScheduleHint.tsx
      PostCard.tsx
      PostDetailView.tsx
      AnalyticsView.tsx
      AnalyticsCard.tsx
      PlatformBreakdown.tsx
      DraftsList.tsx
      TagInput.tsx
      CaptionEditor.tsx
      AIGenerateModal.tsx
      DeepLinkButton.tsx
      PostPreviewModal.tsx
      ImportExportPanel.tsx
      CardLinked.tsx
      UnscheduledPool.tsx
  utils/
    analytics.ts              # Mock analytics data generation
    aiCaptions.ts             # Mock AI caption templates
    recurrence.ts             # Recurring post engine
    deepLinks.ts              # Platform deep link URL generation
    undo.ts                   # Undo/redo command stack
    platformDefaults.ts       # Platform defaults and limits
  store/
    schema.ts                 # Extended with social post types
    useStore.ts               # Extended with social post methods
    storage.ts                # Extended with social post persistence
    StoreProvider.tsx          # Extended with social post state
```

---

*End of plan. This document is the single source of truth for the Social Media Post Scheduler feature.*
