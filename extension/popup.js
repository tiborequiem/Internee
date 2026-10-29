// extension/popup.js
// Settings controller for Internee Scout extension

document.addEventListener("DOMContentLoaded", () => {
  const apiUrlInput = document.getElementById("apiUrl");
  const handleInput = document.getElementById("handle");
  const spottedCountEl = document.getElementById("spottedCount");
  const saveBtn = document.getElementById("saveBtn");
  const savedStatus = document.getElementById("savedStatus");
  const openDashboard = document.getElementById("openDashboard");

  // Load current settings from chrome.storage.local
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["apiUrl", "handle", "spottedCount"], (res) => {
      apiUrlInput.value = res.apiUrl || "http://localhost:3000";
      handleInput.value = res.handle || "@feed_scout";
      spottedCountEl.textContent = res.spottedCount || 0;
    });
  } else {
    apiUrlInput.value = "http://localhost:3000";
    handleInput.value = "@feed_scout";
    spottedCountEl.textContent = "0";
  }

  // Save settings
  saveBtn.addEventListener("click", () => {
    const apiUrl = apiUrlInput.value.trim() || "http://localhost:3000";
    const handle = handleInput.value.trim() || "@feed_scout";

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ apiUrl, handle }, () => {
        savedStatus.textContent = "Settings saved";
        setTimeout(() => {
          savedStatus.textContent = "";
        }, 2000);
      });
    } else {
      savedStatus.textContent = "Settings saved";
      setTimeout(() => {
        savedStatus.textContent = "";
      }, 2000);
    }
  });

  // Open Dashboard link
  openDashboard.addEventListener("click", (e) => {
    e.preventDefault();
    const url = apiUrlInput.value.trim() || "http://localhost:3000";
    if (typeof chrome !== "undefined" && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank");
    }
  });
});
