"use strict";

const test = require("node:test");
const assert = require("node:assert");
const Growth = require("../growth.js");

const glass = (ml, at = 0) => ({ at, ml });
const MIN = 60 * 1000;

/* ---------- totalMl ---------- */

test("totalMl sums logged glasses", () => {
  assert.strictEqual(Growth.totalMl([glass(250), glass(250), glass(200)]), 700);
});

test("totalMl tolerates empty or malformed logs", () => {
  assert.strictEqual(Growth.totalMl([]), 0);
  assert.strictEqual(Growth.totalMl(null), 0);
  assert.strictEqual(Growth.totalMl([glass(250), { at: 1 }, null]), 250);
});

/* ---------- stageForProgress (goal = 2 L = 2000 ml) ---------- */

test("stage stays seed at zero intake", () => {
  assert.strictEqual(Growth.stageForProgress(0, 2), "seed");
});

test("stage boundaries: seed -> sprout -> small -> medium -> large", () => {
  // < 25% of goal: sprout
  assert.strictEqual(Growth.stageForProgress(1, 2), "sprout");       // 0.05%
  assert.strictEqual(Growth.stageForProgress(499, 2), "sprout");     // 24.95%
  // >= 25% and < 50%: small
  assert.strictEqual(Growth.stageForProgress(500, 2), "small");      // exactly 25%
  assert.strictEqual(Growth.stageForProgress(999, 2), "small");      // 49.95%
  // >= 50% and < 80%: medium
  assert.strictEqual(Growth.stageForProgress(1000, 2), "medium");    // exactly 50%
  assert.strictEqual(Growth.stageForProgress(1599, 2), "medium");    // 79.95%
  // >= 80%: large
  assert.strictEqual(Growth.stageForProgress(1600, 2), "large");     // exactly 80%
  assert.strictEqual(Growth.stageForProgress(2000, 2), "large");     // 100%
  assert.strictEqual(Growth.stageForProgress(5000, 2), "large");     // overshoot
});

test("stage adapts to a different goal", () => {
  assert.strictEqual(Growth.stageForProgress(400, 1), "small");       // 40% of 1 L
  assert.strictEqual(Growth.stageForProgress(900, 1), "large");      // 90% of 1 L
  assert.strictEqual(Growth.stageForProgress(250, 1), "small");      // 25% boundary
});

test("stage falls back to seed for invalid goals", () => {
  assert.strictEqual(Growth.stageForProgress(500, 0), "seed");
  assert.strictEqual(Growth.stageForProgress(500, -1), "seed");
  assert.strictEqual(Growth.stageForProgress(500, NaN), "seed");
});

/* ---------- reachedGoal ---------- */

test("reachedGoal triggers exactly at the goal", () => {
  assert.strictEqual(Growth.reachedGoal(1999, 2), false);
  assert.strictEqual(Growth.reachedGoal(2000, 2), true);
  assert.strictEqual(Growth.reachedGoal(2500, 2), true);
});

test("reachedGoal is false for invalid goals", () => {
  assert.strictEqual(Growth.reachedGoal(5000, 0), false);
  assert.strictEqual(Growth.reachedGoal(5000, NaN), false);
});

/* ---------- stageClass ---------- */

test("stageClass maps stages to CSS classes", () => {
  for (const stage of Growth.STAGES) {
    assert.strictEqual(Growth.stageClass(stage), "stage-" + stage);
  }
});

test("STAGE_SCALES increases monotonically with stage", () => {
  let prev = -Infinity;
  for (const stage of Growth.STAGES) {
    const scale = Growth.STAGE_SCALES[stage];
    assert.ok(scale > prev, `${stage} scale should exceed previous`);
    prev = scale;
  }
  assert.strictEqual(Growth.STAGE_SCALES.large, 1);
});

/* ---------- healthStatus (reminder = 90 min) ---------- */

test("healthStatus is null while the plant is fresh", () => {
  assert.strictEqual(Growth.healthStatus(0, 90 * MIN), null);
  assert.strictEqual(Growth.healthStatus(89 * MIN, 90 * MIN), null);
});

test("healthStatus turns sick at 1.5x the reminder interval", () => {
  assert.strictEqual(Growth.healthStatus(135 * MIN, 90 * MIN), "sick");
  assert.strictEqual(Growth.healthStatus(200 * MIN, 90 * MIN), "sick");
});

