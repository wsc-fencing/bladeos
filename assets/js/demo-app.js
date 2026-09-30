(function () {
  "use strict";

  var KEY = "bladeos.demo.v1";
  var SURFACE_KEY = "bladeos.demo.surface";
  var app = document.getElementById("app");
  var surface = sessionStorage.getItem(SURFACE_KEY) || "ops";
  var portalMemberId = "";

  function blank() {
    return {
      club: {
        name: "New club",
        city: "",
        accent: "#2F6FFF",
        supportEmail: "",
        timezone: "America/New_York"
      },
      locations: [],
      coaches: [],
      plans: [],
      members: [],
      sessions: [],
      bookings: [],
      privates: [],
      products: [],
      discounts: [],
      leads: [],
      invoices: [],
      expenses: [],
      checkins: [],
      campaigns: [],
      videos: [],
      staff: [],
      competitions: [],
      whatsapp: { connected: false, phone: "", templates: [] }
    };
  }

  function load() {
    try {
      var parsed = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!parsed || typeof parsed !== "object") return blank();
      var base = blank();
      Object.keys(base).forEach(function (key) {
        if (key === "club") base.club = Object.assign(base.club, parsed.club || {});
        else if (key === "whatsapp") base.whatsapp = Object.assign(base.whatsapp, parsed.whatsapp || {});
        else if (Array.isArray(parsed[key])) base[key] = parsed[key];
      });
      return base;
    } catch (error) {
      return blank();
    }
  }

  var state = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function uid() {
    return Math.random().toString(36).slice(2, 10);
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function money(value) {
    var amount = Number(value);
    if (!Number.isFinite(amount)) amount = 0;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
  }

  function find(list, id) {
    return (state[list] || []).find(function (row) { return row.id === id; });
  }

  function nameOf(row) {
    if (!row) return "—";
    if (row.name) return row.name;
    return [row.firstName, row.lastName].filter(Boolean).join(" ") || "Untitled";
  }

  function pill(value) {
    var text = String(value || "—");
    var kind = "";
    if (/active|paid|confirmed|completed|booked|won|connected/i.test(text)) kind = "ok";
    else if (/paused|open|requested|draft|trial|contacted|new/i.test(text)) kind = "warn";
    else if (/failed|lost|cancelled|archived/i.test(text)) kind = "bad";
    return '<span class="pill ' + kind + '">' + esc(text) + "</span>";
  }

  var collections = {
    locations: {
      title: "Locations",
      badge: "Add-on · $19 / extra location",
      lead: "A new tenant has no rooms and no second site. Add a location when the club is ready.",
      create: "Add location",
      fields: [
        { key: "name", label: "Name", required: true },
        { key: "city", label: "City" },
        { key: "address", label: "Address", wide: true }
      ],
      columns: [
        { label: "Name", value: function (row) { return esc(row.name); } },
        { label: "City", value: function (row) { return esc(row.city || "—"); } },
        { label: "Address", value: function (row) { return esc(row.address || "—"); } }
      ]
    },
    coaches: {
      title: "Coaches",
      badge: "Core · coach manager",
      lead: "Coach records are empty until the club adds its staff. A coach profile for login is billed separately.",
      create: "Add coach",
      fields: [
        { key: "name", label: "Name", required: true },
        { key: "email", label: "Email", type: "email" },
        { key: "weapon", label: "Weapon", type: "select", options: ["All weapons", "Foil", "Epee", "Sabre"] },
        { key: "status", label: "Status", type: "select", options: ["Active", "Paused"], default: "Active" }
      ],
      columns: [
        { label: "Coach", value: function (row) { return esc(row.name); } },
        { label: "Email", value: function (row) { return esc(row.email || "—"); } },
        { label: "Weapon", value: function (row) { return esc(row.weapon || "—"); } },
        { label: "Status", value: function (row) { return pill(row.status); } }
      ]
    },
    plans: {
      title: "Memberships",
      badge: "Core · sales & pricing",
      lead: "No plans are preloaded. Create the prices this club actually sells.",
      create: "Add membership",
      fields: [
        { key: "name", label: "Name", required: true },
        { key: "price", label: "Price (USD)", type: "number", required: true },
        { key: "interval", label: "Billing", type: "select", options: ["Monthly", "Annual", "Punch card"] },
        { key: "credits", label: "Credits", type: "number" }
      ],
      columns: [
        { label: "Plan", value: function (row) { return esc(row.name); } },
        { label: "Price", value: function (row) { return money(row.price); } },
        { label: "Billing", value: function (row) { return esc(row.interval || "—"); } },
        { label: "Credits", value: function (row) { return row.credits === "" || row.credits == null ? "Unlimited" : esc(row.credits); } }
      ]
    },
    members: {
      title: "Members",
      badge: "Core",
      lead: "The roster starts empty. Nothing is imported from another club.",
      create: "Add member",
      fields: [
        { key: "firstName", label: "First name", required: true },
        { key: "lastName", label: "Last name", required: true },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone" },
        { key: "household", label: "Household" },
        { key: "status", label: "Status", type: "select", options: ["Active", "Prospect", "Paused", "Archived"], default: "Active" },
        { key: "planId", label: "Membership", type: "ref", ref: "plans" },
        { key: "locationId", label: "Home location", type: "ref", ref: "locations" }
      ],
      columns: [
        { label: "Member", value: function (row) { return esc(nameOf(row)); } },
        { label: "Email", value: function (row) { return esc(row.email || "—"); } },
        { label: "Household", value: function (row) { return esc(row.household || "—"); } },
        { label: "Membership", value: function (row) { return esc(nameOf(find("plans", row.planId))); } },
        { label: "Status", value: function (row) { return pill(row.status); } }
      ]
    },
    sessions: {
      title: "Schedule",
      badge: "Core · group classes",
      lead: "The class calendar is blank. Add a session, then book members onto it.",
      create: "Add class",
      fields: [
        { key: "title", label: "Class", required: true },
        { key: "weapon", label: "Weapon", type: "select", options: ["All weapons", "Foil", "Epee", "Sabre"] },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "start", label: "Start", type: "time", required: true },
        { key: "end", label: "End", type: "time" },
        { key: "capacity", label: "Capacity", type: "number" },
        { key: "coachId", label: "Coach", type: "ref", ref: "coaches" },
        { key: "locationId", label: "Location", type: "ref", ref: "locations" }
      ],
      columns: [
        { label: "Class", value: function (row) { return esc(row.title); } },
        { label: "When", value: function (row) { return esc([row.date, row.start].filter(Boolean).join(" · ")); } },
        { label: "Coach", value: function (row) { return esc(nameOf(find("coaches", row.coachId))); } },
        { label: "Location", value: function (row) { return esc(nameOf(find("locations", row.locationId))); } },
        { label: "Booked", value: function (row) { return String(state.bookings.filter(function (item) { return item.sessionId === row.id && item.status !== "Cancelled"; }).length); } }
      ]
    },
    bookings: {
      title: "Class bookings",
      badge: "Core",
      lead: "Bookings attach a member to a class. Both lists start empty.",
      create: "Book class",
      fields: [
        { key: "sessionId", label: "Class", type: "ref", ref: "sessions", required: true },
        { key: "memberId", label: "Member", type: "ref", ref: "members", required: true },
        { key: "status", label: "Status", type: "select", options: ["Booked", "Attended", "Cancelled"], default: "Booked" }
      ],
      columns: [
        { label: "Class", value: function (row) { return esc((find("sessions", row.sessionId) || {}).title || "—"); } },
        { label: "Member", value: function (row) { return esc(nameOf(find("members", row.memberId))); } },
        { label: "Status", value: function (row) { return pill(row.status); } }
      ]
    },
    privates: {
      title: "Private lessons",
      badge: "Core",
      lead: "Private-lesson requests are a separate book from the group schedule.",
      create: "Add private lesson",
      fields: [
        { key: "memberId", label: "Fencer", type: "ref", ref: "members", required: true },
        { key: "coachId", label: "Coach", type: "ref", ref: "coaches", required: true },
        { key: "date", label: "Date", type: "date", required: true },
        { key: "start", label: "Start", type: "time", required: true },
        { key: "minutes", label: "Minutes", type: "number" },
        { key: "status", label: "Status", type: "select", options: ["Requested", "Confirmed", "Completed", "Cancelled"], default: "Requested" }
      ],
      columns: [
        { label: "Fencer", value: function (row) { return esc(nameOf(find("members", row.memberId))); } },
        { label: "Coach", value: function (row) { return esc(nameOf(find("coaches", row.coachId))); } },
        { label: "When", value: function (row) { return esc([row.date, row.start].filter(Boolean).join(" · ")); } },
        { label: "Status", value: function (row) { return pill(row.status); } }
      ]
    },
    products: {
      title: "Pro shop",
      badge: "Core · products",
      lead: "The pro shop catalog is empty. Equipment stays with the club, not with BladeOS.",
      create: "Add product",
      fields: [
        { key: "name", label: "Product", required: true },
        { key: "price", label: "Price (USD)", type: "number", required: true },
        { key: "sku", label: "SKU" },
        { key: "stock", label: "Stock", type: "number" }
      ],
      columns: [
        { label: "Product", value: function (row) { return esc(row.name); } },
        { label: "SKU", value: function (row) { return esc(row.sku || "—"); } },
        { label: "Price", value: function (row) { return money(row.price); } },
        { label: "Stock", value: function (row) { return esc(row.stock || "0"); } }
      ]
    },
    discounts: {
      title: "Discounts",
      badge: "Core",
      lead: "No promo codes exist until the club creates them.",
      create: "Add discount",
      fields: [
        { key: "code", label: "Code", required: true },
        { key: "percent", label: "Percent off", type: "number", required: true },
        { key: "status", label: "Status", type: "select", options: ["Active", "Paused"], default: "Active" }
      ],
      columns: [
        { label: "Code", value: function (row) { return esc(row.code); } },
        { label: "Off", value: function (row) { return esc(row.percent) + "%"; } },
        { label: "Status", value: function (row) { return pill(row.status); } }
      ]
    },
    leads: {
      title: "Leads",
      badge: "Add-on · $9 / month",
      lead: "The pipeline is empty. New inquiries land here before they become members.",
      create: "Add lead",
      fields: [
        { key: "name", label: "Name", required: true },
        { key: "email", label: "Email", type: "email" },
        { key: "source", label: "Source", type: "select", options: ["Walk-in", "Website", "Instagram", "WhatsApp", "Referral"] },
        { key: "stage", label: "Stage", type: "select", options: ["New", "Contacted", "Trial booked", "Won", "Lost"], default: "New" }
      ],
      columns: [
        { label: "Lead", value: function (row) { return esc(row.name); } },
        { label: "Email", value: function (row) { return esc(row.email || "—"); } },
        { label: "Source", value: function (row) { return esc(row.source || "—"); } },
        { label: "Stage", value: function (row) { return pill(row.stage); } }
      ]
    },
    invoices: {
      title: "Billing",
      badge: "Core · Stripe on the club account",
      lead: "No customers, invoices, or transfers. In production each club connects its own Stripe account. This demo never calls Stripe.",
      create: "Add invoice",
      fields: [
        { key: "memberId", label: "Member", type: "ref", ref: "members" },
        { key: "description", label: "Description", required: true },
        { key: "amount", label: "Amount (USD)", type: "number", required: true },
        { key: "status", label: "Status", type: "select", options: ["Open", "Paid", "Failed"], default: "Open" },
        { key: "date", label: "Date", type: "date" }
      ],
      columns: [
        { label: "Description", value: function (row) { return esc(row.description); } },
        { label: "Member", value: function (row) { return esc(nameOf(find("members", row.memberId))); } },
        { label: "Amount", value: function (row) { return money(row.amount); } },
        { label: "Status", value: function (row) { return pill(row.status); } }
      ]
    },
    expenses: {
      title: "Expenses",
      badge: "Add-on · finance",
      lead: "The ledger has no opening balance and no imported history.",
      create: "Add expense",
      fields: [
        { key: "vendor", label: "Vendor", required: true },
        { key: "category", label: "Category", type: "select", options: ["Rent", "Payroll", "Equipment", "Marketing", "Other"] },
        { key: "amount", label: "Amount (USD)", type: "number", required: true },
        { key: "date", label: "Date", type: "date" }
      ],
      columns: [
        { label: "Vendor", value: function (row) { return esc(row.vendor); } },
        { label: "Category", value: function (row) { return esc(row.category || "—"); } },
        { label: "Amount", value: function (row) { return money(row.amount); } },
        { label: "Date", value: function (row) { return esc(row.date || "—"); } }
      ]
    },
    checkins: {
      title: "Check-in",
      badge: "Add-on · kiosk",
      lead: "Attendance starts at zero. A check-in is written only when someone arrives.",
      create: "Record check-in",
      fields: [
        { key: "memberId", label: "Member", type: "ref", ref: "members", required: true },
        { key: "method", label: "Method", type: "select", options: ["Front desk", "Kiosk", "App"], default: "Front desk" },
        { key: "at", label: "When", type: "datetime-local" }
      ],
      columns: [
        { label: "Member", value: function (row) { return esc(nameOf(find("members", row.memberId))); } },
        { label: "Method", value: function (row) { return esc(row.method || "—"); } },
        { label: "When", value: function (row) { return esc(row.at || "—"); } }
      ]
    },
    campaigns: {
      title: "Campaigns",
      badge: "Add-on · leads & marketing",
      lead: "Newsletters, the AI agent, and social connectors are present as modules and stay disconnected.",
      create: "Add campaign",
      fields: [
        { key: "name", label: "Name", required: true },
        { key: "channel", label: "Channel", type: "select", options: ["Email", "Instagram", "WhatsApp"] },
        { key: "status", label: "Status", type: "select", options: ["Draft", "Scheduled", "Sent"], default: "Draft" }
      ],
      columns: [
        { label: "Campaign", value: function (row) { return esc(row.name); } },
        { label: "Channel", value: function (row) { return esc(row.channel || "—"); } },
        { label: "Status", value: function (row) { return pill(row.status); } }
      ]
    },
    videos: {
      title: "Video cloud",
      badge: "Profile · $15 / fencer",
      lead: "Each fencer library is empty. Training, private lessons, bouts, and competition footage would live on the athlete profile.",
      create: "Add video record",
      fields: [
        { key: "memberId", label: "Fencer", type: "ref", ref: "members", required: true },
        { key: "title", label: "Title", required: true },
        { key: "kind", label: "Type", type: "select", options: ["Training", "Private lesson", "Bout", "Competition"] }
      ],
      columns: [
        { label: "Title", value: function (row) { return esc(row.title); } },
        { label: "Fencer", value: function (row) { return esc(nameOf(find("members", row.memberId))); } },
        { label: "Type", value: function (row) { return esc(row.kind || "—"); } }
      ]
    },
    staff: {
      title: "User profiles",
      badge: "Coach $5 · Super admin $20",
      lead: "No staff logins are provisioned. Coach profiles and super admins are added per person.",
      create: "Add profile",
      fields: [
        { key: "name", label: "Name", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "role", label: "Role", type: "select", options: ["Coach profile", "Super admin"], default: "Coach profile" }
      ],
      columns: [
        { label: "Name", value: function (row) { return esc(row.name); } },
        { label: "Email", value: function (row) { return esc(row.email); } },
        { label: "Role", value: function (row) { return esc(row.role); } }
      ]
    },
    competitions: {
      title: "Competitions",
      badge: "Member experience",
      lead: "The competition list is empty. Clubs publish events their fencers can follow.",
      create: "Add competition",
      fields: [
        { key: "name", label: "Event", required: true },
        { key: "date", label: "Date", type: "date" },
        { key: "city", label: "City" },
        { key: "weapon", label: "Weapon", type: "select", options: ["Foil", "Epee", "Sabre", "Mixed"] }
      ],
      columns: [
        { label: "Event", value: function (row) { return esc(row.name); } },
        { label: "Date", value: function (row) { return esc(row.date || "—"); } },
        { label: "City", value: function (row) { return esc(row.city || "—"); } },
        { label: "Weapon", value: function (row) { return esc(row.weapon || "—"); } }
      ]
    }
  };

  var nav = [
    { group: "Operations", items: ["dashboard", "schedule", "privates", "members", "families", "plans", "billing", "coaches"] },
    { group: "Growth", items: ["leads", "marketing", "discounts", "shop", "competitions"] },
    { group: "Add-ons", items: ["finance", "whatsapp", "locations", "checkin", "videos", "staff", "settings"] }
  ];

  var titles = {
    dashboard: "Dashboard",
    schedule: "Schedule",
    families: "Families",
    billing: "Billing",
    marketing: "Marketing",
    finance: "Finance",
    whatsapp: "WhatsApp",
    checkin: "Check-in",
    shop: "Pro shop",
    settings: "Club settings"
  };

  function route() {
    var hash = (location.hash || "#/dashboard").replace(/^#\/?/, "");
    return hash || "dashboard";
  }

  function fieldInput(field) {
    var id = "f-" + field.key;
    if (field.type === "select") {
      return '<select name="' + field.key + '">' + field.options.map(function (option) {
        return '<option' + (option === field.default ? " selected" : "") + ">" + esc(option) + "</option>";
      }).join("") + "</select>";
    }
    if (field.type === "ref") {
      var rows = state[field.ref] || [];
      var options = '<option value="">None</option>' + rows.map(function (row) {
        var label = field.ref === "sessions" ? (row.title + " · " + (row.date || "")) : nameOf(row);
        return '<option value="' + esc(row.id) + '">' + esc(label) + "</option>";
      }).join("");
      return '<select name="' + field.key + '">' + options + "</select>";
    }
    var type = field.type || "text";
    return '<input id="' + id + '" name="' + field.key + '" type="' + type + '"' + (field.required ? " required" : "") + ">";
  }

  function formFor(collection) {
    var spec = collections[collection];
    return '<form class="card form-grid" data-create="' + collection + '">' + spec.fields.map(function (field) {
      return '<label class="field' + (field.wide ? " wide" : "") + '">' + esc(field.label) + fieldInput(field) + "</label>";
    }).join("") + '<button class="btn btn-primary" type="submit">' + esc(spec.create) + "</button></form>";
  }

  function tableFor(collection) {
    var spec = collections[collection];
    var rows = state[collection];
    if (!rows.length) {
      return '<div class="empty"><h2>Nothing here yet</h2><p>' + esc(spec.lead) + "</p></div>";
    }
    return '<div class="table-wrap"><table><thead><tr>' + spec.columns.map(function (column) {
      return "<th>" + esc(column.label) + "</th>";
    }).join("") + "<th></th></tr></thead><tbody>" + rows.map(function (row) {
      return "<tr>" + spec.columns.map(function (column) {
        return "<td>" + column.value(row) + "</td>";
      }).join("") + '<td><button class="linkish" type="button" data-delete="' + collection + ":" + esc(row.id) + '">Remove</button></td></tr>';
    }).join("") + "</tbody></table></div>";
  }

  function collectionPage(key) {
    var spec = collections[key];
    return '<header class="page-head"><div><p class="kicker">' + esc(spec.badge) + "</p><h1>" + esc(spec.title) + "</h1><p>" + esc(spec.lead) + "</p></div></header>" + formFor(key) + tableFor(key);
  }

  function sum(list, pick) {
    return list.reduce(function (total, row) { return total + (Number(pick(row)) || 0); }, 0);
  }

  function dashboard() {
    var active = state.members.filter(function (row) { return row.status === "Active"; }).length;
    var paid = sum(state.invoices.filter(function (row) { return row.status === "Paid"; }), function (row) { return row.amount; });
    return '<header class="page-head"><div><p class="kicker">Club operations</p><h1>Dashboard</h1><p>Live counts from this browser’s blank tenant. Every figure is zero until you add a record.</p></div></header>'
      + '<div class="kpi-row">'
      + stat("Active members", active)
      + stat("Paid invoices", money(paid))
      + stat("Classes", state.sessions.length)
      + stat("Check-ins", state.checkins.length)
      + "</div>"
      + '<div class="grid-2">'
      + moduleCard("Sell", "Memberships, shop, discounts, and invoices.")
      + moduleCard("Schedule", "Group classes, bookings, and private lessons.")
      + moduleCard("Coach", "Coach roster and per-coach profiles.")
      + moduleCard("Front desk", "Check-in, kiosk, and the schedule screen.")
      + "</div>";
  }

  function stat(label, value) {
    return '<article class="stat"><span>' + esc(label) + "</span><strong>" + esc(value) + "</strong></article>";
  }

  function moduleCard(title, copy) {
    return '<article class="card"><h3>' + esc(title) + "</h3><p>" + esc(copy) + "</p></article>";
  }

  function families() {
    var groups = {};
    state.members.forEach(function (member) {
      var key = (member.household || "").trim();
      if (!key) return;
      groups[key] = groups[key] || [];
      groups[key].push(member);
    });
    var names = Object.keys(groups);
    var body = names.length ? names.map(function (name) {
      return '<article class="card"><h3>' + esc(name) + "</h3><p>" + groups[name].map(function (member) {
        return esc(nameOf(member));
      }).join(", ") + "</p></article>";
    }).join("") : '<div class="empty"><h2>No households</h2><p>Add a household name on a member. Families are grouped from that field. No family is preloaded.</p></div>';
    return '<header class="page-head"><div><p class="kicker">Member experience</p><h1>Families</h1><p>Households share memberships and billing. This club has none yet.</p></div></header><div class="grid-2">' + body + "</div>";
  }

  function schedulePage() {
    return collectionPage("sessions") + '<div style="height:16px"></div>' + collectionPage("bookings");
  }

  function marketing() {
    var connectors = ["Newsletter", "AI agent", "Instagram", "ManyChat"];
    return '<header class="page-head"><div><p class="kicker">Add-on · $9 / month</p><h1>Marketing</h1><p>Connectors stay off. The demo does not call an outside network.</p></div></header>'
      + '<div class="grid-4" style="margin-bottom:16px">' + connectors.map(function (name) {
        return '<article class="card"><span class="tag">Not connected</span><h3>' + esc(name) + "</h3><p>Available in the module map. No account is linked.</p></article>";
      }).join("") + "</div>"
      + collectionPage("campaigns");
  }

  function finance() {
    var income = sum(state.invoices.filter(function (row) { return row.status === "Paid"; }), function (row) { return row.amount; });
    var costs = sum(state.expenses, function (row) { return row.amount; });
    return '<header class="page-head"><div><p class="kicker">Add-on · $19 / month</p><h1>Finance</h1><p>No opening balances. Income is the sum of invoices you mark paid.</p></div></header>'
      + '<div class="kpi-row">' + stat("Income", money(income)) + stat("Expenses", money(costs)) + stat("Net", money(income - costs)) + "</div>"
      + collectionPage("expenses");
  }

  function whatsapp() {
    var templates = state.whatsapp.templates || [];
    return '<header class="page-head"><div><p class="kicker">Add-on · $29 / month</p><h1>WhatsApp</h1><p>The bot is not connected. Saving a number here only stores it in this browser.</p></div></header>'
      + '<form class="card form-grid" data-whatsapp>'
      + '<label class="field">Club number<input name="phone" value="' + esc(state.whatsapp.phone) + '" placeholder="+1…"></label>'
      + '<label class="field">Connection<select name="connected"><option value="no"' + (state.whatsapp.connected ? "" : " selected") + '>Disconnected</option><option value="yes"' + (state.whatsapp.connected ? " selected" : "") + ">Marked connected</option></select></label>"
      + '<button class="btn btn-primary" type="submit">Save channel</button></form>'
      + '<form class="card form-grid" data-template style="margin-top:12px">'
      + '<label class="field">Template name<input name="name" required></label>'
      + '<label class="field wide">Message<textarea name="body" required></textarea></label>'
      + '<button class="btn btn-secondary" type="submit">Add template</button></form>'
      + (templates.length ? '<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th>Template</th><th>Message</th><th></th></tr></thead><tbody>'
        + templates.map(function (row) {
          return "<tr><td>" + esc(row.name) + "</td><td>" + esc(row.body) + '</td><td><button class="linkish" type="button" data-delete-template="' + esc(row.id) + '">Remove</button></td></tr>';
        }).join("") + "</tbody></table></div>" : '<div class="empty" style="margin-top:12px"><h2>No templates</h2><p>Add the messages the club would send for trials, reminders, and missed classes.</p></div>');
  }

  function settings() {
    var club = state.club;
    return '<header class="page-head"><div><p class="kicker">White label</p><h1>Club settings</h1><p>The club name and accent replace BladeOS on member-facing surfaces. Spacing, states, and the operations shell stay fixed.</p></div></header>'
      + '<form class="card form-grid" data-club>'
      + '<label class="field">Club name<input name="name" required value="' + esc(club.name) + '"></label>'
      + '<label class="field">City<input name="city" value="' + esc(club.city) + '"></label>'
      + '<label class="field">Support email<input name="supportEmail" type="email" value="' + esc(club.supportEmail) + '"></label>'
      + '<label class="field">Accent<input name="accent" type="color" value="' + esc(club.accent || "#2F6FFF") + '"></label>'
      + '<label class="field">Timezone<input name="timezone" value="' + esc(club.timezone) + '"></label>'
      + '<button class="btn btn-primary" type="submit">Save club</button></form>';
  }

  function opsPage() {
    var id = route();
    if (id === "dashboard") return dashboard();
    if (id === "schedule") return schedulePage();
    if (id === "families") return families();
    if (id === "billing") return collectionPage("invoices");
    if (id === "marketing") return marketing();
    if (id === "finance") return finance();
    if (id === "whatsapp") return whatsapp();
    if (id === "checkin") return collectionPage("checkins");
    if (id === "settings") return settings();
    if (collections[id]) return collectionPage(id);
    return dashboard();
  }

  function sidebar() {
    return '<aside class="sidebar"><a class="side-brand" href="index.html"><img src="assets/brand/icon.png" alt=""><span>Blade<b>OS</b>.ai</span></a>'
      + nav.map(function (group) {
        return '<div class="side-group">' + esc(group.group) + "</div>" + group.items.map(function (id) {
          var label = titles[id] || (collections[id] && collections[id].title) || id;
          var active = surface === "ops" && (route() === id || (id === "schedule" && route() === "bookings"));
          return '<a class="side-link' + (active ? " active" : "") + '" href="#/' + id + '" data-surface="ops">' + esc(label) + "</a>";
        }).join("");
      }).join("") + "</aside>";
  }

  function topbar() {
    return '<header class="topbar"><div class="topbar-left"><strong class="club-name">' + esc(state.club.name) + '</strong><span class="pill">Blank tenant</span></div><div class="topbar-right">'
      + '<label class="field" style="flex-direction:row;align-items:center">Surface <select class="surface-select" data-surface-select>'
      + option("ops", "Club operations")
      + option("member", "Member portal")
      + option("public", "Club website")
      + option("kiosk", "Kiosk")
      + option("screen", "Schedule screen")
      + "</select></label>"
      + '<button class="btn btn-secondary danger" type="button" data-reset>Reset database</button>'
      + '<a class="btn btn-secondary" href="index.html">Exit</a></div></header>';
  }

  function option(value, label) {
    return '<option value="' + value + '"' + (surface === value ? " selected" : "") + ">" + esc(label) + "</option>";
  }

  function memberPortal() {
    var options = state.members.map(function (member) {
      return '<option value="' + esc(member.id) + '"' + (member.id === portalMemberId ? " selected" : "") + ">" + esc(nameOf(member)) + "</option>";
    }).join("");
    var member = find("members", portalMemberId);
    var body = !state.members.length
      ? '<div class="empty"><h2>No member accounts</h2><p>The member portal opens onto an empty club. Add a member in operations, then come back.</p></div>'
      : !member
        ? '<div class="empty"><h2>Choose a member</h2><p>Profiles, credits, bookings, invoices, and videos are read from the same empty database.</p></div>'
        : portalDetail(member);
    return '<header class="page-head"><div><p class="kicker">Powered by BladeOS.ai</p><h1>' + esc(state.club.name) + '</h1><p>Member-facing surface. Club identity leads. BladeOS stays in the footer line.</p></div>'
      + (state.members.length ? '<select data-portal>' + '<option value="">Select a member</option>' + options + "</select>" : "")
      + "</header>" + body;
  }

  function portalDetail(member) {
    var plan = find("plans", member.planId);
    var bookings = state.bookings.filter(function (row) { return row.memberId === member.id; });
    var lessons = state.privates.filter(function (row) { return row.memberId === member.id; });
    var invoices = state.invoices.filter(function (row) { return row.memberId === member.id; });
    var videos = state.videos.filter(function (row) { return row.memberId === member.id; });
    return '<div class="kpi-row">'
      + stat("Membership", plan ? plan.name : "None")
      + stat("Bookings", bookings.length)
      + stat("Private lessons", lessons.length)
      + stat("Videos", videos.length)
      + "</div><div class=\"grid-2\">"
      + moduleCard("Profile", [member.email, member.phone, member.household].filter(Boolean).join(" · ") || "No contact details yet.")
      + moduleCard("Billing", invoices.length ? invoices.map(function (row) { return row.description + " " + money(row.amount); }).join(", ") : "No invoices.")
      + "</div>";
  }

  function publicSite() {
    var plans = state.plans.length ? state.plans.map(function (plan) {
      return "<article class=\"card\"><h3>" + esc(plan.name) + "</h3><p class=\"price\">" + money(plan.price) + "</p><p>" + esc(plan.interval || "") + "</p></article>";
    }).join("") : '<div class="empty"><h2>Pricing not published</h2><p>Memberships appear here after the club creates them.</p></div>';
    var classes = state.sessions.length ? '<div class="table-wrap"><table><thead><tr><th>Class</th><th>When</th><th>Weapon</th></tr></thead><tbody>'
      + state.sessions.map(function (row) {
        return "<tr><td>" + esc(row.title) + "</td><td>" + esc([row.date, row.start].filter(Boolean).join(" · ")) + "</td><td>" + esc(row.weapon || "—") + "</td></tr>";
      }).join("") + "</tbody></table></div>" : '<div class="empty"><h2>No public schedule</h2><p>Classes show up when the club adds them.</p></div>';
    return '<div class="public-hero"><p class="kicker" style="color:#9dbdff">Club website</p><h1>' + esc(state.club.name) + "</h1><p>" + esc(state.club.city || "City not set") + "</p></div>"
      + "<h2>Schedule</h2>" + classes + '<h2 style="margin-top:22px">Memberships</h2><div class="grid-3" style="margin-top:12px">' + plans + "</div>";
  }

  function kiosk() {
    var list = state.members.length ? state.members.map(function (member) {
      return '<button type="button" data-kiosk="' + esc(member.id) + '"><strong>' + esc(nameOf(member)) + "</strong><br><span class=\"muted\">" + esc(member.status || "") + "</span></button>";
    }).join("") : '<div class="empty"><h2>No one to check in</h2><p>Add members before the front desk can use the kiosk.</p></div>';
    return '<div class="kiosk"><div class="kiosk-list"><div class="kiosk-head"><strong>Kiosk</strong></div>' + list + '</div><div class="kiosk-main"><div class="empty"><h2>Select a member</h2><p>A tap writes a kiosk check-in into the empty attendance log.</p></div></div></div>';
  }

  function screen() {
    var rows = state.sessions.length ? state.sessions.map(function (row) {
      return "<article><h2>" + esc(row.title) + "</h2><p>" + esc([row.date, row.start, row.end].filter(Boolean).join(" · ")) + " · " + esc(row.weapon || "All weapons") + "</p></article>";
    }).join("") : "<article><h2>No classes on the board</h2><p>The schedule screen stays dark until the club publishes a class.</p></article>";
    return '<div class="stage"><div class="stage-head"><div><p class="kicker" style="color:#9dbdff">Schedule screen</p><h1>' + esc(state.club.name) + '</h1></div></div><div class="board">' + rows + "</div></div>";
  }

  function render() {
    document.documentElement.style.setProperty("--blue", state.club.accent || "#2F6FFF");
    var main = "";
    if (surface === "member") main = '<div class="page">' + memberPortal() + "</div>";
    else if (surface === "public") main = '<div class="page">' + publicSite() + "</div>";
    else if (surface === "kiosk") main = kiosk();
    else if (surface === "screen") main = screen();
    else main = '<div class="page">' + opsPage() + "</div>";

    var showSide = surface === "ops" || surface === "member" || surface === "public";
    app.innerHTML = '<div class="shell" style="' + (showSide ? "" : "grid-template-columns:1fr") + '">'
      + (showSide ? sidebar() : "")
      + '<div class="workspace">' + topbar()
      + '<div class="banner">Blank club database. Records stay in this browser. Reset clears the tenant. No roster, payment, or message is loaded from another club.</div>'
      + main + "</div></div>";
  }

  function readForm(form) {
    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = String(value).trim(); });
    return data;
  }

  app.addEventListener("click", function (event) {
    var reset = event.target.closest("[data-reset]");
    if (reset) {
      if (window.confirm("Clear this club and return to an empty database?")) {
        state = blank();
        portalMemberId = "";
        save();
        render();
      }
      return;
    }
    var remove = event.target.closest("[data-delete]");
    if (remove) {
      var parts = remove.getAttribute("data-delete").split(":");
      state[parts[0]] = state[parts[0]].filter(function (row) { return row.id !== parts[1]; });
      save();
      render();
      return;
    }
    var template = event.target.closest("[data-delete-template]");
    if (template) {
      var id = template.getAttribute("data-delete-template");
      state.whatsapp.templates = state.whatsapp.templates.filter(function (row) { return row.id !== id; });
      save();
      render();
      return;
    }
    var kioskButton = event.target.closest("[data-kiosk]");
    if (kioskButton) {
      state.checkins.unshift({
        id: uid(),
        memberId: kioskButton.getAttribute("data-kiosk"),
        method: "Kiosk",
        at: new Date().toISOString().slice(0, 16)
      });
      save();
      kioskButton.classList.add("on");
      var main = app.querySelector(".kiosk-main");
      if (main) main.innerHTML = '<div class="empty"><h2>Checked in</h2><p>' + kioskButton.querySelector("strong").textContent + " is on today’s attendance list.</p></div>";
    }
    var link = event.target.closest("[data-surface]");
    if (link) {
      surface = "ops";
      sessionStorage.setItem(SURFACE_KEY, surface);
    }
  });

  app.addEventListener("change", function (event) {
    if (event.target.matches("[data-surface-select]")) {
      surface = event.target.value;
      sessionStorage.setItem(SURFACE_KEY, surface);
      render();
    }
    if (event.target.matches("[data-portal]")) {
      portalMemberId = event.target.value;
      render();
    }
  });

  app.addEventListener("submit", function (event) {
    var form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    event.preventDefault();
    if (form.hasAttribute("data-create")) {
      var key = form.getAttribute("data-create");
      if (!collections[key]) return;
      var row = readForm(form);
      row.id = uid();
      state[key].unshift(row);
      save();
      render();
      return;
    }
    if (form.hasAttribute("data-club")) {
      state.club = Object.assign(state.club, readForm(form));
      save();
      render();
      return;
    }
    if (form.hasAttribute("data-whatsapp")) {
      var channel = readForm(form);
      state.whatsapp.phone = channel.phone || "";
      state.whatsapp.connected = channel.connected === "yes";
      save();
      render();
      return;
    }
    if (form.hasAttribute("data-template")) {
      var templateRow = readForm(form);
      templateRow.id = uid();
      state.whatsapp.templates.unshift(templateRow);
      save();
      render();
    }
  });

  window.addEventListener("hashchange", render);
  render();
})();
