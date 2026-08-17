# Flowline — Design System

This document defines Flowline's visual language: an original design system (colors, type, spacing, components) built around a **turquoise** primary theme. It is not derived from Trello's visual identity — only the underlying *interaction patterns* (documented in `Project-context.md`) are shared with Kanban-style tools generally.

---

## 1. Design Principles

- **Visual first, low friction.** Status, priority, and ownership should be readable at a glance without opening anything.
- **Calm, coastal, focused.** Turquoise reads as fresh and clear-headed rather than corporate-navy (Trello) or generic productivity-purple — it should feel distinct and calming to work in for long stretches.
- **Structure through color and space, not heavy borders.** Cards and panels lean on soft shadows and subtle background tints rather than hard 1px lines everywhere.
- **Every interactive element has a resting, hover, and active state.** Nothing should feel static or unclickable.

---

## 2. Color Palette

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#F3FBFA` | App background (soft turquoise-tinted white) |
| `--surface` | `#FFFFFF` | Cards, modals, inputs, panels |
| `--surface-alt` | `#E1F5F3` | Sidebar background, hover states, subtle fills |
| `--ink` | `#132A29` | Primary text (deep teal-black, not pure black) |
| `--ink-muted` | `#5C7C79` | Secondary text, metadata |
| `--ink-faint` | `#94AFAC` | Placeholder text, disabled/tertiary labels |
| `--brand` | `#0DABA3` | Primary actions, active states, links (core turquoise) |
| `--brand-dark` | `#0A8981` | Primary button hover, active nav text |
| `--brand-light` | `#D2F3F0` | Selected/active backgrounds, focus rings |
| `--accent` | `#FF8B5E` | Due-soon indicators, secondary highlights (warm complement to turquoise) |
| `--accent-light` | `#FFE7DA` | Accent background fills |
| `--success` | `#33B27A` | Positive/complete states, low-priority label |
| `--success-light` | `#DFF5EB` | Success background fills |
| `--danger` | `#FF5E6C` | Overdue states, destructive actions |
| `--danger-light` | `#FFE3E5` | Danger background fills |
| `--warn` | `#F6C453` | Due-soon-but-not-urgent indicators, starred state |
| `--warn-light` | `#FEF3D9` | Warning background fills |
| `--border` | `#CDEBE7` | All hairline borders |

**Label swatches** (used for card labels — distinct from semantic status colors above so labels stay visually independent of urgency/status):
- Marketing — `#8B7CF6`
- Design — `#FF8B5E`
- Engineering — `#4AA8FF`
- Urgent — `#FF5E6C`
- Low priority — `#33B27A`
- *(For social content boards, repurpose labels as platform tags, e.g. Instagram, Facebook, Blog — same chip styling, new names/colors set per board.)*

**Usage rule:** semantic colors (`brand`, `accent`, `success`, `danger`, `warn`) are reserved for system states — never repurpose them as arbitrary label colors, and vice versa. This keeps "this is overdue" visually distinct from "this is tagged Urgent."

**Why turquoise + coral:** turquoise and coral/orange sit near-complementary on the color wheel, which is why `--accent` works well as the one warm color allowed alongside the cool turquoise brand — it's intentional contrast, not a mismatched leftover from a different palette.

---

## 3. Typography

Three-family system, each with a distinct job:

| Family | Role | Weights used |
|---|---|---|
| **Space Grotesk** | Display — logo, page titles, modal titles, dashboard stat numbers | 500, 600, 700 |
| **Inter** | Body/UI — all paragraph text, labels, inputs, buttons, nav | 400, 500, 600, 700 |
| **JetBrains Mono** | Metadata — dates, counters, badges, timestamps | 400, 500 |

**Scale:**
- Logo / wordmark: 19px, Space Grotesk 700
- View title (page heading): 24–26px, Space Grotesk 700
- Modal title: 20px, Space Grotesk 700
- Section labels (uppercase, letter-spaced): 11px, Inter 700
- Body / card title: 13.5–14px, Inter 600
- Secondary/meta text: 11–12.5px, Inter 400–600
- Mono metadata (dates, counts): 10.5–11px, JetBrains Mono 400–500

**Rule of thumb:** if it's a number or a date, it's mono. If it's a heading, it's Space Grotesk. Everything else is Inter.

---

## 4. Spacing & Shape

