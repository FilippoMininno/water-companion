# Bloom & Sip

A static website (HTML + CSS + JS, no backend) for tracking daily water intake, designed for cancer patients who have difficulty drinking water due to chemotherapy side effects.

## How it works

- Each morning a new virtual plant is potted from a seed (inline SVG, animated with CSS only).
- Every logged glass of water grows the plant.
- If too long passes without a glass, you get a notification and the plant gets sick; at the end of the day it wilts.
- Reaching your daily goal (configurable in the settings menu) makes the plant bloom.
- Bloomed plants are collected into a growing garden background as days pass.

## Run

Open `index.html` in a browser. All state is stored in `localStorage`.

## Files

- `index.html` — markup including the inline SVG plant
- `styles.css` — growth stages, sway/sick/death/bloom animations, time-of-day sky
- `app.js` — daily cycle, health and notification logic, settings, garden persistence
