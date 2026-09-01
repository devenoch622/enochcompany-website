const $ = id => document.getElementById(id);
const sections = document.querySelectorAll("section");
const navLinks = $("navLinks"), toast = $("toast");

function showToast(msg) { toast.textContent = msg; toast.classList.add("show"); setTimeout(() => toast.classList.remove("show"), 3000) }
function showSection(id) {
  if (id === "dashboard" && !getCurrentUser()) { showToast("Please sign in to access the employee dashboard."); id = "signin" }
  if (id === "admin" && !isAdmin()) { openModal("adminLoginModal"); return }
  sections.forEach(s => s.classList.remove("active"));
  const s = $(id); if (!s) return; s.classList.add("active");
  document.querySelectorAll(".nav-links a").forEach(a => a.classList.remove("active"));
  const a = document.querySelector(`.nav-links a[data-section="${id}"]`); if (a) a.classList.add("active");
  navLinks.classList.remove("show"); window.scrollTo({ top: 0, behavior: "smooth" });
  if (id === "projects") renderProjects(); if (id === "admin") renderAdmin();
}
document.querySelectorAll("[data-section]").forEach(el => el.addEventListener("click", e => { e.preventDefault(); showSection(el.dataset.section) }));
$("menuBtn").addEventListener("click", () => navLinks.classList.toggle("show"));

function openModal(id) { $(id).classList.add("show") }
function closeModal(id) { $(id).classList.remove("show") }
document.querySelectorAll("[data-close]").forEach(b => b.addEventListener("click", () => closeModal(b.dataset.close)));
document.querySelectorAll(".modal").forEach(m => m.addEventListener("click", e => { if (e.target === m) m.classList.remove("show") }));

const STORE = {
  users: "enochTechUsers", current: "enochTechCurrentUser", admin: "enochTechAdmin",
  projects: "enochTechProjects", finance: "enochTechFinance", activities: "enochTechActivities", meetings: "enochTechMeetings"
};
function read(k, f = []) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(f)) } catch { return f } }
function write(k, v) { localStorage.setItem(k, JSON.stringify(v)) }
function getUsers() { return read(STORE.users) }
function getCurrentUser() { return read(STORE.current, null) }
function isAdmin() { return localStorage.getItem(STORE.admin) === "true" }
function logActivity(userId, action, detail) { const arr = read(STORE.activities); arr.unshift({ id: Date.now(), userId, action, detail, time: new Date().toLocaleString() }); write(STORE.activities, arr.slice(0, 300)); if (isAdmin()) renderAdmin() }

$("signupForm").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("signupName").value.trim(), email = $("signupEmail").value.trim(), password = $("signupPassword").value, department = $("signupDepartment").value;
  const users = getUsers(); if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) return showToast("An account with this email already exists.");
  const user = { id: Date.now(), name, email, password, department, joined: new Date().toLocaleDateString() };
  users.push(user); write(STORE.users, users); write(STORE.current, user); logActivity(user.id, "Account created", "Employee account created"); updateDashboard(user); showToast("Account created successfully!"); showSection("dashboard");
});
$("signinForm").addEventListener("submit", e => {
  e.preventDefault(); const email = $("signinEmail").value.trim(), password = $("signinPassword").value;
  const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return showToast("Incorrect email or password."); write(STORE.current, user); logActivity(user.id, "Signed in", "Employee signed in"); updateDashboard(user); showToast("Welcome back, " + user.name + "!"); showSection("dashboard");
});
function updateDashboard(user) {
  if (!user) return;
  $("employeeName").textContent = user.name; $("employeeDepartment").textContent = user.department + " • Enoch Tech Company";
  $("profileName").value = user.name; $("profileEmail").value = user.email; $("profileDepartment").value = user.department;
  renderEmployee();
}
$("logoutButton").addEventListener("click", () => { const u = getCurrentUser(); if (u) logActivity(u.id, "Signed out", "Employee signed out"); localStorage.removeItem(STORE.current); showToast("You have been signed out."); showSection("home") });
$("signinNav").addEventListener("click", () => showSection("signin")); $("signupNav").addEventListener("click", () => showSection("signup"));
$("goSignup").addEventListener("click", () => showSection("signup")); $("goSignin").addEventListener("click", () => showSection("signin"));
$("adminNav").addEventListener("click", () => isAdmin() ? showSection("admin") : openModal("adminLoginModal"));

