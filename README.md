# Hydra 💧🌱

A mobile-first water-intake companion for cancer patients whose chemotherapy makes drinking difficult.

Each morning a new virtual plant is potted from a seed. Every logged glass of water makes it grow; too long without water and it gets sick, withers, and dies. Reach your daily goal and it blooms — bloomed plants stay in the background garden, so a thriving garden grows day after day.

## Features
- Static site: plain HTML/CSS/JS, no backend, state in `localStorage`
- Inline SVG plant with CSS-only animations (growth, swaying, drooping when sick, blooming)
- Configurable daily goal (liters), glass size, and reminder interval
- In-app + browser notification reminders when too much time passes without water
- Persistent garden of bloomed plants in the background

## Run
Open `index.html` in a mobile browser, or serve the folder:

```bash
npx serve .
```

## Tests
Growth logic lives in `growth.js` (pure functions, no DOM) and is covered by a unit suite using Node's built-in test runner — no dependencies needed:

```bash
node --test tests/growth.test.js
```
