// Include this at the top of every protected page.
// If the site hasn't been unlocked this session, send back to the gate.
if (sessionStorage.getItem("us_unlocked") !== "true") {
  window.location.href = "index.html";
}
