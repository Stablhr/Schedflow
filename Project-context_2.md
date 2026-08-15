# Project Context: Flowline — Project Management + Social Media Planner

## 1. Overview

Flowline is a web-based **project management tool with an integrated social media content planner**, inspired by the visual, Kanban-style workflow popularized by Trello. It is built from original code, original visual design, and an original name/brand — it references Trello's *interaction patterns* (boards, lists, cards, drag-and-drop) the way countless legitimate productivity tools do, without copying Trello's name, logo, color identity, marketing copy, or any proprietary assets.

What makes Flowline different from a plain Trello clone is that it's purpose-built around a use case Trello only handles generically: **planning, approving, and scheduling social media content** alongside regular project/task work, in one tool instead of two.

## 2. A Note on Legality & Originality

Since the explicit goal is to build this "in the most legal way possible," the project follows these principles throughout:

- **No Trello branding.** Different product name ("Flowline"), different logo, different color identity, different copy/microcopy throughout.
- **UI *patterns*, not UI *assets*.** Kanban boards, draggable cards, and list-based workflows are a functional, widely-used interaction pattern (Trello itself didn't invent it — it comes from the Kanban method used in manufacturing/Agile long before any software cloned it). Recreating the *pattern* (columns, cards, drag-and-drop, due dates, labels) is standard practice across dozens of legitimate tools (Asana, ClickUp, Notion, Linear, etc.). Copying Trello's specific icon set, illustrations, or exact color palette would not be.
- **Original content.** Any example/seed data used during development (board names, card examples) should be original, not copied verbatim from reference screenshots.
- **This is not legal advice.** If Flowline is ever taken beyond a personal/portfolio project into a commercial product, a real IP/trademark check is worth doing before launch — this document just describes the development approach, not a legal guarantee.

## 3. Main Objective

Give a person or small team **one visual home base** for both their general project work and their social content pipeline — reducing the need to run a task board tool and a separate content calendar tool side by side.

## 4. Core Pillars

Flowline is organized around four pillars, each a primary nav destination:

### 4.1 Dashboard
**Purpose:** The at-a-glance home screen — what needs attention today, across everything.

- Quick stats row: number of boards, cards due this week, unread Inbox items, starred boards
- "Due soon" list — cards with upcoming due dates across all boards, sorted soonest-first, color-coded by urgency (matches the due-date badge logic used elsewhere)
- "Recently active" boards — the last few boards touched, as clickable cards
- Mini Planner preview — a condensed view of the current week, linking through to the full Planner
- Quick-capture entry point (same capture-to-Inbox behavior available from the sidebar)

### 4.2 Inbox
**Purpose:** Capture to-dos from anywhere, anytime — a fast, frictionless entry point before a task gets organized.

- Always-accessible quick-add field (sidebar and Dashboard)
- Captured items land unsorted in Inbox
- From Inbox, each item can be:
  - **Moved into a Board** (assigned to a specific board + list)
  - **Scheduled directly into the Planner** (given a due date, which also creates/attaches it to a board card)
  - **Dismissed** (deleted without further action)
- Inbox badge shows a live unprocessed-item count in the sidebar

### 4.3 Boards
**Purpose:** The core "to-do to done" workspace — Kanban-style visual task and content management.

- **Boards** = projects or content pipelines (e.g., "Website Launch," "Instagram Content — August," "Client Onboarding")
- **Lists** = customizable workflow stages. For a general project board, defaults might be To Do → In Progress → Review → Done. For a **social media content board**, the default template mirrors a real content-approval pipeline: **Pending → In Progress → Production Approval → Marketing Approval → For Posting → Scheduled → Done** — each stage optionally owned by a named approver (an "assignee" subtitle under the list name), matching how content actually moves from draft to published in a real team.
- **Cards** = individual tasks or content pieces, draggable between lists
- Board-level controls: search (with a "recent boards" quick-switch), star/favorite, share with collaborators, visibility setting, filter, and a board menu (see 4.5)
- Multiple boards, freely created, each independently themed by workflow stage names

### 4.4 Planner
**Purpose:** Turn prioritized tasks or scheduled content into a visual, date-based plan.

- Week-view calendar (day columns)
- Drag, drop, and snap cards from Boards or the Inbox directly onto a calendar day to set/change their due date
- Two-way sync: a due date set here updates the source card on its Board, and vice versa — Planner is a *view* of the same card data, not a separate list
- For social content specifically, this doubles as a **content calendar** — see at a glance what's scheduled to post on which day

### 4.5 Board Menu & Supporting Features
Available from within a Board (drawer/menu, not top-level nav):

- **Share** — invite collaborators by name/email with a role (Member/Admin/Observer), or generate a shareable link
- **Visibility** — Private / Workspace / Public, controlling who can see the board
- **Labels** — board-level color-coded tags (repurposable per board — e.g., "Urgent"/"Low priority" for a general board, or "Instagram"/"Facebook"/"Blog" as content-type tags for a social board)
- **Filter** — filter the visible cards by keyword, assigned member, completion status, due date range, or label
- **Views** — Board (fully supported) with Table/Calendar/Dashboard/Timeline/Map as a documented but progressively-built roadmap (Calendar view maps to the shared Planner)
- **Archived items**, **Copy board**, **Activity log**, **Change background**, and other board-management utilities

*(Note: Automation and Slack-style integrations are intentionally out of scope for the initial build — noted as a later-phase idea, not part of MVP.)*

## 5. Card Capabilities

Each card — whether a general task or a piece of social content — is the atomic unit of work and supports:

| Feature | Description |
|---|---|
| **Title & description** | Core task/content details |
| **Attach file** | Any file type (briefs, scripts, spreadsheets) |
| **Attach image** | Image-specific attachment — critical for social content cards (the actual creative/graphic being posted) |
| **Comments** | Threaded discussion on the card |
| **Assign user(s)** | Who owns/is responsible for this card |
| **Cover** | Color or image cover shown on the card face — for content cards, this can double as a creative preview |
| **Location** | Optional — physical or virtual location tied to the task |
| **Labels** | Color-coded tags — category, priority, or (for content) platform/content-type |
| **Due date** | Drives both the Board's due-date badge and Planner placement — for content cards, this is effectively the "publish date" |
| **Reactions** | Lightweight emoji feedback on a card |
| **Watch** | Opt in to notifications/highlighting for a specific card |
| **Activity log** | Full auto-generated history of everything that happened on the card |

## 6. Target Users / Use Cases

- **Solo creators / freelancers** (including VA-style client work) — tracking client deliverables and content calendars in one place instead of switching tools
- **Marketing teams** — campaign planning alongside content approval pipelines
- **Small businesses / agencies** — managing multiple clients' social content through an approval chain (draft → internal review → client approval → scheduled → posted), which is exactly the workflow the reference screenshots show in practice
- **Startups & remote teams** — general lightweight project tracking without heavy tooling overhead

## 7. Tech Stack (Confirmed)

- **Editor:** VS Code
- **Frontend:** React
- **Styling:** Tailwind CSS
- **Data persistence:** Browser `localStorage` for the initial build (no backend/auth yet — single-user, single-device). Data is structured so it can migrate to a real backend (e.g., Firebase or Supabase) later without a full rewrite — see `plan.md` for the storage schema.
- **Drag-and-drop:** `@hello-pangea/dnd` (or `dnd-kit` — confirm final choice before Phase 2 in `plan.md`)

## 8. Brand & Visual Identity

- **Primary color theme:** Turquoise (full palette and tokens defined in `Design.md`)
- Full typography, spacing, and component system specified in `Design.md` — carried over conceptually from the earlier prototype but recolored and treated as Flowline's own original design system, not a Trello reproduction.

## 9. Open Questions / Next Steps

- [ ] Finalize the exact turquoise palette values (draft provided in `Design.md` — confirm/adjust)
- [ ] Confirm drag-and-drop library choice for the real build
- [ ] Decide whether Dashboard ships in the MVP or is added right after Boards + Inbox are solid (see `plan.md` phasing)
- [ ] Decide default board templates to ship out-of-the-box (e.g., "Blank Board," "Social Media Content," "Simple Project")
- [ ] Confirm localStorage data limits are acceptable for expected usage (file/image attachments especially — see `plan.md` for a note on this constraint)
