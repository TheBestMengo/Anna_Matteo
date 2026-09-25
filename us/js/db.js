// Thin wrapper around Firestore so the page scripts don't need to
// touch the SDK directly. Loaded as an ES module straight from a CDN —
// no npm install, no build step.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  deleteField,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { firebaseConfig, SPACE_ID } from "./firebase-config.js";

const DEFAULT_DATA = {
  nextDate: null,
  events: {},
  movies: [],
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "spaces", SPACE_ID);

// Makes sure the shared document exists so later updates don't fail.
// Safe to call from every page — it's a no-op if the doc is already there.
export async function ensureDoc() {
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    await setDoc(docRef, DEFAULT_DATA);
  }
}

// Calls `callback(data)` immediately, then again every time the shared
// document changes anywhere (this tab, the other device, etc).
// Returns an unsubscribe function.
export function subscribe(callback, onError) {
  return onSnapshot(
    docRef,
    (snap) => callback(snap.exists() ? snap.data() : DEFAULT_DATA),
    (err) => {
      console.error("Sync error:", err);
      if (onError) onError(err);
    }
  );
}

export async function setNextDate(dateStr) {
  await setDoc(docRef, { nextDate: dateStr }, { merge: true });
}

export async function setEvent(dateKey, text) {
  const patch = text
    ? { [`events.${dateKey}`]: text }
    : { [`events.${dateKey}`]: deleteField() };
  await updateDoc(docRef, patch);
}

export async function setMovies(movies) {
  await setDoc(docRef, { movies }, { merge: true });
}
