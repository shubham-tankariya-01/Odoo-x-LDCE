# GlobeTrotter — Merge Instructions (Phase 2)
### Run by: Engineer 1 (FE1), after Engineer 2 (FE2) has pushed `feature/engineer-2`

---

## 0. When to run this

This file is **only** opened after:
1. FE1 finished Phase 0 (shared architecture) and Phase 1 (own six screens) on `feature/engineer-1`.
2. FE2 finished Phase 1 (own six screens) on `feature/engineer-2`, based on FE1's Phase 0 commit on `main`.
3. **FE2 pushes and opens the merge into `main` first.**
4. FE1 then pulls `main`, resolves anything, and runs this file's Phase 2 checklist to produce the final integrated app — because FE1 is the architecture owner and the one who can authoritatively judge whether a "conflict" is a real structural problem or just two branches touching the same line.

Because of the file-ownership boundaries enforced in `frontend-engineer-1.md` §5 and `frontend-engineer-2.md` §3, the two branches should not touch the same files at all except in the two narrow cases below — this makes the merge close to mechanical if both engineers actually respected their boundaries.

---

## 1. Git sequence

```
# Engineer 2, when Phase 1 is done:
git push origin feature/engineer-2
# open PR: feature/engineer-2 -> main

# Engineer 1, after Engineer 2's PR is merged into main:
git checkout main
git pull
git checkout feature/engineer-1
git rebase main        # or: git merge main
# resolve anything per §2 below
git push origin feature/engineer-1
# open PR: feature/engineer-1 -> main
# Engineer 1 merges this PR — this is the final integrated app
```

If your workflow merges directly to `main` without PRs, the same order applies: FE2's branch lands on `main` first, then FE1 rebases/merges on top and pushes the final state.

---

## 2. Expected conflicts and how to resolve each

Because ownership was split file-by-file, a genuine line-level conflict should be rare. The only files either branch could plausibly have both touched are:

### `package.json` / lockfile
Both engineers may have added a dependency (e.g. a drag-and-drop library for FE1's section reordering, a date/calendar library for FE2's Screen 11). **Resolution:** keep both sets of dependencies — this is a union, never a choice between one or the other. Re-run the package manager's install after merging to regenerate a single consistent lockfile.

### `src/routes/engineer2.routes.jsx`
FE1 created this file in Phase 0 and FE2 was instructed never to edit it. **Resolution:** if FE2 didn't touch it, there's no conflict — take FE1's version as-is. If FE2 *did* modify it (a boundary violation), the correct fix is not to blindly take FE1's version — first check whether FE2 added a genuinely new route (e.g. a sub-route for a detail modal) versus changed an existing path. Preserve any new route FE2 added by re-adding it to the file yourself in the merge, rather than discarding FE2's work.

### `src/components/shared/*`
FE2 was instructed not to add files here. If a conflict appears here, treat it the same way as above: inspect whether FE2 proposed a genuinely missing shared primitive (flagged per their own instructions) rather than reflexively reverting it — if it's useful and style-compliant, keep it; if it duplicates something FE1 already built, keep FE1's version and update any FE2 page that imported the duplicate.

### Anything else
Any conflict outside the two cases above signals a boundary was crossed somewhere. Don't auto-resolve by picking one side — open both versions, understand why the same file was touched twice, and fix the underlying cause (e.g. a page that should have been FE2-owned got scaffolded again by FE1) before continuing.

---

## 3. Integration checklist — cross-owner links

Walk every navigation seam between the two engineers' screens and confirm it resolves to a real, working route (not a stub) now that both branches are combined:

- [ ] Screen 3 (Landing, FE1) → clicking a "Previous Trips" card opens Screen 9 (Itinerary View, FE1) — same-owner, should already work
- [ ] Screen 3 (Landing, FE1) → Navbar avatar menu → Screen 7 (Profile, FE2) — now real, not the Phase-0 stub
- [ ] Screen 3 (Landing, FE1) → Navbar global search → Screen 8 (Search, FE2) — now real
- [ ] Screen 6 (My Trips, FE2) → clicking a trip card → Screen 9 (Itinerary View, FE1)
- [ ] Screen 7 (Profile, FE2) → "See all" on Preplanned/Previous Trips → Screen 6 (My Trips, FE2)
- [ ] Screen 8 (Search, FE2) → a city result's "View" → Screen 4 (Create a New Trip, FE1), with the `city_id` correctly carried across the owner boundary
- [ ] Screen 8 (Search, FE2) → a trip result (from global search) → Screen 9 (Itinerary View, FE1)
- [ ] Screen 11 (Calendar, FE2) → a day with no activities → Screen 5 (Build Itinerary, FE1)
- [ ] Screen 11 (Calendar, FE2) → a day with activities → Screen 9 (Itinerary View, FE1)
- [ ] Screen 12 (Admin Panel, FE2) → only appears in the Navbar menu when `user.is_admin` is true, and is unreachable/redirects for non-admins
- [ ] Logout, from any screen, correctly clears `AuthContext` and returns to Screen 1 (Login)
- [ ] A forced `401` on any FE2 screen (e.g. expired token mid-session) redirects to Login exactly like it does on FE1's screens — confirms both branches share the same `api/client.js` behavior rather than FE2 having built a parallel handler

---

## 4. Style-consistency spot check

Since both engineers worked from the same `fe_style_final.md` and the same `tokens.css`, but in parallel and without seeing each other's screens live, do one visual pass across all twelve screens back-to-back and confirm:

- [ ] Every `SearchFilterBar` instance (Screens 3, 6, 8, 9, 10, 11) looks and behaves identically — same 40px control height, same radius, same mobile collapse into "Filters"
- [ ] Trip-status badges look identical wherever they appear (Landing, My Trips, Profile)
- [ ] No screen introduced a color, radius, or shadow value outside `tokens.css` — grep the FE2-owned page files for hex codes or raw px shadow values as a final check
- [ ] Empty/loading/error states are visually consistent across both owners' screens (same `EmptyState`/`Skeleton` components, not two different reinventions)

---

## 5. Final steps

1. Confirm every box above is checked.
2. Run the full manual walkthrough once, end to end: register → login → land on `/` → plan a trip → build its itinerary with 2+ sections and activities → view the itinerary/budget → go to My Trips → open Profile and edit a field → run a search → check the calendar → (as an admin user) open the Admin Panel.
3. Commit the merge on `main` with message: `phase 2: merge engineer-1 and engineer-2, integration verified`.
4. Tag the release if your workflow uses tags (e.g. `v0.1.0-frontend`).
5. Note in the commit or PR description which Community/Admin sections remain placeholder pending backend endpoints (per `frontend-engineer-2.md` §2, Screens 10 and 12), so this is visible to whoever picks up backend work next rather than silently forgotten.