// ==================================================
// Question Night — Game Logic (2-player + spend points + canvas wheel + names)
// ==================================================

// -------------------------------
// Deck (30 total)
// -------------------------------
const questions = new Map([
  // Perception (1–10)
  [1,  "What do you think my first impression of you was?"],
  [2,  "What part of my personality do you think stands out the most?"],
  [3,  "What do you think I overthink the most?"],
  [4,  "What do you think people often misunderstand about me?"],
  [5,  "What do you think makes me feel most secure?"],
  [6,  "What do you think I’m secretly afraid of?"],
  [7,  "What’s one assumption you had about me that changed?"],
  [8,  "What do you think I value more: comfort or growth?"],
  [9,  "What do you think I need reassurance about?"],
  [10, "What do you think I’m most proud of?"],

  // Connection (11–20)
  [11, "When do you feel most connected to me?"],
  [12, "What’s a small moment between us that meant a lot to you?"],
  [13, "What do you think I need more of in my life right now?"],
  [14, "What’s something you’ve learned about me only by being close to me?"],
  [15, "What do you think we do really well together?"],
  [16, "When have you felt most appreciated by me?"],
  [17, "What’s something you admire about how I handle things?"],
  [18, "What’s a fear you’ve had about us?"],
  [19, "What do you think makes our relationship different from others?"],
  [20, "What’s one thing you hope we never lose?"],

  // Reflection (21–30)
  [21, "How have I surprised you emotionally?"],
  [22, "What’s something you feel safe telling me?"],
  [23, "What’s something you’ve grown to appreciate about me over time?"],
  [24, "What’s a way I’ve shown up for you that really mattered?"],
  [25, "What’s something about us you don’t say enough?"],
  [26, "What’s something you’re still learning to trust about me?"],
  [27, "What’s a moment you felt truly seen by me?"],
  [28, "What do you think I’ve taught you?"],
  [29, "What intention do you have for us moving forward?"],
  [30, "What’s one thing you want us to protect as we grow?"]
]);

// -------------------------------
// Mystery Wheels (L1/L2/L3)
// -------------------------------
const wheelLevel1 = [
  "What’s something I do that instantly makes you feel closer to me?",
  "What was your first ‘oh… I like them’ moment with me?",
  "What do I do that’s unintentionally attractive?",
  "What’s a compliment you think about me but don’t say enough?",
  "When do you feel most connected to me day-to-day?"
];

const wheelLevel2 = [
  "When do you feel most secure with me—and when do you feel least secure?",
  "What’s something you want more of from me that you haven’t asked for directly?",
  "What’s a small thing I could do that would make a big difference for you?",
  "What’s a fear you’ve had about us that you didn’t want to say out loud?",
  "What’s something you’re still learning to trust about me?"
];

const wheelLevel3 = [
  "What do you need from me to feel fully safe long-term?",
  "What’s something you’re afraid I’ll misunderstand about you?",
  "What boundary do you want us to protect as we grow?",
  "What’s the hardest thing for you to say out loud in relationships?",
  "What’s one thing you never want us to lose, no matter what?"
];

// -------------------------------
// DOM
// -------------------------------
const drawBtn   = document.getElementById("drawBtn");
const countBtn  = document.getElementById("countBtn");
const skipBtn   = document.getElementById("skipBtn");

const questionText = document.getElementById("question");
const levelText    = document.getElementById("level");
const timerText    = document.getElementById("timer");
const turnText     = document.getElementById("turn");
const turnName     = document.getElementById("turnName");

const activeCard = document.getElementById("activeCard");
const usedStack  = document.getElementById("usedStack");

const wheel1Btn = document.getElementById("wheel1Btn");
const wheel2Btn = document.getElementById("wheel2Btn");
const wheel3Btn = document.getElementById("wheel3Btn");

const mysteryText    = document.getElementById("mysteryQuestion");
const mysteryOverlay = document.getElementById("mysteryOverlay");

// Player meters
const meterP1     = document.getElementById("meterP1");
const meterP2     = document.getElementById("meterP2");
const meterTextP1 = document.getElementById("meterTextP1");
const meterTextP2 = document.getElementById("meterTextP2");
const meterFillP1 = document.getElementById("meterFillP1");
const meterFillP2 = document.getElementById("meterFillP2");

// Player name buttons (editable)
const nameBtnP1 = document.getElementById("nameP1");
const nameBtnP2 = document.getElementById("nameP2");

