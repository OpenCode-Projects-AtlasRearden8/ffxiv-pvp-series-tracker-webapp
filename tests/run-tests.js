#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const htmlPath = path.join(__dirname, "..", "index.html");
const html = fs.readFileSync(htmlPath, "utf8");

const match = /<script>([\s\S]*?)<\/script>/.exec(html);
if (!match) {
  console.error("FAIL: could not find the core logic <script> block in index.html");
  process.exit(1);
}

const sandbox = { window: {} };
vm.runInNewContext(match[1], sandbox, { filename: "pvp-core.js" });
const C = sandbox.window.PvpCore;
if (!C) {
  console.error("FAIL: window.PvpCore was not defined by the core logic block");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ok - " + name);
  } catch (e) {
    failed++;
    console.error("  FAIL - " + name);
    console.error("    " + (e && e.message ? e.message : String(e)));
  }
}

function eq(a, b, msg) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error((msg || "mismatch") + " — got " + JSON.stringify(a) + ", expected " + JSON.stringify(b));
  }
}

function truthy(v, msg) {
  if (!v) throw new Error(msg || "expected truthy, got " + JSON.stringify(v));
}

console.log("\nDate primitives");

test("parseISO accepts valid YYYY-MM-DD", () => {
  eq(C.parseISO("2026-03-14"), { y: 2026, m: 3, d: 14 });
});

test("parseISO rejects garbage", () => {
  truthy(C.parseISO("nonsense") === null);
  truthy(C.parseISO("2026-13-01") === null);
  truthy(C.parseISO("") === null);
  truthy(C.parseISO(undefined) === null);
  truthy(C.parseISO("20260314") === null);
});

test("todayISO produces YYYY-MM-DD of local date", () => {
  const d = new Date(2026, 10, 6, 23, 59, 59);
  eq(C.todayISO(d), "2026-11-06");
});

test("todayISO pads month and day", () => {
  const d = new Date(2026, 0, 5);
  eq(C.todayISO(d), "2026-01-05");
});

test("diffDays counts forward days", () => {
  eq(C.diffDays("2026-01-01", "2026-01-08"), 7);
});

test("diffDays is negative backwards and zero same-day", () => {
  eq(C.diffDays("2026-01-08", "2026-01-01"), -7);
  eq(C.diffDays("2026-06-01", "2026-06-01"), 0);
});

test("diffDays survives month and year boundaries (leap-year Februaries)", () => {
  eq(C.diffDays("2024-02-28", "2024-03-01"), 2);
  eq(C.diffDays("2025-02-28", "2025-03-01"), 1);
  eq(C.diffDays("2025-12-31", "2026-01-01"), 1);
});

test("diffDays returns null for invalid inputs", () => {
  truthy(C.diffDays("bad", "2026-01-01") === null);
  truthy(C.diffDays("2026-01-01", "bad") === null);
});

test("addDays walks across month boundaries", () => {
  eq(C.addDays("2026-01-31", 1), "2026-02-01");
  eq(C.addDays("2026-11-06", -7), "2026-10-30");
  truthy(C.addDays("not-a-date", 1) === null);
});

console.log("\nCountdown logic");

test("seasonEndStatus is unconfigured without a date", () => {
  const s = C.seasonEndStatus("", "2026-11-06");
  truthy(s.configured === false && s.daysLeft === null);
  const s2 = C.seasonEndStatus("nonsense", "2026-11-06");
  truthy(s2.configured === false);
});

test("seasonEndStatus counts future days correctly", () => {
  const s = C.seasonEndStatus("2026-11-20", "2026-11-06");
  eq(s, { configured: true, daysLeft: 14, isPast: false, isToday: false });
});

test("seasonEndStatus flags end day and past seasons", () => {
  eq(C.seasonEndStatus("2026-11-06", "2026-11-06"), { configured: true, daysLeft: 0, isPast: false, isToday: true });
  const past = C.seasonEndStatus("2026-11-05", "2026-11-06");
  truthy(past.isPast === true && past.daysLeft === -1);
});

test("countdown across a year boundary", () => {
  eq(C.seasonEndStatus("2027-01-05", "2026-12-31").daysLeft, 5);
});

console.log("\nWeekly tally logic");