- **Border radius:** 6–9px on small elements (chips, buttons, inputs), 10–12px on cards and list columns, 16px on modals.
- **Shadows** (soft, low-opacity, tinted toward the ink color rather than pure black for cohesion):
  - `--shadow-sm`: `0 1px 2px rgba(19,42,41,0.06)` — resting cards, inputs
  - `--shadow-md`: `0 6px 20px rgba(19,42,41,0.08)` — hovered cards, dropdowns
  - `--shadow-lg`: `0 20px 60px rgba(19,42,41,0.18)` — modals, drawers, overlays
- **Spacing rhythm:** built on ~4px increments (4/6/8/9/10/12/14/16/20/24/32). List columns use 12px internal padding; modal bodies use 20–26px; sidebar uses 16–20px.

---

## 5. Layout

- **Sidebar:** fixed-width (230–248px), full viewport height, `--surface-alt` background, houses logo, primary nav (**Dashboard / Inbox / Boards / Planner**), and an always-present Capture box pinned to the bottom.
- **Main content:** flexible width, `--bg` background, scrolls independently of the sidebar.
- **Dashboard:** a responsive grid — stat cards in a row up top, then a two-column layout below (due-soon list + recent boards on one side, mini planner preview on the other), collapsing to a single column on narrow viewports.
- **Board view:** horizontal-scrolling list columns on a translucent turquoise tint (`rgba(225,245,243,0.6)`) so columns feel like a distinct "surface" without a hard container border.
- **Planner:** fixed-width pool panel (230px) + flexible 7-column week grid.

---

## 6. Core Components

### Navigation item (sidebar)
- Resting: transparent background, `--ink-muted` text
- Hover: `rgba(13,171,163,0.08)` background, `--ink` text
- Active: `--surface` background + `--shadow-sm`, `--brand-dark` text — looks "lifted" off the sidebar tint

### Buttons
- **Primary** (`--brand` fill, white text, soft turquoise-tinted shadow) — one per view, for the single most important action (Share, Add, etc.)
- **Ghost** (white fill, `--border` outline) — secondary actions
- All buttons scale down slightly (`transform: scale(.96)`) on active/press for tactile feedback

### Stat card (Dashboard)
- White surface, `--shadow-sm`, large Space Grotesk number, small Inter label underneath, optional small trend/icon in `--brand`
- Used for: Boards count, Due this week, Inbox unread, Starred boards

### Cards (board)
- White surface, `--shadow-sm` resting, `--shadow-md` + visible border on hover
- Optional cover band (color or image) spans the top, bleeding slightly past the card's own padding
- Label chips: pill-shaped, 10px bold text, background = label color at ~13% opacity, text = full label color
- Metadata row (due date, comments, attachments, watch icon, avatars) is always mono/small and secondary — never competes visually with the title
- Due-date badge color-codes automatically: neutral → accent (due soon, <48h) → danger (overdue)

### Chips (labels, users, meta — inside the card modal)
- Same pill shape as board label chips; "removable" variants include an inline ✕ button
- Consistent 20px circular avatars with initials, colored per-member, white 2px border for stacking

### Modals
- Centered, max-width 460–640px depending on complexity, `--shadow-lg`, 16px radius
- Card modal specifically: gradient cover band (turquoise → coral) at the top with a floating circular close button
- Simple modals (Share, Visibility): flat header with title + ✕, no cover band

### Panels / drawers
- **Anchored dropdowns** (Views menu, recent boards, filter): absolutely positioned under their trigger icon, same radius/shadow as modals but smaller and lighter
- **Drawer** (board menu): slides in from the right, fixed to viewport, dimmed overlay behind it, grouped menu items separated by hairline dividers

### Inputs
- 1px `--border` outline at rest, `--brand` outline + `--brand-light` glow ring on focus — used consistently across search, capture box, and all modal inputs

### Attachments (file/image on a card)
- File chip: icon (distinct glyph for image vs. generic file) + filename + size, in a rounded `--bg`-filled row
- Image attachments additionally render a small thumbnail preview inline, not just a filename chip
- Upload zone: dashed `--border` outline, `--brand` on drag-hover, with inline text noting the local storage size guidance from `plan.md` (e.g., "Files are stored in your browser — keep uploads under ~1–2MB")

---

## 7. Interaction Patterns

- **Drag-and-drop** (cards between lists, cards onto Planner days): dragged element drops to ~40% opacity; drop targets get a `--brand-light` background flash while a valid drag hovers over them.
- **Collapsible lists:** width animates from full width down to a thin strip; title rotates to vertical text rather than disappearing, so context isn't lost.
- **Toggle states** (star, watch, filter-active): represented by color fill change, not just an outline change — e.g. starred board icon fills warm yellow (`--warn`), active filter icon gets a small accent dot badge.
- **All state changes animate in** with a quick 150–250ms fade/slide — nothing pops in abruptly.

