# Phase 1: Backend Foundation — Detailed Implementation Plan

> **Status**: In Progress
> **Date**: 2026-08-26
> **Goal**: Vercel serverless API + MongoDB, social post CRUD, frontend API client with localStorage fallback

## Tech Choices

| Decision | Choice |
|---|---|
| Hosting | Vercel (serverless functions) |
| Database | MongoDB (Mongoose ODM) |
| Frontend migration | API-first with localStorage fallback |
| Auth | Single-user mode (no auth yet) |
| Media storage | Vercel Blob |

## New Files

```
api/
  _lib/
    mongodb.ts              # MongoDB connection singleton
    response.ts             # Standard API response helpers
    models/
      SocialPost.ts         # Mongoose schema
      SocialAccount.ts      # Mongoose schema
  social-posts/
    index.ts                # GET (list) + POST (create)
    [id].ts                 # GET/PUT/DELETE single post
  social-accounts/
    index.ts                # GET + POST
    [id].ts                 # GET + DELETE
  media/
    upload.ts               # POST (upload to Vercel Blob)

src/
  lib/
    api/
      client.ts             # Base fetch wrapper
      social-posts.ts       # Social post API functions
      social-accounts.ts    # Account API functions
      media.ts              # Media upload API
    hooks/
      useSocialPosts.ts     # React hook with API + localStorage fallback
```

## Modified Files

| File | Change |
|---|---|
| package.json | Add mongoose, @vercel/blob |
| src/store/schema.ts | Add storageUrl to SocialMediaAttachment |
| src/store/useStore.ts | Minor interface updates |
| src/store/StoreProvider.tsx | Replace localStorage with useSocialPosts hook |
| src/components/social/ComposeModal.tsx | Upload to cloud instead of base64 |
| .gitignore | Ensure api/ is not ignored |

## Implementation Steps

1. Install dependencies
2. Create env files
3. Create vercel.json
4. Create MongoDB connection
5. Create API response helpers
6. Create Mongoose models
7. Create API routes (social posts CRUD)
8. Create API routes (social accounts)
9. Create media upload route
10. Create frontend API client
11. Create useSocialPosts hook
12. Modify StoreProvider
13. Update schema
14. Modify ComposeModal
15. Verify build

## Verification Checklist

- [ ] vercel dev starts frontend + API
- [ ] POST /api/social-posts creates in MongoDB
- [ ] GET /api/social-posts returns all posts
- [ ] PUT /api/social-posts/:id updates
- [ ] DELETE /api/social-posts/:id deletes
- [ ] Social Dashboard shows posts from API
- [ ] Compose Modal creates via API
- [ ] API down = falls back to localStorage
- [ ] Media uploads to cloud storage
- [ ] npm run build succeeds
- [ ] No TypeScript errors
- [ ] Existing localStorage posts still load