const defaultTasks = [
  { title: "Website interface review", desc: "Review the latest Enoch Tech website design.", status: "IN PROGRESS", cls: "progress" },
  { title: "Company documentation", desc: "Update internal project documentation.", status: "PENDING", cls: "pending" },
  { title: "Security checklist", desc: "Complete the application security checklist.", status: "COMPLETED", cls: "complete" },
  { title: "Team project planning", desc: "Prepare the next project planning session.", status: "PENDING", cls: "pending" }
];
function renderEmployee() {
  const u = getCurrentUser(); if (!u) return;
  $("taskList").innerHTML = defaultTasks.map(t => `<div class="task"><div class="task-info"><strong>${esc(t.title)}</strong><small>${esc(t.desc)}</small></div><span class="status ${t.cls}">${t.status}</span></div>`).join("");
  const meetings = read(STORE.meetings).filter(m => !m.employeeOnly || m.employeeOnly === u.id);
  $("employeeMeetingCount").textContent = meetings.length;
  $("employeeMeetingList").innerHTML = meetings.length ? meetings.slice(0, 6).map(m => `<div class="meeting"><strong>${esc(m.title)}</strong><small>${esc(m.date)} • ${esc(m.time)} ${m.room ? `• <a href="${esc(m.room)}" target="_blank" style="color:#00ff88">Join meeting</a>` : ""}</small></div>`).join("") : `<div class="empty">No meetings scheduled.</div>`;
  const acts = read(STORE.activities).filter(a => a.userId === u.id).slice(0, 8);
  $("employeeActivityList").innerHTML = acts.length ? acts.map(a => `<div class="activity-row"><div class="activity-icon">🟢</div><div><strong>${esc(a.action)}</strong><small>${esc(a.detail)} • ${esc(a.time)}</small></div></div>`).join("") : `<div class="empty">No activity recorded yet.</div>`;
}
$("meetingButton").addEventListener("click", () => openModal("meetingModal")); $("addMeeting").addEventListener("click", () => openModal("meetingModal"));
$("customMeetingLink").addEventListener("input", () => { });
$("meetingProvider").addEventListener("change", () => { $("customLinkGroup").style.display = $("meetingProvider").value === "custom" ? "block" : "none" });

function meetingRoom(title) { return "https://meet.jit.si/EnochTech-" + title.replace(/[^a-z0-9]/gi, "").slice(0, 25) + "-" + Date.now().toString().slice(-6) }
$("meetingForm").addEventListener("submit", e => {
  e.preventDefault(); const u = getCurrentUser(), admin = isAdmin();
  const title = $("meetingTitle").value.trim(), date = $("meetingDate").value, time = $("meetingTime").value, notes = $("meetingNotes").value.trim();
  let room = $("meetingProvider").value === "custom" ? $("customMeetingLink").value.trim() : meetingRoom(title);
  if (!room) return showToast("Add a valid meeting link.");
  const meetings = read(STORE.meetings); meetings.unshift({ id: Date.now(), title, date, time, notes, room, createdBy: admin ? "Admin" : u?.name || "Admin", employeeOnly: false }); write(STORE.meetings, meetings);
  if (u) logActivity(u.id, "Meeting scheduled", title);
  closeModal("meetingModal"); $("meetingForm").reset(); $("customLinkGroup").style.display = "none"; showToast("Meeting saved successfully.");
  if (isAdmin()) renderAdmin(); else renderEmployee();
});

$("hostMeetingNow").addEventListener("click", () => { $("meetingTitle").value = "Enoch Tech Team Meeting"; $("meetingDate").value = new Date().toISOString().slice(0, 10); $("meetingTime").value = new Date().toTimeString().slice(0, 5); $("meetingProvider").value = "jitsi"; $("customLinkGroup").style.display = "none"; openModal("meetingModal") });
$("newMeetingAdmin").addEventListener("click", () => openModal("meetingModal"));

