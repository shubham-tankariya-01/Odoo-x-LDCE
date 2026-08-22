# GlobeTrotter — UI Design Exploration Workflow

This doc is for whoever owns the frontend design. It does two things:
1. Teaches **how to research** UI direction — not which colors to pick, but the process for finding, extracting, and reusing good design patterns.
2. Locks in the **non-negotiable baseline** from the wireframe, screen by screen, so nobody accidentally "improves" something into missing a required element.

Read this alongside `style.md` in the same folder — this doc is the *process*, `style.md` is the *output* of that process.

---

## The one rule that overrides everything else

**Every element in the wireframe (`GlobeTrotter - 8 hours.svg`) for a screen must exist in your build. You may add. You may never subtract.**

If the wireframe shows a search bar, group-by, filter, and sort-by on a screen — all four exist, even if you think group-by is redundant with filter. Enhancement means *more capability or better visual treatment of what's there*, not *editing down to what you think is necessary*. This applies at every tier below, including "God" tier — a God-tier screen is a maximalist, delightful version of the exact wireframe, not a reimagined one.

---

## The enhancement tier system

For each screen, decide (as a team, upfront) which tier you're building to. Don't mix tiers within one screen — a button with God-tier micro-interactions next to a Good-tier plain input looks broken, not ambitious.

| Tier | Philosophy | What it adds over the wireframe baseline |
|---|---|---|
| **Good** | Ship it | Wireframe elements laid out with real spacing, a real font, one accent color. No animation. This is "doesn't look like a wireframe anymore." |
| **Better** | Feels like a product | Consistent design tokens (see `style.md`), hover/focus states on every interactive element, empty states, loading states, real placeholder content instead of gray boxes. |
| **Best** | Feels like a funded startup's app | Micro-interactions (button press, card lift on hover), transitions between states, iconography throughout, illustration or photography treatment on empty/banner areas, responsive behavior tested at 3 breakpoints. |
| **Extreme** | Feels crafted | Custom easing curves, skeleton loaders matching final layout exactly, optimistic UI updates, subtle parallax/depth on scroll where it fits (e.g. banner on screen 3), coordinated motion between related screens (e.g. calendar → itinerary transition). |
| **God** | Portfolio-piece | Everything above, plus: a signature visual moment unique to this app (not copied from a reference — synthesized from your research), sound-free but tactile-feeling interactions, dark mode that isn't just inverted colors but re-considered per screen, accessibility (contrast, keyboard nav, screen reader labels) verified, not assumed. |

