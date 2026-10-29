// extension/content.js
// Internee Scout: Passive & batch feed harvester for LinkedIn, X, Indeed, Glassdoor & Wuzzuf

(function () {
  console.log("🎯 [Internee Scout] Initialized on:", window.location.hostname);

  const INTERN_REGEX = /(intern|internship|trainee|تدريب|متدرب)/i;
  const EGYPT_SIGNAL_REGEX = /(cairo|egypt|giza|maadi|new cairo|alexandria|october|zayed|smart village|dokki|heliopolis|send your cv|google\.com\/forms|apply)/i;

  const reportedUrls = new Set();

  // Load previously seen URLs from chrome.storage.local
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["reportedUrls"], (res) => {
      if (Array.isArray(res.reportedUrls)) {
        res.reportedUrls.forEach((u) => reportedUrls.add(u));
      }
    });
  }

  // Create UI Toast container in Catppuccin Mocha style
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
    toast.style.background = "#181825";
    toast.style.border = "1px solid #45475a";
    toast.style.borderRadius = "8px";
    toast.style.padding = "10px 14px";
    toast.style.color = "#cdd6f4";
    toast.style.fontFamily = "ui-monospace, monospace";
    toast.style.fontSize = "11px";
    toast.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";
    toast.style.display = "flex";
    toast.style.alignItems = "center";
    toast.style.gap = "8px";
    toast.style.transition = "all 0.3s ease";
    toast.style.pointerEvents = "auto";

    toast.innerHTML = `
      <span style="color:#cba6f7; font-size:14px;">🌱</span>
      <div>
        <div style="font-weight:600; color:#cdd6f4;">${title}</div>
        <div style="color:#a6adc8; font-size:10px; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${message}</div>
      </div>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  }

  // Batch drop items to Internee backend
  async function reportBatchToInternee(items, siteName) {
    if (!items || items.length === 0) return;

    // Filter items already reported in this session
    const freshItems = items.filter((item) => {
      const clean = item.applicationUrl.split("?")[0];
      if (reportedUrls.has(clean)) return false;
      reportedUrls.add(clean);
      return true;
    });

    if (freshItems.length === 0) return;

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["apiUrl", "handle", "spottedCount"], (settings) => {
        const baseUrl = (settings.apiUrl || "http://localhost:3000").replace(/\/+$/, "");
        const userHandle = settings.handle || "@zen_scout";
        const currentCount = (settings.spottedCount || 0) + freshItems.length;

        chrome.storage.local.set({
          reportedUrls: Array.from(reportedUrls).slice(-500),
          spottedCount: currentCount,
        });

        const targetEndpoint = `${baseUrl}/api/community/batch-drop`;

        fetch(targetEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: freshItems,
            handle: userHandle,
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.added > 0) {
              showScoutToast(
                `Internee Scout: Synced ${data.added} internships`,
                `Harvested from ${siteName} (${freshItems[0].title.slice(0, 35)}...)`
              );
            }
          })
          .catch((err) => {
            console.warn("[Internee Scout] Local API sync warning:", err);
          });
      });
    }
  }

  // Report single post (LinkedIn / X feed)
  async function reportSinglePost(postUrl, author, snippet) {
    if (reportedUrls.has(postUrl)) return;
    reportedUrls.add(postUrl);

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["apiUrl", "handle", "spottedCount"], (settings) => {
        const baseUrl = (settings.apiUrl || "http://localhost:3000").replace(/\/+$/, "");
        const userHandle = settings.handle || "@zen_scout";
        const currentCount = (settings.spottedCount || 0) + 1;

        chrome.storage.local.set({
          reportedUrls: Array.from(reportedUrls).slice(-500),
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
              showScoutToast("Internee Scout: Spotted 1 internship post", `${author}: ${snippet.slice(0, 45)}...`);
            }
          })
          .catch((err) => {
            console.warn("[Internee Scout] Single drop connection error:", err);
          });
      });
    }
  }

  // 1. Harvester for Glassdoor (glassdoor.com/Job/*)
  function scanGlassdoor() {
    const jobCards = document.querySelectorAll(
      'li[data-test="jobListing"], div[data-test="jobListing"], div[class*="JobCard_jobCard"]'
    );
    const discovered = [];

    jobCards.forEach((card) => {
      const titleEl = card.querySelector('[data-test="job-title"]') || card.querySelector("a[data-test='job-link']");
      const title = titleEl ? titleEl.innerText.replace(/\s+/g, " ").trim() : "";

      const compEl =
        card.querySelector('[data-test="employer-name"]') ||
        card.querySelector("div[class*='EmployerProfile_compactEmployerName']") ||
        card.querySelector("span[class*='EmployerProfile']");
      const companyName = compEl ? compEl.innerText.replace(/\s+/g, " ").trim() : "Egyptian Employer";

      const locEl = card.querySelector('[data-test="emp-location"]');
      const location = locEl ? locEl.innerText.replace(/\s+/g, " ").trim() : "Cairo, Egypt";

      const linkEl = card.querySelector("a[data-test='job-link']") || card.querySelector("a[href*='/partner/jobListing']");
      let rawHref = linkEl ? linkEl.href : "";

      if (title && rawHref && (INTERN_REGEX.test(title) || card.innerText.includes("Intern"))) {
        let cleanUrl = rawHref.split("?")[0];
        if (cleanUrl.startsWith("/")) cleanUrl = `https://www.glassdoor.com${cleanUrl}`;

        discovered.push({
          title,
          companyName,
          location,
          applicationUrl: cleanUrl,
          source: "glassdoor",
          sourceType: "portal",
        });
      }
    });

    if (discovered.length > 0) {
      reportBatchToInternee(discovered, "Glassdoor Egypt");
    }
  }

  // 2. Harvester for Indeed (eg.indeed.com / indeed.com)
  function scanIndeed() {
    const jobCards = document.querySelectorAll(
      ".job_seen_beacon, div.jobsearch-SerpJobCard, div.cardOutline"
    );
    const discovered = [];

    jobCards.forEach((card) => {
      const titleEl = card.querySelector("h2.jobTitle a, a.jcs-JobTitle");
      const title = titleEl ? titleEl.innerText.replace(/\s+/g, " ").trim() : "";

      const compEl = card.querySelector('[data-testid="company-name"], span.companyName');
      const companyName = compEl ? compEl.innerText.replace(/\s+/g, " ").trim() : "Egyptian Employer";

      const locEl = card.querySelector('[data-testid="text-location"], div.companyLocation');
      const location = locEl ? locEl.innerText.replace(/\s+/g, " ").trim() : "Cairo, Egypt";

      let cleanUrl = "";
      if (titleEl && titleEl.href) {
        cleanUrl = titleEl.href.split("&")[0].split("?")[0];
      } else {
        const dataJk = card.getAttribute("data-jk") || card.closest("[data-jk]")?.getAttribute("data-jk");
        if (dataJk) cleanUrl = `https://eg.indeed.com/viewjob?jk=${dataJk}`;
      }

      if (title && cleanUrl && (INTERN_REGEX.test(title) || card.innerText.includes("Intern"))) {
        discovered.push({
          title,
          companyName,
          location,
          applicationUrl: cleanUrl,
          source: "indeed",
          sourceType: "portal",
        });
      }
    });

    if (discovered.length > 0) {
      reportBatchToInternee(discovered, "Indeed Egypt");
    }
  }

  // 3. Harvester for Wuzzuf (wuzzuf.net)
  function scanWuzzuf() {
    const jobCards = document.querySelectorAll(
      'div[data-testid="job-card"], .css-1gatmva, .css-pkv5jc, div.job-card'
    );
    const discovered = [];

    jobCards.forEach((card) => {
      const titleEl = card.querySelector('h2 a, a[href*="/jobs/p/"]');
      const title = titleEl ? titleEl.innerText.replace(/\s+/g, " ").trim() : "";

      const compEl = card.querySelector('a.css-17s97q8, a[href*="/jobs/careers/"]');
      const companyName = compEl ? compEl.innerText.replace(/\s+/g, " ").trim() : "Egyptian Employer";

      const locEl = card.querySelector(".css-5wys0k, span.job-location");
      const location = locEl ? locEl.innerText.replace(/\s+/g, " ").trim() : "Cairo, Egypt";

      let rawHref = titleEl ? titleEl.getAttribute("href") : "";

      if (title && rawHref && (INTERN_REGEX.test(title) || card.innerText.includes("Intern"))) {
        let cleanUrl = rawHref.split("?")[0];
        if (cleanUrl.startsWith("/")) cleanUrl = `https://wuzzuf.net${cleanUrl}`;

        discovered.push({
          title,
          companyName,
          location,
          applicationUrl: cleanUrl,
          source: "wuzzuf",
          sourceType: "portal",
        });
      }
    });

    if (discovered.length > 0) {
      reportBatchToInternee(discovered, "Wuzzuf Egypt");
    }
  }

  // 4. Feed monitor for LinkedIn (feed posts)
  function scanLinkedIn() {
    const postElements = document.querySelectorAll(
      ".feed-shared-update-v2, .occludable-update, article, div[data-urn*='activity:']"
    );

    postElements.forEach((el) => {
      const text = el.innerText || "";
      if (INTERN_REGEX.test(text) && EGYPT_SIGNAL_REGEX.test(text)) {
        const linkEl =
          el.querySelector("a[href*='/feed/update/urn:li:activity:']") ||
          el.querySelector("a[href*='/posts/']") ||
          el.querySelector("a.app-aware-link[href*='activity']");

        let postUrl = linkEl ? linkEl.href : window.location.href;
        if (postUrl.includes("?")) postUrl = postUrl.split("?")[0];

        const authorEl =
          el.querySelector(".update-components-actor__name") ||
          el.querySelector(".feed-shared-actor__name") ||
          el.querySelector(".update-components-actor__title");

        const author = authorEl ? authorEl.innerText.trim() : "LinkedIn Poster";
        const snippet = text.replace(/\s+/g, " ").trim().slice(0, 120);

        reportSinglePost(postUrl, author, snippet);
      }
    });
  }

  // 5. Feed monitor for X (Twitter)
  function scanX() {
    const tweets = document.querySelectorAll("article[data-testid='tweet']");

    tweets.forEach((tweet) => {
      const tweetTextEl = tweet.querySelector("div[data-testid='tweetText']");
      const text = tweetTextEl ? tweetTextEl.innerText : tweet.innerText || "";

      if (INTERN_REGEX.test(text) && EGYPT_SIGNAL_REGEX.test(text)) {
        const linkEl = tweet.querySelector("a[href*='/status/']");
        let postUrl = linkEl ? `https://x.com${linkEl.getAttribute("href")}` : window.location.href;
        if (postUrl.includes("?")) postUrl = postUrl.split("?")[0];

        const authorEl = tweet.querySelector("div[data-testid='User-Name']");
        const author = authorEl ? authorEl.innerText.split("\n")[0] : "X Author";
        const snippet = text.replace(/\s+/g, " ").trim().slice(0, 120);

        reportSinglePost(postUrl, author, snippet);
      }
    });
  }

  // Router based on current hostname
  function scanCurrentPage() {
    const host = window.location.hostname;
    if (host.includes("glassdoor.com")) {
      scanGlassdoor();
    } else if (host.includes("indeed.com")) {
      scanIndeed();
    } else if (host.includes("wuzzuf.net")) {
      scanWuzzuf();
    } else if (host.includes("linkedin.com")) {
      scanLinkedIn();
    } else if (host.includes("x.com") || host.includes("twitter.com")) {
      scanX();
    }
  }

  // Debounced MutationObserver for dynamic page navigation & scrolling
  let timeoutId = null;
  const observer = new MutationObserver(() => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      scanCurrentPage();
    }, 1200);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Initial scan after page loads
  setTimeout(scanCurrentPage, 2000);
})();
