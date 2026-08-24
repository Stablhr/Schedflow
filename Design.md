# SchedFlow — Design System (v2)

This document is the **single source of truth** for SchedFlow's visual language: a simple, professional, business-oriented SaaS design built around a turquoise brand accent on neutral surfaces. It applies to every screen — Dashboard, Sidebar, Boards, Card Modal, Share Modal, Inbox, Planner, forms, dropdowns.

**Core principle: professional clarity over visual effects.**

The interface should communicate organization, productivity, trust, reliability, and efficiency. It should feel appropriate for project managers, teams, agencies, social media managers, business owners, and marketing teams.

> **v2 note:** This revision replaces the previous glassmorphism/neomorphism-influenced direction (`Design_1.md`, kept as historical reference). Glass, blur, glow, soft-extrusion, and decorative gradients are no longer part of the design language. Nothing in this doc changes data structures or application behavior — it is a visual-system migration only.

---

## 1. Design Principles

1. **Clarity over decoration.** Visual interest comes from typography, spacing, hierarchy, and alignment — not effects.
2. **Professional SaaS appearance.** The product should feel like serious business productivity software.
3. **Solid surfaces.** Opaque backgrounds everywhere; no frosted glass, no translucent panels.
4. **Subtle borders as structure.** Borders and background differences define hierarchy before shadows do.
5. **Restrained shadows.** Shadows are reserved for genuinely elevated elements (dropdowns, drawers, modals).
6. **Strong typography hierarchy.** Type carries the layout: clear size/weight steps, no decoration.
7. **Consistent spacing.** One spacing scale, applied predictably.
8. **Turquoise as a controlled accent.** Turquoise identifies actions, active states, links, and focus — it is not the interface itself.
9. **Accessibility-first contrast.** Every text/surface pairing meets WCAG AA. Contrast is verified per theme, not assumed.
10. **Predictable interactions.** Controls look like controls. Buttons look like buttons. Inputs look like inputs.
11. **Responsive by default.** Desktop → mobile with readable type, adequate touch targets, intact hierarchy.
12. **Business-oriented visual language.** Structured dashboards, clean navigation, scannable information density.

### What SchedFlow is NOT

Not playful, not gaming-inspired, not neon/futuristic, not a glassmorphism showcase, not overly glossy or experimental. "Polished" means well organized — never decorated.

---

## 2. Old vs New (visual comparison)

| Old (v1 — removed) | New (v2) |
|---|---|
| Frosted glass, `backdrop-blur`, translucent cards | Solid opaque surfaces |
| Neumorphic extrusion/inset shadows | Flat fills + subtle borders |
| Glow on buttons, nav, icons | No glow anywhere |
| Soft shadows separating everything | Spacing > surface tint > border > shadow |
| Gradient covers, gradient board-first themes | Solid colors; gradients only as an optional user-picked board background |
| Everything rounded / pill-shaped | Purposeful radius scale (6–14px) |
| Space Grotesk display headings | Inter-only UI typography |

---

## 3. Color Tokens

Semantic tokens only. Never hard-code hex values in components. All tokens flip automatically in dark mode via `.dark { }` overrides (see §13).

