/* =====================================================================
   SyncStay — SHARED UI COMPONENTS
   Toasts, reusable modals, confirm dialogs, badges & escaping helpers
   ===================================================================== */

const SyncStayUI = (() => {
  const modalOverlay = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalSubtitle = document.getElementById("modal-subtitle");
  const modalBody = document.getElementById("modal-body");
  const modalCloseBtn = document.getElementById("modal-close-btn");

  const confirmOverlay = document.getElementById("confirm-overlay");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
  const confirmOkBtn = document.getElementById("confirm-ok-btn");
  const confirmCloseBtn = document.getElementById("confirm-close-btn");

  const toastContainer = document.getElementById("toast-container");

  let confirmCallback = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      try {
        window.lucide.createIcons();
      } catch (err) {
        console.warn("Lucide icon refresh skipped:", err);
      }
    }
  }

  function getInitials(name) {
    const parts = String(name || "U")
      .trim()
      .split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function badgeClassFor(value) {
    const v = String(value || "").toLowerCase();
    if (
      [
        "available",
        "vacant & clean",
        "inspected",
        "clean",
        "completed",
        "verified",
        "passed",
        "resolved",
        "low"
      ].includes(v)
    ) {
      return "badge-success";
    }
    if (
      [
        "cleaning",
        "in progress",
        "assigned",
        "on duty",
        "medium",
        "on break",
        "requires re-cleaning"
      ].includes(v)
    ) {
      return "badge-accent";
    }
    if (["vacant & dirty", "dirty", "pending", "reported", "high"].includes(v)) {
      return "badge-warning";
    }
    if (["under maintenance", "maintenance", "failed", "critical", "off duty"].includes(v)) {
      return "badge-danger";
    }
    if (["occupied", "administrator", "housekeeping manager"].includes(v)) {
      return "badge-info";
    }
    return "badge-neutral";
  }

  function renderBadge(label) {
    return `<span class="badge ${badgeClassFor(label)}">${escapeHtml(label)}</span>`;
  }

  /* ---------- Toast Notifications ---------- */

  function toast(message, type = "info") {
    const el = document.createElement("div");
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(el);

    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      el.style.transition = "all 0.2s ease";
      setTimeout(() => el.remove(), 220);
    }, 3400);
  }

  /* ---------- Reusable Modal ---------- */

  function openModal({ title, subtitle = "", html, onRender = null }) {
    modalTitle.textContent = title;
    modalSubtitle.textContent = subtitle;
    modalSubtitle.classList.toggle("hidden", !subtitle);
    modalBody.innerHTML = html;
    modalOverlay.classList.remove("hidden");
    refreshIcons();
    if (typeof onRender === "function") onRender(modalBody);
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
    modalBody.innerHTML = "";
  }

  modalCloseBtn.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* ---------- Confirmation Dialog ---------- */

  function confirm({ title = "Confirm Action", message, confirmLabel = "Confirm", onConfirm }) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmOkBtn.textContent = confirmLabel;
    confirmCallback = onConfirm;
    confirmOverlay.classList.remove("hidden");
    refreshIcons();
  }

  function closeConfirm() {
    confirmOverlay.classList.add("hidden");
    confirmCallback = null;
  }

  confirmCancelBtn.addEventListener("click", closeConfirm);
  confirmCloseBtn.addEventListener("click", closeConfirm);
  confirmOverlay.addEventListener("click", (e) => {
    if (e.target === confirmOverlay) closeConfirm();
  });
  confirmOkBtn.addEventListener("click", () => {
    const fn = confirmCallback;
    closeConfirm();
    if (typeof fn === "function") fn();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!confirmOverlay.classList.contains("hidden")) closeConfirm();
      else if (!modalOverlay.classList.contains("hidden")) closeModal();
    }
  });

  return {
    escapeHtml,
    refreshIcons,
    getInitials,
    renderBadge,
    toast,
    openModal,
    closeModal,
    confirm
  };
})();