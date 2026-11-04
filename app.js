const STORE_KEY = "bloomAndSip.v1";

const $ = (id) => document.getElementById(id);
const plantSvg = $("plant-svg");
const statusText = $("status-text");
const drinkBtn = $("drink-btn");
const progressFill = $("progress-fill");
const progressLabel = $("progress-label");
const nextHint = $("next-hint");
const gardenRow = $("garden-row");
const gardenEmpty = $("garden-empty");
const banner = $("notify-banner");
const todayLabel = $("today-label");

function todayStr() {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function dayStartMs(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

function defaultState() {
  return {
    settings: { goalLiters: 2, glassMl: 250, notifyMinutes: 90 },
    day: todayStr(),
    waterMl: 0,
    lastDrinkAt: null,
    notified: false,
    bloomed: false,
    garden: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const state = Object.assign(defaultState(), parsed);
    state.settings = Object.assign(defaultState().settings, parsed.settings || {});
    return state;
  } catch (e) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
}

let state = loadState();

function glassesDrunk() {
  return Math.floor(state.waterMl / state.settings.glassMl);
}

function goalMl() {
  return state.settings.goalLiters * 1000;
}

function minutesSinceLastDrink(now) {
  const ref = state.lastDrinkAt != null ? state.lastDrinkAt : dayStartMs(state.day);
  return Math.max(0, (now - ref) / 60000);
}

function health(now) {
  const decay = 100 / (state.settings.notifyMinutes * 2.5);
  return Math.max(0, 100 - minutesSinceLastDrink(now) * decay);
}

function checkDayRollover(now) {
  const today = todayStr();
  if (state.day === today) return;
  if (state.bloomed) {
    state.garden.push({ date: state.day });
    if (state.garden.length > 90) state.garden = state.garden.slice(-90);
  }
  state.day = today;
  state.waterMl = 0;
  state.lastDrinkAt = null;
  state.notified = false;
  state.bloomed = false;
  saveState();
}

function plantStage(now) {
  if (state.bloomed) return 5;
  return Math.min(4, glassesDrunk());
}

function plantCondition(now) {
  if (state.bloomed) return "bloomed";
  const h = health(now);
  if (h < 45) return "sick";
  return "healthy";
}

function statusMessage(condition) {
  const leftMl = Math.max(0, goalMl() - state.waterMl);
  const glassesLeft = Math.ceil(leftMl / state.settings.glassMl);
  if (condition === "bloomed") return "🌸 Your plant bloomed! You reached your daily goal. It will join the garden tonight.";
  if (condition === "sick") return "🥀 Your plant is thirsty... it needs water soon!";
  if (glassesLeft <= 1) return "Almost there — one more glass and it will bloom! 🌼";
  return "Looking good! " + glassesLeft + " more glass" + (glassesLeft === 1 ? "" : "es") + " to make it bloom.";
}

function render(now) {
  now = now || Date.now();
  const condition = plantCondition(now);
  const stage = plantStage(now);

  plantSvg.className = "";
  plantSvg.classList.add("stage-" + stage);
  if (state.bloomed) plantSvg.classList.add("bloomed");
  if (condition === "sick") plantSvg.classList.add("sick");
  if (condition === "healthy" && !state.bloomed) plantSvg.classList.add("healthy");
  if (state.bloomed) plantSvg.classList.add("healthy");

  statusText.textContent = statusMessage(condition);
  statusText.className = condition === "sick" ? "warn" : condition === "bloomed" ? "happy" : "happy";

  const pct = Math.min(100, (state.waterMl / goalMl()) * 100);
  progressFill.style.width = pct + "%";
  progressLabel.textContent = (state.waterMl / 1000).toFixed(2) + " / " + state.settings.goalLiters.toFixed(2) + " L";
  nextHint.textContent = state.bloomed
    ? "Goal reached — enjoy your blooming plant!"
    : "Glass size: " + state.settings.glassMl + " ml · remind after " + state.settings.notifyMinutes + " min without water";

  todayLabel.textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });

  renderGarden();
  setSky();
}