---

## 8. What Not to Do

- Don't introduce a second cool hue alongside turquoise — coral (`--accent`) is the only warm color allowed in the palette.
- Don't use pure black (`#000`) or a neutral gray border — everything routes through the teal-tinted `--ink`/`--border` tokens so the palette stays cohesive and doesn't drift toward a generic gray SaaS look.
- Don't mix in a fourth typeface — Space Grotesk / Inter / JetBrains Mono covers every text need in the product.
- Don't make label colors and status colors (accent/danger/warn/success) interchangeable — they must stay visually distinct so users can tell "this is overdue" from "this is tagged Design" at a glance.
- Don't reuse Trello's specific blue/navy brand colors, its icon set, or its logo mark anywhere, even as placeholder/temp assets — build placeholders in the turquoise system from day one so nothing "Trello-blue" accidentally ships.

---

## 9. Tailwind Mapping (for `tailwind.config.js`)

```js
// theme.extend.colors
colors: {
  bg: '#F3FBFA',
  surface: '#FFFFFF',
  'surface-alt': '#E1F5F3',
  ink: '#132A29',
  'ink-muted': '#5C7C79',
  'ink-faint': '#94AFAC',
  brand: { DEFAULT: '#0DABA3', dark: '#0A8981', light: '#D2F3F0' },
  accent: { DEFAULT: '#FF8B5E', light: '#FFE7DA' },
  success: { DEFAULT: '#33B27A', light: '#DFF5EB' },
  danger: { DEFAULT: '#FF5E6C', light: '#FFE3E5' },
  warn: { DEFAULT: '#F6C453', light: '#FEF3D9' },
  border: '#CDEBE7',
}

// theme.extend.fontFamily
fontFamily: {
  display: ['"Space Grotesk"', 'sans-serif'],
  sans: ['Inter', 'sans-serif'],
  mono: ['"JetBrains Mono"', 'monospace'],
}

// theme.extend.borderRadius
borderRadius: { xl: '12px', '2xl': '16px' }

// theme.extend.boxShadow
boxShadow: {
  sm: '0 1px 2px rgba(19,42,41,0.06)',
  md: '0 6px 20px rgba(19,42,41,0.08)',
  lg: '0 20px 60px rgba(19,42,41,0.18)',
}
```

---

## 10. Adaptive Contrast System

All surfaces dynamically compute text/icon/foreground colors from their background using WCAG luminance math. This ensures accessible contrast ratios on any user-chosen theme color — no hardcoded text colors on themed surfaces.

### How it works

1. **Parse** — `parseColor()` converts hex/rgb/hsl strings to `{ r, g, b, a }`.
2. **Luminance** — `relativeLuminance()` computes WCAG sRGB→linear luminance (0–1).
3. **Contrast ratio** — `contrastRatio()` returns 1–21 against white or black.
4. **Foreground selection** — `getAccessibleColors(bg)` picks black or white foreground based on bg luminance; primary text targets 4.5:1, muted targets 3:1, faint targets 2.5:1.
5. **CSS variables** — `adaptiveVars(theme)` returns a style object setting `--surface-text`, `--surface-text-muted`, `--surface-text-faint`, `--surface-border`, `--surface-bg-subtle`.
6. **Hook** — `useAdaptiveTheme(bg)` memoizes the computation and returns the theme object.

### Surfaces that adapt

| Surface | Background source | Adapts |
|---------|-------------------|--------|
| Sidebar | Board background | Nav text, icons, active states, user section |
| BoardTopBar | Board background | Title, search, toolbar icons, borders |
| ListColumn | `list.backgroundColor` | Header text, count badge, assignee chip |
| ListMenu | `list.backgroundColor` | Dropdown text, icons |
| Cards | White (`#FFFFFF`) | Always dark text (no adaptation needed) |
| LabelChip | `label.color` | Pill foreground (dark or white) |

### CSS Variables

```
--surface-text       → primary text (4.5:1 contrast)
--surface-text-muted → secondary text (3:1 contrast)
--surface-text-faint → tertiary/placeholder (2.5:1 contrast)
--surface-border     → border/divider color
--surface-bg-subtle  → subtle background fill
```

Components use these via inline `style={{ color: 'var(--surface-text)' }}` instead of Tailwind color classes, so they respond dynamically to theme changes.