// Wheel modal + canvas
const wheelModal  = document.getElementById("wheelModal");
const wheelTitle  = document.getElementById("wheelTitle");
const wheelCanvas = document.getElementById("wheelCanvas");
const closeWheel  = document.getElementById("closeWheel");
const spinBtn     = document.getElementById("spinBtn");

const ctx = wheelCanvas.getContext("2d");

// -------------------------------
// State
// -------------------------------
let hasDrawnAtLeastOnce = false;

let activePlayer = 1;             // 1 or 2
let progress = { 1: 0, 2: 0 };     // each player has their own meter
let canCountThisCard = false;      // Count/Skip once per drawn card

// Player names (persisted)
let playerNames = {
  1: localStorage.getItem("player1Name") || "Player 1",
  2: localStorage.getItem("player2Name") || "Player 2"
};

// Wheel state
let currentWheelLevel = 1;
let currentWheelItems = [];
let isSpinning = false;
let wheelRotation = 0;            // degrees, cumulative

// -------------------------------
// Vibration
// -------------------------------
function vibrate(ms = 15) {
  if ("vibrate" in navigator) navigator.vibrate(ms);
}

// -------------------------------
// Timer
// -------------------------------
const TIMER_START = 60;
let timerInterval = null;

function startTimer() {
  clearInterval(timerInterval);

  let secondsLeft = TIMER_START;
  timerText.textContent = `⏳ ${secondsLeft}s`;
  timerText.className = "";

  timerInterval = setInterval(() => {
    secondsLeft--;
    timerText.textContent = `⏳ ${secondsLeft}s`;

    if (secondsLeft <= 10) timerText.classList.add("warning");

    if (secondsLeft === 0) {
      clearInterval(timerInterval);
      timerText.classList.add("end");
      timerText.textContent = "⏳ Time’s up";
    }
  }, 1000);
}

// -------------------------------
// UI helpers
// -------------------------------
function spendPointsForWheel(level) {
  progress[activePlayer] = Math.max(0, progress[activePlayer] - level);
  updateMetersUI();
}

function triggerMeterComplete(meterEl) {
  meterEl.classList.remove("complete"); // reset if needed
  void meterEl.offsetWidth;             // force reflow
  meterEl.classList.add("complete");

  // clean up class after animation
  setTimeout(() => {
    meterEl.classList.remove("complete");
  }, 600);
}

function showMysteryOverlay() {
  mysteryOverlay.classList.add("show");
  mysteryOverlay.setAttribute("aria-hidden", "false");
}

function hideMysteryOverlay() {
  mysteryOverlay.classList.remove("show");
  mysteryOverlay.setAttribute("aria-hidden", "true");
}

function updatePlayerNamesUI() {
  nameBtnP1.textContent = playerNames[1];
  nameBtnP2.textContent = playerNames[2];
  if (turnName) turnName.textContent = playerNames[activePlayer];
}

function editPlayerName(player) {
  const current = playerNames[player];
  const input = prompt("Enter name:", current);

  if (!input) return;

  const clean = input.trim().slice(0, 16);
  if (!clean) return;

  playerNames[player] = clean;
  localStorage.setItem(`player${player}Name`, clean);

  updatePlayerNamesUI();
}

function updateMetersUI() {
  // Player 1
  meterTextP1.textContent = `${progress[1]}/3`;
  meterFillP1.style.width = `${(progress[1] / 3) * 100}%`;

  // Player 2
  meterTextP2.textContent = `${progress[2]}/3`;
  meterFillP2.style.width = `${(progress[2] / 3) * 100}%`;

  // 🎉 Trigger celebration when someone hits 3/3
  if (progress[1] === 3) triggerMeterComplete(meterP1);
  if (progress[2] === 3) triggerMeterComplete(meterP2);

  updateWheelButtons();
}

function setActivePlayerUI() {
  // If you kept <p id="turn">Turn: <span id="turnName">...</span></p>
  // this updates that span. If not, it falls back to plain text.
  if (turnName) {
    turnName.textContent = playerNames[activePlayer];
  } else {
    turnText.textContent = `Turn: ${playerNames[activePlayer]}`;
  }

  meterP1.classList.toggle("active", activePlayer === 1);
  meterP2.classList.toggle("active", activePlayer === 2);

  updateWheelButtons();
}

function updateWheelButtons() {
  const p = progress[activePlayer];
  wheel1Btn.disabled = p < 1;
  wheel2Btn.disabled = p < 2;
  wheel3Btn.disabled = p < 3;
}

