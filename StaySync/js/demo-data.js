/* =====================================================================
   SyncStay — CENTRALIZED JAVASCRIPT DEMO DATA
   Every account initializes from this exact shared dataset on first run.
   ===================================================================== */

const INSPECTION_CHECKLIST_ITEMS = [
  { key: "bedArranged", label: "Bed properly arranged" },
  { key: "bathroomCleaned", label: "Bathroom cleaned" },
  { key: "towelsReplaced", label: "Towels replaced" },
  { key: "freshLinen", label: "Fresh linen" },
  { key: "floorCleaned", label: "Floor cleaned" },
  { key: "dustRemoved", label: "Dust removed" },
  { key: "amenitiesReplenished", label: "Amenities replenished" },
  { key: "trashRemoved", label: "Trash removed" }
];

const demoData = {
  hotel: {
    name: "The Meridian Grand Hotel",
    propertyCode: "MGH-01",
    floors: 4,
    address: "420 Harborview Avenue, Downtown District",
    contactEmail: "housekeeping@meridiangrand.com",
    checkoutTime: "11:00",
    checkinTime: "15:00"
  },

  users: [
    {
      userId: "12629947",
      password: "SyncStay@321",
      name: "Elena Vance",
      email: "elena.vance@meridiangrand.com",
      role: "Administrator"
    },
    {
      userId: "12629949",
      password: "SyncStay@321",
      name: "Jeffy Einstein",
      email: "marcus.chen@meridiangrand.com",
      role: "Housekeeping Manager"
    },
    {
      userId: "12629686",
      password: "SyncStay@321",
      name: "Priya Sharma",
      email: "priya.sharma@meridiangrand.com",
      role: "Housekeeping Staff"
    },
    {
      userId: "12614967",
      password: "SyncStay@321",
      name: "David Morales",
      email: "david.morales@meridiangrand.com",
      role: "Housekeeping Staff"
    }
  ],

  staff: [
    {
      id: "12629947",
      name: "Elena Vance",
      role: "Administrator",
      contact: "+1 (555) 201-4400",
      assignedFloor: "All Floors",
      shift: "Morning (07:00 - 15:00)",
      availability: "Available",
      completedTasks: 18
    },
    {
      id: "12629949",
      name: "Jeffy Einstein",
      role: "Housekeeping Manager",
      contact: "+1 (555) 201-4412",
      assignedFloor: "All Floors",
      shift: "Morning (07:00 - 15:00)",
      availability: "Available",
      completedTasks: 34
    },
    {
      id: "12629686",
      name: "Priya Sharma",
      role: "Housekeeping Staff",
      contact: "+1 (555) 201-4428",
      assignedFloor: "Floor 1 & 2",
      shift: "Morning (07:00 - 15:00)",
      availability: "On Duty",
      completedTasks: 46
    },
    {
      id: "12614967",
      name: "David Morales",
      role: "Housekeeping Staff",
      contact: "+1 (555) 201-4435",
      assignedFloor: "Floor 3 & 4",
      shift: "Morning (07:00 - 15:00)",
      availability: "On Duty",
      completedTasks: 41
    },
    {
      id: "12630114",
      name: "Hannah Lindqvist",
      role: "Housekeeping Staff",
      contact: "+1 (555) 201-4451",
      assignedFloor: "Floor 2",
      shift: "Evening (15:00 - 23:00)",
      availability: "Available",
      completedTasks: 39
    },
    {
      id: "12630198",
      name: "Samuel Okafor",
      role: "Housekeeping Staff",
      contact: "+1 (555) 201-4469",
      assignedFloor: "Floor 4",
      shift: "Morning (07:00 - 15:00)",
      availability: "On Break",
      completedTasks: 29
    }
  ],

  rooms: [
    {
      roomNumber: "101",
      floor: 1,
      type: "Standard King",
      occupancyStatus: "Vacant",
      cleaningStatus: "Clean",
      status: "Available",
      assignedStaffId: "12629686",
      lastCleaned: "2026-11-24 08:30",
      specialInstructions: "Hypoallergenic pillows prepared."
    },
    {
      roomNumber: "102",
      floor: 1,
      type: "Standard Twin",
      occupancyStatus: "Occupied",
      cleaningStatus: "Clean",
      status: "Occupied",
      assignedStaffId: "12629686",
      lastCleaned: "2026-11-23 13:10",
      specialInstructions: "Do not disturb before 10:30 AM."
    },
    {
      roomNumber: "103",
      floor: 1,
      type: "Deluxe Queen",
      occupancyStatus: "Vacant",
      cleaningStatus: "Dirty",
      status: "Vacant & Dirty",
      assignedStaffId: "12629686",
      lastCleaned: "2026-11-22 14:20",
      specialInstructions: "Late checkout completed; full sanitization required."
    },
    {
      roomNumber: "104",
      floor: 1,
      type: "Accessible King",
      occupancyStatus: "Vacant",
      cleaningStatus: "Inspected",
      status: "Inspected",
      assignedStaffId: "12630114",
      lastCleaned: "2026-11-24 09:00",
      specialInstructions: "Ensure bath safety rails are sanitized."
    },
    {
      roomNumber: "201",
      floor: 2,
      type: "Deluxe King",
      occupancyStatus: "Vacant",
      cleaningStatus: "In Progress",
      status: "Cleaning",
      assignedStaffId: "12629686",
      lastCleaned: "2026-11-23 11:45",
      specialInstructions: "VIP arrival at 15:00 — add welcome fruit tray."
    },
    {
      roomNumber: "202",
      floor: 2,
      type: "Deluxe Twin",
      occupancyStatus: "Occupied",
      cleaningStatus: "Clean",
      status: "Occupied",
      assignedStaffId: "12630114",
      lastCleaned: "2026-11-24 09:40",
      specialInstructions: "Extra bath towels requested daily."
    },
    {
      roomNumber: "203",
      floor: 2,
      type: "Standard King",
      occupancyStatus: "Vacant",
      cleaningStatus: "Clean",
      status: "Vacant & Clean",
      assignedStaffId: "12630114",
      lastCleaned: "2026-11-24 10:15",
      specialInstructions: "Awaiting manager inspection."
    },
    {
      roomNumber: "204",
      floor: 2,
      type: "Executive Suite",
      occupancyStatus: "Vacant",
      cleaningStatus: "Maintenance",
      status: "Under Maintenance",
      assignedStaffId: "12629686",
      lastCleaned: "2026-11-23 12:00",
      specialInstructions: "HVAC unit replacement in progress."
    },
    {
      roomNumber: "301",
      floor: 3,
      type: "Deluxe King",
      occupancyStatus: "Occupied",
      cleaningStatus: "Clean",
      status: "Occupied",
      assignedStaffId: "12614967",
      lastCleaned: "2026-11-23 15:05",
      specialInstructions: "Evening turndown service at 19:00."
    },
    {
      roomNumber: "302",
      floor: 3,
      type: "Executive Suite",
      occupancyStatus: "Vacant",
      cleaningStatus: "Dirty",
      status: "Vacant & Dirty",
      assignedStaffId: "12614967",
      lastCleaned: "2026-11-22 10:50",
      specialInstructions: "Carpet spot treatment needed near lounge sofa."
    },
    {
      roomNumber: "303",
      floor: 3,
      type: "Standard Queen",
      occupancyStatus: "Vacant",
      cleaningStatus: "In Progress",
      status: "Cleaning",
      assignedStaffId: "12614967",
      lastCleaned: "2026-11-23 10:30",
      specialInstructions: "Replace Nespresso capsules and mineral water."
    },
    {
      roomNumber: "304",
      floor: 3,
      type: "Deluxe Queen",
      occupancyStatus: "Vacant",
      cleaningStatus: "Clean",
      status: "Available",
      assignedStaffId: "12614967",
      lastCleaned: "2026-11-24 08:50",
      specialInstructions: "Ready for early check-in."
    },
    {
      roomNumber: "401",
      floor: 4,
      type: "Executive Suite",
      occupancyStatus: "Vacant",
      cleaningStatus: "Clean",
      status: "Vacant & Clean",
      assignedStaffId: "12630198",
      lastCleaned: "2026-11-24 10:40",
      specialInstructions: "Ready for quality inspection."
    },
    {
      roomNumber: "402",
      floor: 4,
      type: "Penthouse Suite",
      occupancyStatus: "Occupied",
      cleaningStatus: "Clean",
      status: "Occupied",
      assignedStaffId: "12614967",
      lastCleaned: "2026-11-24 09:20",
      specialInstructions: "Fresh orchids on dining table every 2 days."
    },
    {
      roomNumber: "403",
      floor: 4,
      type: "Deluxe King",
      occupancyStatus: "Vacant",
      cleaningStatus: "Inspected",
      status: "Inspected",
      assignedStaffId: "12630198",
      lastCleaned: "2026-11-24 08:10",
      specialInstructions: "Passed morning audit with 100% score."
    },
    {
      roomNumber: "404",
      floor: 4,
      type: "Penthouse Suite",
      occupancyStatus: "Vacant",
      cleaningStatus: "Dirty",
      status: "Vacant & Dirty",
      assignedStaffId: "12630198",
      lastCleaned: "2026-11-21 16:00",
      specialInstructions: "Deep cleaning required after 5-night stay."
    }
  ],

  tasks: [
    {
      id: "TSK-1001",
      roomNumber: "201",
      type: "Checkout Cleaning",
      assignedStaffId: "12629686",
      priority: "High",
      description: "Complete checkout reset and prepare VIP welcome setup.",
      deadline: "2026-11-24 13:30",
      status: "In Progress",
      createdAt: "2026-11-24 09:00"
    },
    {
      id: "TSK-1002",
      roomNumber: "103",
      type: "Checkout Cleaning",
      assignedStaffId: "12629686",
      priority: "High",
      description: "Full turnover cleaning after late checkout.",
      deadline: "2026-11-24 14:00",
      status: "Assigned",
      createdAt: "2026-11-24 09:45"
    },
    {
      id: "TSK-1003",
      roomNumber: "303",
      type: "Standard Cleaning",
      assignedStaffId: "12614967",
      priority: "Medium",
      description: "Standard turnover, linen refresh, and minibar restock.",
      deadline: "2026-11-24 13:45",
      status: "In Progress",
      createdAt: "2026-11-24 09:30"
    },
    {
      id: "TSK-1004",
      roomNumber: "302",
      type: "Deep Cleaning",
      assignedStaffId: "12614967",
      priority: "High",
      description: "Deep clean suite and perform carpet stain extraction.",
      deadline: "2026-11-24 15:00",
      status: "Assigned",
      createdAt: "2026-11-24 10:00"
    },
    {
      id: "TSK-1005",
      roomNumber: "404",
      type: "Deep Cleaning",
      assignedStaffId: "12630198",
      priority: "Medium",
      description: "Post-long-stay deep clean of penthouse living and terrace.",
      deadline: "2026-11-24 16:30",
      status: "Pending",
      createdAt: "2026-11-24 10:15"
    },
    {
      id: "TSK-1006",
      roomNumber: "203",
      type: "Bathroom Cleaning",
      assignedStaffId: "12630114",
      priority: "Medium",
      description: "Descaling shower glass and full bathroom sanitization.",
      deadline: "2026-11-24 11:30",
      status: "Completed",
      createdAt: "2026-11-24 08:15"
    },
    {
      id: "TSK-1007",
      roomNumber: "401",
      type: "Linen Replacement",
      assignedStaffId: "12630198",
      priority: "Low",
      description: "Replace king duvet set, pillows, and bath robes.",
      deadline: "2026-11-24 11:00",
      status: "Completed",
      createdAt: "2026-11-24 08:00"
    },
    {
      id: "TSK-1008",
      roomNumber: "104",
      type: "Bed Preparation",
      assignedStaffId: "12630114",
      priority: "Low",
      description: "Fresh crisp linens and accessibility setup verification.",
      deadline: "2026-11-24 09:30",
      status: "Verified",
      createdAt: "2026-11-24 07:30"
    },
    {
      id: "TSK-1009",
      roomNumber: "202",
      type: "Special Requests",
      assignedStaffId: "12630114",
      priority: "Medium",
      description: "Deliver baby crib and extra hypoallergenic blankets.",
      deadline: "2026-11-24 17:00",
      status: "Assigned",
      createdAt: "2026-11-24 10:30"
    }
  ],

  inspections: [
    {
      id: "INS-301",
      roomNumber: "104",
      inspectorName: "Jeffy Einstein",
      date: "2026-11-24 09:25",
      result: "Passed",
      notes: "Immaculate presentation. All accessibility items verified.",
      checklist: {
        bedArranged: true,
        bathroomCleaned: true,
        towelsReplaced: true,
        freshLinen: true,
        floorCleaned: true,
        dustRemoved: true,
        amenitiesReplenished: true,
        trashRemoved: true
      }
    },
    {
      id: "INS-302",
      roomNumber: "403",
      inspectorName: "Jeffy Einstein",
      date: "2026-11-24 08:40",
      result: "Passed",
      notes: "Ready for immediate guest check-in.",
      checklist: {
        bedArranged: true,
        bathroomCleaned: true,
        towelsReplaced: true,
        freshLinen: true,
        floorCleaned: true,
        dustRemoved: true,
        amenitiesReplenished: true,
        trashRemoved: true
      }
    },
    {
      id: "INS-303",
      roomNumber: "103",
      inspectorName: "Jeffy Einstein",
      date: "2026-11-23 16:15",
      result: "Failed",
      notes: "Mirror streaks in bathroom and desk surface dust remaining.",
      checklist: {
        bedArranged: true,
        bathroomCleaned: false,
        towelsReplaced: true,
        freshLinen: true,
        floorCleaned: true,
        dustRemoved: false,
        amenitiesReplenished: true,
        trashRemoved: true
      }
    },
    {
      id: "INS-304",
      roomNumber: "304",
      inspectorName: "Elena Vance",
      date: "2026-11-24 09:10",
      result: "Passed",
      notes: "Clean and stocked per brand standards.",
      checklist: {
        bedArranged: true,
        bathroomCleaned: true,
        towelsReplaced: true,
        freshLinen: true,
        floorCleaned: true,
        dustRemoved: true,
        amenitiesReplenished: true,
        trashRemoved: true
      }
    }
  ],

  maintenance: [
    {
      id: "MNT-501",
      roomNumber: "204",
      issue: "AC Problems",
      description: "Primary HVAC compressor offline; room cannot cool below 27°C.",
      priority: "Critical",
      reporter: "Priya Sharma",
      status: "In Progress",
      createdAt: "2026-11-24 08:20"
    },
    {
      id: "MNT-502",
      roomNumber: "302",
      issue: "Plumbing Issues",
      description: "Slow drainage in master bath vanity sink.",
      priority: "Medium",
      reporter: "David Morales",
      status: "Assigned",
      createdAt: "2026-11-24 09:10"
    },
    {
      id: "MNT-503",
      roomNumber: "102",
      issue: "Electrical Problems",
      description: "Bedside USB-C charging port not supplying power.",
      priority: "Low",
      reporter: "Priya Sharma",
      status: "Reported",
      createdAt: "2026-11-24 10:05"
    },
    {
      id: "MNT-504",
      roomNumber: "402",
      issue: "Broken Furniture",
      description: "Loose hinge on wardrobe left door.",
      priority: "Medium",
      reporter: "Samuel Okafor",
      status: "Resolved",
      createdAt: "2026-11-23 14:40"
    },
    {
      id: "MNT-505",
      roomNumber: "201",
      issue: "Damaged Equipment",
      description: "Electric kettle lid latch cracked; replacement needed.",
      priority: "High",
      reporter: "Hannah Lindqvist",
      status: "Assigned",
      createdAt: "2026-11-24 09:50"
    }
  ],

  notifications: [
    {
      id: "NTF-1",
      type: "Task Assignment",
      title: "New VIP Turnover Assigned",
      message: "Room 201 Checkout Cleaning assigned to Priya Sharma (Due 13:30).",
      timestamp: "2026-11-24 09:05",
      read: false
    },
    {
      id: "NTF-2",
      type: "Maintenance",
      title: "Critical HVAC Issue — Room 204",
      message: "Room 204 automatically marked Under Maintenance due to AC failure.",
      timestamp: "2026-11-24 08:22",
      read: false
    },
    {
      id: "NTF-3",
      type: "Deadline",
      title: "Approaching Task Deadline",
      message: "Room 201 Checkout Cleaning is due within 60 minutes.",
      timestamp: "2026-11-24 12:30",
      read: false
    },
    {
      id: "NTF-4",
      type: "Completed Task",
      title: "Cleaning Completed — Room 203",
      message: "Hannah Lindqvist completed Bathroom Cleaning for Room 203. Ready for inspection.",
      timestamp: "2026-11-24 10:18",
      read: true
    },
    {
      id: "NTF-5",
      type: "Failed Inspection",
      title: "Inspection Failed — Room 103",
      message: "Jeffy Einstein flagged Room 103 for re-cleaning due to bathroom streaks.",
      timestamp: "2026-11-23 16:16",
      read: true
    }
  ],

  activities: [
    {
      id: "ACT-1",
      action: "Inspection Passed",
      detail: "Jeffy Einstein passed quality inspection for Room 104.",
      timestamp: "2026-11-24 09:25"
    },
    {
      id: "ACT-2",
      action: "Task Completed",
      detail: "Hannah Lindqvist completed cleaning in Room 203.",
      timestamp: "2026-11-24 10:15"
    },
    {
      id: "ACT-3",
      action: "Maintenance Logged",
      detail: "Priya Sharma reported Electrical Problems in Room 102.",
      timestamp: "2026-11-24 10:05"
    },
    {
      id: "ACT-4",
      action: "Task Started",
      detail: "David Morales started Standard Cleaning in Room 303.",
      timestamp: "2026-11-24 09:42"
    },
    {
      id: "ACT-5",
      action: "Room Status Updated",
      detail: "Room 204 set to Under Maintenance (Critical AC issue).",
      timestamp: "2026-11-24 08:22"
    },
    {
      id: "ACT-6",
      action: "Task Completed",
      detail: "Samuel Okafor completed Linen Replacement in Room 401.",
      timestamp: "2026-11-24 10:40"
    }
  ],

  performanceHistory: {
    dailyLabels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    dailyCleaned: [24, 28, 22, 31, 35, 38, 29],
    dailyInspected: [21, 25, 20, 29, 32, 34, 26],
    monthlyLabels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
    monthlyRoomsCleaned: [640, 710, 755, 690, 725, 680]
  }
};