---

## 11. Glassmorphism Theme

All UI surfaces use frosted-glass layers: semi-transparent backgrounds + `backdrop-filter: blur()` + saturation boost. This creates depth through transparency rather than solid fills, reinforcing the calm/coastal aesthetic.

### Glass utilities (defined in `index.css`)

| Class | Blur | Saturation | Background | Border | Use |
|-------|------|------------|------------|--------|-----|
| `glass` | 24px | 180% | `rgba(255,255,255,0.72)` | `rgba(255,255,255,0.4)` | Dropdowns, menus, popovers |
| `glass-subtle` | 16px | 160% | `rgba(255,255,255,0.50)` | `rgba(255,255,255,0.25)` | Cards, panels, subtle surfaces |
| `glass-heavy` | 40px | 200% | `rgba(255,255,255,0.85)` | `rgba(255,255,255,0.5)` | Modals, drawers, primary surfaces |
| `glass-dark` | 24px | 180% | `rgba(19,42,41,0.75)` | `rgba(255,255,255,0.08)` | Dark overlays |

All utilities include `-webkit-backdrop-filter` for Safari compatibility.

### Surface mapping

| Surface | Glass level | Notes |
|---------|-------------|-------|
| CardModal | `glass-heavy` | Primary modal — heavy glass |
| BoardMenuDrawer | `glass-heavy` | Right-side drawer |
| CoverPanel | `glass-heavy` | Right-side drawer |
| FilterPanel | `glass` | Dropdown under filter icon |
| ViewsMenu | `glass` | Dropdown under views icon |
| Overflow menus | `glass` | Card menu, list menu |
| PlannerView | `glass-subtle` | Day columns, cards |
| DashboardView | `glass-subtle` | Stat cards, lists |
| InboxView | `glass-subtle` | Inbox items |
| CaptureBox | `glass-subtle` | Capture input |
| Sidebar | `backdrop-blur-2xl` | With adaptive background |
| BoardTopBar | `backdrop-blur-2xl` | With adaptive background |
| Board cards | `bg-white/50 backdrop-blur-md` | Lighter glass for card-on-list |
| List columns | `backdrop-blur-xl` | Translucent column background |
| Modal backdrops | `bg-ink/30 backdrop-blur-md` | Stronger blur, lighter overlay |

### Interaction with adaptive contrast

Glassmorphism + adaptive contrast work together:
1. A surface has a glass background (semi-transparent + blur)
2. The adaptive system computes foreground colors from the background color
3. CSS variables drive text/icons → they remain accessible on any glass level + any theme color

---

## 12. Color Theme Presets

Five gradient themes selectable from the board's three-dot menu. Each applies a diagonal gradient (`135deg`) as the board background, which flows through the adaptive contrast system to restyle the entire UI.

### Theme palette

| Theme | Primary | Secondary | Gradient direction | Mood |
|-------|---------|-----------|--------------------|------|
| Pistachio Blue | `#04344c` (dark navy) | `#b0edf9` (light sky) | Navy → sky | Calm, professional |
| Sunset Purple | `#faae62` (warm orange) | `#3e0856` (deep purple) | Orange → purple | Warm, creative |
| Ocean Blue | `#cae8e8` (pale teal) | `#28469e` (royal blue) | Teal → blue | Cool, focused |
| Milano Red | `#a90e02` (bold red) | `#fffbd4` (soft cream) | Red → cream | Bold, energetic |
| High Contrast | `#fffe15` (bright yellow) | `#0c1e29` (near black) | Yellow → black | Maximum visibility |

### UX behavior

- Themes appear in the BoardMenuDrawer under "Color Themes"
- Each theme shows a gradient swatch + name
- Active theme is highlighted with a ring
- Clicking a theme calls `setBoardBackground(board.id, gradient)`
- The board background updates instantly → adaptive contrast recalculates → all UI text/icons/borders adapt
- Solid backgrounds remain available in a separate "Solid Background" section below

### Gradient composition

Gradients use `linear-gradient(135deg, primary, secondary)` — top-left to bottom-right diagonal. The blur from glassmorphism on top of the gradient creates a soft, diffused color effect across all glass surfaces.

---

## 13. Card Modal Spacing

The card modal uses generous vertical margin (`py-16` on the Modal container) to float above the board content with clear visual separation. The scroll container uses `max-h-[calc(100vh-8rem)]` to prevent the modal from touching viewport edges while maximizing usable content area.
