"use strict";

/* ---------- constants & storage ---------- */
const STORAGE_KEY = "hydra-state-v1";
const GARDEN_KEY = "hydra-garden";
const DEFAULTS = {
  goalLiters: 2.0,
  glassMl: 250,
  reminderMinutes: 90,
  notifications: false,
};

/* Free spots on the garden hill, occupied in order. */
const SLOTS = [
  { left: 6, bottom: 2 }, { left: 16, bottom: 10 }, { left: 27, bottom: 4 },
  { left: 38, bottom: 12 }, { left: 49, bottom: 3 }, { left: 60, bottom: 11 },
  { left: 71, bottom: 4 }, { left: 82, bottom: 13 }, { left: 90, bottom: 5 },
  { left: 12, bottom: 18 }, { left: 44, bottom: 19 }, { left: 76, bottom: 20 },
];

const $ = (sel) => document.querySelector(sel);

const els = {
  plant: $("#plant"),
  plantBody: $("#plant-body"),
  plantInner: $("#plant-inner"),
  droplet: $("#droplet"),
  speech: $("#speech-bubble"),
  progressFill: $("#progress-fill"),
  progressLabel: $("#progress-label"),
  progressPct: $("#progress-pct"),
  progressTrack: $(".progress-track"),
  lastGlass: $("#last-glass"),
  drinkBtn: $("#drink-btn"),
  settingsBtn: $("#settings-btn"),
  settingsModal: $("#settings-modal"),
  goalInput: $("#goal-input"),
  glassInput: $("#glass-size-input"),
  reminderInput: $("#reminder-input"),
  notifToggle: $("#notif-toggle"),
  closeSettings: $("#close-settings"),
  garden: $("#garden"),
  stars: $("#stars"),
  toast: $("#toast"),
  ringFill: $("#ring-fill"),
  gardenCount: $("#garden-count"),
};

/* ---------- state ---------- */
let settings = { ...DEFAULTS };
let logs = [];          // [{ at: timestamp, ml }]
let dayKey = todayKey();
let speciesId = null;
let plantStatus = "seed"; // seed | sprout | small | medium | large | sick | dead | bloomed | transplanted
let reminderTimer = null;
let statusTimer = null;
let toastTimer = null;

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadGarden() {
  try {
    return JSON.parse(localStorage.getItem(GARDEN_KEY) || "[]");
  } catch (e) {
    return [];
  }
}

function saveGarden(entries) {
  try {
    localStorage.setItem(GARDEN_KEY, JSON.stringify(entries));
  } catch (e) { /* ignore */ }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    settings = { ...DEFAULTS, ...(saved.settings || {}) };
    speciesId = saved.speciesId && Plants.speciesFor(saved.speciesId) ? saved.speciesId : null;
    if (Growth.needsRollover(saved.day, dayKey)) {
      // New day since the last visit: pot a fresh, random species and reset the day.
      if (!speciesId) speciesId = Plants.randomSpecies();
      if (Growth.shouldPlantOnRollover(saved)) {
        plantInGarden(saved.bloomColor);
      }
      speciesId = Plants.randomSpecies();
      logs = [];
      plantStatus = "seed";
      persist();
    } else if (saved.day === dayKey) {
      logs = saved.logs || [];
      plantStatus = saved.plantStatus || plantStatus;
    }
  } catch (e) {
    console.warn("Could not load state", e);
  }
}

function persist() {
  const payload = {
    day: dayKey,
    settings,
    logs,
    plantStatus,
    speciesId,
    transplanted: plantStatus === "transplanted",
    bloomColor: Plants.speciesFor(speciesId).color,
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn("Could not persist state", e);
  }
}

/* ---------- water math (pure logic lives in growth.js) ---------- */
const mlTotal = () => Growth.totalMl(logs);
const litersTotal = () => mlTotal() / 1000;

function stageForProgress() {
  return Growth.stageForProgress(mlTotal(), settings.goalLiters);
}

