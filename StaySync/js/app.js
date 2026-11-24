/* =====================================================================
   STAYSYNC — MAIN SPA CONTROLLER & ALL HOUSEKEEPING MODULES
   Dashboard, Rooms, Tasks, Staff, Inspections, Maintenance,
   Notifications, Reports & Analytics (Chart.js + CSV), and Settings
   ===================================================================== */

const StaySyncApp = (() => {
  let currentUser = null;
  let currentView = "dashboard";
  let chartInstances = [];

  // Module filter state
  const filters = {
    rooms: { search: "", floor: "all", type: "all", status: "all" },
    tasks: { search: "", status: "all", priority: "all", scope: "all" },
    staff: { search: "", availability: "all" },
    maintenance: { search: "", status: "all", priority: "all" }
  };

  const VIEW_META = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Live hotel housekeeping coordination overview"
    },
    rooms: {
      title: "Room Management",
      subtitle: "Monitor room occupancy, cleaning readiness, and assignments"
    },
    tasks: {
      title: "Housekeeping Tasks",
      subtitle: "Create, assign, and track daily cleaning operations"
    },
    staff: {
      title: "Staff Management",
      subtitle: "Manage housekeeping team shifts, floors, and workloads"
    },
    inspections: {
      title: "Room Inspections",
      subtitle: "Quality audits with automatic re-cleaning dispatch on failure"
    },
    maintenance: {
      title: "Maintenance Requests",
      subtitle: "Track room repairs and critical out-of-order alerts"
    },
    notifications: {
      title: "Notifications",
      subtitle: "Operational alerts, task updates, and deadline reminders"
    },
    reports: {
      title: "Reports & Analytics",
      subtitle: "Cleaning velocity, staff productivity, and CSV data exports"
    },
    settings: {
      title: "Settings",
      subtitle: "Property configuration, account details, and demo data reset"
    }
  };

  const ROOM_STATUSES = [
    "Available",
    "Occupied",
    "Vacant & Dirty",
    "Vacant & Clean",
    "Cleaning",
    "Inspected",
    "Under Maintenance"
  ];

  const TASK_TYPES = [
    "Standard Cleaning",
    "Deep Cleaning",
    "Checkout Cleaning",
    "Bathroom Cleaning",
    "Linen Replacement",
    "Bed Preparation",
    "Special Requests"
  ];

  const TASK_STATUSES = ["Pending", "Assigned", "In Progress", "Completed", "Verified"];

  const MAINTENANCE_ISSUES = [
    "AC Problems",
    "Plumbing Issues",
    "Electrical Problems",
    "Broken Furniture",
    "Damaged Equipment"
  ];

  const MAINTENANCE_STATUSES = ["Reported", "Assigned", "In Progress", "Resolved"];

  const el = {
    appShell: document.getElementById("app-shell"),
    sidebarBackdrop: document.getElementById("sidebar-backdrop"),
    sidebarCollapseBtn: document.getElementById("sidebar-collapse-btn"),
    mobileMenuBtn: document.getElementById("mobile-menu-btn"),
    sidebarHotelName: document.getElementById("sidebar-hotel-name"),
    sidebarUserAvatar: document.getElementById("sidebar-user-avatar"),
    sidebarUserName: document.getElementById("sidebar-user-name"),
    sidebarUserRole: document.getElementById("sidebar-user-role"),
    topbarRolePill: document.getElementById("topbar-role-pill"),
    topbarNotifBtn: document.getElementById("topbar-notif-btn"),
    topbarNotifDot: document.getElementById("topbar-notif-dot"),
    navNotifBadge: document.getElementById("nav-notif-badge"),
    globalSearchInput: document.getElementById("global-search-input"),
    pageTitle: document.getElementById("page-title"),
    pageSubtitle: document.getElementById("page-subtitle"),
    viewContainer: document.getElementById("view-container"),
    logoutBtn: document.getElementById("logout-btn")
  };

  let shellListenersBound = false;

  function perms() {
    return StaySyncStore.getPermissions(currentUser?.role);
  }

  function destroyCharts() {
    chartInstances.forEach((chart) => {
      try {
        chart.destroy();
      } catch {
        // Ignore chart cleanup errors
      }
    });
    chartInstances = [];
  }

  function mount(user) {
    currentUser = user;
    bindShellListeners();
    updateShellUserChrome();
    navigate("dashboard");
  }

  function bindShellListeners() {
    if (shellListenersBound) return;
    shellListenersBound = true;

    // Sidebar navigation buttons
    document.querySelectorAll(".sidebar-nav .nav-item[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        navigate(btn.dataset.view);
        closeMobileNav();
      });
    });

    // Desktop collapse sidebar
    el.sidebarCollapseBtn.addEventListener("click", () => {
      el.appShell.classList.toggle("sidebar-collapsed");
      const isCollapsed = el.appShell.classList.contains("sidebar-collapsed");
      el.sidebarCollapseBtn.innerHTML = `<i data-lucide="${
        isCollapsed ? "panel-left-open" : "panel-left-close"
      }"></i>`;
      StaySyncUI.refreshIcons();
    });

    // Mobile drawer toggle
    el.mobileMenuBtn.addEventListener("click", () => {
      el.appShell.classList.add("mobile-nav-open");
      el.sidebarBackdrop.classList.remove("hidden");
    });

    el.sidebarBackdrop.addEventListener("click", closeMobileNav);

    // Topbar notification shortcut
    el.topbarNotifBtn.addEventListener("click", () => navigate("notifications"));

    // Global quick search (routes to Rooms or filters current Rooms/Tasks view)
    el.globalSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const q = el.globalSearchInput.value.trim();
        if (!q) return;
        if (currentView === "tasks") {
          filters.tasks.search = q;
          renderCurrentView();
        } else {
          filters.rooms.search = q;
          navigate("rooms");
        }
      }
    });

    // Logout
    el.logoutBtn.addEventListener("click", () => {
      StaySyncUI.confirm({
        title: "Sign Out",
        message: "Are you sure you want to log out of StaySync?",
        confirmLabel: "Logout",
        onConfirm: () => {
          destroyCharts();
          StaySyncAuth.logout();
        }
      });
    });
  }

  function closeMobileNav() {
    el.appShell.classList.remove("mobile-nav-open");
    el.sidebarBackdrop.classList.add("hidden");
  }

  function updateShellUserChrome() {
    const state = StaySyncStore.getState();
    el.sidebarHotelName.textContent = state.hotel.name;
    el.sidebarUserAvatar.textContent = StaySyncUI.getInitials(currentUser.name);
    el.sidebarUserName.textContent = currentUser.name;
    el.sidebarUserRole.textContent = currentUser.role;
    el.topbarRolePill.textContent = currentUser.role;
    updateNotificationIndicators();
  }

  function updateNotificationIndicators() {
    const unread = StaySyncStore.getUnreadNotificationCount();
    el.navNotifBadge.textContent = unread;
    el.navNotifBadge.classList.toggle("hidden", unread === 0);
    el.topbarNotifDot.classList.toggle("hidden", unread === 0);
  }

  function navigate(view) {
    currentView = view;
    document.querySelectorAll(".sidebar-nav .nav-item[data-view]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
    const meta = VIEW_META[view] || VIEW_META.dashboard;
    el.pageTitle.textContent = meta.title;
    el.pageSubtitle.textContent = meta.subtitle;
    renderCurrentView();
  }

  function renderCurrentView() {
    destroyCharts();
    updateShellUserChrome();

    switch (currentView) {
      case "dashboard":
        renderDashboard();
        break;
      case "rooms":
        renderRooms();
        break;
      case "tasks":
        renderTasks();
        break;
      case "staff":
        renderStaff();
        break;
      case "inspections":
        renderInspections();
        break;
      case "maintenance":
        renderMaintenance();
        break;
      case "notifications":
        renderNotifications();
        break;
      case "reports":
        renderReports();
        break;
      case "settings":
        renderSettings();
        break;
      default:
        renderDashboard();
    }
    StaySyncUI.refreshIcons();
  }

  /* ===================================================================
     1. DASHBOARD MODULE
     =================================================================== */

  function renderDashboard() {
    const state = StaySyncStore.getState();
    const stats = StaySyncStore.getDashboardStats();
    const statusBreakdown = ROOM_STATUSES.map((status) => ({
      status,
      count: state.rooms.filter((r) => r.status === status).length
    }));

    const todaysTasks = state.tasks.slice(0, 5);
    const activeStaff = state.staff.slice(0, 5);
    const recentActivities = state.activities.slice(0, 6);

    el.viewContainer.innerHTML = `
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Total Rooms</span>
            <div class="kpi-icon"><i data-lucide="building-2"></i></div>
          </div>
          <div class="kpi-value">${stats.total}</div>
          <div class="kpi-foot">${state.hotel.floors} active floors</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Available Rooms</span>
            <div class="kpi-icon"><i data-lucide="check-circle-2"></i></div>
          </div>
          <div class="kpi-value">${stats.available}</div>
          <div class="kpi-foot">Ready or inspected</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Occupied Rooms</span>
            <div class="kpi-icon"><i data-lucide="key-round"></i></div>
          </div>
          <div class="kpi-value">${stats.occupied}</div>
          <div class="kpi-foot">${
            stats.total ? Math.round((stats.occupied / stats.total) * 100) : 0
          }% occupancy</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Vacant & Dirty</span>
            <div class="kpi-icon accent"><i data-lucide="sparkles"></i></div>
          </div>
          <div class="kpi-value">${stats.vacantDirty}</div>
          <div class="kpi-foot">Awaiting housekeeping</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Cleaning in Progress</span>
            <div class="kpi-icon accent"><i data-lucide="loader"></i></div>
          </div>
          <div class="kpi-value">${stats.cleaning}</div>
          <div class="kpi-foot">Staff currently active</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Clean Rooms</span>
            <div class="kpi-icon"><i data-lucide="shield-check"></i></div>
          </div>
          <div class="kpi-value">${stats.clean}</div>
          <div class="kpi-foot">Meets hygiene standard</div>
        </div>

        <div class="kpi-card">
          <div class="kpi-top">
            <span class="kpi-label">Maintenance Rooms</span>
            <div class="kpi-icon"><i data-lucide="wrench"></i></div>
          </div>
          <div class="kpi-value">${stats.maintenance}</div>
          <div class="kpi-foot">Out of service</div>
        </div>
      </div>

      <div class="dashboard-grid-2">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Cleaning Performance</h3>
              <p class="card-subtitle">Rooms cleaned vs. inspected over the past 7 days</p>
            </div>
            <button class="btn-secondary btn-sm" id="dash-open-reports">View Reports</button>
          </div>
          <div class="card-body">
            <div class="chart-box">
              <canvas id="dash-cleaning-chart"></canvas>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Room Status Overview</h3>
              <p class="card-subtitle">Distribution across all ${stats.total} rooms</p>
            </div>
            <button class="btn-ghost btn-sm" id="dash-open-rooms">Manage</button>
          </div>
          <div class="card-body">
            <div class="status-bar-list">
              ${statusBreakdown
                .map((item) => {
                  const pct = stats.total ? Math.round((item.count / stats.total) * 100) : 0;
                  const isAccent = ["Cleaning", "Vacant & Dirty"].includes(item.status);
                  return `
                    <div class="status-bar-item">
                      <div class="status-bar-meta">
                        <span>${StaySyncUI.escapeHtml(item.status)}</span>
                        <span class="mono">${item.count} (${pct}%)</span>
                      </div>
                      <div class="status-bar-track">
                        <div class="status-bar-fill ${
                          isAccent ? "accent" : ""
                        }" style="width: ${pct}%"></div>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid-3">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Today's Tasks</h3>
              <p class="card-subtitle">${state.tasks.length} total active & completed</p>
            </div>
            <button class="btn-ghost btn-sm" id="dash-open-tasks">All Tasks</button>
          </div>
          <div class="card-body">
            <div class="list-stack">
              ${
                todaysTasks.length
                  ? todaysTasks
                      .map(
                        (t) => `
                  <div class="list-row">
                    <div class="list-row-main">
                      <div class="list-row-title">Room ${StaySyncUI.escapeHtml(
                        t.roomNumber
                      )} · ${StaySyncUI.escapeHtml(t.type)}</div>
                      <div class="list-row-sub">${StaySyncUI.escapeHtml(
                        StaySyncStore.getStaffName(t.assignedStaffId)
                      )} · Due ${StaySyncUI.escapeHtml(t.deadline.split(" ")[1] || t.deadline)}</div>
                    </div>
                    ${StaySyncUI.renderBadge(t.status)}
                  </div>
                `
                      )
                      .join("")
                  : `<div class="empty-state"><p>No tasks scheduled.</p></div>`
              }
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Staff Availability</h3>
              <p class="card-subtitle">${state.staff.length} team members on roster</p>
            </div>
            <button class="btn-ghost btn-sm" id="dash-open-staff">Directory</button>
          </div>
          <div class="card-body">
            <div class="list-stack">
              ${activeStaff
                .map(
                  (st) => `
                <div class="list-row">
                  <div class="list-row-main">
                    <div class="list-row-title">${StaySyncUI.escapeHtml(st.name)}</div>
                    <div class="list-row-sub">${StaySyncUI.escapeHtml(
                      st.assignedFloor
                    )} · ${StaySyncStore.getStaffAssignedTaskCount(st.id)} open tasks</div>
                  </div>
                  ${StaySyncUI.renderBadge(st.availability)}
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Recent Activities</h3>
              <p class="card-subtitle">Live audit log across departments</p>
            </div>
          </div>
          <div class="card-body">
            <div class="list-stack">
              ${recentActivities
                .map(
                  (act) => `
                <div class="list-row">
                  <div class="list-row-main">
                    <div class="list-row-title">${StaySyncUI.escapeHtml(act.action)}</div>
                    <div class="list-row-sub">${StaySyncUI.escapeHtml(act.detail)}</div>
                  </div>
                  <span class="text-muted">${StaySyncUI.escapeHtml(
                    act.timestamp.split(" ")[1] || act.timestamp
                  )}</span>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("dash-open-reports").addEventListener("click", () => navigate("reports"));
    document.getElementById("dash-open-rooms").addEventListener("click", () => navigate("rooms"));
    document.getElementById("dash-open-tasks").addEventListener("click", () => navigate("tasks"));
    document.getElementById("dash-open-staff").addEventListener("click", () => navigate("staff"));

    initDashboardChart();
  }

  function initDashboardChart() {
    const canvas = document.getElementById("dash-cleaning-chart");
    if (!canvas || typeof Chart === "undefined") return;
    const perf = StaySyncStore.getState().performanceHistory;

    const chart = new Chart(canvas, {
      type: "bar",
      data: {
        labels: perf.dailyLabels,
        datasets: [
          {
            label: "Rooms Cleaned",
            data: perf.dailyCleaned,
            backgroundColor: "#202020",
            borderRadius: 6,
            barPercentage: 0.55
          },
          {
            label: "Rooms Inspected",
            data: perf.dailyInspected,
            backgroundColor: "#E58A42",
            borderRadius: 6,
            barPercentage: 0.55
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "top",
            align: "end",
            labels: { boxWidth: 10, usePointStyle: true, color: "#777777", font: { size: 12 } }
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: "#777777" } },
          y: {
            beginAtZero: true,
            grid: { color: "#F0F0F0" },
            ticks: { color: "#777777", stepSize: 10 }
          }
        }
      }
    });
    chartInstances.push(chart);
  }

  /* ===================================================================
     2. ROOM MANAGEMENT MODULE
     =================================================================== */

  function renderRooms() {
    const state = StaySyncStore.getState();
    const p = perms();
    const floors = [...new Set(state.rooms.map((r) => r.floor))].sort((a, b) => a - b);
    const types = [...new Set(state.rooms.map((r) => r.type))].sort();

    const filtered = state.rooms.filter((r) => {
      const q = filters.rooms.search.toLowerCase();
      const matchSearch =
        !q ||
        r.roomNumber.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        StaySyncStore.getStaffName(r.assignedStaffId).toLowerCase().includes(q) ||
        (r.specialInstructions || "").toLowerCase().includes(q);
      const matchFloor = filters.rooms.floor === "all" || String(r.floor) === filters.rooms.floor;
      const matchType = filters.rooms.type === "all" || r.type === filters.rooms.type;
      const matchStatus = filters.rooms.status === "all" || r.status === filters.rooms.status;
      return matchSearch && matchFloor && matchType && matchStatus;
    });

    el.viewContainer.innerHTML = `
      <div class="section-toolbar">
        <div class="filter-group">
          <input id="room-search" class="input-control" type="text" placeholder="Search room, staff, notes..." value="${StaySyncUI.escapeHtml(
            filters.rooms.search
          )}" />
          <select id="room-floor-filter" class="select-control">
            <option value="all">All Floors</option>
            ${floors
              .map(
                (f) =>
                  `<option value="${f}" ${
                    filters.rooms.floor === String(f) ? "selected" : ""
                  }>Floor ${f}</option>`
              )
              .join("")}
          </select>
          <select id="room-type-filter" class="select-control">
            <option value="all">All Types</option>
            ${types
              .map(
                (t) =>
                  `<option value="${StaySyncUI.escapeHtml(t)}" ${
                    filters.rooms.type === t ? "selected" : ""
                  }>${StaySyncUI.escapeHtml(t)}</option>`
              )
              .join("")}
          </select>
          <select id="room-status-filter" class="select-control">
            <option value="all">All Statuses</option>
            ${ROOM_STATUSES.map(
              (s) =>
                `<option value="${s}" ${filters.rooms.status === s ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
        </div>

        <div class="filter-group">
          ${
            p.canManageRooms
              ? `<button id="add-room-btn" class="btn-accent"><i data-lucide="plus"></i> Add Room</button>`
              : ""
          }
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Floor</th>
                <th>Type</th>
                <th>Occupancy</th>
                <th>Status</th>
                <th>Assigned Staff</th>
                <th>Last Cleaned</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length
                  ? filtered
                      .map(
                        (room) => `
                  <tr>
                    <td class="mono">Room ${StaySyncUI.escapeHtml(room.roomNumber)}</td>
                    <td>Floor ${room.floor}</td>
                    <td>${StaySyncUI.escapeHtml(room.type)}</td>
                    <td>${StaySyncUI.renderBadge(room.occupancyStatus)}</td>
                    <td>${StaySyncUI.renderBadge(room.status)}</td>
                    <td>${StaySyncUI.escapeHtml(
                      StaySyncStore.getStaffName(room.assignedStaffId)
                    )}</td>
                    <td class="text-muted">${StaySyncUI.escapeHtml(room.lastCleaned)}</td>
                    <td>
                      <div class="table-actions">
                        <button class="icon-btn room-view-btn" data-room="${
                          room.roomNumber
                        }" title="View Details"><i data-lucide="eye"></i></button>
                        ${
                          p.canManageRooms
                            ? `<button class="icon-btn room-edit-btn" data-room="${room.roomNumber}" title="Edit Room"><i data-lucide="pencil"></i></button>`
                            : ""
                        }
                        ${
                          p.canDeleteRooms
                            ? `<button class="icon-btn danger room-del-btn" data-room="${room.roomNumber}" title="Delete Room"><i data-lucide="trash-2"></i></button>`
                            : ""
                        }
                      </div>
                    </td>
                  </tr>
                `
                      )
                      .join("")
                  : `<tr><td colspan="8"><div class="empty-state"><strong>No matching rooms</strong><p>Adjust your search or filters to see rooms.</p></div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("room-search").addEventListener("input", (e) => {
      filters.rooms.search = e.target.value;
      renderRooms();
    });
    document.getElementById("room-floor-filter").addEventListener("change", (e) => {
      filters.rooms.floor = e.target.value;
      renderRooms();
    });
    document.getElementById("room-type-filter").addEventListener("change", (e) => {
      filters.rooms.type = e.target.value;
      renderRooms();
    });
    document.getElementById("room-status-filter").addEventListener("change", (e) => {
      filters.rooms.status = e.target.value;
      renderRooms();
    });

    const addBtn = document.getElementById("add-room-btn");
    if (addBtn) addBtn.addEventListener("click", () => openRoomFormModal(null));

    el.viewContainer.querySelectorAll(".room-view-btn").forEach((btn) => {
      btn.addEventListener("click", () => openRoomDetailsModal(btn.dataset.room));
    });
    el.viewContainer.querySelectorAll(".room-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openRoomFormModal(btn.dataset.room));
    });
    el.viewContainer.querySelectorAll(".room-del-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        StaySyncUI.confirm({
          title: "Delete Room",
          message: `Remove Room ${btn.dataset.room} permanently from inventory?`,
          confirmLabel: "Delete",
          onConfirm: () => {
            StaySyncStore.deleteRoom(btn.dataset.room);
            StaySyncUI.toast(`Room ${btn.dataset.room} deleted.`, "success");
            renderRooms();
          }
        });
      });
    });
  }

  function openRoomDetailsModal(roomNumber) {
    const state = StaySyncStore.getState();
    const room = state.rooms.find((r) => r.roomNumber === roomNumber);
    if (!room) return;

    const roomTasks = state.tasks.filter((t) => t.roomNumber === roomNumber);
    const roomMaint = state.maintenance.filter((m) => m.roomNumber === roomNumber);

    StaySyncUI.openModal({
      title: `Room ${room.roomNumber} Details`,
      subtitle: `Floor ${room.floor} · ${room.type}`,
      html: `
        <div class="detail-grid">
          <div class="detail-box">
            <div class="detail-label">Room Status</div>
            <div class="detail-value">${StaySyncUI.renderBadge(room.status)}</div>
          </div>
          <div class="detail-box">
            <div class="detail-label">Occupancy / Cleaning</div>
            <div class="detail-value">${StaySyncUI.escapeHtml(
              room.occupancyStatus
            )} · ${StaySyncUI.escapeHtml(room.cleaningStatus)}</div>
          </div>
          <div class="detail-box">
            <div class="detail-label">Assigned Staff</div>
            <div class="detail-value">${StaySyncUI.escapeHtml(
              StaySyncStore.getStaffName(room.assignedStaffId)
            )}</div>
          </div>
          <div class="detail-box">
            <div class="detail-label">Last Cleaned</div>
            <div class="detail-value">${StaySyncUI.escapeHtml(room.lastCleaned)}</div>
          </div>
          <div class="detail-box full">
            <div class="detail-label">Special Instructions</div>
            <div class="detail-value">${StaySyncUI.escapeHtml(
              room.specialInstructions || "None provided."
            )}</div>
          </div>
          <div class="detail-box">
            <div class="detail-label">Linked Tasks</div>
            <div class="detail-value">${roomTasks.length} task(s)</div>
          </div>
          <div class="detail-box">
            <div class="detail-label">Maintenance Tickets</div>
            <div class="detail-value">${roomMaint.length} ticket(s)</div>
          </div>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn-secondary" id="room-detail-close">Close</button>
        </div>
      `,
      onRender: (body) => {
        body.querySelector("#room-detail-close").addEventListener("click", StaySyncUI.closeModal);
      }
    });
  }

  function openRoomFormModal(editRoomNumber) {
    const state = StaySyncStore.getState();
    const room = editRoomNumber
      ? state.rooms.find((r) => r.roomNumber === editRoomNumber)
      : null;

    StaySyncUI.openModal({
      title: room ? `Edit Room ${room.roomNumber}` : "Add New Room",
      subtitle: "Configure room details, housekeeping status, and staff assignment",
      html: `
        <form id="room-form">
          <div class="form-grid">
            <div class="form-field">
              <label for="rf-number">Room Number *</label>
              <input id="rf-number" class="input-control" type="text" required value="${StaySyncUI.escapeHtml(
                room?.roomNumber || ""
              )}" placeholder="e.g. 501" />
            </div>
            <div class="form-field">
              <label for="rf-floor">Floor *</label>
              <input id="rf-floor" class="input-control" type="number" min="1" max="50" required value="${
                room?.floor || 1
              }" />
            </div>
            <div class="form-field">
              <label for="rf-type">Room Type *</label>
              <select id="rf-type" class="select-control" required>
                ${[
                  "Standard King",
                  "Standard Queen",
                  "Standard Twin",
                  "Deluxe King",
                  "Deluxe Queen",
                  "Deluxe Twin",
                  "Accessible King",
                  "Executive Suite",
                  "Penthouse Suite"
                ]
                  .map(
                    (t) =>
                      `<option value="${t}" ${room?.type === t ? "selected" : ""}>${t}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="rf-status">Room Status *</label>
              <select id="rf-status" class="select-control" required>
                ${ROOM_STATUSES.map(
                  (s) =>
                    `<option value="${s}" ${
                      (room?.status || "Available") === s ? "selected" : ""
                    }>${s}</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="rf-staff">Assigned Staff</label>
              <select id="rf-staff" class="select-control">
                <option value="">Unassigned</option>
                ${state.staff
                  .map(
                    (st) =>
                      `<option value="${st.id}" ${
                        room?.assignedStaffId === st.id ? "selected" : ""
                      }>${StaySyncUI.escapeHtml(st.name)} (${StaySyncUI.escapeHtml(
                        st.assignedFloor
                      )})</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="rf-cleaned">Last Cleaned</label>
              <input id="rf-cleaned" class="input-control" type="text" value="${StaySyncUI.escapeHtml(
                room?.lastCleaned || StaySyncStore.nowTimestamp()
              )}" />
            </div>
            <div class="form-field full">
              <label for="rf-notes">Special Instructions</label>
              <textarea id="rf-notes" class="textarea-control" placeholder="Guest preferences, allergies, VIP setup...">${StaySyncUI.escapeHtml(
                room?.specialInstructions || ""
              )}</textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="rf-cancel">Cancel</button>
            <button type="submit" class="btn-accent">${room ? "Save Changes" : "Add Room"}</button>
          </div>
        </form>
      `,
      onRender: (body) => {
        body.querySelector("#rf-cancel").addEventListener("click", StaySyncUI.closeModal);
        body.querySelector("#room-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const result = StaySyncStore.saveRoom(
            {
              roomNumber: body.querySelector("#rf-number").value,
              floor: body.querySelector("#rf-floor").value,
              type: body.querySelector("#rf-type").value,
              status: body.querySelector("#rf-status").value,
              assignedStaffId: body.querySelector("#rf-staff").value,
              lastCleaned: body.querySelector("#rf-cleaned").value,
              specialInstructions: body.querySelector("#rf-notes").value
            },
            editRoomNumber
          );

          if (result.error) {
            StaySyncUI.toast(result.error, "error");
            return;
          }
          StaySyncUI.closeModal();
          StaySyncUI.toast(
            room
              ? `Room ${result.room.roomNumber} updated.`
              : `Room ${result.room.roomNumber} added.`,
            "success"
          );
          renderRooms();
        });
      }
    });
  }

  /* ===================================================================
     3. HOUSEKEEPING TASKS MODULE
     =================================================================== */

  function renderTasks() {
    const state = StaySyncStore.getState();
    const p = perms();

    const filtered = state.tasks.filter((t) => {
      const q = filters.tasks.search.toLowerCase();
      const staffName = StaySyncStore.getStaffName(t.assignedStaffId).toLowerCase();
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.roomNumber.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        staffName.includes(q);
      const matchStatus = filters.tasks.status === "all" || t.status === filters.tasks.status;
      const matchPriority =
        filters.tasks.priority === "all" || t.priority === filters.tasks.priority;
      const matchScope =
        filters.tasks.scope === "all" || t.assignedStaffId === currentUser.userId;
      return matchSearch && matchStatus && matchPriority && matchScope;
    });

    el.viewContainer.innerHTML = `
      <div class="section-toolbar">
        <div class="filter-group">
          <input id="task-search" class="input-control" type="text" placeholder="Search task ID, room, staff..." value="${StaySyncUI.escapeHtml(
            filters.tasks.search
          )}" />
          <select id="task-scope-filter" class="select-control">
            <option value="all" ${filters.tasks.scope === "all" ? "selected" : ""}>All Tasks</option>
            <option value="mine" ${
              filters.tasks.scope === "mine" ? "selected" : ""
            }>My Assigned Tasks</option>
          </select>
          <select id="task-status-filter" class="select-control">
            <option value="all">All Statuses</option>
            ${TASK_STATUSES.map(
              (s) =>
                `<option value="${s}" ${filters.tasks.status === s ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
          <select id="task-priority-filter" class="select-control">
            <option value="all">All Priorities</option>
            ${["Low", "Medium", "High"]
              .map(
                (pr) =>
                  `<option value="${pr}" ${
                    filters.tasks.priority === pr ? "selected" : ""
                  }>${pr}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="filter-group">
          ${
            p.canManageTasks
              ? `<button id="add-task-btn" class="btn-accent"><i data-lucide="plus"></i> Create Task</button>`
              : ""
          }
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Room</th>
                <th>Task Type</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Deadline</th>
                <th>Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length
                  ? filtered
                      .map((t) => {
                        const isMine = t.assignedStaffId === currentUser.userId;
                        const canProgress = p.canManageTasks || isMine;
                        return `
                  <tr>
                    <td class="mono">${StaySyncUI.escapeHtml(t.id)}</td>
                    <td class="mono">Room ${StaySyncUI.escapeHtml(t.roomNumber)}</td>
                    <td>
                      <div>${StaySyncUI.escapeHtml(t.type)}</div>
                      <div class="text-muted">${StaySyncUI.escapeHtml(t.description)}</div>
                    </td>
                    <td>${StaySyncUI.escapeHtml(
                      StaySyncStore.getStaffName(t.assignedStaffId)
                    )}</td>
                    <td>${StaySyncUI.renderBadge(t.priority)}</td>
                    <td class="text-muted">${StaySyncUI.escapeHtml(t.deadline)}</td>
                    <td>${StaySyncUI.renderBadge(t.status)}</td>
                    <td>
                      <div class="table-actions">
                        ${
                          canProgress && ["Pending", "Assigned"].includes(t.status)
                            ? `<button class="btn-secondary btn-sm task-step-btn" data-id="${t.id}" data-next="In Progress">Start</button>`
                            : ""
                        }
                        ${
                          canProgress && t.status === "In Progress"
                            ? `<button class="btn-primary btn-sm task-step-btn" data-id="${t.id}" data-next="Completed">Complete</button>`
                            : ""
                        }
                        ${
                          p.canVerifyTasks && t.status === "Completed"
                            ? `<button class="btn-accent btn-sm task-step-btn" data-id="${t.id}" data-next="Verified">Verify</button>`
                            : ""
                        }
                        ${
                          p.canManageTasks
                            ? `<button class="icon-btn task-edit-btn" data-id="${t.id}" title="Edit Task"><i data-lucide="pencil"></i></button>
                               <button class="icon-btn danger task-del-btn" data-id="${t.id}" title="Delete Task"><i data-lucide="trash-2"></i></button>`
                            : ""
                        }
                      </div>
                    </td>
                  </tr>
                `;
                      })
                      .join("")
                  : `<tr><td colspan="8"><div class="empty-state"><strong>No housekeeping tasks found</strong><p>Try clearing your filters or create a new cleaning task.</p></div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("task-search").addEventListener("input", (e) => {
      filters.tasks.search = e.target.value;
      renderTasks();
    });
    document.getElementById("task-scope-filter").addEventListener("change", (e) => {
      filters.tasks.scope = e.target.value;
      renderTasks();
    });
    document.getElementById("task-status-filter").addEventListener("change", (e) => {
      filters.tasks.status = e.target.value;
      renderTasks();
    });
    document.getElementById("task-priority-filter").addEventListener("change", (e) => {
      filters.tasks.priority = e.target.value;
      renderTasks();
    });

    const addBtn = document.getElementById("add-task-btn");
    if (addBtn) addBtn.addEventListener("click", () => openTaskFormModal(null));

    el.viewContainer.querySelectorAll(".task-step-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const updated = StaySyncStore.updateTaskStatus(btn.dataset.id, btn.dataset.next);
        if (updated) {
          StaySyncUI.toast(
            `${updated.id} moved to ${updated.status}. Room ${updated.roomNumber} synced.`,
            "success"
          );
          updateNotificationIndicators();
          renderTasks();
        }
      });
    });

    el.viewContainer.querySelectorAll(".task-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openTaskFormModal(btn.dataset.id));
    });

    el.viewContainer.querySelectorAll(".task-del-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        StaySyncUI.confirm({
          title: "Delete Task",
          message: `Delete housekeeping task ${btn.dataset.id}?`,
          confirmLabel: "Delete",
          onConfirm: () => {
            StaySyncStore.deleteTask(btn.dataset.id);
            StaySyncUI.toast(`Task ${btn.dataset.id} deleted.`, "success");
            renderTasks();
          }
        });
      });
    });
  }

  function openTaskFormModal(editTaskId) {
    const state = StaySyncStore.getState();
    const task = editTaskId ? state.tasks.find((t) => t.id === editTaskId) : null;
    const defaultDeadline = StaySyncStore.nowTimestamp().slice(0, 11) + "15:00";

    StaySyncUI.openModal({
      title: task ? `Edit Task ${task.id}` : "Create Housekeeping Task",
      subtitle: "Assign room cleaning work with deadline and priority",
      html: `
        <form id="task-form">
          <div class="form-grid">
            <div class="form-field">
              <label for="tf-room">Room Number *</label>
              <select id="tf-room" class="select-control" required>
                ${state.rooms
                  .map(
                    (r) =>
                      `<option value="${r.roomNumber}" ${
                        task?.roomNumber === r.roomNumber ? "selected" : ""
                      }>Room ${r.roomNumber} — ${StaySyncUI.escapeHtml(r.status)}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="tf-type">Task Type *</label>
              <select id="tf-type" class="select-control" required>
                ${TASK_TYPES.map(
                  (tp) => `<option value="${tp}" ${task?.type === tp ? "selected" : ""}>${tp}</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="tf-staff">Assigned Employee</label>
              <select id="tf-staff" class="select-control">
                <option value="">Unassigned</option>
                ${state.staff
                  .map(
                    (st) =>
                      `<option value="${st.id}" ${
                        task?.assignedStaffId === st.id ? "selected" : ""
                      }>${StaySyncUI.escapeHtml(st.name)} (${StaySyncUI.escapeHtml(
                        st.assignedFloor
                      )})</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="tf-priority">Priority *</label>
              <select id="tf-priority" class="select-control" required>
                ${["Low", "Medium", "High"]
                  .map(
                    (pr) =>
                      `<option value="${pr}" ${
                        (task?.priority || "Medium") === pr ? "selected" : ""
                      }>${pr}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="tf-deadline">Deadline *</label>
              <input id="tf-deadline" class="input-control" type="text" required value="${StaySyncUI.escapeHtml(
                task?.deadline || defaultDeadline
              )}" placeholder="YYYY-MM-DD HH:MM" />
            </div>
            <div class="form-field">
              <label for="tf-status">Status *</label>
              <select id="tf-status" class="select-control" required>
                ${TASK_STATUSES.map(
                  (s) =>
                    `<option value="${s}" ${
                      (task?.status || "Assigned") === s ? "selected" : ""
                    }>${s}</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-field full">
              <label for="tf-desc">Description *</label>
              <textarea id="tf-desc" class="textarea-control" required placeholder="Specific cleaning instructions...">${StaySyncUI.escapeHtml(
                task?.description || ""
              )}</textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="tf-cancel">Cancel</button>
            <button type="submit" class="btn-accent">${task ? "Save Task" : "Create Task"}</button>
          </div>
        </form>
      `,
      onRender: (body) => {
        body.querySelector("#tf-cancel").addEventListener("click", StaySyncUI.closeModal);
        body.querySelector("#task-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const res = StaySyncStore.saveTask(
            {
              roomNumber: body.querySelector("#tf-room").value,
              type: body.querySelector("#tf-type").value,
              assignedStaffId: body.querySelector("#tf-staff").value,
              priority: body.querySelector("#tf-priority").value,
              deadline: body.querySelector("#tf-deadline").value,
              status: body.querySelector("#tf-status").value,
              description: body.querySelector("#tf-desc").value
            },
            editTaskId
          );

          if (res.error) {
            StaySyncUI.toast(res.error, "error");
            return;
          }
          StaySyncUI.closeModal();
          StaySyncUI.toast(
            task ? `Task ${res.task.id} updated.` : `Task ${res.task.id} created.`,
            "success"
          );
          updateNotificationIndicators();
          renderTasks();
        });
      }
    });
  }

  /* ===================================================================
     4. STAFF MANAGEMENT MODULE
     =================================================================== */

  function renderStaff() {
    const state = StaySyncStore.getState();
    const p = perms();

    const filtered = state.staff.filter((st) => {
      const q = filters.staff.search.toLowerCase();
      const matchSearch =
        !q ||
        st.id.toLowerCase().includes(q) ||
        st.name.toLowerCase().includes(q) ||
        st.role.toLowerCase().includes(q) ||
        st.assignedFloor.toLowerCase().includes(q);
      const matchAvail =
        filters.staff.availability === "all" || st.availability === filters.staff.availability;
      return matchSearch && matchAvail;
    });

    el.viewContainer.innerHTML = `
      <div class="section-toolbar">
        <div class="filter-group">
          <input id="staff-search" class="input-control" type="text" placeholder="Search ID, name, floor..." value="${StaySyncUI.escapeHtml(
            filters.staff.search
          )}" />
          <select id="staff-avail-filter" class="select-control">
            <option value="all">All Availability</option>
            ${["Available", "On Duty", "On Break", "Off Duty"]
              .map(
                (a) =>
                  `<option value="${a}" ${
                    filters.staff.availability === a ? "selected" : ""
                  }>${a}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="filter-group">
          ${
            p.canManageStaff
              ? `<button id="add-staff-btn" class="btn-accent"><i data-lucide="user-plus"></i> Add Staff</button>`
              : ""
          }
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name & Contact</th>
                <th>Role</th>
                <th>Assigned Floor</th>
                <th>Shift</th>
                <th>Availability</th>
                <th>Workload</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length
                  ? filtered
                      .map((st) => {
                        const openCount = StaySyncStore.getStaffAssignedTaskCount(st.id);
                        return `
                  <tr>
                    <td class="mono">${StaySyncUI.escapeHtml(st.id)}</td>
                    <td>
                      <div style="font-weight:500">${StaySyncUI.escapeHtml(st.name)}</div>
                      <div class="text-muted">${StaySyncUI.escapeHtml(st.contact)}</div>
                    </td>
                    <td>${StaySyncUI.renderBadge(st.role)}</td>
                    <td>${StaySyncUI.escapeHtml(st.assignedFloor)}</td>
                    <td class="text-muted">${StaySyncUI.escapeHtml(st.shift)}</td>
                    <td>${StaySyncUI.renderBadge(st.availability)}</td>
                    <td>
                      <span class="mono">${openCount}</span> active ·
                      <span class="mono">${st.completedTasks || 0}</span> done
                    </td>
                    <td>
                      <div class="table-actions">
                        ${
                          p.canManageStaff
                            ? `<button class="icon-btn staff-edit-btn" data-id="${st.id}" title="Edit Staff"><i data-lucide="pencil"></i></button>`
                            : ""
                        }
                        ${
                          p.canDeleteStaff && st.id !== currentUser.userId
                            ? `<button class="icon-btn danger staff-del-btn" data-id="${st.id}" title="Remove Staff"><i data-lucide="trash-2"></i></button>`
                            : ""
                        }
                      </div>
                    </td>
                  </tr>
                `;
                      })
                      .join("")
                  : `<tr><td colspan="8"><div class="empty-state"><strong>No staff members matched</strong><p>Adjust your search query.</p></div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("staff-search").addEventListener("input", (e) => {
      filters.staff.search = e.target.value;
      renderStaff();
    });
    document.getElementById("staff-avail-filter").addEventListener("change", (e) => {
      filters.staff.availability = e.target.value;
      renderStaff();
    });

    const addBtn = document.getElementById("add-staff-btn");
    if (addBtn) addBtn.addEventListener("click", () => openStaffFormModal(null));

    el.viewContainer.querySelectorAll(".staff-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openStaffFormModal(btn.dataset.id));
    });

    el.viewContainer.querySelectorAll(".staff-del-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        StaySyncUI.confirm({
          title: "Remove Staff Member",
          message: `Remove Employee ${btn.dataset.id} from the roster? Open tasks assigned to them will become unassigned.`,
          confirmLabel: "Remove",
          onConfirm: () => {
            StaySyncStore.deleteStaff(btn.dataset.id);
            StaySyncUI.toast("Staff member removed.", "success");
            renderStaff();
          }
        });
      });
    });
  }

  function openStaffFormModal(editId) {
    const state = StaySyncStore.getState();
    const member = editId ? state.staff.find((s) => s.id === editId) : null;

    StaySyncUI.openModal({
      title: member ? `Edit Staff — ${member.name}` : "Add Staff Member",
      subtitle: "Configure floor assignment, shift schedule, and availability",
      html: `
        <form id="staff-form">
          <div class="form-grid">
            <div class="form-field">
              <label for="sf-id">Employee ID</label>
              <input id="sf-id" class="input-control" type="text" ${
                member ? "disabled" : ""
              } value="${StaySyncUI.escapeHtml(member?.id || "")}" placeholder="Auto-generated if blank" />
            </div>
            <div class="form-field">
              <label for="sf-name">Full Name *</label>
              <input id="sf-name" class="input-control" type="text" required value="${StaySyncUI.escapeHtml(
                member?.name || ""
              )}" />
            </div>
            <div class="form-field">
              <label for="sf-role">Role *</label>
              <select id="sf-role" class="select-control" required>
                ${["Housekeeping Staff", "Housekeeping Manager", "Administrator"]
                  .map(
                    (r) =>
                      `<option value="${r}" ${
                        (member?.role || "Housekeeping Staff") === r ? "selected" : ""
                      }>${r}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="sf-contact">Contact *</label>
              <input id="sf-contact" class="input-control" type="text" required value="${StaySyncUI.escapeHtml(
                member?.contact || ""
              )}" placeholder="+1 (555) 000-0000" />
            </div>
            <div class="form-field">
              <label for="sf-floor">Assigned Floor *</label>
              <input id="sf-floor" class="input-control" type="text" required value="${StaySyncUI.escapeHtml(
                member?.assignedFloor || "Floor 1"
              )}" placeholder="e.g. Floor 2" />
            </div>
            <div class="form-field">
              <label for="sf-shift">Shift *</label>
              <select id="sf-shift" class="select-control" required>
                ${[
                  "Morning (07:00 - 15:00)",
                  "Evening (15:00 - 23:00)",
                  "Night (23:00 - 07:00)"
                ]
                  .map(
                    (sh) =>
                      `<option value="${sh}" ${member?.shift === sh ? "selected" : ""}>${sh}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field full">
              <label for="sf-avail">Availability *</label>
              <select id="sf-avail" class="select-control" required>
                ${["Available", "On Duty", "On Break", "Off Duty"]
                  .map(
                    (a) =>
                      `<option value="${a}" ${
                        (member?.availability || "Available") === a ? "selected" : ""
                      }>${a}</option>`
                  )
                  .join("")}
              </select>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="sf-cancel">Cancel</button>
            <button type="submit" class="btn-accent">${
              member ? "Save Changes" : "Add Staff"
            }</button>
          </div>
        </form>
      `,
      onRender: (body) => {
        body.querySelector("#sf-cancel").addEventListener("click", StaySyncUI.closeModal);
        body.querySelector("#staff-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const res = StaySyncStore.saveStaff(
            {
              id: body.querySelector("#sf-id").value,
              name: body.querySelector("#sf-name").value,
              role: body.querySelector("#sf-role").value,
              contact: body.querySelector("#sf-contact").value,
              assignedFloor: body.querySelector("#sf-floor").value,
              shift: body.querySelector("#sf-shift").value,
              availability: body.querySelector("#sf-avail").value
            },
            editId
          );
          if (res.error) {
            StaySyncUI.toast(res.error, "error");
            return;
          }
          StaySyncUI.closeModal();
          StaySyncUI.toast(
            member ? `${res.staff.name} updated.` : `${res.staff.name} added to roster.`,
            "success"
          );
          renderStaff();
        });
      }
    });
  }

  /* ===================================================================
     5. ROOM INSPECTIONS MODULE
     =================================================================== */

  function renderInspections() {
    const state = StaySyncStore.getState();
    const p = perms();
    const readyForInspection = state.rooms.filter((r) => r.status === "Vacant & Clean");

    el.viewContainer.innerHTML = `
      <div class="section-toolbar">
        <div class="filter-group">
          <span class="text-muted">
            <strong style="color:var(--text-primary)">${readyForInspection.length}</strong> room(s) currently awaiting quality inspection
            ${
              readyForInspection.length
                ? `(${readyForInspection.map((r) => "Room " + r.roomNumber).join(", ")})`
                : ""
            }
          </span>
        </div>
        <div class="filter-group">
          ${
            p.canInspectRooms
              ? `<button id="new-inspection-btn" class="btn-accent"><i data-lucide="clipboard-check"></i> Conduct Inspection</button>`
              : `<span class="text-muted">Only Managers & Administrators can submit inspections.</span>`
          }
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Inspection ID</th>
                <th>Room</th>
                <th>Inspector</th>
                <th>Date</th>
                <th>Checklist Score</th>
                <th>Result</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${
                state.inspections.length
                  ? state.inspections
                      .map((ins) => {
                        const passedCount = INSPECTION_CHECKLIST_ITEMS.filter(
                          (item) => ins.checklist && ins.checklist[item.key]
                        ).length;
                        return `
                  <tr>
                    <td class="mono">${StaySyncUI.escapeHtml(ins.id)}</td>
                    <td class="mono">Room ${StaySyncUI.escapeHtml(ins.roomNumber)}</td>
                    <td>${StaySyncUI.escapeHtml(ins.inspectorName)}</td>
                    <td class="text-muted">${StaySyncUI.escapeHtml(ins.date)}</td>
                    <td class="mono">${passedCount} / ${INSPECTION_CHECKLIST_ITEMS.length}</td>
                    <td>${StaySyncUI.renderBadge(ins.result)}</td>
                    <td class="text-muted">${StaySyncUI.escapeHtml(ins.notes || "—")}</td>
                  </tr>
                `;
                      })
                      .join("")
                  : `<tr><td colspan="7"><div class="empty-state"><strong>No inspections logged yet</strong></div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    const newBtn = document.getElementById("new-inspection-btn");
    if (newBtn) newBtn.addEventListener("click", openInspectionModal);
  }

  function openInspectionModal() {
    const state = StaySyncStore.getState();
    const sortedRooms = [...state.rooms].sort((a, b) => {
      if (a.status === "Vacant & Clean" && b.status !== "Vacant & Clean") return -1;
      if (b.status === "Vacant & Clean" && a.status !== "Vacant & Clean") return 1;
      return a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true });
    });

    StaySyncUI.openModal({
      title: "Room Quality Inspection",
      subtitle: "Failed or re-cleaning results automatically create a high-priority re-cleaning task",
      html: `
        <form id="inspection-form">
          <div class="form-grid">
            <div class="form-field">
              <label for="inf-room">Select Room *</label>
              <select id="inf-room" class="select-control" required>
                ${sortedRooms
                  .map(
                    (r) =>
                      `<option value="${r.roomNumber}">Room ${r.roomNumber} (${StaySyncUI.escapeHtml(
                        r.status
                      )})</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="inf-result">Inspection Result *</label>
              <select id="inf-result" class="select-control" required>
                <option value="Passed">Passed</option>
                <option value="Failed">Failed</option>
                <option value="Requires Re-cleaning">Requires Re-cleaning</option>
              </select>
            </div>
          </div>

          <div style="margin-top:16px">
            <label style="font-size:12.5px;font-weight:500;display:block;margin-bottom:6px">
              8-Point Housekeeping Inspection Checklist
            </label>
            <div class="checklist-grid">
              ${INSPECTION_CHECKLIST_ITEMS.map(
                (item) => `
                <label class="checklist-item">
                  <input type="checkbox" name="chk-${item.key}" checked />
                  <span>${StaySyncUI.escapeHtml(item.label)}</span>
                </label>
              `
              ).join("")}
            </div>
          </div>

          <div class="form-field full">
            <label for="inf-notes">Inspector Notes</label>
            <textarea id="inf-notes" class="textarea-control" placeholder="Record observations or corrective actions..."></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="inf-cancel">Cancel</button>
            <button type="submit" class="btn-accent">Submit Inspection</button>
          </div>
        </form>
      `,
      onRender: (body) => {
        const resultSelect = body.querySelector("#inf-result");
        const checkboxes = body.querySelectorAll('input[type="checkbox"]');

        // Automatically suggest Failed when any checklist item is unchecked
        checkboxes.forEach((cb) => {
          cb.addEventListener("change", () => {
            const allChecked = Array.from(checkboxes).every((c) => c.checked);
            if (!allChecked && resultSelect.value === "Passed") {
              resultSelect.value = "Requires Re-cleaning";
            } else if (allChecked) {
              resultSelect.value = "Passed";
            }
          });
        });

        body.querySelector("#inf-cancel").addEventListener("click", StaySyncUI.closeModal);
        body.querySelector("#inspection-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const checklist = {};
          INSPECTION_CHECKLIST_ITEMS.forEach((item) => {
            checklist[item.key] = body.querySelector(`input[name="chk-${item.key}"]`).checked;
          });

          const outcome = StaySyncStore.createInspection({
            roomNumber: body.querySelector("#inf-room").value,
            inspectorName: currentUser.name,
            result: resultSelect.value,
            notes: body.querySelector("#inf-notes").value,
            checklist
          });

          StaySyncUI.closeModal();
          updateNotificationIndicators();
          if (outcome.autoTask) {
            StaySyncUI.toast(
              `Inspection ${outcome.inspection.result}. Auto-created re-cleaning task ${outcome.autoTask.id}.`,
              "info"
            );
          } else {
            StaySyncUI.toast(
              `Room ${outcome.inspection.roomNumber} passed inspection and is now Inspected.`,
              "success"
            );
          }
          renderInspections();
        });
      }
    });
  }

  /* ===================================================================
     6. MAINTENANCE REQUESTS MODULE
     =================================================================== */

  function renderMaintenance() {
    const state = StaySyncStore.getState();
    const p = perms();

    const filtered = state.maintenance.filter((m) => {
      const q = filters.maintenance.search.toLowerCase();
      const matchSearch =
        !q ||
        m.id.toLowerCase().includes(q) ||
        m.roomNumber.toLowerCase().includes(q) ||
        m.issue.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.reporter.toLowerCase().includes(q);
      const matchStatus =
        filters.maintenance.status === "all" || m.status === filters.maintenance.status;
      const matchPriority =
        filters.maintenance.priority === "all" || m.priority === filters.maintenance.priority;
      return matchSearch && matchStatus && matchPriority;
    });

    el.viewContainer.innerHTML = `
      <div class="section-toolbar">
        <div class="filter-group">
          <input id="maint-search" class="input-control" type="text" placeholder="Search room, issue, reporter..." value="${StaySyncUI.escapeHtml(
            filters.maintenance.search
          )}" />
          <select id="maint-status-filter" class="select-control">
            <option value="all">All Statuses</option>
            ${MAINTENANCE_STATUSES.map(
              (s) =>
                `<option value="${s}" ${
                  filters.maintenance.status === s ? "selected" : ""
                }>${s}</option>`
            ).join("")}
          </select>
          <select id="maint-priority-filter" class="select-control">
            <option value="all">All Priorities</option>
            ${["Low", "Medium", "High", "Critical"]
              .map(
                (pr) =>
                  `<option value="${pr}" ${
                    filters.maintenance.priority === pr ? "selected" : ""
                  }>${pr}</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="filter-group">
          <button id="add-maint-btn" class="btn-accent"><i data-lucide="plus"></i> Report Issue</button>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Room</th>
                <th>Issue & Description</th>
                <th>Priority</th>
                <th>Reporter</th>
                <th>Status</th>
                <th style="text-align:right">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
                filtered.length
                  ? filtered
                      .map(
                        (m) => `
                  <tr>
                    <td class="mono">${StaySyncUI.escapeHtml(m.id)}</td>
                    <td class="mono">Room ${StaySyncUI.escapeHtml(m.roomNumber)}</td>
                    <td>
                      <div style="font-weight:500">${StaySyncUI.escapeHtml(m.issue)}</div>
                      <div class="text-muted">${StaySyncUI.escapeHtml(m.description)}</div>
                    </td>
                    <td>${StaySyncUI.renderBadge(m.priority)}</td>
                    <td>
                      <div>${StaySyncUI.escapeHtml(m.reporter)}</div>
                      <div class="text-muted">${StaySyncUI.escapeHtml(m.createdAt)}</div>
                    </td>
                    <td>${StaySyncUI.renderBadge(m.status)}</td>
                    <td>
                      <div class="table-actions">
                        ${
                          p.canManageMaintenance && m.status !== "Resolved"
                            ? `<button class="btn-secondary btn-sm maint-resolve-btn" data-id="${m.id}">Mark Resolved</button>`
                            : ""
                        }
                        ${
                          p.canManageMaintenance
                            ? `<button class="icon-btn maint-edit-btn" data-id="${m.id}" title="Edit"><i data-lucide="pencil"></i></button>`
                            : ""
                        }
                        ${
                          p.canDeleteMaintenance
                            ? `<button class="icon-btn danger maint-del-btn" data-id="${m.id}" title="Delete"><i data-lucide="trash-2"></i></button>`
                            : ""
                        }
                      </div>
                    </td>
                  </tr>
                `
                      )
                      .join("")
                  : `<tr><td colspan="7"><div class="empty-state"><strong>No maintenance requests</strong><p>All equipment and room systems are operating normally.</p></div></td></tr>`
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById("maint-search").addEventListener("input", (e) => {
      filters.maintenance.search = e.target.value;
      renderMaintenance();
    });
    document.getElementById("maint-status-filter").addEventListener("change", (e) => {
      filters.maintenance.status = e.target.value;
      renderMaintenance();
    });
    document.getElementById("maint-priority-filter").addEventListener("change", (e) => {
      filters.maintenance.priority = e.target.value;
      renderMaintenance();
    });

    document.getElementById("add-maint-btn").addEventListener("click", () => openMaintenanceModal(null));

    el.viewContainer.querySelectorAll(".maint-resolve-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const updated = StaySyncStore.updateMaintenanceStatus(btn.dataset.id, "Resolved");
        if (updated) {
          StaySyncUI.toast(
            `${updated.id} resolved. Room ${updated.roomNumber} status updated.`,
            "success"
          );
          renderMaintenance();
        }
      });
    });

    el.viewContainer.querySelectorAll(".maint-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openMaintenanceModal(btn.dataset.id));
    });

    el.viewContainer.querySelectorAll(".maint-del-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        StaySyncUI.confirm({
          title: "Delete Maintenance Ticket",
          message: `Permanently delete maintenance ticket ${btn.dataset.id}?`,
          confirmLabel: "Delete",
          onConfirm: () => {
            StaySyncStore.deleteMaintenance(btn.dataset.id);
            StaySyncUI.toast(`Ticket ${btn.dataset.id} deleted.`, "success");
            renderMaintenance();
          }
        });
      });
    });
  }

  function openMaintenanceModal(editId) {
    const state = StaySyncStore.getState();
    const ticket = editId ? state.maintenance.find((m) => m.id === editId) : null;

    StaySyncUI.openModal({
      title: ticket ? `Edit Maintenance ${ticket.id}` : "Report Maintenance Issue",
      subtitle: "Critical unresolved tickets automatically set the room to Under Maintenance",
      html: `
        <form id="maint-form">
          <div class="form-grid">
            <div class="form-field">
              <label for="mf-room">Room Number *</label>
              <select id="mf-room" class="select-control" required>
                ${state.rooms
                  .map(
                    (r) =>
                      `<option value="${r.roomNumber}" ${
                        ticket?.roomNumber === r.roomNumber ? "selected" : ""
                      }>Room ${r.roomNumber} (Floor ${r.floor})</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="mf-issue">Issue Category *</label>
              <select id="mf-issue" class="select-control" required>
                ${MAINTENANCE_ISSUES.map(
                  (iss) =>
                    `<option value="${iss}" ${ticket?.issue === iss ? "selected" : ""}>${iss}</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="mf-priority">Priority *</label>
              <select id="mf-priority" class="select-control" required>
                ${["Low", "Medium", "High", "Critical"]
                  .map(
                    (pr) =>
                      `<option value="${pr}" ${
                        (ticket?.priority || "Medium") === pr ? "selected" : ""
                      }>${pr}</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="form-field">
              <label for="mf-status">Status *</label>
              <select id="mf-status" class="select-control" required ${
                !perms().canManageMaintenance && !ticket ? "disabled" : ""
              }>
                ${MAINTENANCE_STATUSES.map(
                  (st) =>
                    `<option value="${st}" ${
                      (ticket?.status || "Reported") === st ? "selected" : ""
                    }>${st}</option>`
                ).join("")}
              </select>
            </div>
            <div class="form-field full">
              <label for="mf-desc">Issue Description *</label>
              <textarea id="mf-desc" class="textarea-control" required placeholder="Describe the fault clearly...">${StaySyncUI.escapeHtml(
                ticket?.description || ""
              )}</textarea>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" id="mf-cancel">Cancel</button>
            <button type="submit" class="btn-accent">${
              ticket ? "Save Ticket" : "Submit Request"
            }</button>
          </div>
        </form>
      `,
      onRender: (body) => {
        body.querySelector("#mf-cancel").addEventListener("click", StaySyncUI.closeModal);
        body.querySelector("#maint-form").addEventListener("submit", (e) => {
          e.preventDefault();
          const res = StaySyncStore.saveMaintenance(
            {
              roomNumber: body.querySelector("#mf-room").value,
              issue: body.querySelector("#mf-issue").value,
              priority: body.querySelector("#mf-priority").value,
              status: body.querySelector("#mf-status").value,
              description: body.querySelector("#mf-desc").value,
              reporter: ticket ? ticket.reporter : currentUser.name
            },
            editId
          );

          if (res.error) {
            StaySyncUI.toast(res.error, "error");
            return;
          }
          StaySyncUI.closeModal();
          updateNotificationIndicators();
          StaySyncUI.toast(
            ticket
              ? `Ticket ${res.maintenance.id} updated.`
              : `Reported ${res.maintenance.issue} for Room ${res.maintenance.roomNumber}.`,
            "success"
          );
          renderMaintenance();
        });
      }
    });
  }

  /* ===================================================================
     7. NOTIFICATIONS MODULE
     =================================================================== */

  function renderNotifications() {
    const notifications = StaySyncStore.getState().notifications;
    const unreadCount = StaySyncStore.getUnreadNotificationCount();

    const iconForType = (type) => {
      switch (type) {
        case "Task Assignment":
          return "clipboard-list";
        case "Completed Task":
          return "check-circle-2";
        case "Failed Inspection":
          return "alert-triangle";
        case "Maintenance":
          return "wrench";
        case "Deadline":
          return "clock";
        default:
          return "bell";
      }
    };

    el.viewContainer.innerHTML = `
      <div class="section-toolbar">
        <div class="filter-group">
          <span class="text-muted"><strong style="color:var(--text-primary)">${unreadCount}</strong> unread notification(s)</span>
        </div>
        <div class="filter-group">
          <button id="mark-all-read-btn" class="btn-secondary">Mark All Read</button>
          <button id="clear-read-btn" class="btn-ghost">Clear Read</button>
        </div>
      </div>

      <div class="card">
        ${
          notifications.length
            ? notifications
                .map(
                  (n) => `
            <div class="notif-item ${n.read ? "" : "unread"}">
              <div class="notif-left">
                <div class="notif-icon-wrap ${n.read ? "" : "accent"}">
                  <i data-lucide="${iconForType(n.type)}"></i>
                </div>
                <div>
                  <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
                    <strong style="font-size:13.5px">${StaySyncUI.escapeHtml(n.title)}</strong>
                    ${StaySyncUI.renderBadge(n.type)}
                  </div>
                  <p style="margin:4px 0 4px;color:var(--text-secondary);font-size:13px">${StaySyncUI.escapeHtml(
                    n.message
                  )}</p>
                  <span class="text-muted" style="font-size:11.5px">${StaySyncUI.escapeHtml(
                    n.timestamp
                  )}</span>
                </div>
              </div>
              <div>
                ${
                  !n.read
                    ? `<button class="btn-secondary btn-sm notif-read-btn" data-id="${n.id}">Mark Read</button>`
                    : `<span class="text-muted" style="font-size:12px">Read</span>`
                }
              </div>
            </div>
          `
                )
                .join("")
            : `<div class="empty-state"><strong>You're all caught up</strong><p>No active notifications at the moment.</p></div>`
        }
      </div>
    `;

    document.getElementById("mark-all-read-btn").addEventListener("click", () => {
      StaySyncStore.markAllNotificationsRead();
      updateNotificationIndicators();
      StaySyncUI.toast("All notifications marked as read.", "success");
      renderNotifications();
    });

    document.getElementById("clear-read-btn").addEventListener("click", () => {
      StaySyncStore.clearReadNotifications();
      StaySyncUI.toast("Cleared read notifications.", "info");
      renderNotifications();
    });

    el.viewContainer.querySelectorAll(".notif-read-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        StaySyncStore.markNotificationRead(btn.dataset.id);
        updateNotificationIndicators();
        renderNotifications();
      });
    });
  }

  /* ===================================================================
     8. REPORTS & ANALYTICS MODULE (Chart.js + CSV Exports)
     =================================================================== */

  function renderReports() {
    const state = StaySyncStore.getState();
    const stats = StaySyncStore.getDashboardStats();
    const passedInsp = state.inspections.filter((i) => i.result === "Passed").length;
    const passRate = state.inspections.length
      ? Math.round((passedInsp / state.inspections.length) * 100)
      : 100;
    const openMaint = state.maintenance.filter((m) => m.status !== "Resolved").length;

    el.viewContainer.innerHTML = `
      <div class="section-toolbar">
        <div class="filter-group">
          <span class="text-muted">Export live datasets in CSV format</span>
        </div>
        <div class="filter-group">
          <button id="exp-rooms-csv" class="btn-secondary"><i data-lucide="download"></i> Export Rooms CSV</button>
          <button id="exp-tasks-csv" class="btn-secondary"><i data-lucide="download"></i> Export Tasks CSV</button>
          <button id="exp-staff-csv" class="btn-secondary"><i data-lucide="download"></i> Staff Productivity CSV</button>
          <button id="exp-maint-csv" class="btn-primary"><i data-lucide="download"></i> Maintenance CSV</button>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-top"><span class="kpi-label">Inspection Pass Rate</span></div>
          <div class="kpi-value">${passRate}%</div>
          <div class="kpi-foot">${passedInsp} of ${state.inspections.length} passed</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><span class="kpi-label">Room Availability</span></div>
          <div class="kpi-value">${
            stats.total ? Math.round((stats.available / stats.total) * 100) : 0
          }%</div>
          <div class="kpi-foot">${stats.available} ready rooms</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><span class="kpi-label">Tasks Completed</span></div>
          <div class="kpi-value">${
            state.tasks.filter((t) => ["Completed", "Verified"].includes(t.status)).length
          }</div>
          <div class="kpi-foot">of ${state.tasks.length} total tasks</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-top"><span class="kpi-label">Open Maintenance</span></div>
          <div class="kpi-value">${openMaint}</div>
          <div class="kpi-foot">${state.maintenance.length} total logged tickets</div>
        </div>
      </div>

      <div class="dashboard-grid-equal">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Monthly Cleaning Volume</h3>
              <p class="card-subtitle">Total rooms cleaned over the last 6 months</p>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-box"><canvas id="rep-monthly-chart"></canvas></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Staff Productivity</h3>
              <p class="card-subtitle">Completed housekeeping tasks by staff member</p>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-box"><canvas id="rep-staff-chart"></canvas></div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid-equal">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Room Availability Breakdown</h3>
              <p class="card-subtitle">Live operational state of hotel inventory</p>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-box"><canvas id="rep-rooms-chart"></canvas></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Maintenance by Category</h3>
              <p class="card-subtitle">Frequency of reported engineering issues</p>
            </div>
          </div>
          <div class="card-body">
            <div class="chart-box"><canvas id="rep-maint-chart"></canvas></div>
          </div>
        </div>
      </div>
    `;

    // CSV Export Handlers
    document.getElementById("exp-rooms-csv").addEventListener("click", () => {
      StaySyncStore.exportToCSV(
        "staysync-rooms.csv",
        ["Room Number", "Floor", "Type", "Occupancy", "Cleaning Status", "Status", "Assigned Staff", "Last Cleaned", "Special Instructions"],
        state.rooms.map((r) => [
          r.roomNumber,
          r.floor,
          r.type,
          r.occupancyStatus,
          r.cleaningStatus,
          r.status,
          StaySyncStore.getStaffName(r.assignedStaffId),
          r.lastCleaned,
          r.specialInstructions
        ])
      );
      StaySyncUI.toast("Exported staysync-rooms.csv", "success");
    });

    document.getElementById("exp-tasks-csv").addEventListener("click", () => {
      StaySyncStore.exportToCSV(
        "staysync-tasks.csv",
        ["Task ID", "Room", "Task Type", "Assigned Staff", "Priority", "Deadline", "Status", "Description"],
        state.tasks.map((t) => [
          t.id,
          t.roomNumber,
          t.type,
          StaySyncStore.getStaffName(t.assignedStaffId),
          t.priority,
          t.deadline,
          t.status,
          t.description
        ])
      );
      StaySyncUI.toast("Exported staysync-tasks.csv", "success");
    });

    document.getElementById("exp-staff-csv").addEventListener("click", () => {
      StaySyncStore.exportToCSV(
        "staysync-staff-productivity.csv",
        ["Employee ID", "Name", "Role", "Assigned Floor", "Shift", "Availability", "Active Tasks", "Completed Tasks"],
        state.staff.map((st) => [
          st.id,
          st.name,
          st.role,
          st.assignedFloor,
          st.shift,
          st.availability,
          StaySyncStore.getStaffAssignedTaskCount(st.id),
          st.completedTasks || 0
        ])
      );
      StaySyncUI.toast("Exported staysync-staff-productivity.csv", "success");
    });

    document.getElementById("exp-maint-csv").addEventListener("click", () => {
      StaySyncStore.exportToCSV(
        "staysync-maintenance.csv",
        ["Ticket ID", "Room", "Issue", "Priority", "Reporter", "Status", "Reported At", "Description"],
        state.maintenance.map((m) => [
          m.id,
          m.roomNumber,
          m.issue,
          m.priority,
          m.reporter,
          m.status,
          m.createdAt,
          m.description
        ])
      );
      StaySyncUI.toast("Exported staysync-maintenance.csv", "success");
    });

    initReportCharts();
  }

  function initReportCharts() {
    if (typeof Chart === "undefined") return;
    const state = StaySyncStore.getState();

    // 1. Monthly Cleaning Line Chart
    const monthlyCtx = document.getElementById("rep-monthly-chart");
    if (monthlyCtx) {
      chartInstances.push(
        new Chart(monthlyCtx, {
          type: "line",
          data: {
            labels: state.performanceHistory.monthlyLabels,
            datasets: [
              {
                label: "Rooms Cleaned",
                data: state.performanceHistory.monthlyRoomsCleaned,
                borderColor: "#E58A42",
                backgroundColor: "rgba(229, 138, 66, 0.08)",
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: "#E58A42"
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#777777" } },
              y: { grid: { color: "#F0F0F0" }, ticks: { color: "#777777" } }
            }
          }
        })
      );
    }

    // 2. Staff Productivity Horizontal Bar
    const staffCtx = document.getElementById("rep-staff-chart");
    if (staffCtx) {
      chartInstances.push(
        new Chart(staffCtx, {
          type: "bar",
          data: {
            labels: state.staff.map((s) => s.name),
            datasets: [
              {
                label: "Completed Tasks",
                data: state.staff.map((s) => s.completedTasks || 0),
                backgroundColor: "#202020",
                borderRadius: 6,
                barPercentage: 0.55
              }
            ]
          },
          options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { beginAtZero: true, grid: { color: "#F0F0F0" }, ticks: { color: "#777777" } },
              y: { grid: { display: false }, ticks: { color: "#202020" } }
            }
          }
        })
      );
    }

    // 3. Room Availability Doughnut
    const roomCtx = document.getElementById("rep-rooms-chart");
    if (roomCtx) {
      const counts = ROOM_STATUSES.map(
        (st) => state.rooms.filter((r) => r.status === st).length
      );
      chartInstances.push(
        new Chart(roomCtx, {
          type: "doughnut",
          data: {
            labels: ROOM_STATUSES,
            datasets: [
              {
                data: counts,
                backgroundColor: [
                  "#202020",
                  "#5C5C5C",
                  "#E58A42",
                  "#8C8C8C",
                  "#F1B98A",
                  "#B8B8B8",
                  "#C94A38"
                ],
                borderWidth: 2,
                borderColor: "#FFFFFF"
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "66%",
            plugins: {
              legend: {
                position: "right",
                labels: { boxWidth: 10, usePointStyle: true, color: "#555555", font: { size: 12 } }
              }
            }
          }
        })
      );
    }

    // 4. Maintenance Categories Bar
    const maintCtx = document.getElementById("rep-maint-chart");
    if (maintCtx) {
      const mCounts = MAINTENANCE_ISSUES.map(
        (iss) => state.maintenance.filter((m) => m.issue === iss).length
      );
      chartInstances.push(
        new Chart(maintCtx, {
          type: "bar",
          data: {
            labels: MAINTENANCE_ISSUES,
            datasets: [
              {
                label: "Tickets",
                data: mCounts,
                backgroundColor: "#E58A42",
                borderRadius: 6,
                barPercentage: 0.5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { color: "#777777", font: { size: 11 } } },
              y: {
                beginAtZero: true,
                grid: { color: "#F0F0F0" },
                ticks: { stepSize: 1, color: "#777777" }
              }
            }
          }
        })
      );
    }
  }

  /* ===================================================================
     9. SETTINGS & RESET DEMO DATA MODULE
     =================================================================== */

  function renderSettings() {
    const state = StaySyncStore.getState();
    const p = perms();

    el.viewContainer.innerHTML = `
      <div class="settings-grid">
        <div class="card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Hotel Property Information</h3>
              <p class="card-subtitle">General operational configuration stored in this browser</p>
            </div>
          </div>
          <div class="card-body">
            <form id="hotel-settings-form">
              <div class="form-grid">
                <div class="form-field full">
                  <label for="hs-name">Hotel Name</label>
                  <input id="hs-name" class="input-control" type="text" required ${
                    p.canEditHotelSettings ? "" : "disabled"
                  } value="${StaySyncUI.escapeHtml(state.hotel.name)}" />
                </div>
                <div class="form-field">
                  <label for="hs-code">Property Code</label>
                  <input id="hs-code" class="input-control" type="text" required ${
                    p.canEditHotelSettings ? "" : "disabled"
                  } value="${StaySyncUI.escapeHtml(state.hotel.propertyCode)}" />
                </div>
                <div class="form-field">
                  <label for="hs-floors">Total Floors</label>
                  <input id="hs-floors" class="input-control" type="number" min="1" required ${
                    p.canEditHotelSettings ? "" : "disabled"
                  } value="${state.hotel.floors}" />
                </div>
                <div class="form-field">
                  <label for="hs-checkout">Checkout Time</label>
                  <input id="hs-checkout" class="input-control" type="time" ${
                    p.canEditHotelSettings ? "" : "disabled"
                  } value="${StaySyncUI.escapeHtml(state.hotel.checkoutTime)}" />
                </div>
                <div class="form-field">
                  <label for="hs-checkin">Check-in Time</label>
                  <input id="hs-checkin" class="input-control" type="time" ${
                    p.canEditHotelSettings ? "" : "disabled"
                  } value="${StaySyncUI.escapeHtml(state.hotel.checkinTime)}" />
                </div>
                <div class="form-field full">
                  <label for="hs-email">Housekeeping Desk Email</label>
                  <input id="hs-email" class="input-control" type="email" required ${
                    p.canEditHotelSettings ? "" : "disabled"
                  } value="${StaySyncUI.escapeHtml(state.hotel.contactEmail)}" />
                </div>
                <div class="form-field full">
                  <label for="hs-address">Property Address</label>
                  <input id="hs-address" class="input-control" type="text" required ${
                    p.canEditHotelSettings ? "" : "disabled"
                  } value="${StaySyncUI.escapeHtml(state.hotel.address)}" />
                </div>
              </div>
              <div class="modal-actions" style="border-top:none;padding-top:8px">
                ${
                  p.canEditHotelSettings
                    ? `<button type="submit" class="btn-accent">Save Hotel Settings</button>`
                    : `<span class="text-muted">Only Administrators can modify hotel settings.</span>`
                }
              </div>
            </form>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px">
          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Current Session</h3>
                <p class="card-subtitle">Active account & role permissions</p>
              </div>
            </div>
            <div class="card-body">
              <div class="detail-grid">
                <div class="detail-box">
                  <div class="detail-label">Name</div>
                  <div class="detail-value">${StaySyncUI.escapeHtml(currentUser.name)}</div>
                </div>
                <div class="detail-box">
                  <div class="detail-label">User ID</div>
                  <div class="detail-value mono">${StaySyncUI.escapeHtml(currentUser.userId)}</div>
                </div>
                <div class="detail-box full">
                  <div class="detail-label">Role</div>
                  <div class="detail-value">${StaySyncUI.renderBadge(currentUser.role)}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Demo Data & Local Storage</h3>
                <p class="card-subtitle">Browser-local persistence initialized from js/demo-data.js</p>
              </div>
            </div>
            <div class="card-body">
              <p class="text-muted" style="margin-top:0">
                All rooms, tasks, staff, inspections, and maintenance changes are saved in this browser's
                LocalStorage. Data is device-specific and does not sync across separate browsers.
              </p>
              <button id="reset-demo-btn" class="btn-danger" ${
                p.canResetData ? "" : "disabled title='Administrator only'"
              }>
                <i data-lucide="rotate-ccw"></i> Reset Demo Data
              </button>
              ${
                !p.canResetData
                  ? `<p class="text-muted" style="margin-top:8px">Sign in as an Administrator (12629947) to reset the shared demo dataset.</p>`
                  : ""
              }
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3 class="card-title">Default Demo Credentials</h3>
                <p class="card-subtitle">Shared reference accounts</p>
              </div>
            </div>
            <div class="card-body" style="padding:0">
              <table class="cred-table">
                <thead>
                  <tr><th>User ID</th><th>Password</th><th>Role</th></tr>
                </thead>
                <tbody>
                  ${demoData.users
                    .map(
                      (u) => `
                    <tr>
                      <td class="mono">${u.userId}</td>
                      <td class="mono">${u.password}</td>
                      <td>${u.role}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById("hotel-settings-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!p.canEditHotelSettings) return;
      StaySyncStore.updateHotelSettings({
        name: document.getElementById("hs-name").value,
        propertyCode: document.getElementById("hs-code").value,
        floors: document.getElementById("hs-floors").value,
        checkoutTime: document.getElementById("hs-checkout").value,
        checkinTime: document.getElementById("hs-checkin").value,
        contactEmail: document.getElementById("hs-email").value,
        address: document.getElementById("hs-address").value
      });
      updateShellUserChrome();
      StaySyncUI.toast("Hotel settings saved.", "success");
    });

    const resetBtn = document.getElementById("reset-demo-btn");
    if (resetBtn && p.canResetData) {
      resetBtn.addEventListener("click", () => {
        StaySyncUI.confirm({
          title: "Reset Demo Data",
          message:
            "This will erase all custom rooms, tasks, staff edits, inspections, and tickets in this browser and restore the default dataset from js/demo-data.js. Continue?",
          confirmLabel: "Reset All Data",
          onConfirm: () => {
            StaySyncStore.resetDemoData();
            StaySyncUI.toast("Demo data restored to defaults.", "success");
            renderCurrentView();
          }
        });
      });
    }
  }

  return {
    mount,
    navigate
  };
})();