### 3.1 Core tokens

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-background` | `#F6F8F8` | `#0F1A19` | Page/app background (very light neutral / dark neutral) |
| `--color-surface` | `#FFFFFF` | `#1A2B2A` | Cards, modals, inputs, panels, navbar |
| `--color-surface-alt` | `#EDF2F2` | `#243534` | Sidebar, hover fills, subtle wells, list-column tint |
| `--color-surface-elevated` | `#FFFFFF` | `#243534` | Dropdowns, popovers, drawers (things that float) |
| `--color-text-primary` | `#132A29` | `#E8F0EF` | Headings, body, primary content (≥ 4.5:1 on its surfaces) |
| `--color-text-secondary` | `#5C7C79` | `#94AFAC` | Metadata, secondary labels (≥ 4.5:1 on white/dark surfaces) |
| `--color-text-muted` | `#94AFAC` | `#5C7C79` | Placeholder & disabled text ONLY — never for meaningful content |
| `--color-border` | `#DEE7E6` | `#2D4442` | Default hairline borders/dividers |
| `--color-border-strong` | `#C7D4D2` | `#3D5553` | Input borders, selected/hover borders, dividers needing more weight |
| `--color-primary` | `#0DABA3` | `#0DABA3` | Turquoise brand — primary actions, active states, selection |
| `--color-primary-hover` | `#0A8981` | `#10C4BB` | Primary button/nav hover |
| `--color-primary-foreground` | `#0F2A28` | `#06211F` | Text/icons ON turquoise fills (see contrast matrix §3.3) |
| `--color-primary-subtle` | `#D2F3F0` | `#1A3D3A` | Selected/active tinted backgrounds, focus ring fill |

Legacy aliases used by current code map 1:1 (`bg`→`background`, `ink`→`text-primary`, `ink-muted`→`text-secondary`, `ink-faint`→`text-muted`, `brand-light`→`primary-subtle`). Keep aliases during migration, remove after.

### 3.2 Status tokens

Every color has one meaning:

| Token | Base | Subtle bg | Text-safe* | Meaning |
|---|---|---|---|---|
| `--color-success` | `#33B27A` | `#DFF5EB` | `#1F7A50` | Completed / done / published |
| `--color-warning` | `#E8A93D` | `#FEF3D9` | `#8A6116` | Due soon / pending / starred |
| `--color-danger` | `#E5484D` | `#FFE3E5` | `#C42B37` | Overdue / error / destructive |
| `--color-info` | `#4AA8FF` | `#DFEBFC` | `#1D5FBF` | Informational highlights |

\* "Text-safe" = the shade to use when a status color appears as small text on a light surface (≥ 4.5:1). The pastel base values are for dots, icons, badges-on-dark, and filled chips — **never** small text on white.

Status chip pattern (default): `subtle bg` + `text-primary` label + optional colored dot/icon in `base`. This is the business-standard pattern (Linear/Asana-style) and sidesteps contrast problems entirely.

The old coral `--accent` role is retired. Its two jobs are reassigned: due-soon indicators → `warning`; warm label swatch remains available as a *label* color only (§3.4).

### 3.3 Turquoise contrast matrix (required pairings)

Computed against WCAG relative luminance — these pairings are mandatory:

