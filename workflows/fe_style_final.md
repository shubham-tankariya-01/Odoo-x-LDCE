# GlobeTrotter — style.md

This file is the design contract for the whole app. Its job is narrow but critical: **any person or AI agent building any screen should be able to read only this file and produce something visually indistinguishable from every other screen in the app.**

How to use it:
- **Paste the whole file** (or the relevant sections) into the system prompt / context of whatever's generating UI — Claude, Cursor, v0, an MCP-connected design tool, doesn't matter. The more of this file the agent has, the less drift between screens.
- **Update it once, not per-screen.** If you decide the accent color is wrong on screen 9, fix it here and regenerate — don't patch screen 9 alone and let it diverge.

---

## 1. Brand foundation

- **Product name:** GlobeTrotter
- **One-line personality:** Calm and organized, not busy — a trip planner that feels like a well-run itinerary, not a cluttered dashboard. Professional first, travel-themed second.
- **Reference products this borrows from:** Linear's restraint and flat surfaces, Notion's calendar/table clarity, shadcn/ui's default component discipline.
- **What this explicitly is NOT:** Not playful or cartoonish. Not illustration-heavy or skeuomorphic (no passport-stamp badges, no decorative route-line motifs, no mascot art). Not glowing, animated, or gradient-driven. No emoji anywhere in the product — icons only.

---

## 2. Color system

Light mode only — dark mode is out of scope for this system.

```
--color-primary:        #1D4ED8   /* main brand color — primary buttons, active states, links */
--color-primary-hover:  #1E40AF
--color-secondary:      #47536B   /* secondary actions, less prominent CTAs — neutral slate, not a fifth saturated hue */
--color-secondary-hover:#33405A
--color-accent:         #DCE7FC   /* highlights, badges, the "pop" color — pale blue tint, used sparingly; never the warning-yellow hue, to avoid colliding with its semantic meaning */

--color-bg-page:        #F7F6F2
--color-bg-surface:     #FFFFFF   /* cards, panels */
--color-bg-surface-alt: #F1EFE9  /* nested surfaces, e.g. a card inside a card, table stripes */

--color-text-primary:   #1F2328
--color-text-secondary: #565B61
--color-text-muted:     #8A8F94

--color-border:         #DEDBD2
--color-border-strong:  #C7C3B7   /* focus rings, active borders */

--color-success:        #15803D   /* under-budget indicators, confirmations */
--color-warning:        #B7791F   /* approaching-budget alerts */
--color-danger:         #C22C1F  /* over-budget alerts, destructive actions */
```

**Rule:** semantic colors (success/warning/danger) are reserved for their meaning. Don't use `--color-danger` red as a decorative accent anywhere — it will read as an error to users even when you don't mean it to. This is also why `--color-accent` is a pale blue tint rather than reusing yellow or green: those two are already spoken for by warning/success and must never carry a second, unrelated meaning.

**Status vs. budget colors — a deliberate split:** trip-status badges (Ongoing / Upcoming / Completed) do **not** use the success/warning/danger set. They use primary/neutral tones instead (below, §8), because "Completed" is not the same concept as "under budget," and reusing green for both would make a budget badge and a trip-status badge look like they mean the same thing when they don't.

---

## 3. Typography

```
--font-heading: "Inter", sans-serif
--font-body:    "Inter", sans-serif
--font-mono:    "JetBrains Mono", monospace   /* for dates, costs, anything tabular */
```

One family for heading and body on purpose — this system leans on weight and size for hierarchy, not a second typeface, to keep the professional/neutral tone.

Type scale:

| Token | Size | Weight | Used for |
|---|---|---|---|
| `--text-xs` | `12px` | `400` | timestamps, helper text |
| `--text-sm` | `14px` | `400` (labels: `600`) | body copy, form labels |
| `--text-base` | `16px` | `400` | default body text |
| `--text-lg` | `18px` | `600` | card titles, section labels |
| `--text-xl` | `24px` | `600` | screen titles |
| `--text-2xl` | `32px` | `700` | hero/banner text (screen 3) |

**Rule:** two weights maximum in active use — `400` regular and `600` medium/semibold. `700` bold is reserved for true emphasis only (hero numbers, page titles) and used rarely.

---