test("weekStartOf snaps to Monday (Mon and mid-week)", () => {
  eq(C.weekStartOf("2026-11-02"), "2026-11-02");
  eq(C.weekStartOf("2026-11-06"), "2026-11-02");
});

test("weekStartOf snaps Sunday into the same Monday-Sunday week", () => {
  eq(C.weekStartOf("2026-01-04"), "2025-12-29");
});

test("weekStartOf rejects invalid dates", () => {
  truthy(C.weekStartOf("nope") === null);
});

test("tallyWins sums only within the window", () => {
  const wins = [
    { date: "2026-10-26", count: 5 },
    { date: "2026-11-02", count: 3 },
    { date: "2026-11-04", count: 4 },
    { date: "2026-11-08", count: 6 },
    { date: "2026-11-09", count: 9 }
  ];
  eq(C.tallyWins(wins, "2026-11-02", "2026-11-08"), 13);
  eq(C.tallyWins(wins, "2026-11-09", "2026-11-15"), 9);
  eq(C.tallyWins(wins, "2099-01-01", "2099-01-07"), 0);
  eq(C.tallyWins(wins, "bad", "2026-11-08"), 0);
});

test("tallyWins ignores malformed and negative entries", () => {
  const wins = [
    { date: "2026-11-02", count: 3 },
    { date: "2026-11-03", count: -1 },
    { date: "oops", count: 10 },
    null
  ];
  eq(C.tallyWins(wins, "2026-11-02", "2026-11-08"), 3);
});

test("addWin increments an existing day", () => {
  const wins = [{ date: "2026-11-06", count: 2 }];
  const out = C.addWin(wins, "2026-11-06", 3);
  eq(out, [{ date: "2026-11-06", count: 5 }]);
  truthy(wins[0].count === 2, "addWin must not mutate its input");
});

test("addWin creates a day and clamps at zero", () => {
  eq(C.addWin([], "2026-11-06", 2), [{ date: "2026-11-06", count: 2 }]);
  const wins = [{ date: "2026-11-06", count: 2 }];
  eq(C.addWin(wins, "2026-11-06", -3), []);
  eq(C.addWin(wins, "2026-11-06", -1), [{ date: "2026-11-06", count: 1 }]);
  truthy(wins[0].count === 2, "addWin must not mutate its input");
});

test("weeklyTotals buckets Monday-Sunday weeks, newest first", () => {
  const wins = [
    { date: "2026-10-27", count: 2 },
    { date: "2026-11-01", count: 3 },
    { date: "2026-11-04", count: 4 },
    { date: "2026-11-05", count: 5 }
  ];
  const weeks = C.weeklyTotals(wins, "2026-11-06", 2);
  eq(weeks.length, 2);
  eq(weeks[0], { start: "2026-11-02", total: 9 });
  eq(weeks[1], { start: "2026-10-26", total: 5 });
});

test("weeklyTotals of a two-week window does not bleed across weeks", () => {
  const weeks = C.weeklyTotals([
    { date: "2026-11-02", count: 7 },
    { date: "2026-11-09", count: 2 }
  ], "2026-11-10", 2);
  eq(weeks[0].total, 2);
  eq(weeks[1].total, 7);
});

console.log("\nSeries rewards");

test("rewardTemplate has levels inside 1-30 and unique levels", () => {
  const tpl = C.rewardTemplate();
  truthy(tpl.length > 0);
  tpl.forEach(r => {
    truthy(r.level >= 1 && r.level <= 30, "template level out of range");
    truthy(typeof r.name === "string" && r.name.length > 0);
  });
  const levels = tpl.map(r => r.level);
  truthy(new Set(levels).size === levels.length, "template levels must be unique");
});

test("rewardsRemaining keeps only unchecked rewards above the current level, ascending", () => {
  const rewards = [
    { level: 10, name: "emote", done: false },
    { level: 6, name: "glamour", done: true },
    { level: 4, name: "exp", done: false },
    { level: 20, name: "mount", done: false }
  ];
  eq(C.rewardsRemaining(5, rewards), [
    { level: 10, name: "emote", done: false },
    { level: 20, name: "mount", done: false }
  ]);
  eq(C.rewardsRemaining(20, rewards), []);
});

console.log("\nSeries pace");

