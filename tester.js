// ==================================================
// Question Night — Game Logic (clean + readable)
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
// DOM
// -------------------------------

const drawButton   = document.getElementById("drawBtn");
const questionText = document.getElementById("question");
const levelText    = document.getElementById("level");
const timerText    = document.getElementById("timer");
const card         = document.getElementById("qCard")
const activeCard   = document.getElementById("activeCard");
const usedStack    = document.getElementById("usedStack");
let hasDrawnAtLeastOnce = false;
const cardSound    = document.getElementById("cardSound");
const soundToggle  = document.getElementById("soundToggle");

// -------------------------------
// Timer state
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

function setGameCompleteUI() {
  clearInterval(timerInterval);
  timerText.textContent = "";

  drawButton.disabled = true;
  drawButton.textContent = "All done! ✅";

  questionText.textContent = "Thanks for playing! 💛";

  levelText.className = "complete";
  levelText.textContent = "Level: Complete";
}

function getLevelInfo(questionNumber) {
  if (questionNumber <= 10) return { label: "Perception", className: "perception" };
  if (questionNumber <= 20) return { label: "Connection", className: "connection" };
  return { label: "Reflection", className: "reflection" };
}

function animateLevel(label, className) {
  // animate out
  levelText.className = "";
  levelText.classList.add("bump");

  // swap text + color and animate in
  setTimeout(() => {
    levelText.textContent = `Level: ${label}`;
    levelText.className = className;
  }, 200);
}

function animateQuestion(text) {
  activeCard.classList.remove("deal");
  void activeCard.offsetWidth; // restart animation
  activeCard.classList.add("deal");

  setTimeout(() => {
    questionText.textContent = text;
  }, 120);
}

function discardCurrentCardToLeft() {
  const from = activeCard.getBoundingClientRect();
  const to = usedStack.getBoundingClientRect();

  // Create a "ghost" copy of the card
  const ghost = activeCard.cloneNode(true);
  ghost.classList.add("fly-card");

  // Position it exactly over the active card
  ghost.style.left = `${from.left}px`;
  ghost.style.top = `${from.top}px`;
  ghost.style.width = `${from.width}px`;
  ghost.style.height = `${from.height}px`;

  document.body.appendChild(ghost);

  // Compute travel distance (center -> center)
  const dx = (to.left + to.width / 2) - (from.left + from.width / 2);
  const dy = (to.top + to.height / 2) - (from.top + from.height / 2);

  // Animate: slide left + slight rotate + flip + fade
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

function playCardSound() {
  if (!soundToggle.checked) return;

  cardSound.currentTime = 0;
  cardSound.volume = 0.25; // soft + cozy
  cardSound.play();
}

// -------------------------------
// Main action: draw a question
// -------------------------------

drawButton.addEventListener("click", () => {
  // If no questions left, finish and stop
  if (questions.size === 0) {
    setGameCompleteUI();
    return;
  }

  // Send current card to the left pile (only after first draw)
  if (hasDrawnAtLeastOnce) discardCurrentCardToLeft();

  // Pick a random remaining question
  const keys = Array.from(questions.keys());
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const question = questions.get(randomKey);

  // Update UI (level + deal + timer + sound)
  const { label, className } = getLevelInfo(randomKey);
  animateLevel(label, className);
//   playCardSound();
  animateQuestion(question);
  startTimer();

  // Remove question to prevent repeats
  questions.delete(randomKey);
  hasDrawnAtLeastOnce = true;

  // If that was the last question, finish the game
  if (questions.size === 0) {
    setGameCompleteUI();
  }
});