## 4. Spacing & layout

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-12: 48px
```

- **Grid:** 12-column, 24px gutter, max-width 1280px content container.
- **Breakpoints:** mobile: 375px / tablet: 768px / desktop: 1280px.
- **Card padding standard:** 16px on mobile, 24px on desktop — applies to every card component: trip cards, section cards, activity result rows.

---

## 5. Radius & elevation

```
--radius-sm: 6px      /* inputs, buttons, dropdown controls */
--radius-md: 12px     /* cards, panels */
--radius-lg: 16px     /* modals, large containers */
--radius-full: 9999px /* avatars, pills, badges — not used for buttons */

--shadow-sm: 0 1px 2px rgba(31, 35, 40, 0.06)   /* resting card state, only on clickable cards */
--shadow-md: 0 2px 6px rgba(31, 35, 40, 0.08)   /* hover/raised state */
--shadow-lg: 0 8px 24px rgba(31, 35, 40, 0.12)  /* modals, dropdowns */
```

**Rule:** pick one radius scale and use it everywhere. A screen with 4px buttons next to 16px cards next to fully-rounded avatars is fine — a screen with 4px buttons on one page and 8px buttons doing the identical job on another page is not. Buttons and inputs always use `--radius-sm`; `--radius-full` is reserved for avatars and badges so "action" and "label" stay visually distinct.

No glow, colored shadow, or blur-behind (backdrop-filter) effects anywhere in the system. Shadows are neutral gray only, and only appear where a surface is genuinely raised above another (hover on a clickable card, or a modal/dropdown floating above the page) — never as decoration on a static element.

---

## 6. Iconography & imagery

- **Icon set:** Tabler Icons — outline style only, 20px default, 16px inline with text. No emoji anywhere in the product, in any state or placeholder copy.
- **Illustration style (empty states, onboarding):** Flat, 2-color (primary blue + neutral gray), no gradients, no mascot or character illustration.
- **Photography treatment (city/destination images):** 16:9 crop, neutral color grade — no heavy filter or warm-tint overlay that obscures the actual place.
- **Avatars:** Circle shape. Fallback for users without a photo: initials on a `--color-bg-surface-alt` background with `--color-text-secondary` text — a neutral fallback, never a semantic color.

---

## 7. Motion

```
--ease-standard: cubic-bezier(0.2, 0, 0.2, 1)
--duration-fast: 100ms   /* hover states, button press */
--duration-base: 160ms   /* card transitions, dropdown open */
--duration-slow: 220ms   /* modal open only */
```

**Rule:** every interactive element gets a hover AND a focus state at minimum — focus states are not optional, they're the accessibility baseline. But motion stays deliberately minimal: transitions are limited to color and opacity changes only. **No scale transforms, no glow, no blur, no shadow-pulse, no animated gradients, anywhere.** If a state change can't be communicated with a flat color/border shift in under 220ms, redesign the state — don't reach for a bigger animation.

---

## 8. Component conventions

**Buttons:**
- *Primary* — `--color-primary` fill, white text, no border. One per screen, main CTA ("Save," "Continue," "Create").
- *Secondary* — `--color-bg-surface` fill, `--color-text-primary` text, `1px solid --color-border`. Cancel, back, low-emphasis actions.
- *Success / Warning / Danger* — solid fill of the matching semantic color, white text. Used only for actions that actually confirm, caution, or destroy (e.g. "Confirm booking" = success, "Delete trip" = danger). Never used as a styling choice unrelated to that meaning.
- *Ghost* — text-only, `--color-text-secondary`, no fill or border. Tertiary inline actions.
- States: **default** → **hover** (paired darker fill/border, flat color shift only) → **active** (darker still + `--color-border-strong` inset ring) → **disabled** (45% opacity, no pointer events) → **loading** (label replaced by a static spinner glyph, button holds its resting size so nothing reflows).

**Inputs:**
- Default: white background, `1px solid --color-border`.
- Focus: border becomes `2px solid --color-border-strong` — no glow ring, just a solid border weight change.
- Error: `1px solid --color-danger` border, helper text below in `--color-danger`.
- Disabled: `--color-bg-surface-alt` background, `--color-text-muted` text.
- Label always above the input; helper or error text always below.

**Cards (trip cards, section cards, activity rows — screens 3, 4, 6, 7, 8):**
- `1px solid --color-border`, `--radius-md`, no shadow at rest.
- Only genuinely clickable cards (e.g. trip cards you tap to open) gain `--shadow-sm` on hover — non-interactive cards (a static budget panel, a section card mid-edit) never pick up a hover shadow, since they don't do anything on hover.
- Card padding follows §4's standard exactly — no per-screen exceptions.

**Search + Group-by/Filter/Sort-by bar (screens 3, 6, 8, 9, 10, 11 — this exact combination appears six times, build it once as a shared component):**
- Layout: search field (icon + input) flex-grows on the left; "Group by," "Filter," "Sort by" render as three equal-height dropdown buttons, right-aligned.
- All controls share one height (40px) and `--radius-sm` — the search field is **not** a full pill; it matches the same radius as the buttons beside it, per the radius rule in §5.
- Mobile collapse: the three dropdowns collapse into a single "Filters" button that opens a bottom sheet listing all three controls stacked; the search field stays full-width above it.

**Badges/tags (trip status, budget alerts):**
- Shape: `--radius-full` pill, `--text-xs` label, optional 14px leading icon.
- *Trip status* (neutral/primary scale, not semantic): Ongoing → `--color-accent` background, `--color-primary` text · Upcoming → `--color-bg-surface-alt` background, `--color-text-secondary` text · Completed → `--color-border` background, `--color-text-muted` text.
- *Budget alerts* (semantic scale): Under budget → `--color-success` at 12% tint background, full-strength `--color-success` text · Approaching budget → `--color-warning` at 12% tint, full-strength text · Over budget → `--color-danger` at 12% tint, full-strength text, always paired with a warning-triangle icon (color is never the only signal).

**Empty states:**
- One centered icon (48px, `--color-text-muted`) + one-line message + a primary-button action. Never a blank list. Example: no-trips icon + "No trips yet" + "Plan your first trip" primary button.

**Loading states:**
- Static skeleton blocks in `--color-bg-surface-alt`, matching the exact final dimensions of the component they replace (card skeleton = same height/padding as a trip card, row skeleton = same height as a listing row) — nothing shifts when real content loads in.
- No shimmer sweep or pulse animation on skeletons, consistent with §7's no-motion-beyond-flat-color rule.

---

## 9. Accessibility floor (non-negotiable regardless of tier)

- Text contrast meets WCAG AA against its background (4.5:1 body text, 3:1 large text) — verify with a contrast checker, don't eyeball it.
- Every interactive element reachable and operable by keyboard alone.
- Every icon-only button has an `aria-label`.
- Color is never the only signal for state — the over-budget indicator always pairs `--color-danger` with a warning icon and the word "Over budget," not just a red badge.

---

## 10. Prompt block — paste this into any AI agent or MCP server

```
You are building UI for GlobeTrotter, a trip-planning app. Follow these constraints exactly:

