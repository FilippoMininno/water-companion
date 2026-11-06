"use strict";

const test = require("node:test");
const assert = require("node:assert");
const Plants = require("../plants.js");

/* ---------- species catalog ---------- */

test("catalog has at least five species", () => {
  assert.ok(Plants.SPECIES.length >= 5);
});

test("species ids are unique", () => {
  const ids = Plants.SPECIES.map((s) => s.id);
  assert.strictEqual(new Set(ids).size, ids.length);
});

test("every species has required fields", () => {
  for (const s of Plants.SPECIES) {
    assert.strictEqual(typeof s.id, "string", s.id + " id");
    assert.strictEqual(typeof s.name, "string", s.id + " name");
    assert.strictEqual(typeof s.color, "string", s.id + " color");
    assert.ok(s.markup.length > 50, s.id + " should have detailed markup");
    assert.ok(s.markup.includes('class="stem"'), s.id + " needs a stem");
    assert.ok(s.markup.includes('class="leaf"'), s.id + " needs leaves");
    assert.ok(s.markup.includes('class="bloom-part"'), s.id + " needs a bloom part");
    assert.ok(s.markup.includes("--bloom-origin"), s.id + " needs a bloom origin");
  }
});

/* ---------- markup builders ---------- */

test("markupFor returns species markup plus sick marks", () => {
  const m = Plants.markupFor("rose");
  assert.ok(m.includes('class="bloom-part"'));
  assert.ok(m.includes('class="sick-marks"'));
});

test("markupFor falls back to the first species for unknown ids", () => {
  assert.ok(Plants.markupFor("does-not-exist").includes('class="bloom-part"'));
});

test("svgFor builds a standalone svg with a width", () => {
  const svg = Plants.svgFor("tulip", 80);
  assert.ok(svg.startsWith("<svg "));
  assert.ok(svg.includes('width="80"'));
  assert.ok(svg.includes('viewBox="0 0 200 260"'));
});

/* ---------- selection ---------- */

test("pickSpecies is deterministic for a given seed", () => {
  assert.strictEqual(Plants.pickSpecies("2025-01-01"), Plants.pickSpecies("2025-01-01"));
  assert.strictEqual(Plants.pickSpecies("salt-42"), Plants.pickSpecies("salt-42"));
});

test("pickSpecies returns a valid species id", () => {
  const ids = new Set(Plants.SPECIES.map((s) => s.id));
  for (const seed of ["a", "b", "2025-11-04", "x1", "seed"]) {
    assert.ok(ids.has(Plants.pickSpecies(seed)), "invalid id for seed " + seed);
  }
});

test("pickSpecies distributes across seeds", () => {
  const picks = new Set();
  for (let i = 0; i < 100; i++) picks.add(Plants.pickSpecies("day-" + i));
  assert.ok(picks.size >= 2, "expected variety across 100 seeds, got " + picks.size);
});

test("randomSpecies returns a valid species id", () => {
  const ids = new Set(Plants.SPECIES.map((s) => s.id));
  assert.ok(ids.has(Plants.randomSpecies(() => 0)));
  assert.ok(ids.has(Plants.randomSpecies(() => 0.99)));
  assert.ok(ids.has(Plants.randomSpecies()));
});

test("speciesFor falls back for unknown ids", () => {
  assert.strictEqual(Plants.speciesFor("nope").id, Plants.SPECIES[0].id);
  assert.strictEqual(Plants.speciesFor("rose").id, "rose");
});

/* ---------- insects ---------- */

test("insect catalog has at least three kinds", () => {
  assert.ok(Plants.INSECTS.length >= 3);
});

test("every insect has an id and svg with flapping wings", () => {
  const ids = Plants.INSECTS.map((i) => i.id);
  assert.strictEqual(new Set(ids).size, ids.length);
  for (const i of Plants.INSECTS) {
    assert.ok(i.svg.startsWith("<svg "), i.id + " svg");
    assert.ok(i.svg.includes('class="insect-wing wing-l"'), i.id + " left wing");
    assert.ok(i.svg.includes('class="insect-wing wing-r"'), i.id + " right wing");
  }
});

test("insectFor falls back to the first insect for unknown ids", () => {
  assert.strictEqual(Plants.insectFor("nope").id, Plants.INSECTS[0].id);
  assert.ok(Plants.insectFor("bee").id === "bee");
});

/* ---------- grass ---------- */

test("grassTuft builds a tuft svg for each variant", () => {
  for (const v of [0, 1, 2, 3, -1]) {
    const svg = Plants.grassTuft(v);
    assert.ok(svg.startsWith("<svg "), "variant " + v);
    assert.ok((svg.match(/<path/g) || []).length >= 5, "variant " + v + " needs several blades");
  }
});