function switchTurn() {
  activePlayer = activePlayer === 1 ? 2 : 1;
  setActivePlayerUI();
}

function getLevelInfo(questionNumber) {
  if (questionNumber <= 10) return { label: "Perception", className: "perception" };
  if (questionNumber <= 20) return { label: "Connection", className: "connection" };
  return { label: "Reflection", className: "reflection" };
}

function animateLevel(label, className) {
  levelText.className = "";
  levelText.classList.add("bump");

  setTimeout(() => {
    levelText.textContent = `Level: ${label}`;
    levelText.className = className;
  }, 200);
}

function animateQuestion(text) {
  activeCard.classList.remove("deal");
  void activeCard.offsetWidth;
  activeCard.classList.add("deal");

  setTimeout(() => {
    questionText.textContent = text;
  }, 120);
}

function discardCurrentCardToLeft() {
  const from = activeCard.getBoundingClientRect();
  const to = usedStack.getBoundingClientRect();

  const ghost = activeCard.cloneNode(true);
  ghost.classList.add("fly-card");

  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;

  document.body.appendChild(ghost);

  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);

  const animation = ghost.animate(
    [
      { transform: `translate(0px, 0px) rotate(0deg) rotateY(0deg) scale(var(--active-scale))`, opacity: 1 },
      { transform: `translate(${dx * 0.6}px, ${dy * 0.6}px) rotate(-4deg) rotateY(40deg) scale(1.02)`, opacity: 0.85 },
      { transform: `translate(${dx}px, ${dy}px) rotate(-10deg) rotateY(85deg) scale(0.95)`, opacity: 0 }
    ],
    { duration: 420, easing: "cubic-bezier(.2,.9,.2,1)", fill: "forwards" }
  );

  animation.onfinish = () => ghost.remove();
}

// -------------------------------
// Wheel (Canvas drawing + spin)
// -------------------------------
function openWheel(level) {
  currentWheelLevel = level;
  currentWheelItems =
    level === 1 ? wheelLevel1 :
    level === 2 ? wheelLevel2 :
    wheelLevel3;

  wheelTitle.textContent = `Mystery Wheel — Level ${level}`;
  drawWheel(currentWheelItems);

  wheelModal.classList.remove("hidden");
  wheelModal.setAttribute("aria-hidden", "false");

  isSpinning = false;
  wheelCanvas.style.transform = `rotate(${wheelRotation}deg)`;
}

function closeWheelModal() {
  if (isSpinning) return;
  wheelModal.classList.add("hidden");
  wheelModal.setAttribute("aria-hidden", "true");
}

function spinWheel() {
  if (isSpinning) return;
  isSpinning = true;

  const n = currentWheelItems.length;
  const slice = 360 / n;

  const chosenIndex = Math.floor(Math.random() * n);

  const startOffset = -90; // degrees (matches draw start offset)
  const targetCenter = startOffset + (chosenIndex * slice + slice / 2);

  const extraSpins = 6 * 360;

  const finalRotation = wheelRotation + extraSpins - targetCenter;

  wheelRotation = finalRotation;
  wheelCanvas.style.transform = `rotate(${wheelRotation}deg)`;

  setTimeout(() => {
    // Spend points on spin
  spendPointsForWheel(currentWheelLevel);

    // Reveal chosen question
    const chosenText = currentWheelItems[chosenIndex];
    mysteryText.textContent = `L${currentWheelLevel} Mystery: ${chosenText}`;
    showMysteryOverlay();

    isSpinning = false;
    closeWheelModal();

    // Switch after spinning
    switchTurn();
  }, 2700);
}

