import { ensureDoc, subscribe, setNextDate } from "./db.js";

const daysDisplay = document.getElementById("days-display");
const hoursDisplay = document.getElementById("hours-display");
const minutesDisplay = document.getElementById("minutes-display");
const secondsDisplay = document.getElementById("seconds-display");
const eyebrow = document.getElementById("counter-eyebrow");
const targetLabel = document.getElementById("target-date-label");
const syncStatus = document.getElementById("sync-status");

const toggleBtn = document.getElementById("toggle-date-btn");
const dateForm = document.getElementById("date-form");
const dateInput = document.getElementById("date-input");
const cancelBtn = document.getElementById("cancel-date-btn");

const logoutLink = document.getElementById("logout-link");

let currentTarget = null; // Date object or null
let timerId = null;

function formatTargetLabel(date) {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return "Marked for " + date.toLocaleDateString(undefined, options);
}

function tick() {
  if (!currentTarget || isNaN(currentTarget.getTime())) {
    daysDisplay.innerHTML = '— <span class="unit">days</span>';
    hoursDisplay.textContent = "00";
    minutesDisplay.textContent = "00";
    secondsDisplay.textContent = "00";
    eyebrow.textContent = "no date set yet";
    targetLabel.textContent = "Pick the next day you'll see each other.";
    return;
  }

  const now = new Date();
  const diff = currentTarget.getTime() - now.getTime();

  targetLabel.textContent = formatTargetLabel(currentTarget);

  if (diff <= 0) {
    eyebrow.textContent = "today's the day";
    daysDisplay.innerHTML = '0 <span class="unit">days</span>';
    hoursDisplay.textContent = "00";
    minutesDisplay.textContent = "00";
    secondsDisplay.textContent = "00";
    return;
  }

  eyebrow.textContent = "until we're together again";

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  daysDisplay.innerHTML = days + ' <span class="unit">days</span>';
  hoursDisplay.textContent = String(hours).padStart(2, "0");
  minutesDisplay.textContent = String(minutes).padStart(2, "0");
  secondsDisplay.textContent = String(seconds).padStart(2, "0");
}

function startTicking() {
  if (timerId) clearInterval(timerId);
  tick();
  timerId = setInterval(tick, 1000);
}

toggleBtn.addEventListener("click", () => {
  if (currentTarget && !isNaN(currentTarget.getTime())) {
    dateInput.value = currentTarget.toISOString().slice(0, 10);
  }
  dateForm.classList.add("open");
  toggleBtn.style.display = "none";
});

cancelBtn.addEventListener("click", () => {
  dateForm.classList.remove("open");
  toggleBtn.style.display = "inline-flex";
});

dateForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!dateInput.value) return;
  dateForm.classList.remove("open");
  toggleBtn.style.display = "inline-flex";
  try {
    await setNextDate(dateInput.value);
  } catch (err) {
    syncStatus.textContent = "couldn't save — check your connection";
  }
});

logoutLink.addEventListener("click", (e) => {
  e.preventDefault();
  sessionStorage.removeItem("us_unlocked");
  window.location.href = "index.html";
});

// --- wire up live sync ---
(async () => {
  try {
    await ensureDoc();
    subscribe(
      (data) => {
        syncStatus.textContent = "synced";
        currentTarget = data.nextDate ? new Date(data.nextDate) : null;
        startTicking();
      },
      () => {
        syncStatus.textContent = "offline — showing last saved";
      }
    );
  } catch (err) {
    console.error(err);
    syncStatus.textContent = "couldn't connect — check firebase-config.js";
    startTicking();
  }
})();
