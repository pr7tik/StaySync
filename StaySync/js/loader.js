/* =====================================================================
   SyncStay — ENTRY LOADER DISMISS CONTROLLER
   Matches homepage 0.55s fill duration and smooth 0.45s fade out
   ===================================================================== */

(function bootstrapSyncStay() {
  const loader = document.getElementById('page-loader');

  // Initialize store and auth controller
  try {
    SyncStayStore.init();
    SyncStayAuth.init((user) => SyncStayApp.mount(user));
  } catch (err) {
    console.error('Initialization error:', err);
  }

  // Preload essential icons & fonts safely
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    try {
      window.lucide.createIcons();
    } catch {
      // Gracefully handle icon initialization
    }
  }

  // Match the homepage animation duration (~550ms) then reveal login/dashboard
  setTimeout(() => {
    SyncStayAuth.revealAfterLoading();
    if (window.SyncStayUI && typeof window.SyncStayUI.refreshIcons === 'function') {
      window.SyncStayUI.refreshIcons();
    }

    if (loader) {
      loader.classList.add('is-hidden');
      setTimeout(() => loader.remove(), 480);
    }
  }, 580);
})();