function drawWheel(items) {
  const n = items.length;

  const w = wheelCanvas.width;
  const h = wheelCanvas.height;
  const cx = w / 2;
  const cy = h / 2;

  const r = Math.min(cx, cy) - 20;

  const colors = [
    "rgba(99,102,241,0.75)",
    "rgba(236,72,153,0.70)",
    "rgba(34,197,94,0.65)",
    "rgba(245,158,11,0.70)",
    "rgba(59,130,246,0.70)",
    "rgba(168,85,247,0.70)",
    "rgba(14,165,233,0.70)",
    "rgba(244,63,94,0.70)"
  ];

  ctx.clearRect(0, 0, w, h);

  const sliceRad = (Math.PI * 2) / n;
  const startOffsetRad = -Math.PI / 2;

  for (let i = 0; i < n; i++) {
    const a0 = startOffsetRad + i * sliceRad;
    const a1 = a0 + sliceRad;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 4;
    ctx.stroke();

    drawSliceText("MYSTERY", cx, cy, r, (a0 + a1) / 2);
  }

  ctx.beginPath();
  ctx.arc(cx, cy, 44, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  ctx.fill();
  ctx.strokeStyle = "rgba(15,23,42,0.10)";
  ctx.lineWidth = 6;
  ctx.stroke();
}

function drawSliceText(text, cx, cy, r, midAngle) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(midAngle);

  const textRadius = r * 0.62;
  ctx.translate(textRadius, 0);

  const isLong = text.length > 65;
  ctx.font = isLong
    ? "bold 17px system-ui, -apple-system, Segoe UI, Roboto, Arial"
    : "bold 20px system-ui, -apple-system, Segoe UI, Roboto, Arial";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const maxWidth = 320;
  const lines = wrapLines(text, maxWidth);

  const shown = lines.slice(0, 3);
  const lineHeight = isLong ? 22 : 24;
  const startY = -(shown.length - 1) * lineHeight / 2;

  const boxW = Math.min(maxWidth, 340);
  const boxH = shown.length * lineHeight + 16;

  ctx.globalAlpha = 0.85;
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  roundRect(ctx, -boxW / 2, startY - 8, boxW, boxH, 16);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(15,23,42,0.92)";

  shown.forEach((ln, idx) => {
    ctx.fillText(ln, 0, startY + idx * lineHeight);
  });

  if (lines.length > 3) {
    ctx.fillText("…", 0, startY + 3 * lineHeight);
  }

  ctx.restore();
}

function wrapLines(text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

// -------------------------------
// Game actions
// -------------------------------
drawBtn.addEventListener("click", () => {
  hideMysteryOverlay();
  if (questions.size === 0) return;

  if (hasDrawnAtLeastOnce) discardCurrentCardToLeft();

  const keys = Array.from(questions.keys());
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const q = questions.get(randomKey);

  const { label, className } = getLevelInfo(randomKey);
  animateLevel(label, className);
  animateQuestion(q);
  startTimer();

  mysteryText.textContent = "";

  canCountThisCard = true;
  countBtn.disabled = false;
  skipBtn.disabled = false;

  countBtn.textContent = "Count it ✅";

  questions.delete(randomKey);
  hasDrawnAtLeastOnce = true;
});

countBtn.addEventListener("click", () => {
  if (!canCountThisCard) return;

  // tiny tap feedback
  vibrate(15);

  const before = progress[activePlayer];

  // award point to ACTIVE player
  progress[activePlayer] = Math.min(3, before + 1);
  updateMetersUI();

  // if they JUST hit 3/3, give a lil celebration
  if (before < 3 && progress[activePlayer] === 3) {
    vibrate(25);

    // optional: pop the active player's meter immediately (even if updateMetersUI already does it)
    const meterEl = activePlayer === 1 ? meterP1 : meterP2;
    meterEl.classList.remove("complete");
    void meterEl.offsetWidth;
    meterEl.classList.add("complete");
    setTimeout(() => meterEl.classList.remove("complete"), 600);
  }

  canCountThisCard = false;
  countBtn.disabled = true;
  skipBtn.disabled = true;

  countBtn.textContent = "Counted ✅";

  switchTurn();
});


skipBtn.addEventListener("click", () => {
  if (!canCountThisCard) return;

  vibrate(8);

  canCountThisCard = false;
  countBtn.disabled = true;
  skipBtn.disabled = true;

  countBtn.textContent = "Skipped";

  switchTurn();
});

// Wheel opens only if active player has enough points
wheel1Btn.addEventListener("click", () => {
  if (progress[activePlayer] < 1) return;
  openWheel(1);
});
wheel2Btn.addEventListener("click", () => {
  if (progress[activePlayer] < 2) return;
  openWheel(2);
});
wheel3Btn.addEventListener("click", () => {
  if (progress[activePlayer] < 3) return;
  openWheel(3);
});

spinBtn.addEventListener("click", () => spinWheel());
closeWheel.addEventListener("click", () => closeWheelModal());

wheelModal.addEventListener("click", (e) => {
  if (e.target === wheelModal) closeWheelModal();
});

// Edit names
nameBtnP1.addEventListener("click", () => editPlayerName(1));
nameBtnP2.addEventListener("click", () => editPlayerName(2));

// -------------------------------
// Init
// -------------------------------
updateMetersUI();
setActivePlayerUI();
updatePlayerNamesUI();