/* ---------- plant rendering ---------- */
function renderPlant() {
  const body = els.plantBody;
  els.plantInner.innerHTML = Plants.markupFor(speciesId);
  body.classList.remove("stage-seed", "stage-sprout", "stage-small", "stage-medium", "stage-large", "sick", "dead", "bloomed", "healthy", "grew");
  els.plant.className = "mood-" + Growth.potMood(plantStatus);

  if (plantStatus === "dead") {
    body.classList.add("dead");
  } else if (plantStatus === "bloomed") {
    body.classList.add("stage-large", "bloomed");
  } else if (plantStatus === "transplanted") {
    body.classList.add("stage-seed");
  } else if (plantStatus === "sick") {
    body.classList.add(Growth.stageClass(stageForProgress()), "sick");
  } else {
    body.classList.add(Growth.stageClass(plantStatus), "healthy");
  }
}

function say(text) {
  els.speech.textContent = text;
  els.speech.classList.add("visible");
  clearTimeout(say._t);
  say._t = setTimeout(() => els.speech.classList.remove("visible"), 4000);
}

function toast(text) {
  els.toast.textContent = text;
  els.toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("visible"), 3500);
}

/* ---------- progress UI ---------- */
function renderProgress() {
  const goalMl = settings.goalLiters * 1000;
  const pct = Math.min(100, Math.round((mlTotal() / goalMl) * 100));
  els.progressFill.style.width = pct + "%";
  els.progressFill.classList.toggle("full", pct >= 100);
  els.progressLabel.textContent = `${litersTotal().toFixed(2).replace(/\.00$/, ".0")} L of ${settings.goalLiters} L`;
  els.progressPct.textContent = pct + "%";
  els.progressTrack.setAttribute("aria-valuenow", pct);

  const last = logs[logs.length - 1];
  els.lastGlass.textContent = last
    ? `Last glass at ${new Date(last.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    : "No glass logged yet today";

  const ringC = 2 * Math.PI * 52;
  if (els.ringFill) {
    els.ringFill.style.strokeDashoffset = (ringC * (1 - pct / 100)).toFixed(1);
    els.ringFill.classList.toggle("full", pct >= 100);
  }
}

/* ---------- garden (bloomed plants history) ---------- */
function freeSlot() {
  const entries = loadGarden();
  const used = new Set(entries.map((e) => e.slot));
  for (let i = 0; i < SLOTS.length; i++) {
    if (!used.has(i)) return i;
  }
  return entries.length % SLOTS.length; // garden full: recycle oldest spot
}

function plantInGarden(color) {
  const entries = loadGarden();
  const slot = freeSlot();
  entries.push({
    at: Date.now(),
    color: color || Plants.speciesFor(speciesId).color,
    species: speciesId,
    slot,
    scale: 0.85 + Math.random() * 0.35,
  });
  saveGarden(entries.slice(-SLOTS.length * 2));
  renderGarden();
  renderInsects();
  return slot;
}

const GARDEN_PLANT_SIZE = 96;

function renderGarden() {
  const entries = loadGarden();
  els.garden.innerHTML = "";
  const count = Math.min(entries.length, SLOTS.length);
  const start = entries.length - count;
  for (let i = 0; i < count; i++) {
    const e = entries[start + i];
    const slot = SLOTS[e.slot % SLOTS.length];
    const wrap = document.createElement("div");
    wrap.className = "garden-flower";
    wrap.dataset.slot = e.slot;
    wrap.style.left = slot.left + "%";
    wrap.style.bottom = slot.bottom + "%";
    wrap.style.animationDelay = (e.slot % 5) * 0.4 + "s";
    wrap.innerHTML = Plants.svgFor(e.species, Math.round(GARDEN_PLANT_SIZE * (e.scale || 1)));
    els.garden.appendChild(wrap);
  }
  if (els.gardenCount) {
    const bloomed = entries.length;
    els.gardenCount.hidden = bloomed === 0;
    els.gardenCount.textContent = "🌼 " + bloomed;
  }
}

/* ---------- ambient grass field ---------- */
function renderGrass() {
  const grass = $("#grass");
  grass.innerHTML = "";
  for (let i = 0; i < 18; i++) {
    const el = document.createElement("div");
    el.className = "grass-tuft";
    el.style.left = Math.random() * 100 + "%";
    el.style.bottom = Math.random() * 26 + "%";
    const scale = 0.7 + Math.random() * 0.9;
    el.style.transform = `scale(${scale.toFixed(2)})`;
    el.style.animationDelay = -Math.random() * 4 + "s";
    el.innerHTML = Plants.grassTuft(i);
    grass.appendChild(el);
  }
}

/* ---------- petal rain on bloom ---------- */
function spawnPetals(color) {
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("div");
    p.className = "petal-bit";
    p.style.left = Math.random() * 100 + "vw";
    p.style.setProperty("--dur", 4 + Math.random() * 3.5 + "s");
    p.style.setProperty("--sway", (Math.random() * 90 - 45).toFixed(0) + "px");
    p.style.animationDelay = Math.random() * 0.8 + "s";
    p.innerHTML =
      '<svg viewBox="0 0 20 14" width="16" aria-hidden="true">' +
      '<ellipse cx="10" cy="7" rx="9" ry="6" fill="' + color + '" opacity="0.9"/></svg>';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 9000);
  }
}

/* ---------- sparkle burst on bloom ---------- */
function spawnBurst(x, y, color) {
  const colors = [color, "#ffd166", "#fff3bf", "#ff8fb1"];
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("div");
    s.className = "spark";
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const dist = 60 + Math.random() * 80;
    s.style.left = x + "px";
    s.style.top = y + "px";
    s.style.background = colors[i % colors.length];
    s.style.setProperty("--tx", Math.cos(angle) * dist + "px");
    s.style.setProperty("--ty", Math.sin(angle) * dist - 40 + "px");
    s.style.animationDelay = Math.random() * 0.15 + "s";
    s.style.width = s.style.height = 5 + Math.random() * 7 + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 1300);
  }
}

/* ---------- ambient insects (more as the garden fills up) ---------- */
function insectCount() {
  const plants = Math.min(loadGarden().length, SLOTS.length);
  return Math.min(8, Math.floor(plants / 2));
}

function renderInsects() {
  els.stars.querySelectorAll(".insect").forEach((n) => n.remove());
  const count = insectCount();
  for (let i = 0; i < count; i++) {
    const insect = Plants.INSECTS[i % Plants.INSECTS.length];
    const el = document.createElement("div");
    el.className = "insect";
    el.style.left = 8 + Math.random() * 80 + "%";
    el.style.top = 30 + Math.random() * 40 + "%";
    el.style.setProperty("--dur", 9 + Math.random() * 8 + "s");
    el.style.setProperty("--dx1", (Math.random() * 60 - 30).toFixed(0) + "px");
    el.style.setProperty("--dy1", (Math.random() * 40 - 20).toFixed(0) + "px");
    el.style.setProperty("--dx2", (Math.random() * 100 - 50).toFixed(0) + "px");
    el.style.setProperty("--dy2", (Math.random() * 60 - 30).toFixed(0) + "px");
    el.style.animationDelay = -Math.random() * 10 + "s";
    el.innerHTML = insect.svg;
    els.stars.appendChild(el);
  }
}

/* ---------- transplant animation ---------- */
function transplantBloom() {
  if (plantStatus !== "bloomed") return;
  const slot = plantInGarden();

  const targetEl = els.garden.querySelector(`[data-slot="${slot}"]`);
  if (!targetEl || typeof targetEl.getBoundingClientRect !== "function") {
    finishTransplant();
    return;
  }
  targetEl.style.visibility = "hidden";

  const plantRect = els.plant.getBoundingClientRect();
  const clone = document.createElement("div");
  clone.className = "transplant-clone";
  clone.innerHTML = Plants.svgFor(speciesId, Math.min(200, plantRect.width));
  document.body.appendChild(clone);

  const size = clone.firstElementChild.getBoundingClientRect();
  const startX = plantRect.left + plantRect.width / 2 - size.width / 2;
  const startY = plantRect.top;
  clone.style.left = startX + "px";
  clone.style.top = startY + "px";

  const t = targetEl.getBoundingClientRect();
  const targetX = t.left + t.width / 2 - size.width / 2;
  const targetY = t.bottom - size.height;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      clone.style.transform = `translate(${targetX - startX}px, ${targetY - startY}px) scale(0.42)`;
      clone.style.opacity = "0.9";
    });
  });

  setTimeout(() => {
    clone.remove();
    targetEl.style.visibility = "";
    finishTransplant();
  }, 1400);
}

function finishTransplant() {
  plantStatus = "transplanted";
  renderPlant();
  persist();
  say("I'm home in the garden now. Thank you! 🌸");
  toast("Your plant has been transplanted to the garden 🌱");
}

/* ---------- stars (ambient) ---------- */
function renderStars() {
  els.stars.innerHTML = "";
  for (let i = 0; i < 14; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = 2 + Math.random() * 3;
    s.style.width = s.style.height = size + "px";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 40 + "%";
    s.style.animationDelay = Math.random() * 3 + "s";
    els.stars.appendChild(s);
  }
}

/* ---------- core actions ---------- */
function drinkGlass() {
  if (plantStatus === "dead") {
    toast("Your plant has withered for today. It'll be back tomorrow 🌱");
    return;
  }

  logs.push({ at: Date.now(), ml: settings.glassMl });
  animateDroplet();
  renderProgress();
  persist();

  if (plantStatus === "bloomed" || plantStatus === "transplanted") {
    say("Extra water for the garden! Thank you 💧");
    return;
  }

  plantStatus = stageForProgress();
  renderPlant();
  triggerGrowthAnimation();
  scheduleReminder();
  scheduleStatusCheck();

  if (Growth.reachedGoal(mlTotal(), settings.goalLiters)) {
    bloom();
  } else {
    const messages = {
      seed: "Glug glug… I feel a sprout coming! 🌱",
      sprout: "Yay, I'm growing! 💚",
      small: "Look at my new leaves! 🍃",
      medium: "I'm getting big and strong! 🌿",
      large: "Almost there… I can feel a bloom coming! ✨",
    };
    say(messages[plantStatus] || "Thanks for the water! 💧");
  }

  els.drinkBtn.classList.remove("celebrate");
  void els.drinkBtn.offsetWidth;
  els.drinkBtn.classList.add("celebrate");
}

function animateDroplet() {
  const d = els.droplet;
  d.classList.remove("pouring");
  void d.offsetWidth;
  d.classList.add("pouring");
  setTimeout(() => d.classList.remove("pouring"), 1200);
}

function triggerGrowthAnimation() {
  const body = els.plantBody;
  body.classList.remove("grew");
  void body.offsetWidth;
  body.classList.add("grew");
  els.plant.classList.remove("splash");
  void els.plant.offsetWidth;
  els.plant.classList.add("splash");
  setTimeout(() => {
    body.classList.remove("grew");
    els.plant.classList.remove("splash");
  }, 1300);
}

function bloom() {
  plantStatus = "bloomed";
  renderPlant();
  persist();
  say("We did it! I'm blooming! 🌸");
  toast("Congratulations! Your plant bloomed today 🌸");
  const rect = els.plant.getBoundingClientRect();
  spawnBurst(rect.left + rect.width / 2, rect.top + rect.height * 0.3, Plants.speciesFor(speciesId).color);
  spawnPetals(Plants.speciesFor(speciesId).color);
  if (settings.notifications && Notification.permission === "granted") {
    try {
      new Notification("Hydra", { body: "Your plant bloomed! Beautiful job staying hydrated today 🌸" });
    } catch (e) { /* ignore */ }
  }
  setTimeout(transplantBloom, 2400);
}

/* ---------- reminders & health ---------- */
function scheduleReminder() {
  clearTimeout(reminderTimer);
  if (plantStatus === "dead" || plantStatus === "bloomed" || plantStatus === "transplanted") return;
  const ms = settings.reminderMinutes * 60 * 1000;
  reminderTimer = setTimeout(() => {
    if (plantStatus === "dead" || plantStatus === "bloomed" || plantStatus === "transplanted") return;
    say("I'm thirsty… could you drink some water? 💧");
    toast("Time for a glass of water! Your companion is thirsty 💧");
    if (settings.notifications && Notification.permission === "granted") {
      try {
        new Notification("Hydra", { body: "Time for a glass of water! Your plant is getting thirsty 🌱" });
      } catch (e) { /* ignore */ }
    }
  }, ms);
}

function scheduleStatusCheck() {
  clearTimeout(statusTimer);
  if (plantStatus === "dead" || plantStatus === "bloomed" || plantStatus === "transplanted") return;
  const ms = settings.reminderMinutes * 60 * 1000 * 1.5;
  statusTimer = setTimeout(checkHealth, ms);
}

function checkHealth() {
  if (plantStatus === "dead" || plantStatus === "bloomed" || plantStatus === "transplanted") return;
  const last = logs.length ? logs[logs.length - 1].at : dayStart();
  const status = Growth.healthStatus(Date.now() - last, settings.reminderMinutes * 60 * 1000);

  if (status === "dead") {
    plantStatus = "dead";
    renderPlant();
    persist();
    say("…I'm sorry, I couldn't make it 💔");
    toast("Your plant withered. Tomorrow is a new seed 🌱");
    return;
  }

  if (status === "sick" && plantStatus !== "sick") {
    plantStatus = "sick";
    renderPlant();
    persist();
    say("I'm not feeling well… please drink some water 😢");
    toast("Your plant is getting sick — drink a glass of water! 💧");
  }
  scheduleStatusCheck();
}

function dayStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/* ---------- settings ---------- */
function openSettings() {
  els.goalInput.value = settings.goalLiters;
  els.glassInput.value = settings.glassMl;
  els.reminderInput.value = settings.reminderMinutes;
  els.notifToggle.checked = settings.notifications;
  els.settingsModal.hidden = false;
}

function closeSettings() {
  settings = Growth.normalizeSettings({
    goalLiters: els.goalInput.value,
    glassMl: els.glassInput.value,
    reminderMinutes: els.reminderInput.value,
    notifications: els.notifToggle.checked,
  }, settings);

  els.settingsModal.hidden = true;
  persist();
  if (plantStatus !== "bloomed" && plantStatus !== "transplanted" && plantStatus !== "dead") {
    plantStatus = stageForProgress();
    renderPlant();
  }
  renderProgress();
  scheduleReminder();
  scheduleStatusCheck();
  toast("Settings saved ✓");
}

/* ---------- time-of-day theme ---------- */
function applyTheme() {
  document.body.className = "theme-" + Growth.skyTheme(new Date().getHours());
}

/* ---------- day rollover ---------- */
function potNewSeed() {
  speciesId = Plants.randomSpecies();
  logs = [];
  plantStatus = "seed";
  renderPlant();
  renderProgress();
  persist();
  const species = Plants.speciesFor(speciesId);
  say(`Good morning! Today's seed is a ${species.name} 🌱`);
}