let preparedApplication = "";
$("openApplication").addEventListener("click", () => openModal("applicationModal"));
document.querySelectorAll(".apply-job").forEach(b => b.addEventListener("click", () => { $("appPosition").value = b.parentElement.querySelector("h3").textContent; openModal("applicationModal") }));
$("applicationForm").addEventListener("submit", e => {
  e.preventDefault();
  preparedApplication = `ENOCH TECH COMPANY\nJOB APPLICATION\n\nApplicant Name: ${$("appName").value.trim()}\nEmail: ${$("appEmail").value.trim()}\nPhone: ${$("appPhone").value.trim()}\nPosition: ${$("appPosition").value}\nExperience: ${$("appExperience").value}\nLocation: ${$("appLocation").value.trim()}\n\nSkills:\n${$("appSkills").value.trim()}\n\nWhy I Want to Work With Enoch Tech:\n${$("appMessage").value.trim()}\n\nThank you,\n${$("appName").value.trim()}`;
  $("applicationPreview").textContent = preparedApplication;
  const subject = encodeURIComponent("Job Application - " + $("appPosition").value + " - " + $("appName").value.trim()), body = encodeURIComponent(preparedApplication);
  $("emailApplication").href = `mailto:enochskettorsr@gmail.com?subject=${subject}&body=${body}`;
  $("whatsappApplication").href = `https://wa.me/250799480574?text=${body}`;
  $("facebookApplication").href = `https://www.facebook.com/profile.php?id=61592917302142`;
  closeModal("applicationModal"); openModal("sendApplicationModal"); showToast("Application prepared successfully.");
});
$("copyApplication").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(preparedApplication); showToast("Application text copied — paste it into Facebook Messenger.") }
  catch { showToast("Could not copy automatically — please select and copy the text above.") }
});
$("facebookApplication").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(preparedApplication) } catch { }
});

function getProjects() { return read(STORE.projects) }
function renderProjects() {
  const ps = getProjects();
  $("publicProjectGrid").innerHTML = ps.length ? ps.map(p => `<article class="project-card">${p.image ? `<img src="${p.image}" alt="${esc(p.name)}">` : "<div style='height:200px;display:flex;align-items:center;justify-content:center;font-size:50px'>💻</div>"}<div class="project-card-body"><div class="project-tags"><span class="tag">${esc(p.category)}</span>${(p.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join("")}</div><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p>${p.url ? `<a class="btn btn-primary" href="${esc(p.url)}" target="_blank" rel="noopener">Open Project</a>` : ""}</div></article>`).join("") : `<div class="empty" style="grid-column:1/-1">No public projects yet. Admin can publish projects from the Admin Dashboard.</div>`;
}
$("adminProjectButton").addEventListener("click", () => isAdmin() ? openModal("projectModal") : (openModal("adminLoginModal")));
$("newProjectAdmin").addEventListener("click", () => openModal("projectModal"));
$("projectForm").addEventListener("submit", e => {
  e.preventDefault(); const file = $("projectImage").files[0]; const save = image => {
    const ps = getProjects(); ps.unshift({ id: Date.now(), name: $("projectName").value.trim(), category: $("projectCategory").value, description: $("projectDescription").value.trim(), url: $("projectUrl").value.trim(), tags: $("projectTags").value.split(",").map(x => x.trim()).filter(Boolean), image: image || "", date: new Date().toLocaleString() }); write(STORE.projects, ps); closeModal("projectModal"); $("projectForm").reset(); renderProjects(); renderAdmin(); showToast("Project published successfully.");
  };
  if (file) { const reader = new FileReader(); reader.onload = () => save(reader.result); reader.readAsDataURL(file) } else save("");
});

