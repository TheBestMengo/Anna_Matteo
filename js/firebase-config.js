// =========================================================
// EDIT THIS FILE — paste in your own Firebase project's config.
// Get this from: Firebase Console → Project settings → General
// → "Your apps" → the web app (</> icon) → SDK setup and config.
// =========================================================

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

// The address of your shared document inside Firestore.
// Change "us" to a long, random string (e.g. mash your keyboard for 20
// characters) so a stranger can't guess it and read or edit your data.
// It only needs to be set once — both devices just need to have the
// same value here.
export const SPACE_ID = "us-CHANGE-THIS-TO-SOMETHING-RANDOM";
