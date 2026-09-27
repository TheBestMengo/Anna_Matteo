/* =========================================================
   EDIT THIS SECTION — make it yours
   ========================================================= */

// The password that unlocks the site. Change this to something
// only the two of you know.
const PASSWORD = "cipollinottolo";

// A hint is shown after each wrong attempt, one at a time, in order.
// Write your own inside jokes / clues here. As many as you like.
const HINTS = [
  "Hint: Think of how we talked to each other at the beginning.",
  "Hint: It has something to do with fear and love.",
  "Hint: It has something to do with snakes.",
  "Hint: It is the opposite to a word concerning BEARS!",
  "You are really SCARSA, you know?",
  "BRUH",
  "Hint: Orsottopotto mio, what nickname did you use for me at the very beginning?"
];

/* ========================================================= */

const form = document.getElementById("password-form");
const input = document.getElementById("password-input");
const errorEl = document.getElementById("error");
const hintEl = document.getElementById("hint");
const envelope = document.getElementById("envelope");

let attempts = 0;

// If already unlocked this session, skip straight to home.
if (sessionStorage.getItem("us_unlocked") === "true") {
  window.location.href = "home.html";
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = input.value.trim();

  if (value.length > 0 && value.toLowerCase() === PASSWORD.toLowerCase()) {
    sessionStorage.setItem("us_unlocked", "true");
    errorEl.textContent = "";
    envelope.style.opacity = "0";
    envelope.style.transition = "opacity 0.3s ease";
    setTimeout(() => {
      window.location.href = "home.html";
    }, 250);
    return;
  }

  // Wrong password
  errorEl.textContent = "AZZ! Not quite — try again.";
  envelope.classList.remove("shake");
  // force reflow so the animation can replay
  void envelope.offsetWidth;
  envelope.classList.add("shake");

  if (attempts < HINTS.length) {
    hintEl.textContent = HINTS[attempts];
  } else {
    hintEl.textContent = "That was all the hints :( — ask Matteo directly!";
  }
  attempts++;

  input.value = "";
  input.focus();
});