| Combination | Ratio | Verdict |
|---|---|---|
| `text-primary` (#132A29) on `primary` fill (#0DABA3) | ≈ 5.9:1 | ✅ AA normal text — default for buttons/fills |
| White on `primary` fill | ≈ 2.6:1 | ❌ BANNED for normal-size text/icons |
| `primary-text` #087A72 on white | ≈ 5.2:1 | ✅ Use for turquoise links/text on light surfaces |
| `#10C4BB` on dark background (#0F1A19) | ≈ 8:1 | ✅ Turquoise links/accent text in dark mode |
| `primary-hover` (#0A8981) icon on white | ≈ 4.3:1 | ✅ Icons/non-text ≥ 3:1 |

Rules that follow:
- Primary buttons use **dark ink text on turquoise**, not white. (Current code's `bg-brand text-white` must migrate.)
- Turquoise-colored text/links on light surfaces use `#087A72`; on dark surfaces use `#10C4BB`. Raw `#0DABA3` is never body/link text on light.
- Focus rings may use raw `primary` (non-text, 3:1 against adjacent surfaces satisfied via offset ring).

### 3.4 Label swatches (board labels)

Label colors stay independent of semantic status colors so "tagged Urgent" never looks like "is overdue":

- Marketing `#8B7CF6` · Design `#FF8B5E` · Engineering `#4AA8FF` · Urgent `#FF5E6C` · Low priority `#33B27A`
- For social boards, repurpose as platform tags (Instagram, Facebook, Blog…) — same chips, per-board names/colors.
- Chip style: pill, `label-color @ ~12%` background, label-color text at min 11px semibold (name is always written out — color is never the sole channel). New work may prefer the status-chip pattern (subtle bg + ink text + colored dot).

Usage rule (unchanged from v1): semantic tokens are never repurposed as arbitrary label colors, and vice versa.

---

## 4. Typography

Typography is the primary tool for hierarchy. Clean, neutral, business-like.

### 4.1 Families

| Family | Role | Weights |
|---|---|---|
| **Inter** | Everything UI: headings, body, labels, inputs, buttons, nav, logo/wordmark | 400, 500, 600, 700 |
| **JetBrains Mono** | Dates, counters, timestamps, numeric metadata | 400, 500 |

Space Grotesk is removed from the system (headings and wordmark included). Rule of thumb: if it's a number or a date, it's mono; everything else is Inter.

### 4.2 Scale

| Level | Spec |
|---|---|
| Wordmark/logo | Inter 700 · 16–17px · `text-primary` (+ turquoise mark allowed) |
| Page title (view heading) | Inter 700 · 22px · `text-primary` |
| Modal title | Inter 600 · 17px |
| Section heading | Inter 600 · 14–15px |
| Section eyebrow (uppercase labels) | Inter 600 · 11px · letter-spacing 0.05em · `text-secondary` |
| Card title / list item title | Inter 600 · 13.5–14px |
| Body | Inter 400 · 13–14px · line-height 1.55 |
| Secondary/meta | Inter 400–500 · 11–12px · `text-secondary` |
| Mono metadata | JetBrains Mono 500 · 11px · `text-secondary` |

Weight discipline: at most one bold element per view region; not everything semibold. Avoid oversized headings, decorative fonts, and excessive letter-spacing.

---

## 5. Spacing

Fixed scale — no arbitrary values: **4 · 8 · 12 · 16 · 20 · 24 · 32 px**.

- Component internal padding: 8–12px (chips, inputs), 16px (cards, nav items)
- Card/list internal padding: 12px
- Modal padding: header 16px, body 20–24px
- Sidebar padding: 12–16px
- Section gaps on a page: 24px; page gutters: 24px desktop / 16px ≤ tablet

Spacing creates grouping: related elements 4–8px apart, unrelated groups 20–32px apart.

---

## 6. Border Radius

Small scale, used consistently:

| Token | Value | Applies to |
|---|---|---|
| `radius-sm` | 6px | Inputs, buttons, small controls |
| `radius-md` | 10px | Cards, list columns, dropdowns |
| `radius-lg` | 14px | Modals, drawers |
| `full` | 9999px | Small badges/chips/avatars only |

Prohibited: huge rounded containers (≥ 16px on non-modal surfaces), pill-shaped cards/buttons/inputs.

---

## 7. Borders

Borders are the primary structural tool — preferred over shadows for defining edges of: cards, inputs, dropdowns, modals, sidebar edge, navbar bottom, calendar cells, table rows.

- Default hairline: 1px `border` token
- Interactive emphasis (hover/selected input): `border-strong`
- Dividers inside a surface: `border` at reduced prominence where needed
- Not every element gets an outline — adjacent same-surface elements may rely on spacing alone. Avoid double-borders (border + shadow together on resting elements).

---

## 8. Shadows

Exactly four levels. No custom shadows on individual components.

| Token | Value | Usage |
|---|---|---|
| `shadow-none` | none | Most surfaces (default) |
| `shadow-subtle` | `0 1px 2px rgba(15,26,25,0.06)` | Dropdowns/popovers, hovered interactive rows |
| `shadow-medium` | `0 4px 12px rgba(15,26,25,0.10)` | Drawers, floating toolbars |
| `shadow-modal` | `0 16px 48px rgba(15,26,25,0.20)` | Modals only |

Hierarchy order: **spacing → background difference → border → shadow (only when necessary).** Resting cards carry no shadow.

---

## 9. Z-index Scale

| Layer | Value |
|---|---|
| Sticky headers/toolbars | 30 |
| Dropdown/popover | 40 |
| Drawer | 45 |
| Modal backdrop | 50 |
| Modal panel | 60 |
| Toast | 70 |

---

## 10. Motion & Micro-interactions

Fast, quiet, professional.

- Color/opacity transitions: 100–150ms ease-out
- Small press feedback: `scale(0.98)` max, or none — no bounce, no large transforms
- Enter animations: 150ms fade, ≤ 8px slide; nothing pops or flies
- Drag-and-drop: dragged item at ~40% opacity; valid drop target gets `primary-subtle` background + `border-strong` outline (no animation loops)
- Respect `prefers-reduced-motion`: disable transforms/slides, keep opacity
- Removed: `hover-glow`, `hover-grow` scaling > 1.02, glowing/light-effect animations

---

## 11. Light Mode

Clean, bright, neutral. Hierarchy:

| Element | Surface |
|---|---|
| App background | `background` #F6F8F8 |
| Sidebar | `surface-alt` #EDF2F2 |
| Navbar/top bars | `surface` #FFFFFF |
| Cards, inputs | `surface` #FFFFFF |
| Dropdowns | `surface-elevated` #FFFFFF + `border-strong` + `shadow-subtle` |
| Modals | `surface` #FFFFFF + `shadow-modal` |

No colored page sections, no tinted cards except status/label tints. Turquoise appears only per §3.3 rules.

---

## 12. Dark Mode

Equally supported, equally restrained — never neon, never oversaturated.

| Element | Surface |
|---|---|
| App background | `#0F1A19` |
| Cards, inputs, navbar | `surface` #1A2B2A |
| Sidebar / hover fills | `surface-alt` #243534 |
| Elevated (dropdowns/drawers) | #243534 |
| Borders | `#2D4442` (strong `#3D5553`) |
| Primary text | `#E8F0EF` |
| Secondary text | `#94AFAC` |
| Accent text/links | `#10C4BB` |

Dark-mode contrast requirements (mandatory):
- Body text ≥ 4.5:1 against its actual surface — verify after any token change
- Secondary text ≥ 4.5:1 on card surfaces (#94AFAC on #1A2B2A ≈ 5.9:1 ✓)
- Muted/placeholder exempt from AA but still ≥ 3:1 where feasible
- No low-opacity gray-on-gray text; no dark text on mid-gray surfaces
- Toggle: three-way (light → dark → system) in sidebar, Sun/Moon/Monitor icons, respects `prefers-color-scheme` live — behavior unchanged

---

## 13. Adaptive Contrast System (retained)

The WCAG-based adaptive system stays — it directly enforces Principle 9 on user-chosen board backgrounds.

- `useAdaptiveTheme(bg)` / `getAccessibleColors()` compute foregrounds from any background: primary targets 4.5:1, secondary 3:1, faint 2.5:1 (faint only for placeholder-tier content).
- Emits `--surface-text`, `--surface-text-muted`, `--surface-border`, etc.; consumed by `AdaptiveSurface`, `BoardTopBar`, `Sidebar`, `ListColumn`, `ListMenu`.
- Under v2 this system runs on **solid** board backgrounds (§14) instead of glass layers. The glassmorphism × adaptive interaction model from v1 is obsolete.

---

## 14. Board Backgrounds

User-selectable per board; drives adaptive theming.

- **Solid colors first (default section):** `#0DABA3`, `#0A8981`, `#132A29`, `#FF8B5E`, `#33B27A`, `#4AA8FF`, `#8B7CF6`, `#FF5E6C` — plus white/default.
- **Gradient presets remain available** in a separate, clearly secondary group ("Gradients") as an explicit user choice. This is a feature, not a design treatment: UI chrome (sidebar, navbar, modals, cards) stays flat regardless of board background.
- Default new-board background: solid (white or `#0DABA3`).

---

## 15. Components

### 15.1 Buttons

| Variant | Style |
|---|---|
| Primary | `primary` fill, `primary-foreground` text, `radius-sm`, hover `primary-hover`. One per view region. |
| Secondary | `surface` fill, 1px `border-strong`, `text-primary`, hover `surface-alt` |
| Tertiary/Ghost | Transparent, `text-secondary`, hover `surface-alt` + `text-primary` |
| Danger | `#D93B49` fill, white text (≈ 4.5:1), hover darken. Restrained — destructive actions only. |

All variants: height 32–36px, padding 8–12px horizontal, font Inter 500–600 at 13–14px, disabled = `text-muted` + no hover state. No gradients, no glow, no emboss, no heavy shadow. Press = `scale(.98)`.

### 15.2 Inputs & Forms

Conventional professional SaaS fields — instantly recognizable:

- Solid `surface` background, 1px `border-strong`, `radius-sm`, 8–10px vertical padding
- Placeholder: `text-muted`
- Focus: 2px `primary` ring (or border swap) + `primary-subtle` halo ≤ 3px — clear but not glowing
- Error: `danger` border + small danger text below
- Disabled: `surface-alt` bg + `text-muted`
- No inset shadows, no glass, no animated glow

### 15.3 Cards

Simple and structured:

- Solid `surface` bg, 1px `border`, `radius-md`, 12–16px padding
- **No resting shadow.** Hover (interactive cards): `border-strong` + optionally `shadow-subtle`
- Internal hierarchy via typography (title 14px/600 → meta 11–12px mono/secondary) and spacing — not decoration
- Cover bands: solid single color or image, flush within card radius; no gradient covers
- Kanban card specifics (metadata row, due-date badge logic neutral→warning→danger, avatars, label chips) unchanged — restyled to this language

### 15.4 Modals & Dialogs

- Solid `surface`, `radius-lg`, `shadow-modal`, centered, viewport-constrained (`max-h-[calc(100vh-8rem)]`), internally scrollable
- Backdrop: solid dim (`rgba(15,26,25,0.5)`), **no backdrop-blur**
- Structure: header (title + ✕) with bottom divider → scrollable body → footer with right-aligned buttons, separated by borders/spacing
- Share modal: email/name input + member select + Share button row; "Share with link" section; tabs for Members / Join requests; bordered member rows. Feels like a business dialog, not a showcase.
- Card detail modal: same shell; clear labeled sections (description, attachments, comments); no gradient cover band, no floating close button

### 15.5 Dropdowns, Menus & Drawers

- Dropdown/popover: `surface-elevated`, 1px `border-strong`, `radius-md`, `shadow-subtle`, 4–6px vertical padding
- Menu items: 32px rows, `radius-sm` inner highlight on hover, icons 16px
- Drawer: fixed right, `surface-elevated`, `shadow-medium`, dimmed solid overlay, grouped sections with hairline dividers

### 15.6 Sidebar & Navigation

- `surface-alt` background, fixed width 230–248px, full height
- Nav items (Dashboard / Inbox / Boards / Planner): 36–40px rows, 16px Lucide icon + 14px Inter 500 label, `radius-sm`
- Resting: `text-secondary` · Hover: `surface` (or 6% ink tint) + `text-primary` · **Active:** `primary-subtle` bg + `primary-hover` text + optional 3px left accent bar — clear, not glowing, no lifted-shadow effect
- Inbox unread badge: `primary` fill pill w/ `primary-foreground` count (or `danger` if prioritized)
- Capture box pinned at bottom: plain input styling (§15.2)

### 15.7 Board Navbar (Top Bar)

Compact, flat, structured toolbar on `surface` with 1px bottom `border`:

- Left: avatar/board identity + editable title (inline input uses §15.2)
- Right toolbar: board actions, quick action, filter, star, visibility, share, more — as ghost `IconButton`s (28–32px hit area, 16–18px icons)
- Active/toggled tools (filter on, starred): `primary` or `warning` fill respectively — semantic, consistent
- **Share button stays visually prominent**: Primary variant (turquoise fill). Solid + border, no glass/glow.
- When themed by board background, text/icons come from the adaptive system (§13)

### 15.8 Dashboard

Professional business dashboard — easy to scan:

- KPI stat row: clean cards (§15.3) — large number (Inter 700, 22–24px, `text-primary`) over uppercase 11px label (`text-secondary`). E.g., `12 / BOARDS`, `4 / DUE THIS WEEK`, `3 / UNREAD`. Optional small icon in `primary`.
- Two-column body: due-soon list + recent boards | mini planner preview
- Lists: row-based (§15.12), urgency via status chips, not decoration
- Collapses to single column on narrow viewports

### 15.9 Board View (Lists & Kanban)

- List columns: `surface-alt` (or adaptive-tinted) container, `radius-md`, 12px padding, header = 13px/600 + count badge (mono)
- Column background may be a flat tint — no translucency
- Cards per §15.3; drag/drop affordances per §10
- Alt views (Table/Calendar/Timeline/Map) reuse the same tokens: bordered cells, row lists, status-colored pills/bars — no glowing cells or gradient bars

### 15.10 Planner (Social Content Calendar)

Professional scheduling tool:

- Pool panel (230px, `surface-alt`) + flexible week grid; day cells bordered with `border`, today highlighted with `primary` top-bar or `primary-subtle` wash
- Event cards: compact §15.3 cards — platform indicator (icon or label chip), content title, scheduled time (mono), owner avatar
- Status communicated by color-coded left border/dot: draft `text-secondary`, scheduled `primary`, published `success`, overdue `danger` — distinguishable without overwhelming the cell
- No glowing cells, no decorative gradients, no heavy shadows

### 15.11 Inbox

Professional communication/task inbox — row-based list:

- Full-width rows divided by 1px `border`; columns: unread indicator, subject/title, snippet/metadata, timestamp (mono), priority/status chip, quick actions on hover
- Unread: Inter 600 title + `primary-subtle` (or 4% ink) background + 6px `primary` dot. **No glow.**
- Read: regular weight, `surface` background
- Row height ≥ 44px on touch breakpoints

### 15.12 Tables & Structured Lists

- Clear rows, subtle separators (`border`), consistent column alignment, readable headers (eyebrow style or 12px/600)
- Header row may sit on `surface-alt`; rows on `surface`; zebra striping unnecessary
- No floating rows, no heavy per-row shadows, no nested rounded boxes

### 15.13 Chips, Badges & Avatars

- Chips/badges: pill (`full` radius OK here), 11px Inter 500–600, per §3.2/§3.4 patterns; removable variants include inline ✕
- Avatars: 20–24px circles, initials, per-member color, 2px `surface` ring when stacked
- Skeleton loaders: neutral shimmer on `surface-alt` (existing utility fine — it's functional, not decorative)

### 15.14 Icons

- Existing library (lucide-react), line style only
- Sizes: 16px (inline/meta), 18–20px (nav/toolbar); never oversized/decorative
- Color follows text hierarchy (`text-secondary` default, `text-primary` on hover, `primary-hover` when active); status icons use their semantic token

---

## 16. Accessibility Requirements

Part of the system, not an afterthought:

- Text contrast ≥ 4.5:1 (normal) / 3:1 (≥ 18.66px bold or 24px) against actual rendered surface — including adaptive-themed surfaces
- Visible focus states on all interactive elements: 2px `primary` outline/ring with offset; never `outline-none` without replacement
- Disabled states readable (`text-muted` on `surface-alt`)
- Full keyboard operability preserved (modals trap+escape, menus arrow-navigate — existing behavior)
- Interactive targets ≥ 32px (pointer) / ≥ 44px (touch breakpoints)
- State is never color-only: pair color with text, icon, dot, or weight (unread = bold + dot; overdue = red + date emphasis)
- Verify dark mode after every palette change (§12 checklist)

---

## 17. Responsive Behavior

- Breakpoints: desktop (≥ 1024) full layout · tablet (768–1023) condensed sidebar/collapsible nav · mobile (< 768) stacked, sidebar → drawer/hamburger
- Never sacrifice readability for density: maintain type scale, spacing rhythm, and hierarchy at every width
- Touch targets per §16; tables/lists become horizontally scrollable rather than truncating critical columns
- Dashboard/planner grids collapse to single column; modals become near-full-screen sheets on mobile while keeping the same visual language

---

## 18. Prohibited Patterns (hard rules)

**Glassmorphism — removed as a design direction.**
No `backdrop-blur`, `backdrop-filter`, `glass`/`glass-panel`/`glass-subtle`/`glass-heavy`/`glass-dark`, translucent surfaces (`bg-white/10`, `bg-white/50`…), frosted panels, or scrim blurs. Only sanctioned transparency: modal backdrop dim and skeleton shimmer.

**Neumorphism — removed.**
No `neu-*` utilities, inset shadows (`shadow-[inset_…]`), dual soft shadows, embossed/extruded controls, recessed inputs.

**Glow — removed.**
No outer glows, neon borders, glowing buttons/icons/nav, light sweeps, `hover-glow`.

**Gradients — not a UI treatment.**
No gradient buttons, cards, navigation, borders, cover bands, or app chrome. Sole exceptions: optional user-picked board background presets (§14) and, if ever explicitly required, a marketing/hero area outside the app UI.

**Shadows** beyond the four-token system (§8); **radius** outside §6 scale; **spacing** outside §5 scale; **colored text** violating §3.2/§3.3; white text on turquoise fills; decorative oversized icons; bouncy/large-transform animation.

If a specific functional case ever truly requires transparency, document it here as a named exception — don't reintroduce it informally.

---

## 19. Tailwind v4 Token Mapping (`src/index.css` `@theme`)

Tailwind v4 CSS-config (no `tailwind.config.js`). Target end-state:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Colors — canonical */
  --color-background: #F6F8F8;
  --color-surface: #FFFFFF;
  --color-surface-alt: #EDF2F2;
  --color-surface-elevated: #FFFFFF;

  --color-text-primary: #132A29;
  --color-text-secondary: #5C7C79;
  --color-text-muted: #94AFAC;

  --color-border: #DEE7E6;
  --color-border-strong: #C7D4D2;

  --color-primary: #0DABA3;
  --color-primary-hover: #0A8981;
  --color-primary-foreground: #0F2A28;
  --color-primary-subtle: #D2F3F0;
  --color-primary-text: #087A72;

  --color-success: #33B27A;   --color-success-subtle: #DFF5EB;  --color-success-text: #1F7A50;
  --color-warning: #E8A93D;   --color-warning-subtle: #FEF3D9;  --color-warning-text: #8A6116;
  --color-danger: #E5484D;    --color-danger-subtle: #FFE3E5;   --color-danger-text: #C42B37;
  --color-info: #4AA8FF;      --color-info-subtle: #DFEBFC;     --color-info-text: #1D5FBF;
  --color-danger-button: #D93B49;

  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Radius */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px;

  /* Shadows */
  --shadow-none: 0 0 #0000;
  --shadow-subtle: 0 1px 2px rgba(15,26,25,0.06);
  --shadow-medium: 0 4px 12px rgba(15,26,25,0.10);
  --shadow-modal: 0 16px 48px rgba(15,26,25,0.20);
}

.dark { /* override every color token per §12 */ }
```

Migration notes:
- Keep legacy aliases (`--color-bg`, `--color-ink`, `--color-ink-muted`, `--color-ink-faint`, `--color-brand*`, `--color-accent`) pointing at canonical vars until components are migrated, then delete.
- Delete: all `glass*` tokens/utilities, all `neu-*` utilities, `hover-glow`.
- `hover-lift`/`hover-grow`/`hover-slide-right`/`hover-rotate`: replace usages with plain color transitions; delete utilities.
- `font-display` class usages remap to `font-sans` (Space Grotesk dropped; update Google Fonts link in `index.html` accordingly).
- Remove `backdrop-blur` classes from `Modal.tsx`, `Sidebar.tsx`, `BoardMenuDrawer.tsx`, `BoardViewSkeleton.tsx`, `TimelineView.tsx`, `CoverPanel.tsx`.
- **Implementation note (radius):** the shipped `index.css` intentionally does NOT define custom `--radius-*` tokens. Tailwind v4's default radius scale (rounded-md = 6px, rounded-lg = 8px) already falls within the §6 ranges (sm 6px / md 10px / lg 14px), so components use `rounded-md`/`rounded-lg` directly and modals/drawers use `rounded-[14px]`. §6's named tokens are treated as guidance values, not literal CSS vars.

---

## 20. Migration Strategy

Token/CSS-layer first, shared components second, views last. No destructive rewrite; each phase ships working UI.

1. **Global styles** — rewrite `index.css` `@theme` + `.dark` overrides to §19; add new tokens/shadows; keep legacy aliases rendering correctly.
2. **Shared primitives** — restyle `IconButton`, `Modal`, `Chip`, `Avatar`, `DueBadge`, `CaptureBox`, `SectionLabel`; introduce shared `Button` and `Input` components (new files) implementing §15.1–15.2 so the rest of the migration consumes them.
3. **Layout** — `Sidebar`, `AppShell` (nav active states, capture box, theme toggle).
4. **Board chrome** — `BoardTopBar`, `ListColumn`, `Card`, `ListMenu`, `FilterPanel`, `ViewsMenu`, `AddListForm`, `AddCardForm`, skeletons.
5. **Modals** — `ShareModal`, `CreateBoardModal`, `LabelsModal`, `VisibilityModal`, `InboxActionModal`, `MoveCardDialog`, `BoardMenuDrawer`, `ArchivedPanel`, then the Card modal suite (`CardModal`, description/comments/attachments/labels/dues/location/cover).
6. **Views** — `DashboardView`, `BoardsHome`, `InboxView`, `PlannerView` (+ DayColumn/PlannerCard/UnscheduledPool), `TableView`, `CalendarView`, `TimelineView`, `MapView`.
7. **Cleanup** — delete legacy aliases, dead utilities (`glass*`, `neu-*`, `hover-glow`), unused Space Grotesk import; run lint/typecheck; manual pass in both themes.

Avoid restyling the same concept in ten places — route everything through tokens + shared Button/Input/Modal.

## 21. Protected Functionality (must not break)

Visual-only migration. Throughout phases 1–7, preserve behavior of: board create/edit/delete, card CRUD, drag-and-drop (`@hello-pangea/dnd`), attachments (incl. images + upload guidance), comments/reactions, labels, members & share flows, due dates & Planner↔Board two-way sync, inbox capture/move/schedule/dismiss, board views switching, search/filter, visibility settings, star/watch toggles, activity log, localStorage persistence & schema, light/dark/system theme switching, adaptive-theming on custom board backgrounds, keyboard accessibility, routing. No data-structure changes.

---

## 22. Change Log

**v2 (this revision)**
- Replaced glassmorphism (§11 v1), neomorphism utilities, glow effects, decorative gradients, and shadow-first hierarchy with a solid-surface, border-structured business system.
- Typography: Inter-only UI (Space Grotesk removed incl. wordmark); JetBrains Mono retained for numeric/date metadata.
- Retired coral `--accent` role (due-soon → warning; coral survives only as a label swatch).
- Corrected inaccessible pairing: dark ink replaces white text on turquoise fills (§3.3).
- Added explicit tokens for spacing, radius, shadows (4-level), z-index, motion, status colors w/ text-safe shades; documented light/dark specs with contrast minimums; added component specs for all major surfaces; documented phased migration + protected functionality.

**v1 (`Design_1.md`)** — turquoise coastal system, glassmorphism theme, neumorphism utilities, Space Grotesk display type, gradient board themes. Superseded; kept for reference only.
