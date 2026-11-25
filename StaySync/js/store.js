/* =====================================================================
   SyncStay — LOCALSTORAGE STATE MANAGER & BUSINESS LOGIC ENGINE
   Handles initialization, persistence, cross-module sync & CSV export
   ===================================================================== */

const SyncStayStore = (() => {
  const DATA_KEY = "SyncStay_data_v1";
  const SESSION_KEY = "SyncStay_session_v1";

  let state = null;

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function nowTimestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  }

  function save() {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(state));
    } catch (err) {
      console.error("Failed to save SyncStay state to LocalStorage:", err);
    }
  }

  function init() {
    try {
      const saved = localStorage.getItem(DATA_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.rooms)) {
          state = parsed;
          return state;
        }
      }
    } catch (err) {
      console.warn("Corrupted LocalStorage data detected; reinitializing.", err);
    }
    state = deepClone(demoData);
    save();
    return state;
  }

  function resetDemoData() {
    state = deepClone(demoData);
    save();
    return state;
  }

  function getState() {
    if (!state) init();
    return state;
  }

  /* ---------- Session Persistence ---------- */

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      const user = getState().users.find((u) => u.userId === session.userId);
      return user ? { ...user } : null;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        userId: user.userId,
        name: user.name,
        role: user.role,
        loggedInAt: nowTimestamp()
      })
    );
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /* ---------- Role Permissions ---------- */

  function getPermissions(role) {
    const isAdmin = role === "Administrator";
    const isManager = role === "Housekeeping Manager";
    const isStaff = role === "Housekeeping Staff";

    return {
      isAdmin,
      isManager,
      isStaff,
      canManageRooms: isAdmin || isManager,
      canDeleteRooms: isAdmin,
      canManageTasks: isAdmin || isManager,
      canVerifyTasks: isAdmin || isManager,
      canManageStaff: isAdmin || isManager,
      canDeleteStaff: isAdmin,
      canInspectRooms: isAdmin || isManager,
      canManageMaintenance: isAdmin || isManager,
      canDeleteMaintenance: isAdmin,
      canEditHotelSettings: isAdmin,
      canResetData: isAdmin
    };
  }

  /* ---------- Activity & Notification Helpers ---------- */

  function addActivity(action, detail) {
    const s = getState();
    s.activities.unshift({
      id: "ACT-" + Date.now().toString().slice(-5),
      action,
      detail,
      timestamp: nowTimestamp()
    });
    if (s.activities.length > 40) s.activities.pop();
    save();
  }

  function addNotification(type, title, message) {
    const s = getState();
    s.notifications.unshift({
      id: "NTF-" + Date.now().toString().slice(-6),
      type,
      title,
      message,
      timestamp: nowTimestamp(),
      read: false
    });
    save();
  }

  /* ---------- Helper Lookups ---------- */

  function getStaffName(staffId) {
    if (!staffId) return "Unassigned";
    const member = getState().staff.find((st) => st.id === staffId);
    return member ? member.name : "Unassigned";
  }

  function getStaffAssignedTaskCount(staffId) {
    return getState().tasks.filter(
      (t) =>
        t.assignedStaffId === staffId &&
        ["Pending", "Assigned", "In Progress"].includes(t.status)
    ).length;
  }

  function deriveRoomFieldsFromStatus(status, currentOccupancy) {
    switch (status) {
      case "Available":
        return { occupancyStatus: "Vacant", cleaningStatus: "Clean" };
      case "Occupied":
        return { occupancyStatus: "Occupied", cleaningStatus: "Clean" };
      case "Vacant & Dirty":
        return { occupancyStatus: "Vacant", cleaningStatus: "Dirty" };
      case "Vacant & Clean":
        return { occupancyStatus: "Vacant", cleaningStatus: "Clean" };
      case "Cleaning":
        return {
          occupancyStatus: currentOccupancy || "Vacant",
          cleaningStatus: "In Progress"
        };
      case "Inspected":
        return { occupancyStatus: "Vacant", cleaningStatus: "Inspected" };
      case "Under Maintenance":
        return { occupancyStatus: "Vacant", cleaningStatus: "Maintenance" };
      default:
        return {
          occupancyStatus: currentOccupancy || "Vacant",
          cleaningStatus: "Clean"
        };
    }
  }

  /* ---------- Users & Auth ---------- */

  function authenticate(userId, password) {
    const cleanId = String(userId || "").trim();
    const user = getState().users.find(
      (u) =>
        (u.userId === cleanId ||
          u.name.toLowerCase() === cleanId.toLowerCase()) &&
        u.password === password
    );
    return user || null;
  }

  function registerUser({ username, email, password }) {
    const s = getState();
    const cleanName = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (s.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return { error: "An account with this email already exists." };
    }

    const generatedId = String(12630500 + s.users.length + Math.floor(Math.random() * 90));
    // Strictly never assign Administrator role to self-registered accounts
    const newUser = {
      userId: generatedId,
      password,
      name: cleanName,
      email: cleanEmail,
      role: "Housekeeping Staff"
    };

    s.users.push(newUser);
    s.staff.push({
      id: generatedId,
      name: cleanName,
      role: "Housekeeping Staff",
      contact: cleanEmail,
      assignedFloor: "Floor 1",
      shift: "Morning (07:00 - 15:00)",
      availability: "Available",
      completedTasks: 0
    });

    addActivity("User Registered", `${cleanName} registered as Housekeeping Staff (${generatedId}).`);
    save();
    return { user: newUser };
  }

  /* ---------- Room CRUD ---------- */

  function saveRoom(roomData, originalRoomNumber = null) {
    const s = getState();
    const derived = deriveRoomFieldsFromStatus(roomData.status, roomData.occupancyStatus);
    const record = {
      roomNumber: String(roomData.roomNumber).trim(),
      floor: Number(roomData.floor),
      type: roomData.type.trim(),
      occupancyStatus: roomData.occupancyStatus || derived.occupancyStatus,
      cleaningStatus: roomData.cleaningStatus || derived.cleaningStatus,
      status: roomData.status,
      assignedStaffId: roomData.assignedStaffId || "",
      lastCleaned: roomData.lastCleaned || nowTimestamp(),
      specialInstructions: (roomData.specialInstructions || "").trim()
    };

    if (originalRoomNumber) {
      const idx = s.rooms.findIndex((r) => r.roomNumber === originalRoomNumber);
      if (idx === -1) return { error: "Room not found." };
      if (
        originalRoomNumber !== record.roomNumber &&
        s.rooms.some((r) => r.roomNumber === record.roomNumber)
      ) {
        return { error: `Room ${record.roomNumber} already exists.` };
      }
      s.rooms[idx] = record;
      addActivity("Room Updated", `Room ${record.roomNumber} updated (${record.status}).`);
    } else {
      if (s.rooms.some((r) => r.roomNumber === record.roomNumber)) {
        return { error: `Room ${record.roomNumber} already exists.` };
      }
      s.rooms.push(record);
      s.rooms.sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }));
      addActivity("Room Added", `Added Room ${record.roomNumber} (Floor ${record.floor} · ${record.type}).`);
    }

    save();
    return { room: record };
  }

  function deleteRoom(roomNumber) {
    const s = getState();
    s.rooms = s.rooms.filter((r) => r.roomNumber !== roomNumber);
    addActivity("Room Deleted", `Room ${roomNumber} removed from inventory.`);
    save();
  }

  /* ---------- Task CRUD & Room Status Sync ---------- */

  function syncRoomWithTask(task, prevStatus = null) {
    const s = getState();
    const room = s.rooms.find((r) => r.roomNumber === task.roomNumber);
    if (!room) return;

    // Preserve Under Maintenance if a critical unresolved maintenance ticket exists
    const hasCriticalMaint = s.maintenance.some(
      (m) => m.roomNumber === room.roomNumber && m.priority === "Critical" && m.status !== "Resolved"
    );

    if (task.assignedStaffId) {
      room.assignedStaffId = task.assignedStaffId;
    }

    if (hasCriticalMaint) return;

    if (task.status === "In Progress") {
      room.status = "Cleaning";
      room.cleaningStatus = "In Progress";
    } else if (task.status === "Completed") {
      room.status = "Vacant & Clean";
      room.cleaningStatus = "Clean";
      room.lastCleaned = nowTimestamp();

      if (prevStatus !== "Completed") {
        const staffMember = s.staff.find((st) => st.id === task.assignedStaffId);
        if (staffMember) staffMember.completedTasks = (staffMember.completedTasks || 0) + 1;
        addNotification(
          "Completed Task",
          `Task Completed — Room ${room.roomNumber}`,
          `${getStaffName(task.assignedStaffId)} completed ${task.type} (${task.id}). Ready for inspection.`
        );
      }
    } else if (task.status === "Verified") {
      room.status = "Inspected";
      room.cleaningStatus = "Inspected";
      room.occupancyStatus = "Vacant";
    }
  }

  function saveTask(taskData, editTaskId = null) {
    const s = getState();

    if (editTaskId) {
      const idx = s.tasks.findIndex((t) => t.id === editTaskId);
      if (idx === -1) return { error: "Task not found." };
      const prevStatus = s.tasks[idx].status;
      s.tasks[idx] = {
        ...s.tasks[idx],
        roomNumber: taskData.roomNumber,
        type: taskData.type,
        assignedStaffId: taskData.assignedStaffId,
        priority: taskData.priority,
        description: taskData.description.trim(),
        deadline: taskData.deadline,
        status: taskData.status
      };
      syncRoomWithTask(s.tasks[idx], prevStatus);
      addActivity("Task Updated", `${editTaskId} (Room ${taskData.roomNumber}) marked ${taskData.status}.`);
      save();
      return { task: s.tasks[idx] };
    }

    const nextNum = 1001 + s.tasks.length + Math.floor(Math.random() * 50);
    const newTask = {
      id: `TSK-${nextNum}`,
      roomNumber: taskData.roomNumber,
      type: taskData.type,
      assignedStaffId: taskData.assignedStaffId,
      priority: taskData.priority,
      description: taskData.description.trim(),
      deadline: taskData.deadline,
      status: taskData.status || (taskData.assignedStaffId ? "Assigned" : "Pending"),
      createdAt: nowTimestamp()
    };

    s.tasks.unshift(newTask);
    syncRoomWithTask(newTask, null);

    addNotification(
      "Task Assignment",
      `New Task Assigned — Room ${newTask.roomNumber}`,
      `${newTask.type} (${newTask.priority} priority) assigned to ${getStaffName(
        newTask.assignedStaffId
      )}.`
    );
    addActivity(
      "Task Created",
      `Created ${newTask.id}: ${newTask.type} for Room ${newTask.roomNumber}.`
    );
    save();
    return { task: newTask };
  }

  function updateTaskStatus(taskId, newStatus) {
    const s = getState();
    const task = s.tasks.find((t) => t.id === taskId);
    if (!task) return null;
    const prev = task.status;
    task.status = newStatus;
    syncRoomWithTask(task, prev);
    addActivity("Task Status Changed", `${task.id} (Room ${task.roomNumber}) moved to ${newStatus}.`);
    save();
    return task;
  }

  function deleteTask(taskId) {
    const s = getState();
    s.tasks = s.tasks.filter((t) => t.id !== taskId);
    addActivity("Task Deleted", `Task ${taskId} was removed.`);
    save();
  }

  /* ---------- Staff CRUD ---------- */

  function saveStaff(staffData, editId = null) {
    const s = getState();

    if (editId) {
      const idx = s.staff.findIndex((st) => st.id === editId);
      if (idx === -1) return { error: "Staff member not found." };
      s.staff[idx] = {
        ...s.staff[idx],
        name: staffData.name.trim(),
        role: staffData.role,
        contact: staffData.contact.trim(),
        assignedFloor: staffData.assignedFloor.trim(),
        shift: staffData.shift,
        availability: staffData.availability
      };
      // Keep user display name/role synced if linked account exists
      const linkedUser = s.users.find((u) => u.userId === editId);
      if (linkedUser) {
        linkedUser.name = s.staff[idx].name;
        linkedUser.role = s.staff[idx].role;
      }
      addActivity("Staff Updated", `Updated staff profile for ${s.staff[idx].name}.`);
      save();
      return { staff: s.staff[idx] };
    }

    const newId = staffData.id
      ? String(staffData.id).trim()
      : String(12630200 + s.staff.length + Math.floor(Math.random() * 90));

    if (s.staff.some((st) => st.id === newId)) {
      return { error: `Employee ID ${newId} already exists.` };
    }

    const member = {
      id: newId,
      name: staffData.name.trim(),
      role: staffData.role,
      contact: staffData.contact.trim(),
      assignedFloor: staffData.assignedFloor.trim(),
      shift: staffData.shift,
      availability: staffData.availability,
      completedTasks: 0
    };

    s.staff.push(member);
    addActivity("Staff Added", `${member.name} (${member.id}) joined as ${member.role}.`);
    save();
    return { staff: member };
  }

  function deleteStaff(staffId) {
    const s = getState();
    const target = s.staff.find((st) => st.id === staffId);
    s.staff = s.staff.filter((st) => st.id !== staffId);
    // Unassign open tasks from deleted staff
    s.tasks.forEach((t) => {
      if (t.assignedStaffId === staffId && !["Completed", "Verified"].includes(t.status)) {
        t.assignedStaffId = "";
        if (t.status === "Assigned") t.status = "Pending";
      }
    });
    if (target) {
      addActivity("Staff Removed", `${target.name} (${staffId}) was removed from staff roster.`);
    }
    save();
  }

  /* ---------- Room Inspections & Auto Re-cleaning Task ---------- */

  function createInspection({ roomNumber, inspectorName, result, notes, checklist }) {
    const s = getState();
    const record = {
      id: `INS-${305 + s.inspections.length}`,
      roomNumber,
      inspectorName,
      date: nowTimestamp(),
      result,
      notes: (notes || "").trim(),
      checklist
    };

    s.inspections.unshift(record);
    const room = s.rooms.find((r) => r.roomNumber === roomNumber);
    let autoTask = null;

    if (result === "Passed") {
      if (room && room.status !== "Under Maintenance") {
        room.status = "Inspected";
        room.cleaningStatus = "Inspected";
        room.occupancyStatus = "Vacant";
      }
      // Verify any completed tasks for this room
      s.tasks.forEach((t) => {
        if (t.roomNumber === roomNumber && t.status === "Completed") {
          t.status = "Verified";
        }
      });
      addActivity("Inspection Passed", `${inspectorName} passed Room ${roomNumber} (${record.id}).`);
    } else {
      // Failed or Requires Re-cleaning -> auto-generate re-cleaning task
      if (room && room.status !== "Under Maintenance") {
        room.status = "Vacant & Dirty";
        room.cleaningStatus = "Dirty";
      }

      const failedLabels = INSPECTION_CHECKLIST_ITEMS.filter((item) => !checklist[item.key]).map(
        (i) => i.label
      );

      const assigneeId =
        (room && room.assignedStaffId) ||
        (s.staff.find((st) => st.role === "Housekeeping Staff") || {}).id ||
        "";

      const deadlineDate = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const pad = (n) => String(n).padStart(2, "0");
      const deadlineStr = `${deadlineDate.getFullYear()}-${pad(deadlineDate.getMonth() + 1)}-${pad(
        deadlineDate.getDate()
      )} ${pad(deadlineDate.getHours())}:${pad(deadlineDate.getMinutes())}`;

      autoTask = {
        id: `TSK-${1010 + s.tasks.length + Math.floor(Math.random() * 40)}`,
        roomNumber,
        type: "Standard Cleaning",
        assignedStaffId: assigneeId,
        priority: "High",
        description: `Re-cleaning required after ${result.toLowerCase()} inspection (${record.id}). Issues: ${
          failedLabels.length ? failedLabels.join(", ") : record.notes || "Quality standards not met"
        }.`,
        deadline: deadlineStr,
        status: assigneeId ? "Assigned" : "Pending",
        createdAt: nowTimestamp()
      };

      s.tasks.unshift(autoTask);

      addNotification(
        "Failed Inspection",
        `Inspection ${result} — Room ${roomNumber}`,
        `Auto-generated re-cleaning task ${autoTask.id} assigned to ${getStaffName(assigneeId)}.`
      );
      addActivity(
        "Inspection Failed",
        `${inspectorName} marked Room ${roomNumber} as ${result}. Re-cleaning task ${autoTask.id} created.`
      );
    }

    save();
    return { inspection: record, autoTask };
  }

  /* ---------- Maintenance Requests & Critical Room Sync ---------- */

  function syncRoomMaintenanceState(roomNumber) {
    const s = getState();
    const room = s.rooms.find((r) => r.roomNumber === roomNumber);
    if (!room) return;

    const hasCriticalOpen = s.maintenance.some(
      (m) => m.roomNumber === roomNumber && m.priority === "Critical" && m.status !== "Resolved"
    );

    if (hasCriticalOpen) {
      room.status = "Under Maintenance";
      room.cleaningStatus = "Maintenance";
      room.occupancyStatus = "Vacant";
    } else if (room.status === "Under Maintenance") {
      // Returned from maintenance; needs cleaning before guest use
      room.status = "Vacant & Dirty";
      room.cleaningStatus = "Dirty";
    }
  }

  function saveMaintenance(data, editId = null) {
    const s = getState();

    if (editId) {
      const idx = s.maintenance.findIndex((m) => m.id === editId);
      if (idx === -1) return { error: "Maintenance request not found." };
      const oldRoom = s.maintenance[idx].roomNumber;
      s.maintenance[idx] = {
        ...s.maintenance[idx],
        roomNumber: data.roomNumber,
        issue: data.issue,
        description: data.description.trim(),
        priority: data.priority,
        status: data.status
      };
      syncRoomMaintenanceState(oldRoom);
      syncRoomMaintenanceState(data.roomNumber);
      addActivity(
        "Maintenance Updated",
        `${editId} (Room ${data.roomNumber}) status set to ${data.status}.`
      );
      save();
      return { maintenance: s.maintenance[idx] };
    }

    const record = {
      id: `MNT-${506 + s.maintenance.length}`,
      roomNumber: data.roomNumber,
      issue: data.issue,
      description: data.description.trim(),
      priority: data.priority,
      reporter: data.reporter,
      status: data.status || "Reported",
      createdAt: nowTimestamp()
    };

    s.maintenance.unshift(record);
    syncRoomMaintenanceState(record.roomNumber);

    addNotification(
      "Maintenance",
      `${record.priority} Maintenance — Room ${record.roomNumber}`,
      `${record.issue} reported by ${record.reporter}${
        record.priority === "Critical" ? " — room marked Under Maintenance." : "."
      }`
    );
    addActivity(
      "Maintenance Reported",
      `${record.reporter} reported ${record.issue} in Room ${record.roomNumber} (${record.priority}).`
    );

    save();
    return { maintenance: record };
  }

  function updateMaintenanceStatus(id, status) {
    const s = getState();
    const item = s.maintenance.find((m) => m.id === id);
    if (!item) return null;
    item.status = status;
    syncRoomMaintenanceState(item.roomNumber);
    addActivity("Maintenance Updated", `${item.id} (Room ${item.roomNumber}) marked ${status}.`);
    save();
    return item;
  }

  function deleteMaintenance(id) {
    const s = getState();
    const target = s.maintenance.find((m) => m.id === id);
    s.maintenance = s.maintenance.filter((m) => m.id !== id);
    if (target) {
      syncRoomMaintenanceState(target.roomNumber);
      addActivity("Maintenance Removed", `Maintenance ticket ${id} removed.`);
    }
    save();
  }

  /* ---------- Notifications ---------- */

  function markNotificationRead(id) {
    const item = getState().notifications.find((n) => n.id === id);
    if (item) {
      item.read = true;
      save();
    }
  }

  function markAllNotificationsRead() {
    getState().notifications.forEach((n) => (n.read = true));
    save();
  }

  function clearReadNotifications() {
    const s = getState();
    s.notifications = s.notifications.filter((n) => !n.read);
    save();
  }

  function getUnreadNotificationCount() {
    return getState().notifications.filter((n) => !n.read).length;
  }

  /* ---------- Hotel Settings ---------- */

  function updateHotelSettings(hotelData) {
    const s = getState();
    s.hotel = {
      ...s.hotel,
      name: hotelData.name.trim(),
      propertyCode: hotelData.propertyCode.trim(),
      floors: Number(hotelData.floors) || s.hotel.floors,
      address: hotelData.address.trim(),
      contactEmail: hotelData.contactEmail.trim(),
      checkoutTime: hotelData.checkoutTime,
      checkinTime: hotelData.checkinTime
    };
    addActivity("Settings Saved", `Hotel profile updated for ${s.hotel.name}.`);
    save();
    return s.hotel;
  }

  /* ---------- Live Computed Statistics ---------- */

  function getDashboardStats() {
    const rooms = getState().rooms;
    const total = rooms.length;
    const available = rooms.filter((r) =>
      ["Available", "Vacant & Clean", "Inspected"].includes(r.status)
    ).length;
    const occupied = rooms.filter((r) => r.status === "Occupied").length;
    const vacantDirty = rooms.filter((r) => r.status === "Vacant & Dirty").length;
    const cleaning = rooms.filter((r) => r.status === "Cleaning").length;
    const clean = rooms.filter((r) =>
      ["Available", "Vacant & Clean", "Inspected"].includes(r.status) ||
      (r.status === "Occupied" && r.cleaningStatus === "Clean")
    ).length;
    const maintenance = rooms.filter((r) => r.status === "Under Maintenance").length;

    return {
      total,
      available,
      occupied,
      vacantDirty,
      cleaning,
      clean,
      maintenance
    };
  }

  /* ---------- CSV Export Utility ---------- */

  function exportToCSV(filename, headers, rows) {
    const escapeCell = (val) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return /[",\n]/.test(str) ? `"${str}"` : str;
    };
    const csvLines = [
      headers.map(escapeCell).join(","),
      ...rows.map((row) => row.map(escapeCell).join(","))
    ];
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return {
    init,
    resetDemoData,
    getState,
    getSession,
    setSession,
    clearSession,
    getPermissions,
    authenticate,
    registerUser,
    getStaffName,
    getStaffAssignedTaskCount,
    saveRoom,
    deleteRoom,
    saveTask,
    updateTaskStatus,
    deleteTask,
    saveStaff,
    deleteStaff,
    createInspection,
    saveMaintenance,
    updateMaintenanceStatus,
    deleteMaintenance,
    markNotificationRead,
    markAllNotificationsRead,
    clearReadNotifications,
    getUnreadNotificationCount,
    updateHotelSettings,
    getDashboardStats,
    exportToCSV,
    nowTimestamp
  };
})();