test("healthStatus turns dead at 3x the reminder interval", () => {
  assert.strictEqual(Growth.healthStatus(270 * MIN, 90 * MIN), "dead");
  assert.strictEqual(Growth.healthStatus(600 * MIN, 90 * MIN), "dead");
});

test("healthStatus rejects invalid inputs", () => {
  assert.strictEqual(Growth.healthStatus(-5, 90 * MIN), null);
  assert.strictEqual(Growth.healthStatus(100, 0), null);
  assert.strictEqual(Growth.healthStatus(100, NaN), null);
  assert.strictEqual(Growth.healthStatus(NaN, 90 * MIN), null);
});

/* ---------- normalizeSettings ---------- */

const DEFAULTS = { goalLiters: 2, glassMl: 250, reminderMinutes: 90, notifications: false };

test("normalizeSettings keeps valid values", () => {
  const s = Growth.normalizeSettings({ goalLiters: 1.5, glassMl: 300, reminderMinutes: 45, notifications: true }, DEFAULTS);
  assert.deepStrictEqual(s, { goalLiters: 1.5, glassMl: 300, reminderMinutes: 45, notifications: true });
});

test("normalizeSettings clamps out-of-range values", () => {
  const s = Growth.normalizeSettings({ goalLiters: 50, glassMl: 9999, reminderMinutes: 1 }, DEFAULTS);
  assert.strictEqual(s.goalLiters, 5);
  assert.strictEqual(s.glassMl, 500);
  assert.strictEqual(s.reminderMinutes, 15);
});

test("normalizeSettings falls back to defaults for invalid input", () => {
  const s = Growth.normalizeSettings({}, DEFAULTS);
  assert.deepStrictEqual(s, DEFAULTS);
  const s2 = Growth.normalizeSettings({ goalLiters: "abc" }, DEFAULTS);
  assert.strictEqual(s2.goalLiters, DEFAULTS.goalLiters);
});

test("normalizeSettings accepts numeric strings from form inputs", () => {
  const s = Growth.normalizeSettings({ goalLiters: "3", glassMl: "200", reminderMinutes: "60" }, DEFAULTS);
  assert.strictEqual(s.goalLiters, 3);
  assert.strictEqual(s.glassMl, 200);
  assert.strictEqual(s.reminderMinutes, 60);
});

/* ---------- end-to-end growth simulation ---------- */

test("a full day of drinking reaches the bloom", () => {
  const goal = 2;
  const glasses = [glass(250), glass(250), glass(250), glass(250), glass(250), glass(250), glass(250), glass(250)];
  const stages = glasses.map((g, i) => Growth.stageForProgress(Growth.totalMl(glasses.slice(0, i + 1)), goal));
  assert.deepStrictEqual(stages, ["sprout", "small", "small", "medium", "medium", "medium", "large", "large"]);
  assert.strictEqual(Growth.reachedGoal(Growth.totalMl(glasses), goal), true);
});

test("a neglected plant decays from healthy to sick to dead", () => {
  const reminder = 90 * MIN;
  const sinceLastGlass = (m) => Growth.healthStatus(m * MIN, reminder);
  assert.strictEqual(sinceLastGlass(60), null);
  assert.strictEqual(sinceLastGlass(135), "sick");
  assert.strictEqual(sinceLastGlass(269), "sick");
  assert.strictEqual(sinceLastGlass(270), "dead");
});

/* ---------- day rollover ---------- */

test("needsRollover is true only across different days", () => {
  assert.strictEqual(Growth.needsRollover("2025-11-04", "2025-11-04"), false);
  assert.strictEqual(Growth.needsRollover("2025-11-04", "2025-11-05"), true);
  assert.strictEqual(Growth.needsRollover(undefined, "2025-11-05"), false);
  assert.strictEqual(Growth.needsRollover("2025-11-04", undefined), false);
});

test("shouldPlantOnRollover only for un-transplanted blooms", () => {
  assert.strictEqual(Growth.shouldPlantOnRollover({ plantStatus: "bloomed", transplanted: false }), true);
  assert.strictEqual(Growth.shouldPlantOnRollover({ plantStatus: "bloomed", transplanted: true }), false);
  assert.strictEqual(Growth.shouldPlantOnRollover({ plantStatus: "dead" }), false);
  assert.strictEqual(Growth.shouldPlantOnRollover({ plantStatus: "large" }), false);
  assert.strictEqual(Growth.shouldPlantOnRollover(null), false);
});
