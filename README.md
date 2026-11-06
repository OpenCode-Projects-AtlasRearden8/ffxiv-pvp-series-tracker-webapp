# FFXIV PvP Season Tracker

A tiny, private, offline web app for tracking your Final Fantasy XIV PvP season progress. Everything you log stays in your own browser — no accounts, no servers, no analytics, no network calls at all.

It answers one question every session: *what should I finish before the season ends?*

## What it does

- **Season countdown** — enter the season-end date and the Overview shows days remaining (including "ends today" and past-season states).
- **Series & rewards** — log your current PvP series level (1–30) and work through a reward checklist. Reward names are an editable template, since the item list changes every series.
- **Reward-first priorities** — the Overview lists your next unclaimed rewards, estimates days-to-reward from your recent leveling pace, and flags anything that won't make it before season end.
- **Crystalline Conflict notes** — keep your own rank plus climbing notes per role (Tank, Healer, Melee DPS, Ranged DPS, Caster DPS): builds, mistakes to avoid, matchup reminders.
- **Win tallies** — one-click daily win counts, a daily/weekly goal, a 7-day view, and Monday–Sunday week totals for the last 6 weeks.
- **Mood log** — after a session, log how it felt (Great / Good / Mixed / Tilted / Rough) with an optional note. Three rough entries in a row gently suggests a breather.
- **Backup & reset** — export everything as a JSON file, import it on another computer, start a fresh season (keeps tallies and mood log), or wipe it all.

## Why another FFXIV tracker?

Most FFXIV trackers are driven by the Lodestone or focus on crafting/gathering/raid progress. This one is deliberately different:

- **100% manual entry, 100% local** — your data never leaves the browser, so it works even when the API endpoints change or disappear.
- **Built around the season clock** — countdown, pacing estimates, and "what to finish" come first; everything else supports them.
- **Records how playing *felt*** — the mood log is the feature no other PvP tracker offers, and it's genuinely useful for knowing when to queue and when to stop.
- **One file, zero installs** — no build step, no dependencies, no server.

## How to run it

1. Download `index.html`.
2. Double-click it (or open it in any modern browser; it works fine from `file://`).
3. That's it. The app is one self-contained HTML file — everything (HTML, CSS, JavaScript) lives inside it.

Data is stored under the localStorage key `ffxiv-pvp-tracker-v1`. Clearing your browser data will clear the tracker, so use the **Export JSON backup** button in the Data tab before switching browsers or computers.

## How to run the tests

The pure logic (countdown math, win tallies, weekly buckets, series pacing, reward filtering, mood trend) is extracted from `index.html` and tested with Node's built-in modules — no dependencies to install:

```sh
node tests/run-tests.js
```

35 assertions cover date math across month/year boundaries, season-end states, Monday–Sunday week bucketing, tally windowing, pace estimation, and more.

## Project layout

```
index.html          the entire app (single file)
tests/run-tests.js  zero-dependency test suite (Node + built-in vm/assert)
LICENSE             MIT license
STATUS.md           build status, verification results, known gaps
```

## FAQ

**Does it send my data anywhere?** No. The app makes zero network requests and has no external resources of any kind.

**Which timezone / week convention does it use?** All dates are your local calendar dates, and tally weeks run Monday–Sunday so totals group cleanly regardless of the in-game reset time.

**Are the reward names correct for my series?** The defaults are a general template — click any reward name in the Series tab and retype it to match the current series exactly.

**Does it work on a phone?** Yes — it's a responsive single file; open it in your mobile browser. (localStorage availability from `file://` varies on some older iOS browsers, which is why the JSON export is recommended.)

## Credits

A practical gaming tool from **Asdale Dynamics, LLC** — beginner-friendly AI education, books, and accessible local-first tools. Learn more at [dylanasdale.github.io](https://dylanasdale.github.io).

*Final Fantasy XIV and Crystalline Conflict are trademarks of Square Enix Holdings Co., Ltd. This is an unofficial fan tool — it is not affiliated with, sponsored, or endorsed by Square Enix.*

## License

[MIT](LICENSE) — Copyright (c) 2026 Asdale Dynamics, LLC.
