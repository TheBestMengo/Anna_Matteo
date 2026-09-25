/* =========================================================
   EDIT THIS SECTION — make it yours
   ========================================================= */

// The password that unlocks the site. Change this to something
// only the two of you know.
const PASSWORD = "changeme";

// A hint is shown after each wrong attempt, one at a time, in order.
// Write your own inside jokes / clues here. As many as you like.
const HINTS = [
  "Hint: think about where we met.",
  "Hint: it has something to do with our song.",
  "Hint: the nickname only you use for me.",
  "Hint: you know this one — think harder.",
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
  errorEl.textContent = "Not quite — try again.";
  envelope.classList.remove("shake");
  // force reflow so the animation can replay
  void envelope.offsetWidth;
  envelope.classList.add("shake");

  if (attempts < HINTS.length) {
    hintEl.textContent = HINTS[attempts];
  } else {
    hintEl.textContent = "That was all the hints — ask them directly!";
  }
  attempts++;

  input.value = "";
  input.focus();
});
