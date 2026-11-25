/* =====================================================================
   SyncStay — AUTHENTICATION & LOGIN / REGISTRATION CONTROLLER
   Preserves all authentication logic, demo accounts & session storage
   ===================================================================== */

const SyncStayAuth = (() => {
  const authScreen = document.getElementById("auth-screen");
  const appShell = document.getElementById("app-shell");

  const tabLogin = document.getElementById("auth-tab-login");
  const tabRegister = document.getElementById("auth-tab-register");
  const panelLogin = document.getElementById("auth-panel-login");
  const panelRegister = document.getElementById("auth-panel-register");
  const switchToRegister = document.getElementById("switch-to-register");
  const switchToLogin = document.getElementById("switch-to-login");

  const loginForm = document.getElementById("login-form");
  const loginUserIdInput = document.getElementById("login-userid");
  const loginPasswordInput = document.getElementById("login-password");

  const registerForm = document.getElementById("register-form");
  const regUsernameInput = document.getElementById("register-username");
  const regUserIdInput = document.getElementById("register-userid");
  const regPasswordInput = document.getElementById("register-password");

  const forgotPasswordLink = document.getElementById("forgot-password-link");

  let onAuthenticatedCallback = null;

  function switchMode(mode) {
    const isRegister = mode === "register";
    if (tabLogin && tabRegister && panelLogin && panelRegister) {
      tabLogin.classList.toggle("active", !isRegister);
      tabLogin.setAttribute("aria-selected", String(!isRegister));
      tabRegister.classList.toggle("active", isRegister);
      tabRegister.setAttribute("aria-selected", String(isRegister));

      panelLogin.classList.toggle("active", !isRegister);
      panelRegister.classList.toggle("active", isRegister);
    }
  }

  function init(onAuthenticated) {
    onAuthenticatedCallback = onAuthenticated;

    // Smooth tab & link switching between Login and Registration
    if (tabLogin) tabLogin.addEventListener("click", () => switchMode("login"));
    if (tabRegister) tabRegister.addEventListener("click", () => switchMode("register"));
    if (switchToRegister) switchToRegister.addEventListener("click", () => switchMode("register"));
    if (switchToLogin) switchToLogin.addEventListener("click", () => switchMode("login"));

    // Password visibility toggles
    document.querySelectorAll("#auth-screen .auth-eye-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        btn.innerHTML = `<i data-lucide="${showing ? "eye" : "eye-off"}"></i>`;
        SyncStayUI.refreshIcons();
      });
    });

    // Cosmetic role card selection (visual indicator only)
    const roleCards = document.querySelectorAll("#auth-screen .auth-role-card");
    const selectedRoleLabel = document.getElementById("selected-role-label");
    roleCards.forEach((card) => {
      card.addEventListener("click", () => {
        roleCards.forEach((c) => {
          const isSelected = c === card;
          c.classList.toggle("active", isSelected);
          c.setAttribute("aria-checked", String(isSelected));
        });
        if (selectedRoleLabel) {
          selectedRoleLabel.textContent = card.dataset.roleLabel || "";
        }
      });
    });

    // Login Form Submit
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const userId = loginUserIdInput.value.trim();
        const password = loginPasswordInput.value;

        if (!userId || !password) {
          SyncStayUI.toast("Please enter both User ID and Password.", "error");
          return;
        }

        const user = SyncStayStore.authenticate(userId, password);
        if (!user) {
          SyncStayUI.toast("Invalid User ID or password. Check credentials.", "error");
          return;
        }

        SyncStayStore.setSession(user);
        loginForm.reset();
        showApp(user);
        SyncStayUI.toast(`Welcome back, ${user.name} (${user.role}).`, "success");
      });
    }

    // Registration Form Submit (Registers with custom User ID)
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = regUsernameInput ? regUsernameInput.value.trim() : "";
        const userId = regUserIdInput ? regUserIdInput.value.trim() : "";
        const password = regPasswordInput ? regPasswordInput.value : "";

        if (username.length < 2) {
          SyncStayUI.toast("Full name must be at least 2 characters.", "error");
          return;
        }
        if (!userId || userId.length < 3) {
          SyncStayUI.toast("User ID must be at least 3 characters.", "error");
          return;
        }
        if (password.length < 6) {
          SyncStayUI.toast("Password must be at least 6 characters.", "error");
          return;
        }

        const result = SyncStayStore.registerUser({ username, userId, password });
        if (result.error) {
          SyncStayUI.toast(result.error, "error");
          return;
        }

        // Switch to login tab and prefill the User ID
        registerForm.reset();
        switchMode("login");
        if (loginUserIdInput) {
          loginUserIdInput.value = result.user.userId;
        }
        if (loginPasswordInput) {
          loginPasswordInput.value = "";
          loginPasswordInput.focus();
        }

        SyncStayUI.toast(
          `Account created for ${result.user.userId}! Enter password to sign in.`,
          "success"
        );
      });
    }

    // Demo credentials modal via Forgot Password
    if (forgotPasswordLink) {
      forgotPasswordLink.addEventListener("click", (e) => {
        e.preventDefault();
        SyncStayUI.openModal({
          title: "SyncStay Demo Accounts",
          subtitle: "Use any of the default accounts below to sign in",
          html: `
            <table class="cred-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Password</th>
                  <th>Role</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${demoData.users
                  .map(
                    (u) => `
                  <tr>
                    <td class="mono">${SyncStayUI.escapeHtml(u.userId)}</td>
                    <td class="mono">${SyncStayUI.escapeHtml(u.password)}</td>
                    <td>${SyncStayUI.renderBadge(u.role)}</td>
                    <td>
                      <button type="button" class="btn-secondary btn-sm fill-demo-btn" data-id="${u.userId}" data-pw="${u.password}">
                        Use
                      </button>
                    </td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" id="close-demo-modal-btn">Close</button>
            </div>
          `,
          onRender: (body) => {
            body.querySelectorAll(".fill-demo-btn").forEach((btn) => {
              btn.addEventListener("click", () => {
                switchMode("login");
                if (loginUserIdInput) loginUserIdInput.value = btn.dataset.id;
                if (loginPasswordInput) loginPasswordInput.value = btn.dataset.pw;
                SyncStayUI.closeModal();
                SyncStayUI.toast(`Filled credentials for ${btn.dataset.id}. Click Sign in.`, "info");
              });
            });
            body
              .querySelector("#close-demo-modal-btn")
              .addEventListener("click", SyncStayUI.closeModal);
          }
        });
      });
    }
  }

  function showAuth() {
    appShell.classList.add("hidden");
    authScreen.classList.remove("hidden");
    switchMode("login");
    SyncStayUI.refreshIcons();
  }

  function showApp(user) {
    authScreen.classList.add("hidden");
    appShell.classList.remove("hidden");
    if (typeof onAuthenticatedCallback === "function") {
      onAuthenticatedCallback(user);
    }
  }

  function logout() {
    SyncStayStore.clearSession();
    showAuth();
    SyncStayUI.toast("You have been logged out.", "info");
  }

  function revealAfterLoading() {
    const activeSession = SyncStayStore.getSession();
    if (activeSession) {
      showApp(activeSession);
    } else {
      showAuth();
    }
  }

  return {
    init,
    showAuth,
    showApp,
    logout,
    revealAfterLoading
  };
})();