For an 8-hour hackathon build: target **Better** across all 8 in-scope screens (see `screen-requirements-and-style-guide` cross-reference — Community and Admin are dev-cut, but still worth designing to at least Good tier if you have spare design time, since a Figma file survives the hackathon even if the code doesn't). Push individual screens to **Best** only after every screen has hit Better — a half-finished God-tier screen 9 next to a bare screen 6 reads worse in a demo than five consistent Better-tier screens.

---

## How to actually research design direction

This is the part most people skip and then wonder why their app looks like six different apps stitched together. Follow this in order, every time you start a new screen.

### Step 1 — Gather 5-8 references before opening Figma or a code editor

Don't design from a blank canvas. Pull real screens from real products first.

**Reference sites (curated UI screenshots, searchable by category):**
- Mobbin — mobile + web app screens, searchable by flow ("onboarding," "search results," "calendar")
- Screenlane, Land-book — landing pages and full product UI
- SaaS Frame — B2B/SaaS-specific patterns, good for the admin/analytics screen
- Godly, Awwwards — high-polish, experimental — best for Extreme/God tier inspiration, not baseline
- Dribbble, Behance — individual shots, less "real product" fidelity but great for color/type direction
- Refero, UI Sources — curated, smaller, less noisy than Dribbble

**Search query patterns that actually work** (don't just search "travel app"):
- `"[screen purpose] UI" site:mobbin.com` — e.g. `"itinerary calendar UI" site:mobbin.com`
- `"[app category] dashboard design" dribbble` — e.g. `"trip planner dashboard design" dribbble`
- `"[component] component inspiration"` — e.g. `"date range picker component inspiration"`
- Search for the *category leader*, not the exact concept: "Airbnb trip planning UI," "TripIt itinerary screen," "Notion calendar view" — established products solve these exact problems well, and their patterns are proven at scale.

### Step 2 — Use AI for direction, not final output

AI tools are for compressing the "what could this look like" exploration phase, not for generating your final component code sight-unseen.

- **Mood/direction generation:** Describe the emotional target ("a trip planner that feels calm and organized, not busy — think Linear's restraint applied to travel"), and ask for 3-4 distinct visual directions with reasoning, not just images. Claude, ChatGPT, or Claude's Visualizer can do this in text + inline mockup form.
- **v0.dev, Galileo AI, Uizard:** Useful for generating a *first-draft component* you then heavily edit — never ship their raw output. Treat it as a sketch, not a deliverable.
- **Prompting technique that works:** give the AI your wireframe constraints explicitly ("this screen must have: search bar, group-by, filter, sort-by, and a 3-column card grid — do not remove any of these") plus your `style.md` tokens, and ask it to compose within those constraints. Vague prompts get generic results; constrained prompts get usable ones.

### Step 3 — Extract, don't eyeball

Once you've found 2-3 references you like, pull actual values from them instead of guessing "that blue looks about right."

- **Colors:** ColorZilla or the built-in eyedropper in Chrome DevTools — click the exact pixel, get the exact hex.
- **Full CSS inspection:** CSS Peeper (Chrome extension) — dumps a site's color palette, fonts, and image assets in one panel, faster than manually inspecting elements.
- **Fonts:** WhatFont or Fontanello browser extensions — hover any text, see the exact font family/weight/size.
- **Spacing/layout:** Chrome DevTools → toggle the ruler/grid overlay, measure padding and gaps directly rather than estimating.

### Step 4 — Build the palette and type system as standalone tools, not in your head

- **Coolors.co** — generate and lock a palette, export as CSS variables directly.
- **realtimecolors.com** — preview a palette applied to a real UI layout before committing — catches "this looks fine as swatches but terrible as a button" early.
- **Adobe Color** — extract a palette from an uploaded reference image (useful if your inspiration is a photo, not a UI screen).
- **Google Fonts + Fontpair.co** — pairing tool specifically for heading/body font combinations that are pre-validated to work together.
- **type-scale.com** — generates a consistent modular type scale (don't hand-pick font sizes per screen; a bad scale is the #1 reason apps feel inconsistent).

### Step 5 — Don't hand-build what a component library already solved

Given your React + Tailwind stack, lean on:
- **shadcn/ui** — copy-paste component source (not an npm dependency), fully restyleable with your tokens. Best fit for this project — you own the code, so it inherits your `style.md` tokens directly instead of fighting a library's opinions.
- **Radix UI** — headless primitives (dropdowns, dialogs, popovers) if shadcn doesn't cover something — accessibility handled for you.
- **daisyUI** — faster to prototype with if you want pre-styled components and will restyle later; more opinionated than shadcn.

This isn't about being lazy — a hand-rolled date-range picker (screen 5, 9, 11) will eat hours and still have accessibility bugs a solved component doesn't.

---

## Screen-by-screen: wireframe baseline (non-negotiable)

Every item below must exist in your build for that screen. Enhancement tier changes *how it looks and behaves*, never *whether it's there*.

**1. Login Screen** — Photo/avatar element, username field, password field, login button.

**2. Registration Screen** — Photo upload, first name, last name, email, phone number, city, country, additional info (freeform text), register button.

**3. Main Landing Page** — Banner image area, search bar, group-by/filter/sort-by controls, "Top Regional Selections" (multi-item row), "Previous Trips" (multi-item row), a persistent "Plan a trip" action.

**4. Create a New Trip Screen** — Place selection, start date, end date, a suggestions grid for places/activities to add into the trip.

**5. Build Itinerary Screen** — Repeatable "Section" blocks, each with a description field, date range, and a budget-for-this-section field; an "Add another Section" action.

**6. User Trip Listing** — Search bar, group-by/filter/sort-by, three status groupings (Ongoing / Upcoming / Completed), each with trip summary cards.

**7. User Profile Page** — Profile image, editable user details, "Preplanned Trips" row with view actions, "Previous Trips" row with view actions.

**8. Activity / City Search Page** — Search bar, group-by/filter/sort-by, a results list where each row shows an option and its details.

**9. Itinerary View Screen (with budget)** — Search/group-by/filter/sort-by, day-by-day grouping (Day 1, Day 2, ...), each day listing activities paired with their expense.

**10. Community Tab Screen** — Search/group-by/filter/sort-by, a feed of shared trip/activity posts, an explanatory panel describing the section's purpose.

**11. Calendar View Screen** — Search/group-by/filter/sort-by, a full month calendar grid, trips overlaid on the date cells they span.

**12. Admin Panel Screen** — Tabs for Manage User Data / Popular Cities / Popular Activities / User Trends & Analytics, chart visualizations (pie, line, bar), explanatory panel per section.

*(Cross-reference: per the dev build plan, screens 10 and 12 are cut from the 8-hour code build. Still worth designing to at least Good tier — the Figma/design artifact isn't time-boxed the same way the code is, and having it ready means a future dev sprint isn't starting from zero.)*

---

## Handoff to style.md

Once you've done the research above and picked your direction, everything gets distilled into `style.md`. That file is the single source of truth — every screen, every component, every future AI prompt pulls its visual rules from there, never from "what felt right in the moment" on an individual screen. See that file for the actual token spec and how to use it with an AI coding agent or MCP server.