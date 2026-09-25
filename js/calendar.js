import { ensureDoc, subscribe, setEvent } from "./db.js";

const monthLabel = document.getElementById("month-label");
const daysGrid = document.getElementById("days-grid");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const syncStatus = document.getElementById("sync-status");

const overlay = document.getElementById("modal-overlay");
const modalDate = document.getElementById("modal-date");
const modalTextarea = document.getElementById("modal-textarea");
const modalSave = document.getElementById("modal-save");
const modalCancel = document.getElementById("modal-cancel");
const modalClear = document.getElementById("modal-clear");

const today = new Date();
today.setHours(0, 0, 0, 0);

let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); // 0-indexed
let activeKey = null;
let events = {}; // live cache, kept in sync by the Firestore subscription

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function render() {
  monthLabel.textContent = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  daysGrid.innerHTML = "";

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  // Monday-first weekday index: 0 = Mon ... 6 = Sun
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < startOffset; i++) {
    const filler = document.createElement("div");
    filler.className = "day-box empty";
    daysGrid.appendChild(filler);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cellDate = new Date(viewYear, viewMonth, d);
    cellDate.setHours(0, 0, 0, 0);
    const key = dateKey(viewYear, viewMonth, d);

    const box = document.createElement("button");
    box.type = "button";
    box.className = "day-box";

    if (cellDate.getTime() < today.getTime()) {
      box.classList.add("past");
    } else if (cellDate.getTime() === today.getTime()) {
      box.classList.add("today");
    } else {
      box.classList.add("future");
    }

    const num = document.createElement("span");
    num.className = "num";
    num.textContent = String(d);
    box.appendChild(num);

    if (events[key]) {
      const evt = document.createElement("span");
      evt.className = "evt";
      evt.textContent = events[key];
      box.appendChild(evt);
    }

    box.addEventListener("click", () => openModal(key, cellDate));
    daysGrid.appendChild(box);
  }
}

function openModal(key, dateObj) {
  activeKey = key;
  modalDate.textContent = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  modalTextarea.value = events[key] || "";
  overlay.classList.add("open");
  modalTextarea.focus();
}

function closeModal() {
  overlay.classList.remove("open");
  activeKey = null;
}

modalSave.addEventListener("click", async () => {
  if (!activeKey) return;
  const text = modalTextarea.value.trim();
  closeModal();
  try {
    await setEvent(activeKey, text);
  } catch (err) {
    syncStatus.textContent = "couldn't save — check your connection";
  }
});

modalClear.addEventListener("click", async () => {
  if (!activeKey) return;
  const key = activeKey;
  closeModal();
  try {
    await setEvent(key, "");
  } catch (err) {
    syncStatus.textContent = "couldn't save — check your connection";
  }
});

modalCancel.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});

prevBtn.addEventListener("click", () => {
  viewMonth--;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear--;
  }
  render();
});

nextBtn.addEventListener("click", () => {
  viewMonth++;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear++;
  }
  render();
});

// --- wire up live sync ---
(async () => {
  try {
    await ensureDoc();
    subscribe(
      (data) => {
        syncStatus.textContent = "synced";
        events = data.events || {};
        render();
      },
      () => {
        syncStatus.textContent = "offline — showing last saved";
      }
    );
  } catch (err) {
    console.error(err);
    syncStatus.textContent = "couldn't connect — check firebase-config.js";
    render();
  }
})();
