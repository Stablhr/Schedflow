# Flowline — Development Plan

Companion to `Project-context.md` (what we're building and why) and `Design.md` (what it should look like). This document covers **how** to build it: folder structure, data schema, and the order of work.

---

## 1. Project Setup

```bash
npm create vite@latest flowline -- --template react
cd flowline
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install @hello-pangea/dnd
npm install uuid
npm install lucide-react   # icon set — do NOT use Trello's icon set; pick a neutral open-source icon library
```

Configure `tailwind.config.js` to extend the theme with the turquoise palette from `Design.md` (colors, font families, border radius, box shadow scale) so components can use semantic Tailwind classes (`bg-brand`, `text-ink-muted`, etc.) instead of hardcoded hex values throughout the app.

---

## 2. Folder Structure

```
src/
  components/
    layout/
      Sidebar.jsx
      TopBar.jsx
      AppShell.jsx
    dashboard/
      DashboardView.jsx
      StatCard.jsx
      DueSoonList.jsx
      RecentBoardsList.jsx
      PlannerPreview.jsx
    inbox/
      InboxView.jsx
      InboxItem.jsx
      CaptureBox.jsx
    boards/
      BoardsHome.jsx          // board picker / "all boards" grid
      BoardView.jsx           // single board (lists + cards)
      ListColumn.jsx
      ListMenu.jsx
      Card.jsx
      AddCardForm.jsx
      AddListForm.jsx
      BoardTopBar.jsx
      ViewsMenu.jsx
      FilterPanel.jsx
      BoardMenuDrawer.jsx
      ShareModal.jsx
      VisibilityModal.jsx
    planner/
      PlannerView.jsx
      WeekGrid.jsx
      DayColumn.jsx
      UnscheduledPool.jsx
    card-modal/
      CardModal.jsx
      CardDescription.jsx
      CardLabels.jsx
      CardMembers.jsx
      CardDueDate.jsx
      CardCover.jsx
      CardAttachments.jsx      // handles both file + image
      CardComments.jsx
      CardReactions.jsx
      CardActivity.jsx
    shared/
      Avatar.jsx
      Chip.jsx
      Modal.jsx
      IconButton.jsx
  hooks/
    useLocalStorage.js
    useBoards.js
    useCards.js
    useInbox.js
  store/
    storage.js                 // all localStorage read/write logic lives here
    schema.js                  // shape/defaults for each entity
  utils/
    dates.js                   // due-date urgency logic (overdue/soon/normal)
    id.js                      // uuid wrapper
  App.jsx
  main.jsx
  index.css                    // Tailwind directives + any custom base styles
```

**Rule:** No component should call `localStorage` directly. Everything goes through `store/storage.js` so the persistence layer can be swapped for a real backend later without touching UI components.

---

## 3. LocalStorage Data Schema

Store everything under a single namespaced root key to avoid collisions with other localStorage usage in the browser, and to make export/import/reset trivial.

```js
// localStorage key: "flowline_data"
{
  version: 1,                    // bump this if the schema shape changes later
  boards: {
    [boardId]: {
      id, name, description, visibility, starred,
      background, createdAt, updatedAt,
      listOrder: [listId, listId, ...],
      labels: { [labelId]: { id, name, color } }
    }
  },
  lists: {
    [listId]: {
      id, boardId, name, assignee, collapsed, order,
      cardOrder: [cardId, cardId, ...]
    }
  },
  cards: {
    [cardId]: {
      id, boardId, listId, title, desc,
      cover: null,                 // hex color OR { type:'image', dataUrl }
      labelIds: [],
      memberIds: [],
      dueDate: null,                // ISO date string, e.g. "2026-08-20"
      location: '',
      watching: false,
      files: [ { id, name, type: 'file'|'image', dataUrl, size, addedAt } ],
      comments: [ { id, authorId, text, createdAt } ],
      reactions: { "👍": 0, "🎉": 0, "👀": 0, "❤️": 0 },
      activity: [ { id, text, createdAt } ],
      createdAt, updatedAt
    }
  },
  inbox: [
    { id, text, createdAt }
  ],
  members: {
    [memberId]: { id, name, color }   // local "team" — even single-user mode needs at least a "You" member
  },
  ui: {
    starredBoardIds: [],
    lastVisitedBoardId: null
  }
}
```

### Important localStorage constraints to design around

- **Size limit:** localStorage is capped around 5–10MB per origin depending on browser. File/image attachments stored as base64 `dataUrl` strings will burn through this fast — a handful of images can approach the limit.
  - **For MVP:** accept this limitation, but validate file size on upload (e.g., warn or block over ~1–2MB per file) and show a clear error if a `localStorage.setItem` call fails due to quota.
  - **Flag clearly in the UI** (e.g., a note in the attachment panel) that attachments are stored locally in the browser and won't sync across devices until a real backend is added.
- **No multi-device sync, no real auth** — `members` is a local list the user manages themselves (e.g., adds "You," "Client A," etc.) rather than real accounts. This is expected and fine for the local-first MVP.
- **Write strategy:** debounce writes to localStorage (e.g., 300–500ms after the last state change) rather than writing on every keystroke, to avoid perf issues while typing in the description/comment fields.

---

## 4. Build Order (Phases)

Each phase should be functional end-to-end (UI + state + persistence) before moving to the next — don't build all UI first and wire up storage later.

### Phase 0 — Foundation
- Vite + Tailwind setup with the turquoise theme tokens from `Design.md`
- `store/storage.js` with get/set/update helpers and the schema above
- `AppShell` with sidebar nav (Dashboard / Inbox / Boards / Planner) — routing via simple state or React Router, either is fine for a local-first app

### Phase 1 — Boards Core
- Create board, list, and card CRUD, backed by localStorage
- Drag-and-drop cards between lists (`@hello-pangea/dnd`)
- Card face rendering: title, labels, due-date badge, avatars (per `Design.md`)
- List behaviors: add list, collapse/expand, rename, delete

### Phase 2 — Card Modal
- Full card detail modal: description, labels, members, due date, cover, location
- Attachments (file + image) — this is the feature most affected by the localStorage constraint above; build the size-limit warning alongside the upload UI, not after
- Comments, reactions, watch toggle
- Activity log — every mutation above must append an entry (see `Project-context.md` card capabilities table)

### Phase 3 — Inbox
- Capture bar (sidebar + Dashboard)
- Inbox list with Move-to-board / Dismiss actions
- Badge count synced to sidebar nav

### Phase 4 — Planner
- Week grid view
- Unscheduled pool (cards with no `dueDate`)
- Drag-to-schedule (sets `dueDate` on the underlying card — must be the *same* card object Boards renders, not a copy)
- Week navigation (prev/next)

### Phase 5 — Dashboard
- Stats row, due-soon list, recent boards, mini planner preview
- This is a "read/aggregate" view over existing data — no new entities needed, so it's lower risk to build last

### Phase 6 — Board Menu & Polish
- Share modal, Visibility modal, Filter panel, Views menu (Board fully functional; others as placeholder shells per `Project-context.md`)
- Board-level settings: background, labels management, archived items
- Empty states, loading states, and a "Reset all data" option (clears the `flowline_data` key) for easier local testing

---

## 5. Testing Checkpoints (per phase, in VS Code + browser)

- After Phase 1: create 2+ boards, drag cards across lists, refresh the browser, confirm state persists.
- After Phase 2: attach a file and an image to a card, confirm they render and persist after refresh; intentionally attach a large file to confirm the size-limit warning fires correctly.
- After Phase 3: capture 3+ inbox items, move one to a board, dismiss another, confirm the badge count updates live.
- After Phase 4: drag a card from the pool onto a day, confirm the same card shows the new due date back on its Board.
- After Phase 5: confirm dashboard stats match actual board/card counts (no stale/cached numbers).
- After Phase 6: use "Reset all data" and confirm the app returns to a clean empty state without errors.

---

## 6. Future / Post-MVP (not part of this build)

- Real backend (Firebase or Supabase) + auth, replacing localStorage — the schema above is intentionally shaped to make this migration straightforward later
- Real multi-user collaboration (Share modal currently just simulates roles/invites locally)
- Automation rules, Slack-style integrations (explicitly deferred per `Project-context.md`)
- Table / Dashboard / Timeline / Map board views beyond the placeholder shells

---

## 7. Implementation Plan — Cover Panel, Comment Reactions, Move Card

### Feature 1: Cover Source Panel (Attachments → Cover)

Expand `CardCover.tsx` into a right-side drawer (matching `BoardMenuDrawer` pattern) with these sections:

**Schema:** Add `coverSize: 'large' | 'small'` to Card interface. Default `'small'`.

**CoverPanel.tsx** (new right-side drawer):
- **Size** — two selectable visual previews: "Large" (tall aspect-[4/5] image) and "Small" (short color-band). Updates `card.coverSize`.
- **Remove cover** — clears `card.cover` to null, resets `coverSize` to `'small'`.
- **Colors** — grid of `COVER_COLORS` swatches. Selecting one sets `card.cover = <hex>`.
- **Attachments** — thumbnails of image attachments. Clicking one sets it as cover. Active cover indicated with ring.
- **Upload a cover image** — file input that adds file to `card.files` AND sets as cover in one action. Tag with "Cover" label in attachments list.

**Rendering changes:**
- `Card.tsx` CardCoverBand: image cover + `coverSize === 'large'` → `aspect-[4/5]`; image cover + `coverSize === 'small'` → `h-8` band; color covers always `h-8`.
- `CardModal.tsx` modal band: image + large → `h-48`; image + small → `h-16`; color → `h-28` unchanged.

**Unsplash/AI options:** Omitted entirely.

### Feature 2: Comment Reactions

**Schema:** Add `reactions: Reactions` field to `CommentItem` interface (same shape as `card.reactions`).

**`src/utils/reactions.ts`** (new): localStorage helpers keyed by `schedflow_user_comment_reactions`. Shape: `{ [cardId]: { [commentId]: string[] } }`.

**CardComments.tsx changes:**
- Each comment gets an "add reaction" icon button → opens compact emoji picker (search + frequently-used row).
- Reaction pills shown below comment text. Clicking toggles user's reaction on/off.
- Activity logged: `Reacted {emoji} to a comment`.

### Feature 3: Move Card Dialog

**Overflow menu** in `CardModal.tsx` header: `MoreHorizontal` icon button → small dropdown with "Move" and "Archive" (archive moved from footer).

**MoveCardDialog.tsx** (new centered modal):
- **Board tab** — Board dropdown, List dropdown, Position dropdown, "Move" button. Uses existing `store.moveCard()`.
- **Inbox tab** — "Move to Inbox" with confirm state. Strips all card data (labels, cover, files, comments, reactions). Uses `store.addInboxItem()` + `store.deleteCard()`. Logs activity before deletion.

**Tradeoff note:** MVP discards card-specific data when demoting to Inbox. Preserving data for re-promotion is a future enhancement.

### Files Changed

| File | Change |
|------|--------|
| `src/store/schema.ts` | Add `coverSize` to Card, `reactions` to CommentItem |
| `src/store/StoreProvider.tsx` | Add `coverSize: 'small'` default in `makeCard()` |
| `src/utils/reactions.ts` | **New** — localStorage user-reaction helpers |
| `src/components/card-modal/CoverPanel.tsx` | **New** — right-side drawer |
| `src/components/card-modal/CardCover.tsx` | Simplify to button + inline remove |
| `src/components/card-modal/CardModal.tsx` | Add overflow menu, CoverPanel, MoveCardDialog |
| `src/components/card-modal/CardAttachments.tsx` | Add "Cover" badge on active cover |
| `src/components/card-modal/CardComments.tsx` | Per-comment reaction UI |
| `src/components/card-modal/MoveCardDialog.tsx` | **New** — Board/Inbox tabbed dialog |
| `src/components/boards/Card.tsx` | CardCoverBand reads coverSize |
