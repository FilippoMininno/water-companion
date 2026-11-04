"use strict";

/* ---------- constants & storage ---------- */
const STORAGE_KEY = "hydra-state-v1";
const DEFAULTS = {
  goalLiters: 2.0,
  glassMl: 250,
  reminderMinutes: 90,
  notifications: false,
};

const $ = (sel) => document.querySelector(sel);

const els = {
  plantBody: $("#plant-body"),
  flower: $("#flower"),
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
};

/* ---------- state ---------- */
let settings = { ...DEFAULTS };
let logs = [];        // [{ at: timestamp, ml }]
let dayKey = todayKey();
let plantStatus = "seed"; // seed | sprout | small | medium | large | sick | dead | bloomed
let reminderTimer = null;
let statusTimer = null;
let toastTimer = null;

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    settings = { ...DEFAULTS, ...(saved.settings || {}) };
    if (saved.day === dayKey) {
      logs = saved.logs || [];
    } else if (saved.plantStatus === "bloomed") {
      addGardenFlower(saved.bloomedAt || Date.now(), saved.flowerColor || "#ff8fb1");
      persist();
      return;
    } else if (saved.day && saved.logs && saved.logs.length > 0) {
      addGardenFlower(saved.bloomedAt || Date.now(), saved.flowerColor || "#ff8fb1");
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
    bloomColor: flowerColor,
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
  body.classList.remove("stage-seed", "stage-sprout", "stage-small", "stage-medium", "stage-large", "sick", "dead", "bloomed", "healthy");

  if (plantStatus === "dead") {
    body.classList.add("dead");
  } else if (plantStatus === "bloomed") {
    body.classList.add("stage-large", "bloomed");
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
}

/* ---------- garden (bloomed plants history) ---------- */
const FLOWER_COLORS = ["#ff8fb1", "#ffd166", "#c77dff", "#ff6b6b", "#7bdff2", "#f4a261"];
let flowerColor = FLOWER_COLORS[0];

function addGardenFlower(at, color) {
  const gardenFlowers = JSON.parse(localStorage.getItem("hydra-garden") || "[]");
  gardenFlowers.push({ at, color });
  localStorage.setItem("hydra-garden", JSON.stringify(gardenFlowers));
  renderGarden();
}

function renderGarden() {
  let gardenFlowers = [];
  try {
    gardenFlowers = JSON.parse(localStorage.getItem("hydra-garden") || "[]");
  } catch (e) { /* ignore */ }
  els.garden.innerHTML = "";
  const count = Math.min(gardenFlowers.length, 24);
  for (let i = 0; i < count; i++) {
    const f = gardenFlowers[gardenFlowers.length - 1 - i];
    const el = buildGardenFlower(f.color, i);
    els.garden.appendChild(el);
  }
}

function buildGardenFlower(color, index) {
  const wrap = document.createElement("div");
  wrap.className = "garden-flower";
  const left = (index * 37 + 12) % 92 + 2;
  const delay = (index % 5) * 0.4;
  const size = 26 + (index % 3) * 8;
  wrap.style.left = left + "%";
  wrap.style.animationDelay = delay + "s";
  wrap.style.width = size + "px";
  wrap.innerHTML = `
    <svg viewBox="0 0 40 60" width="100%">
      <path d="M20 60 C20 45 19 35 20 24" stroke="#3f8f4f" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M20 44 C11 43 6 37 4 30 C13 28 19 34 20 44 Z" fill="#4caf50"/>
      <path d="M20 34 C29 33 34 27 36 20 C27 18 21 24 20 34 Z" fill="#58c15c"/>
      <g>
        <ellipse cx="20" cy="14" rx="5" ry="9" fill="${color}"/>
        <ellipse cx="20" cy="14" rx="5" ry="9" fill="${color}" transform="rotate(60 20 20)"/>
        <ellipse cx="20" cy="14" rx="5" ry="9" fill="${color}" transform="rotate(120 20 20)"/>
        <ellipse cx="20" cy="14" rx="5" ry="9" fill="${color}" transform="rotate(180 20 20)"/>
        <ellipse cx="20" cy="14" rx="5" ry="9" fill="${color}" transform="rotate(240 20 20)"/>
        <ellipse cx="20" cy="14" rx="5" ry="9" fill="${color}" transform="rotate(300 20 20)"/>
        <circle cx="20" cy="20" r="5" fill="#ffd166"/>
      </g>
    </svg>`;
  return wrap;
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
  if (plantStatus === "dead" || plantStatus === "bloomed") {
    toast(plantStatus === "bloomed" ? "Goal reached! Your plant is blooming 🌸" : "Your plant has withered for today. It'll be back tomorrow 🌱");
    return;
  }

  logs.push({ at: Date.now(), ml: settings.glassMl });
  plantStatus = stageForProgress();
  animateDroplet();
  renderPlant();
  renderProgress();
  persist();
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
  d.style.opacity = "1";
  d.style.animation = "none";
  void d.offsetWidth;
  d.style.animation = "";
  setTimeout(() => (d.style.opacity = "0"), 950);
}

function bloom() {
  plantStatus = "bloomed";
  flowerColor = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];
  renderPlant();
  persist();
  say("We did it! I'm blooming! 🌸");
  toast("Congratulations! Your plant bloomed today 🌸");
  if (settings.notifications && Notification.permission === "granted") {
    try {
      new Notification("Hydra", { body: "Your plant bloomed! Beautiful job staying hydrated today 🌸" });
    } catch (e) { /* ignore */ }
  }
  els.drinkBtn.disabled = true;
  setTimeout(() => (els.drinkBtn.disabled = false), 800);
}

/* ---------- reminders & health ---------- */
function scheduleReminder() {
  clearTimeout(reminderTimer);
  if (plantStatus === "dead" || plantStatus === "bloomed") return;
  const ms = settings.reminderMinutes * 60 * 1000;
  reminderTimer = setTimeout(() => {
    if (plantStatus === "dead" || plantStatus === "bloomed") return;
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
  if (plantStatus === "dead" || plantStatus === "bloomed") return;
  const ms = settings.reminderMinutes * 60 * 1000 * 1.5;
  statusTimer = setTimeout(checkHealth, ms);
}

function checkHealth() {
  if (plantStatus === "dead" || plantStatus === "bloomed") return;
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
  plantStatus = plantStatus === "bloomed" || plantStatus === "dead" ? plantStatus : stageForProgress();
  renderPlant();
  renderProgress();
  scheduleReminder();
  scheduleStatusCheck();
  toast("Settings saved ✓");
}

/* ---------- day rollover ---------- */
function checkNewDay() {
  const now = new Date();
  if (todayKey(now) !== dayKey) {
    if (plantStatus === "bloomed") {
      addGardenFlower(Date.now(), flowerColor);
    }
    dayKey = todayKey(now);
    logs = [];
    plantStatus = "seed";
    persist();
    renderPlant();
    renderProgress();
    say("A new seed has been potted! Good morning 🌱");
  }
}

/* ---------- init ---------- */
function init() {
  loadState();
  renderStars();
  renderGarden();
  plantStatus = logs.length ? stageForProgress() : "seed";
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

  say(logs.length ? "Welcome back! I missed you 💧" : "Good morning! I'm your little seed 🌱");
  scheduleReminder();
  scheduleStatusCheck();
  setInterval(checkNewDay, 60 * 1000);
  setInterval(checkHealth, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      checkNewDay();
      checkHealth();
    }
  });
}

init();
