import { ensureDoc, subscribe, setMovies } from "./db.js";

const addForm = document.getElementById("add-form");
const addInput = document.getElementById("add-input");
const list = document.getElementById("movie-list");
const syncStatus = document.getElementById("sync-status");

const STATUS_ORDER = ["default", "seen", "towatch"];
const STATUS_LABEL = {
  default: "unmarked",
  seen: "seen together",
  towatch: "to watch",
};

let movies = []; // live cache, kept in sync by the Firestore subscription

function render() {
  list.innerHTML = "";

  if (movies.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No movies yet — add the first one above.";
    list.appendChild(empty);
    return;
  }

  movies.forEach((movie) => {
    const item = document.createElement("div");
    item.className = "movie-item" + (movie.status !== "default" ? " " + movie.status : "");

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = movie.title;
    item.appendChild(title);

    const right = document.createElement("div");
    right.className = "row";
    right.style.gap = "10px";

    const statusLabel = document.createElement("span");
    statusLabel.className = "status-label";
    statusLabel.textContent = STATUS_LABEL[movie.status];
    right.appendChild(statusLabel);

    const del = document.createElement("button");
    del.className = "delete-btn";
    del.type = "button";
    del.textContent = "×";
    del.title = "Remove";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      removeMovie(movie.id);
    });
    right.appendChild(del);

    item.appendChild(right);

    item.addEventListener("click", () => cycleStatus(movie.id));
    list.appendChild(item);
  });
}

async function persist(nextMovies) {
  movies = nextMovies;
  render();
  try {
    await setMovies(movies);
  } catch (err) {
    syncStatus.textContent = "couldn't save — check your connection";
  }
}

function cycleStatus(id) {
  const next = movies.map((m) => {
    if (m.id !== id) return m;
    const currentIndex = STATUS_ORDER.indexOf(m.status);
    return { ...m, status: STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length] };
  });
  persist(next);
}

function removeMovie(id) {
  persist(movies.filter((m) => m.id !== id));
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = addInput.value.trim();
  if (!title) return;

  const next = [
    ...movies,
    {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      title,
      status: "default",
    },
  ];
  addInput.value = "";
  persist(next);
});

// --- wire up live sync ---
(async () => {
  try {
    await ensureDoc();
    subscribe(
      (data) => {
        syncStatus.textContent = "synced";
        movies = data.movies || [];
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