- Theme: light mode only, off-white page background (#F7F6F2) with white card surfaces (#FFFFFF).
- Colors: primary #1D4ED8 (hover #1E40AF), secondary #47536B, accent #DCE7FC (used sparingly, never reused for warning/success),
  text #1F2328 / #565B61 / #8A8F94, borders #DEDBD2 / #C7C3B7,
  semantic success #15803D / warning #B7791F / danger #C22C1F — reserved strictly for their meaning, never decorative.
- Typography: both headings and body in Inter, mono (JetBrains Mono) for dates/costs/tabular data.
  Type scale: --text-xs 12px to --text-2xl 32px per the table in §3. Two weights max (400, 600); 700 only for rare true emphasis.
- Spacing scale: 4/8/12/16/24/32/48px, nothing outside this scale.
- Radius: 6px for inputs/buttons/dropdowns, 12px for cards, 16px for modals, full-round only for avatars/pills/badges — never for buttons.
- Elevation: no shadow at rest except on genuinely clickable cards on hover. No glow, colored shadow, or blur-behind effects anywhere.
- Motion: hover/focus/active/disabled states required on every interactive element, but transitions are flat color/opacity only — no scale, no glow, no shimmer, max 220ms.
- Icons: Tabler Icons, outline style. No emoji anywhere in the interface, including placeholder or status copy.
- Component library: shadcn/ui as the base, restyled with the tokens above — do not introduce a different component library or hand-roll a component shadcn already provides.
- This screen must include [paste the exact bare-minimum element list for that screen from ui-design-workflow.md] — do not omit or substitute any of these. You may add supporting UI beyond this list as long as none of the required elements are removed.
- Target enhancement tier for this screen: [Good / Better / Best / Extreme / God — see ui-design-workflow.md for what each tier means].
```

This is the whole point of the file: every value above is already filled in, so every screen — whether built by a teammate, a future dev, or an AI agent — starts from the same visual ground truth instead of reinventing it.