function renderGarden() {
  gardenRow.innerHTML = "";
  gardenEmpty.style.display = state.garden.length ? "none" : "block";
  state.garden.forEach((entry, i) => {
    const hue = (i * 47 + 320) % 360;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 44 60");
    svg.classList.add("garden-flower");
    svg.innerHTML =
      '<line x1="22" y1="58" x2="22" y2="30" stroke="#3f9d55" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M22,46 C14,44 10,38 11,33 C18,35 22,40 22,46 Z" fill="#4caf62"/>' +
      '<g transform="translate(22,24)">' +
      '<g fill="hsl(' + hue + ',75%,70%)">' +
      '<ellipse cx="0" cy="-8" rx="4.5" ry="8"/>' +
      '<ellipse cx="0" cy="-8" rx="4.5" ry="8" transform="rotate(72)"/>' +
      '<ellipse cx="0" cy="-8" rx="4.5" ry="8" transform="rotate(144)"/>' +
      '<ellipse cx="0" cy="-8" rx="4.5" ry="8" transform="rotate(216)"/>' +
      '<ellipse cx="0" cy="-8" rx="4.5" ry="8" transform="rotate(288)"/>' +
      '</g><circle r="4" fill="#ffd54f"/></g>';
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = "Bloomed on " + entry.date;
    svg.appendChild(title);
    gardenRow.appendChild(svg);
  });
}

function setSky() {
  const h = new Date().getHours();
  let sky1, sky2;
  if (h < 5) { sky1 = "#1c2a4a"; sky2 = "#3a4a6b"; }
  else if (h < 8) { sky1 = "#f7c8a0"; sky2 = "#ffe8d0"; }
  else if (h < 17) { sky1 = "#aee3f5"; sky2 = "#e8f7ff"; }
  else if (h < 20) { sky1 = "#f2a56f"; sky2 = "#ffd9b0"; }
  else { sky1 = "#27355c"; sky2 = "#5a6a94"; }
  document.documentElement.style.setProperty("--sky1", sky1);
  document.documentElement.style.setProperty("--sky2", sky2);
}

function spawnDrops() {
  const drops = $("drops");
  drops.innerHTML = "";
  for (let i = 0; i < 3; i++) {
    const d = document.createElement("div");
    d.className = "drop";
    drops.appendChild(d);
  }
}

function showBanner(msg) {
  banner.textContent = msg;
  banner.classList.remove("hidden");
  clearTimeout(showBanner._t);
  showBanner._t = setTimeout(() => banner.classList.add("hidden"), 8000);
}

function requestNotifyPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function fireNotification(now) {
  const mins = Math.round(minutesSinceLastDrink(now));
  const msg = "💧 It's been " + mins + " minutes since your last glass — your plant is thirsty!";
  showBanner(msg);
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification("Bloom & Sip", { body: msg }); } catch (e) { /* unsupported */ }
  }
}

function onDrink() {
  requestNotifyPermission();
  const now = Date.now();
  checkDayRollover(now);
  state.waterMl += state.settings.glassMl;
  state.lastDrinkAt = now;
  state.notified = false;
  if (!state.bloomed && state.waterMl >= goalMl()) {
    state.bloomed = true;
    showBanner("🌸 Your plant just bloomed! Goal reached for today!");
  }
  saveState();
  spawnDrops();
  render(now);
}

function tick() {
  const now = Date.now();
  const before = state.day;
  checkDayRollover(now);
  if (before !== state.day) render(now);

  const thresholdMs = state.settings.notifyMinutes * 60000;
  const ref = state.lastDrinkAt != null ? state.lastDrinkAt : dayStartMs(state.day);
  if (!state.notified && !state.bloomed && now - ref > thresholdMs) {
    state.notified = true;
    saveState();
    fireNotification(now);
  }
  render(now);
}

function openSettings() {
  $("set-goal").value = state.settings.goalLiters;
  $("set-glass").value = state.settings.glassMl;
  $("set-notify").value = state.settings.notifyMinutes;
  $("settings-modal").classList.remove("hidden");
}

function saveSettings() {
  const goal = parseFloat($("set-goal").value);
  const glass = parseInt($("set-glass").value, 10);
  const notify = parseInt($("set-notify").value, 10);
  if (isFinite(goal) && goal > 0) state.settings.goalLiters = goal;
  if (isFinite(glass) && glass > 0) state.settings.glassMl = glass;
  if (isFinite(notify) && notify > 0) state.settings.notifyMinutes = notify;
  if (!state.bloomed && state.waterMl >= goalMl()) state.bloomed = true;
  saveState();
  $("settings-modal").classList.add("hidden");
  render();
}

drinkBtn.addEventListener("click", onDrink);
$("settings-btn").addEventListener("click", openSettings);
$("settings-close").addEventListener("click", () => $("settings-modal").classList.add("hidden"));
$("settings-save").addEventListener("click", saveSettings);
$("settings-modal").addEventListener("click", (e) => {
  if (e.target === $("settings-modal")) $("settings-modal").classList.add("hidden");
});

checkDayRollover(Date.now());
render();
setInterval(tick, 30000);
