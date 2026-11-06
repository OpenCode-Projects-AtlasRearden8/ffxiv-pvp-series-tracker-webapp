# STATUS — FFXIV PvP Season Tracker

Last updated: 2026-11-06

## What was built

A private, offline, single-file web app (`index.html`) for tracking FFXIV PvP
season progress by manual entry. Pure HTML/CSS/JavaScript, zero dependencies,
works from `file://`, stores all data in browser localStorage
(key `ffxiv-pvp-tracker-v1'); makes zero network requests.

Features:

- Season-end countdown (days left, "ends today", past-season states) with a
  "what to finish before the season ends" summary.
- Series level tracking (1–30) with change logging that powers pace estimates.
- Editable series reward checklist (15-level template, names retypeable to
  match the current series; check/uncheck claimed rewards).
- Reward-first priorities list on the Overview: remaining rewards ordered by
  level, estimated days-to-reward from the last 7 days of leveling, and
  urgency flags when the estimate exceeds the days until season end.
- Crystalline Conflict rank field plus per-role climbing notes
  (Tank, Healer, Melee DPS, Ranged DPS, Caster DPS).
- Daily/weekly PvP win tallies: today's count with +/−, daily and weekly
  goals, 7-day logs, and 6 weeks of Monday–Sunday totals.
- Match mood log (Great/Good/Mixed/Tilted/Rough + note) with a trend check
  that flags a rough stretch.
- Data tab: JSON export/import backup, "start a new season" (keeps tallies
  and mood log), and full delete with confirmations.
- Accessibility touches: labeled controls, aria-labels on dynamic buttons.

Distinct gameplay-wise from Lodestone-driven trackers: fully manual,
season-clock-first, and includes a mood log — something no mainstream FFXIV
PvP tracker offers.

## How to run it

- App: open `index.html` in any modern browser (double-click works; runs
  entirely from `file://`).
- Tests: `node tests/run-tests.js` (Node built-ins only, no install).

## Verification results (2026-11-06)

- `node tests/run-tests.js` — **all 35 tests passed** covering: date parsing
  and padding, diffDay math across month/year/leap-year boundaries, countdown
  states (future / today / past / unconfigured), Monday-Sunday week bucketing
  including the Sunday edge case, tally windowing (no bleed across weeks,
  malformed/negative entries ignored), addWin create/increment/clamp and
  input immutability, reward template validity and remaining-rewards filter,
  series level clamping/logging, pace-per-day estimation (regression deltas
  excluded), days-to-level rounding, and mood-trend flagging.
- Both inline `<script>` blocks compile cleanly (Node `vm.compileFunction`).
- All 37 `getElementById` targets and all tab sections verified to exist in
  the markup; no duplicate element ids.
- All inline-checkable structural tags balanced.
- LICENSE copyright line verified character-exact:
  `Copyright (c) 2026 Asdale Dynamics, LLC`.

## Known gaps

- Reward names are a generic editable template, not the exact item list of a
  specific current series (by design — series rotate every ~6 months); the
  user retypes names once per series.
- Pace estimates are based on manual level-change entries; they are naive
  until a few entries exist.
- No automated browser-DOM tests (the UI layer is smoke-checked by id/tag
  consistency and script compilation; testable pure logic is fully covered).
- localStorage is per-browser/per-profile: there is no sync, so backups
  (Data tab → Export JSON) are the only way to move data between computers.
- Some iOS `file://` localStorage configurations can be ephemeral; export
  backups are recommended there.
