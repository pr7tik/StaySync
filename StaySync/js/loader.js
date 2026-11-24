/* =====================================================================
   STAYSYNC — ANIMATED INITIAL LOADING SEQUENCE (UPGRADED)
   Smoothly interpolates progress, initializes data, preloads assets
   gracefully, enforces a minimum 2-second display, then reveals Login
   ===================================================================== */

(function bootstrapStaySync() {
  const loadingScreen = document.getElementById("loading-screen");
  const progressBar = document.getElementById("loader-progress-bar");
  const progressTrack = document.querySelector(".loader-progress-track");
  const statusText = document.getElementById("loader-status-text");
  const percentEl = document.getElementById("loader-percent");

  let displayedPct = 0;
  let targetPct = 0;
  let rafId = null;

  function animateProgress() {
    if (displayedPct < targetPct) {
      const step = Math.max(0.6, (targetPct - displayedPct) * 0.12);
      displayedPct = Math.min(targetPct, displayedPct + step);
      const rounded = Math.round(displayedPct);
      progressBar.style.width = `${displayedPct.toFixed(1)}%`;
      if (percentEl) percentEl.textContent = `${rounded}%`;
      if (progressTrack) progressTrack.setAttribute("aria-valuenow", String(rounded));
    }
    if (displayedPct < 100) {
      rafId = requestAnimationFrame(animateProgress);
    }
  }

  function setTargetProgress(pct, label) {
    targetPct = Math.max(targetPct, Math.min(100, pct));
    if (label && statusText) statusText.textContent = label;
    if (!rafId) rafId = requestAnimationFrame(animateProgress);
  }

  function preloadFonts() {
    if (!document.fonts || !document.fonts.ready) return Promise.resolve();
    return Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 1800))
    ]);
  }

  function preloadEssentialAssets() {
    const iconReady = new Promise((resolve) => {
      if (window.lucide) {
        try {
          window.lucide.createIcons();
        } catch {
          // Handle icon failure gracefully
        }
      }
      resolve();
    });

    const pageReady =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise((resolve) => {
            window.addEventListener("load", resolve, { once: true });
            setTimeout(resolve, 2500);
          });

    return Promise.allSettled([preloadFonts(), iconReady, pageReady]);
  }

  async function runStartupSequence() {
    const MIN_DISPLAY_MS = 2200;
    const startTime = performance.now();

    setTargetProgress(22, "Preparing your workspace...");

    // Step 1: Initialize centralized demo data & LocalStorage store
    try {
      StaySyncStore.init();
      StaySyncAuth.init((user) => StaySyncApp.mount(user));
    } catch (err) {
      console.error("Initialization error:", err);
    }
    setTargetProgress(58, "Preparing your workspace...");

    // Step 2: Preload fonts, icons, and essential assets gracefully
    await preloadEssentialAssets();
    setTargetProgress(86, "Preparing your workspace...");

    // Step 3: Guarantee minimum display duration so animations complete smoothly
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);

    await new Promise((resolve) => setTimeout(resolve, remaining));
    setTargetProgress(100, "Workspace ready");

    // Allow the counter & progress bar to cleanly reach 100%
    await new Promise((resolve) => setTimeout(resolve, 280));
    if (rafId) cancelAnimationFrame(rafId);
    progressBar.style.width = "100%";
    if (percentEl) percentEl.textContent = "100%";

    // Step 4: Reveal Login/Registration (or persisted session) behind the fading loader
    StaySyncAuth.revealAfterLoading();
    StaySyncUI.refreshIcons();

    requestAnimationFrame(() => {
      loadingScreen.classList.add("is-leaving");
      setTimeout(() => {
        loadingScreen.remove();
      }, 580);
    });
  }

  runStartupSequence();
})();