function checkNewDay() {
  const now = new Date();
  if (todayKey(now) !== dayKey) {
    if (plantStatus === "bloomed" && !document.hidden) {
      // Bloomed and still on screen: transplant before rolling over.
      transplantBloom();
      dayKey = todayKey(now);
      setTimeout(potNewSeed, 1600);
      return;
    }
    if (plantStatus === "bloomed" || plantStatus === "transplanted") {
      plantInGarden();
    }
    dayKey = todayKey(now);
    potNewSeed();
  }
}

/* ---------- init ---------- */
function init() {
  loadState();
  if (!speciesId) speciesId = Plants.randomSpecies();
  applyTheme();
  renderStars();
  renderGrass();
  renderGarden();
  renderInsects();
  if (!logs.length) plantStatus = "seed";
  renderPlant();
  renderProgress();

  els.drinkBtn.addEventListener("click", drinkGlass);
  els.settingsBtn.addEventListener("click", openSettings);
  els.closeSettings.addEventListener("click", closeSettings);
  els.settingsModal.addEventListener("click", (e) => {
    if (e.target === els.settingsModal) closeSettings();
  });
  els.notifToggle.addEventListener("change", () => {
    if (els.notifToggle.checked && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().then((p) => {
        if (p !== "granted") {
          els.notifToggle.checked = false;
          toast("Notifications were blocked by the browser");
        }
      });
    }
  });

  const species = Plants.speciesFor(speciesId);
  say(logs.length ? `Welcome back to your ${species.name}! 💧` : `Good morning! Today's seed is a ${species.name} 🌱`);
  scheduleReminder();
  scheduleStatusCheck();
  setInterval(checkNewDay, 60 * 1000);
  setInterval(checkHealth, 5 * 60 * 1000);
  setInterval(applyTheme, 10 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkNewDay();
      checkHealth();
    }
  });
}

init();