test("setSeriesLevel clamps to 1-30 and logs changes", () => {
  const data = { seriesLevel: 10, seriesLog: [] };
  C.setSeriesLevel(data, 12);
  eq(data.seriesLevel, 12);
  eq(data.seriesLog.length, 1);
  eq(data.seriesLog[0].delta, 2);
  eq(data.seriesLog[0].to, 12);
  C.setSeriesLevel(data, 1);
  eq(data.seriesLevel, 1);
  eq(data.seriesLog[data.seriesLog.length - 1].delta, -11);
});

test("setSeriesLevel logs nothing when the level is unchanged", () => {
  const data = { seriesLevel: 10, seriesLog: [] };
  C.setSeriesLevel(data, 10);
  eq(data.seriesLog.length, 0);
  eq(data.seriesLevel, 10);
});

test("setSeriesLevel clamps absurd values", () => {
  const data = { seriesLevel: 10, seriesLog: [] };
  C.setSeriesLevel(data, 99);
  eq(data.seriesLevel, 30);
  C.setSeriesLevel(data, -5);
  eq(data.seriesLevel, 1);
});

test("pacePerDay derives levels/day from the last 7 days", () => {
  const today = "2026-11-06";
  const log = [
    { date: "2026-11-04", from: 10, to: 14, delta: 4 },
    { date: "2026-11-06", from: 14, to: 16, delta: 2 },
    { date: "2026-10-20", from: 1, to: 10, delta: 9 }
  ];
  const pace = C.pacePerDay(log, today, 7);
  truthy(Math.abs(pace - 2) < 0.01, "expected 6 levels over the 3 days since the first in-window log, got " + pace);
  truthy(pace > 0 && !C.pacePerDay(log.filter(e => e.date === "2026-10-20"), today, 7), "outside-window logs contribute nothing");
});

test("pacePerDay short window uses elapsed time when first entry is recent", () => {
  const today = "2026-11-06";
  const log = [{ date: "2026-11-05", from: 4, to: 8, delta: 4 }];
  eq(C.pacePerDay(log, today, 7), 2);
});

test("pacePerDay is zero without recent progress", () => {
  const log = [{ date: "2026-09-01", from: 1, to: 5, delta: 4 }];
  eq(C.pacePerDay(log, "2026-11-06", 7), 0);
  eq(C.pacePerDay([], "2026-11-06", 7), 0);
});

test("pacePerDay ignores regression deltas", () => {
  const today = "2026-11-06";
  const log = [
    { date: "2026-11-04", from: 10, to: 3, delta: -7 },
    { date: "2026-11-05", from: 3, to: 5, delta: 2 }
  ];
  const pace = C.pacePerDay(log, today, 7);
  truthy(Math.abs(pace - 2 / 3) < 0.01, "expected only the 2 gained levels counted over 3 days, got " + pace);
});

test("estimateDaysToLevel handles ahead / no-pace / rounding cases", () => {
  eq(C.estimateDaysToLevel(10, 10, 0.5), 0);
  eq(C.estimateDaysToLevel(10, 8, 0.5), 0);
  truthy(C.estimateDaysToLevel(10, 13, 0) === null);
  eq(C.estimateDaysToLevel(10, 13, 0.5), 6);
  eq(C.estimateDaysToLevel(10, 11, 0.5), 2);
});

console.log("\nMood trend");

test("moodTrend flags a rough streak", () => {
  const t = C.moodTrend([
    { ts: 1, mood: "Great" },
    { ts: 2, mood: "Tilted" },
    { ts: 3, mood: "Rough" },
    { ts: 4, mood: "Tilted" },
    { ts: 5, mood: "Rough" }
  ]);
  truthy(t.shouldRest, "should suggest a rest after a Tilted/Rough tail");
  truthy(t.label.length > 0);
});

test("moodTrend is healthy on strong sessions", () => {
  const t = C.moodTrend([
    { ts: 1, mood: "Great" },
    { ts: 2, mood: "Great" },
    { ts: 3, mood: "Good" }
  ]);
  truthy(t.shouldRest === false);
});

test("moodTrend is neutral with no entries", () => {
  const t = C.moodTrend([]);
  truthy(t.shouldRest === false && t.label === "");
});

console.log("");
if (failed > 0) {
  console.error("Tests: " + passed + " passed, " + failed + " FAILED");
  process.exit(1);
} else {
  console.log("Tests: all " + passed + " passed");
}
