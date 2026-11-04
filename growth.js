"use strict";

/*
 * Pure growth logic for the Hydra water companion.
 * No DOM access: everything here is unit-testable (see tests/growth.test.js).
 * Loaded as a classic script in the browser (exposes window.Growth)
 * and via require() under Node for tests.
 */
(function (root) {
  const STAGES = ["seed", "sprout", "small", "medium", "large"];

  const STAGE_SCALES = {
    seed: 0.12,
    sprout: 0.35,
    small: 0.55,
    medium: 0.78,
    large: 1,
  };

  function totalMl(logs) {
    if (!Array.isArray(logs)) return 0;
    return logs.reduce(function (sum, entry) {
      return sum + (entry && typeof entry.ml === "number" ? entry.ml : 0);
    }, 0);
  }

  function reachedGoal(ml, goalLiters) {
    var goalMl = goalLiters * 1000;
    if (!isFinite(goalMl) || goalMl <= 0) return false;
    return ml >= goalMl;
  }

  function stageForProgress(ml, goalLiters) {
    var goalMl = goalLiters * 1000;
    if (!isFinite(goalMl) || goalMl <= 0) return "seed";
    var ratio = ml / goalMl;
    if (ratio <= 0) return "seed";
    if (ratio < 0.25) return "sprout";
    if (ratio < 0.5) return "small";
    if (ratio < 0.8) return "medium";
    return "large";
  }

  function stageClass(stage) {
    return "stage-" + stage;
  }

  /*
   * Health decay from elapsed time since the last glass.
   * reminderMs = reminder interval in milliseconds.
   * sick at >= 1.5x the reminder interval, dead at >= 3x.
   */
  function healthStatus(elapsedMs, reminderMs) {
    if (!isFinite(elapsedMs) || !isFinite(reminderMs) || reminderMs <= 0) return null;
    if (elapsedMs < 0) return null;
    if (elapsedMs >= reminderMs * 3) return "dead";
    if (elapsedMs >= reminderMs * 1.5) return "sick";
    return null;
  }

  function clamp(value, min, max, fallback) {
    var n = typeof value === "string" ? parseFloat(value) : value;
    if (typeof n !== "number" || !isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function normalizeSettings(input, defaults) {
    var raw = input || {};
    return {
      goalLiters: clamp(raw.goalLiters, 0.5, 5, defaults.goalLiters),
      glassMl: Math.round(clamp(raw.glassMl, 100, 500, defaults.glassMl)),
      reminderMinutes: Math.round(clamp(raw.reminderMinutes, 15, 240, defaults.reminderMinutes)),
      notifications: !!raw.notifications,
    };
  }

  /*
   * Day rollover helpers.
   * needsRollover: true when the persisted day is a previous day.
   * shouldPlantOnRollover: true when yesterday's plant bloomed but was
   * never transplanted (page closed before the animation) — plant it anyway.
   */
  function needsRollover(savedDay, currentDay) {
    return typeof savedDay === "string" && typeof currentDay === "string" && savedDay !== currentDay;
  }

  function shouldPlantOnRollover(saved) {
    if (!saved || saved.transplanted) return false;
    return saved.plantStatus === "bloomed";
  }

  var api = {
    STAGES: STAGES,
    STAGE_SCALES: STAGE_SCALES,
    totalMl: totalMl,
    reachedGoal: reachedGoal,
    stageForProgress: stageForProgress,
    stageClass: stageClass,
    healthStatus: healthStatus,
    clamp: clamp,
    normalizeSettings: normalizeSettings,
    needsRollover: needsRollover,
    shouldPlantOnRollover: shouldPlantOnRollover,
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.Growth = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