$("financeForm").addEventListener("submit", e => {
  e.preventDefault(); const arr = read(STORE.finance); arr.unshift({ id: Date.now(), type: $("financeType").value, amount: Number($("financeAmount").value), description: $("financeDescription").value.trim(), date: new Date().toLocaleString() }); write(STORE.finance, arr); $("financeForm").reset(); renderAdmin(); showToast("Financial record saved.");
});
function renderAdmin() {
  if (!isAdmin()) return;
  const finance = read(STORE.finance), income = finance.filter(x => x.type === "income").reduce((a, b) => a + b.amount, 0), expense = finance.filter(x => x.type === "expense").reduce((a, b) => a + b.amount, 0);
  $("adminRevenue").textContent = "$" + income.toLocaleString(undefined, { minimumFractionDigits: 2 }); $("adminExpenses").textContent = "$" + expense.toLocaleString(undefined, { minimumFractionDigits: 2 }); $("adminNet").textContent = "$" + (income - expense).toLocaleString(undefined, { minimumFractionDigits: 2 }); $("adminEmployees").textContent = getUsers().length;
  $("financeTable").innerHTML = finance.length ? finance.map(x => `<tr><td>${esc(x.date)}</td><td>${x.type === "income" ? "Income" : "Expense"}</td><td>${esc(x.description)}</td><td>$${x.amount.toFixed(2)}</td><td><button class="btn btn-danger delete-finance" data-id="${x.id}" style="padding:6px 9px;font-size:10px">Delete</button></td></tr>`).join("") : `<tr><td colspan="5"><div class="empty">No finance records yet.</div></td></tr>`;
  document.querySelectorAll(".delete-finance").forEach(b => b.addEventListener("click", () => { write(STORE.finance, finance.filter(x => x.id !== Number(b.dataset.id))); renderAdmin() }));
  $("employeeTable").innerHTML = getUsers().length ? getUsers().map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.department)}</td><td>${esc(u.joined || "—")}</td></tr>`).join("") : `<tr><td colspan="4"><div class="empty">No employees yet.</div></td></tr>`;
  const acts = read(STORE.activities).slice(0, 30); $("adminActivityList").innerHTML = acts.length ? acts.map(a => { const u = getUsers().find(x => x.id === a.userId); return `<div class="activity-row"><div class="activity-icon">🧾</div><div><strong>${esc(u?.name || "System")}</strong><small>${esc(a.action)} — ${esc(a.detail)} • ${esc(a.time)}</small></div></div>` }).join("") : `<div class="empty">No employee activity recorded.</div>`;
  $("financeSummary").innerHTML = `<div class="stat-card admin-stat"><span>Revenue</span><strong>$${income.toFixed(2)}</strong></div><div class="stat-card admin-stat" style="margin-top:10px"><span>Expenses</span><strong>$${expense.toFixed(2)}</strong></div><div class="stat-card admin-stat" style="margin-top:10px"><span>Net</span><strong>$${(income - expense).toFixed(2)}</strong></div>`;
  const ms = read(STORE.meetings); $("adminMeetingList").innerHTML = ms.length ? ms.slice(0, 8).map(m => `<div class="meeting"><strong>${esc(m.title)}</strong><small>${esc(m.date)} • ${esc(m.time)} • <a href="${esc(m.room)}" target="_blank" style="color:#00ff88">Join / Host</a></small></div>`).join("") : `<div class="empty">No meetings yet.</div>`;
  const ps = getProjects(); $("adminProjectList").innerHTML = ps.length ? ps.map(p => `<div class="activity-row"><div class="activity-icon">📁</div><div style="flex:1"><strong>${esc(p.name)}</strong><small>${esc(p.category)} • ${esc(p.date)}</small></div><button class="btn btn-danger delete-project" data-id="${p.id}" style="padding:7px 10px;font-size:10px">Delete</button></div>`).join("") : `<div class="empty">No projects published.</div>`;
  document.querySelectorAll(".delete-project").forEach(b => b.addEventListener("click", () => { write(STORE.projects, ps.filter(p => p.id !== Number(b.dataset.id))); renderAdmin(); renderProjects(); showToast("Project removed.") }));
}
$("adminLoginForm").addEventListener("submit", e => {
  e.preventDefault(); const email = $("adminEmail").value.trim(), password = $("adminPassword").value;
  if (email === "admin@enochtech.com" && password === "Admin@123") { localStorage.setItem(STORE.admin, "true"); closeModal("adminLoginModal"); showToast("Admin access granted."); showSection("admin"); logActivity(0, "Admin sign-in", "Admin accessed the private dashboard") } else showToast("Invalid admin credentials.");
});
$("adminLogout").addEventListener("click", () => { localStorage.removeItem(STORE.admin); showToast("Admin session closed."); showSection("home") });

function esc(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;") }

/* ============================================================
   ET NEXUS AI — full-site knowledge base.
   This pulls together everything about Enoch Tech (about, CEO,
   services, skills, projects, careers, contact, employee portal
   and admin dashboard) so it can answer questions about anything
   on the website, plus live data (published projects, employees,
   meetings) straight from local storage.
   ============================================================ */
const siteKnowledge = {
  company: "Enoch Tech Company is a technology-focused organization: We Build. We Secure. We Innovate. It combines software engineering, cybersecurity, IT knowledge, artificial intelligence and technology consulting to help people and organizations turn ideas into practical technology.",
  values: "Our values: (1) Professionalism and responsibility in every project. (2) Innovation through continuous learning and experimentation. (3) Security as an important part of modern technology. (4) Quality, reliability and attention to detail. (5) Customer-focused solutions built around real needs.",
  ceo: "Enoch S. Kettor Sr. is the Founder & Chief Executive Officer of Enoch Tech Company. He leads with a focus on software engineering, cybersecurity, artificial intelligence, IT solutions and digital innovation. The CEO section includes his profile, a media gallery and a video center where his interviews and presentations play directly on the website.",
  services: "Enoch Tech offers: Software Development (websites, web apps, business platforms), Cybersecurity (assessments and protection strategies), IT Solutions (infrastructure, networking, technical support), Artificial Intelligence (automation and intelligent tools), Digital Forensics (responsible digital evidence work) and Technology Consulting (planning and implementation guidance).",
  skills: "Technology capabilities: Software Engineering, Web Development, Cybersecurity, Networking, Artificial Intelligence, Digital Forensics, Database Management and Technology Consulting.",
  careers: "Enoch Tech is hiring for: Software Developer, Cybersecurity, IT Specialist, AI & Technology, UI/UX Designer and Technology Intern. Applicants can open Careers → Apply Online, fill in the application form, and then send it by Email, WhatsApp or Facebook straight from the site.",
  contact: "You can reach Enoch Tech by email at enochskettorsr@gmail.com, on WhatsApp at wa.me/250799480574, or through Facebook, Instagram, LinkedIn, X and YouTube — all linked in the Contact section.",
  employeePortal: "Employees can Sign Up or Sign In from the top navigation to reach their personal Employee Workspace, which shows their tasks, upcoming meetings and their own activity history.",
  adminDashboard: "The Admin Dashboard is private and reserved for company leadership. It manages projects, meetings, finance records and employee accounts, and shows a live activity feed of everything employees do (sign-ins, tasks, meetings, applications) so leadership can track team activity in one place.",
  meetings: "Meetings run inside the browser using Jitsi video rooms created automatically, or a custom meeting link can be pasted in instead. Employees see their meetings on their dashboard and admins see every meeting from the admin dashboard.",
  mobile: "The whole website is built to work on phones, tablets and desktops — the layout, menus, forms and video/gallery grids all adapt to smaller screens."
};
function liveProjectsSummary() {
  const ps = getProjects();
  if (!ps.length) return "There are no published projects yet — admins can add one from the Projects page or the Admin Dashboard.";
  return "Current published projects: " + ps.slice(0, 8).map(p => `${p.name} (${p.category})`).join(", ") + (ps.length > 8 ? `, and ${ps.length - 8} more.` : ".");
}
function liveStatsSummary() {
  const users = getUsers(), meetings = read(STORE.meetings);
  return `There are currently ${users.length} registered employee${users.length === 1 ? "" : "s"} and ${meetings.length} recorded meeting${meetings.length === 1 ? "" : "s"}.`;
}
function getAIResponse(q) {
  const query = q.toLowerCase();
  if (/hello|hi there|^hi$|hey/.test(query)) return "Hello! 👋 I'm ET Nexus AI. Ask me about the company, our CEO, services, skills, projects, careers, contact info, the employee portal or the admin dashboard — I have information on everything on this website.";
  if (query.includes("ceo") || query.includes("founder") || query.includes("leader")) return `<strong>CEO:</strong> ${siteKnowledge.ceo}`;
  if (query.includes("value")) return siteKnowledge.values;
  if (query.includes("project")) return `${siteKnowledge.company}<br><br>${liveProjectsSummary()}`;
  if (query.includes("admin") || query.includes("earning") || query.includes("finance") || query.includes("revenue")) return siteKnowledge.adminDashboard;
  if (query.includes("employee") && (query.includes("dashboard") || query.includes("portal") || query.includes("workspace"))) return `${siteKnowledge.employeePortal} ${liveStatsSummary()}`;
  if (query.includes("meeting") || query.includes("host") || query.includes("jitsi")) return siteKnowledge.meetings;
  if (query.includes("skill") || query.includes("capabilit")) return siteKnowledge.skills;
  if (query.includes("service") || query.includes("offer") || query.includes("what do you do")) return siteKnowledge.services;
  if (query.includes("career") || query.includes("apply") || query.includes("job") || query.includes("hiring") || query.includes("vacan")) return siteKnowledge.careers;
  if (query.includes("contact") || query.includes("email") || query.includes("phone") || query.includes("whatsapp") || query.includes("facebook") || query.includes("social")) return siteKnowledge.contact;
  if (query.includes("mobile") || query.includes("phone") || query.includes("responsive")) return siteKnowledge.mobile;
  if (query.includes("about") || query.includes("who are you") || query.includes("what is enoch")) return `${siteKnowledge.company}<br><br>${siteKnowledge.values}`;
  if (query.includes("everything") || query.includes("all information") || query.includes("summary") || query.includes("tell me more")) {
    return [siteKnowledge.company, siteKnowledge.ceo, siteKnowledge.services, siteKnowledge.careers, siteKnowledge.contact, liveProjectsSummary()].join("<br><br>");
  }
  return "I'm ET Nexus AI — I can answer questions about Enoch Tech's company info, CEO, services, skills, projects, careers, contact details, the employee dashboard or the admin dashboard. Try asking about any of those, or type \"everything\" for a full overview.";
}
function addAIMessage(html) { const d = document.createElement("div"); d.className = "ai-message"; d.innerHTML = html; $("aiMessages").appendChild(d); $("aiMessages").scrollTop = $("aiMessages").scrollHeight }
function addUserMessage(t) { const d = document.createElement("div"); d.className = "user-message"; d.textContent = t; $("aiMessages").appendChild(d); $("aiMessages").scrollTop = $("aiMessages").scrollHeight }
function sendAIMessage(q = null) { const m = q || $("aiInput").value.trim(); if (!m) return; addUserMessage(m); $("aiInput").value = ""; setTimeout(() => addAIMessage(getAIResponse(m)), 350) }
$("aiButton").addEventListener("click", () => { $("aiChat").classList.toggle("show"); if ($("aiChat").classList.contains("show")) $("aiInput").focus() }); $("closeAI").addEventListener("click", () => $("aiChat").classList.remove("show")); $("sendAI").addEventListener("click", () => sendAIMessage()); $("aiInput").addEventListener("keydown", e => { if (e.key === "Enter") sendAIMessage() }); document.querySelectorAll(".quick-btn").forEach(b => b.addEventListener("click", () => sendAIMessage(b.dataset.question)));

renderProjects(); renderEmployee(); renderAdmin(); $("year").textContent = new Date().getFullYear();
const cu = getCurrentUser(); if (cu) updateDashboard(cu);