// extension/content.js
// Internee Scout: Passive, human-speed feed monitor for LinkedIn & X (Twitter)

(function () {
  console.log("🎯 [Internee Scout] Initialized on feed.");

  const INTERN_REGEX = /(intern|internship|تدريب|متدرب)/i;
  const EGYPT_SIGNAL_REGEX = /(cairo|egypt|giza|maadi|new cairo|alexandria|october|zayed|send your cv|google\.com\/forms|apply)/i;

  const reportedUrls = new Set();

  // Load previously seen URLs from chrome.storage.local
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["reportedUrls"], (res) => {
      if (Array.isArray(res.reportedUrls)) {
        res.reportedUrls.forEach((u) => reportedUrls.add(u));
      }
    });
  }

  // Create UI Toast container
  let toastContainer = null;
  function showScoutToast(title, message) {
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.id = "internee-scout-toast-container";
      toastContainer.style.position = "fixed";
      toastContainer.style.bottom = "20px";
      toastContainer.style.right = "20px";
      toastContainer.style.zIndex = "9999999";
      toastContainer.style.display = "flex";
      toastContainer.style.flexDirection = "column";
      toastContainer.style.gap = "8px";
      toastContainer.style.pointerEvents = "none";
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement("div");
    toast.style.background = "#161614";
    toast.style.border = "1px solid #262624";
    toast.style.borderRadius = "8px";
    toast.style.padding = "10px 14px";
    toast.style.color = "#ECECEC";
    toast.style.fontFamily = "ui-monospace, monospace";
    toast.style.fontSize = "11px";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "8px";
    toast.style.transition = "all 0.3s ease";
    toast.style.pointerEvents = "auto";

    toast.innerHTML = `
      <span style="color:#D97757; font-size:14px;">🎯</span>
      <div>
        <div style="font-weight:600; color:#ECECEC;">${title}</div>
        <div style="color:#8E8D8A; font-size:10px; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${message}</div>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Report post to Internee backend
  async function reportPostToInternee(postUrl, author, snippet) {
    if (reportedUrls.has(postUrl)) return;
    reportedUrls.add(postUrl);

    // Persist to storage
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["apiUrl", "handle", "spottedCount"], (settings) => {
        const baseUrl = (settings.apiUrl || "http://localhost:3000").replace(/\/+$/, "");
        const userHandle = settings.handle || "@feed_scout";
        const currentCount = (settings.spottedCount || 0) + 1;

        chrome.storage.local.set({
          reportedUrls: Array.from(reportedUrls).slice(-200),
          spottedCount: currentCount,
        });

        const targetEndpoint = `${baseUrl}/api/community/quick-drop`;

        fetch(targetEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: postUrl,
            handle: userHandle,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              showScoutToast("Internee Scout: Spotted 1 new internship post", `${author}: ${snippet.slice(0, 45)}...`);
            }
          })
          .catch((err) => {
            console.warn("[Internee Scout] Could not connect to Internee local API:", err);
          });
      });
    }
  }

  // Scan LinkedIn feed posts
  function scanLinkedIn() {
    const postElements = document.querySelectorAll(
      ".feed-shared-update-v2, .occludable-update, article, div[data-urn*='activity:']"
    );

    postElements.forEach((el) => {
      const text = el.innerText || "";
      if (INTERN_REGEX.test(text) && EGYPT_SIGNAL_REGEX.test(text)) {
        // Find permalink
        const linkEl =
          el.querySelector("a[href*='/feed/update/urn:li:activity:']") ||
          el.querySelector("a[href*='/posts/']") ||
          el.querySelector("a.app-aware-link[href*='activity']");

        let postUrl = linkEl ? linkEl.href : window.location.href;
        if (postUrl.includes("?")) postUrl = postUrl.split("?")[0];

        // Find author name
        const authorEl =
          el.querySelector(".update-components-actor__name") ||
          el.querySelector(".feed-shared-actor__name") ||
          el.querySelector(".update-components-actor__title");

        const author = authorEl ? authorEl.innerText.trim() : "LinkedIn Poster";
        const snippet = text.replace(/\s+/g, " ").trim().slice(0, 120);

        reportPostToInternee(postUrl, author, snippet);
      }
    });
  }

  // Scan X (Twitter) tweets
  function scanX() {
    const tweets = document.querySelectorAll("article[data-testid='tweet']");

    tweets.forEach((tweet) => {
      const tweetTextEl = tweet.querySelector("div[data-testid='tweetText']");
      const text = tweetTextEl ? tweetTextEl.innerText : tweet.innerText || "";

      if (INTERN_REGEX.test(text) && EGYPT_SIGNAL_REGEX.test(text)) {
        // Find permalink
        const linkEl = tweet.querySelector("a[href*='/status/']");
        let postUrl = linkEl ? `https://x.com${linkEl.getAttribute("href")}` : window.location.href;
        if (postUrl.includes("?")) postUrl = postUrl.split("?")[0];

        // Find author name
        const authorEl = tweet.querySelector("div[data-testid='User-Name']");
        const author = authorEl ? authorEl.innerText.split("\n")[0] : "X Author";
        const snippet = text.replace(/\s+/g, " ").trim().slice(0, 120);

        reportPostToInternee(postUrl, author, snippet);
      }
    });
  }

  // Periodic and Mutation-based scanning
  function scanFeed() {
    const host = window.location.hostname;
    if (host.includes("linkedin.com")) {
      scanLinkedIn();
    } else if (host.includes("x.com") || host.includes("twitter.com")) {
      scanX();
    }
  }

  // Debounced MutationObserver
  let timeoutId = null;
  const observer = new MutationObserver(() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      scanFeed();
    }, 1200); // passive, human-speed scan interval
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan after load
  setTimeout(scanFeed, 2000);
})();
