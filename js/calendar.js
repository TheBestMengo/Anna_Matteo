import { ensureDoc, subscribe, addEvent, removeEvent } from "./db.js";

const monthLabel = document.getElementById("month-label");
const daysGrid = document.getElementById("days-grid");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");
const syncStatus = document.getElementById("sync-status");

const overlay = document.getElementById("modal-overlay");
const modalDate = document.getElementById("modal-date");
const eventList = document.getElementById("event-list");
const addEventForm = document.getElementById("add-event-form");
const addEventInput = document.getElementById("add-event-input");
const modalClose = document.getElementById("modal-close");

const today = new Date();
today.setHours(0, 0, 0, 0);

let viewYear = today.getFullYear();
let viewMonth = today.getMonth(); // 0-indexed
let activeKey = null;
let events = {}; // live cache, kept in sync by the Firestore subscription — { dateKey: [{id, text}, ...] }

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

// Older data (from before this page supported multiple events per day)
// stored a single string per day instead of an array — normalize it.
function eventsFor(key) {
  const raw = events[key];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  return [{ id: "legacy", text: raw }];
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
    const dayEvents = eventsFor(key);

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

    if (dayEvents.length > 0) {
      const evt = document.createElement("span");
      evt.className = "evt";
      evt.textContent =
        dayEvents.length === 1
          ? dayEvents[0].text
          : dayEvents.map((e) => e.text).join(" · ");
      box.appendChild(evt);
    }

    box.addEventListener("click", () => openModal(key, cellDate));
    daysGrid.appendChild(box);
  }
}

function renderEventList() {
  eventList.innerHTML = "";
  const dayEvents = eventsFor(activeKey);

  if (dayEvents.length === 0) {
    const empty = document.createElement("div");
    empty.className = "event-empty";
    empty.textContent = "Nothing here yet — add the first one below.";
    eventList.appendChild(empty);
    return;
  }

  dayEvents.forEach((entry) => {
    const item = document.createElement("div");
    item.className = "event-item";

    const text = document.createElement("span");
    text.className = "text";
    text.textContent = entry.text;
    item.appendChild(text);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "delete-btn";
    del.title = "Remove";
    del.textContent = "×";
    del.addEventListener("click", async () => {
      try {
        await removeEvent(activeKey, entry);
      } catch (err) {
        syncStatus.textContent = "couldn't save — check your connection";
      }
    });
    item.appendChild(del);

    eventList.appendChild(item);
  });
}

function openModal(key, dateObj) {
  activeKey = key;
  modalDate.textContent = dateObj.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  addEventInput.value = "";
  renderEventList();
  overlay.classList.add("open");
  addEventInput.focus();
}

function closeModal() {
  overlay.classList.remove("open");
  activeKey = null;
}

addEventForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = addEventInput.value.trim();
  if (!text || !activeKey) return;
  addEventInput.value = "";
  try {
    await addEvent(activeKey, text);
  } catch (err) {
    syncStatus.textContent = "couldn't save — check your connection";
  }
  addEventInput.focus();
});

modalClose.addEventListener("click", closeModal);
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
        // Keep the open modal's list current if a change comes in
        // from the other device while it's open.
        if (activeKey && overlay.classList.contains("open")) {
          renderEventList();
        }
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
