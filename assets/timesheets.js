import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const config = window.CADMUS_TIMESHEETS_CONFIG || {};

const app = {
  supabase: null,
  user: null,
  profile: null,
  projects: [],
  managers: [],
  report: null,
  dailyReports: [],
  weekStart: startOfWeek(new Date()),
};

const els = {
  setupNotice: document.querySelector("#setupNotice"),
  authView: document.querySelector("#authView"),
  profileView: document.querySelector("#profileView"),
  appView: document.querySelector("#appView"),
  portfolioView: document.querySelector("#portfolioView"),
  authForm: document.querySelector("#authForm"),
  email: document.querySelector("#email"),
  authMessage: document.querySelector("#authMessage"),
  userEmail: document.querySelector("#userEmail"),
  rolePill: document.querySelector("#rolePill"),
  signOut: document.querySelector("#signOut"),
  profileForm: document.querySelector("#profileForm"),
  profileName: document.querySelector("#profileName"),
  profileCompany: document.querySelector("#profileCompany"),
  profileBranch: document.querySelector("#profileBranch"),
  profileDivision: document.querySelector("#profileDivision"),
  profileProject: document.querySelector("#profileProject"),
  profileManager: document.querySelector("#profileManager"),
  profileMessage: document.querySelector("#profileMessage"),
  profileSummary: document.querySelector("#profileSummary"),
  weekStart: document.querySelector("#weekStart"),
  prevWeek: document.querySelector("#prevWeek"),
  nextWeek: document.querySelector("#nextWeek"),
  saveWeek: document.querySelector("#saveWeek"),
  submitWeek: document.querySelector("#submitWeek"),
  exportCsv: document.querySelector("#exportCsv"),
  dailyGrid: document.querySelector("#dailyGrid"),
  appMessage: document.querySelector("#appMessage"),
  totalHours: document.querySelector("#totalHours"),
  reportStatus: document.querySelector("#reportStatus"),
  projectCode: document.querySelector("#projectCode"),
  portfolioStatus: document.querySelector("#portfolioStatus"),
  refreshPortfolio: document.querySelector("#refreshPortfolio"),
  portfolioList: document.querySelector("#portfolioList"),
};

boot();

async function boot() {
  els.weekStart.value = toDateInput(app.weekStart);

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    els.setupNotice.classList.remove("hidden");
    els.authView.classList.add("hidden");
    return;
  }

  app.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
  bindEvents();

  const { data } = await app.supabase.auth.getSession();
  app.user = data.session?.user || null;
  await renderForAuthState();

  app.supabase.auth.onAuthStateChange(async (_event, session) => {
    app.user = session?.user || null;
    await renderForAuthState();
  });
}

function bindEvents() {
  els.authForm.addEventListener("submit", signIn);
  els.profileForm.addEventListener("submit", saveProfile);
  els.profileProject.addEventListener("change", () => populateManagerSelect());
  els.signOut.addEventListener("click", () => app.supabase.auth.signOut());
  els.weekStart.addEventListener("change", async () => {
    app.weekStart = startOfWeek(parseLocalDate(els.weekStart.value));
    els.weekStart.value = toDateInput(app.weekStart);
    await loadWeek();
  });
  els.prevWeek.addEventListener("click", () => moveWeek(-7));
  els.nextWeek.addEventListener("click", () => moveWeek(7));
  els.saveWeek.addEventListener("click", () => saveWeek("draft"));
  els.submitWeek.addEventListener("click", () => saveWeek("submitted"));
  els.exportCsv.addEventListener("click", exportCsv);
  els.refreshPortfolio.addEventListener("click", loadPortfolio);
  els.portfolioStatus.addEventListener("change", loadPortfolio);
}

async function signIn(event) {
  event.preventDefault();
  setMessage(els.authMessage, "Sending sign-in link...");
  const email = els.email.value.trim();
  const redirectTo = `${window.location.origin}/timesheets/`;
  const { error } = await app.supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    setMessage(els.authMessage, error.message, true);
    return;
  }

  setMessage(els.authMessage, "Check your email for the sign-in link.");
}

async function renderForAuthState() {
  hideAllViews();
  els.signOut.classList.toggle("hidden", !app.user);
  els.rolePill.classList.add("hidden");

  if (!app.user) {
    els.authView.classList.remove("hidden");
    els.userEmail.textContent = "Not signed in";
    return;
  }

  els.userEmail.textContent = app.user.email;
  await loadReferenceData();
  await loadProfile();

  if (!app.profile) {
    renderProfileForm();
    els.profileView.classList.remove("hidden");
    return;
  }

  els.rolePill.textContent = app.profile.role;
  els.rolePill.classList.remove("hidden");
  els.appView.classList.remove("hidden");
  renderProfileSummary();
  await loadWeek();

  if (["manager", "admin"].includes(app.profile.role)) {
    els.portfolioView.classList.remove("hidden");
    await loadPortfolio();
  }
}

function hideAllViews() {
  els.authView.classList.add("hidden");
  els.profileView.classList.add("hidden");
  els.appView.classList.add("hidden");
  els.portfolioView.classList.add("hidden");
}

async function loadReferenceData() {
  const [{ data: projects, error: projectError }, { data: managers, error: managerError }] = await Promise.all([
    app.supabase.from("timesheet_projects").select("id, name, code, client").eq("active", true).order("name"),
    app.supabase.from("timesheet_project_managers").select("id, project_id, manager_name, manager_email").eq("active", true).order("manager_name"),
  ]);

  if (projectError) setMessage(els.profileMessage, `Project load failed: ${projectError.message}`, true);
  if (managerError) setMessage(els.profileMessage, `Manager load failed: ${managerError.message}`, true);

  app.projects = projects || [];
  app.managers = managers || [];
}

async function loadProfile() {
  const { data, error } = await app.supabase
    .from("timesheet_profiles")
    .select("id, email, full_name, company, branch, division, project_id, manager_id, role")
    .eq("id", app.user.id)
    .maybeSingle();

  if (error) {
    setMessage(els.profileMessage, `Profile load failed: ${error.message}`, true);
    app.profile = null;
    return;
  }

  app.profile = data;
}

function renderProfileForm() {
  populateProjectSelect();
  els.profileName.value = app.profile?.full_name || app.user.user_metadata?.full_name || "";
  els.profileCompany.value = app.profile?.company || "Cadmus Project Management";
  els.profileBranch.value = app.profile?.branch || "";
  els.profileDivision.value = app.profile?.division || "";
  els.profileProject.value = app.profile?.project_id || app.projects.find((project) => project.code === "BENCON")?.id || app.projects[0]?.id || "";
  populateManagerSelect(app.profile?.manager_id);
}

function populateProjectSelect() {
  els.profileProject.innerHTML = "";
  els.profileProject.append(new Option("Select project", ""));
  for (const project of app.projects) {
    els.profileProject.append(new Option(projectLabel(project), project.id));
  }
}

function populateManagerSelect(selectedId = "") {
  const projectId = els.profileProject.value;
  const managers = app.managers.filter((manager) => manager.project_id === projectId);
  els.profileManager.innerHTML = "";
  els.profileManager.append(new Option(managers.length ? "Select manager" : "No managers configured", ""));
  for (const manager of managers) {
    els.profileManager.append(new Option(`${manager.manager_name} - ${manager.manager_email}`, manager.id));
  }
  els.profileManager.value = selectedId && managers.some((manager) => manager.id === selectedId) ? selectedId : "";
}

async function saveProfile(event) {
  event.preventDefault();
  setMessage(els.profileMessage, "Saving profile...");

  const payload = {
    id: app.user.id,
    email: app.user.email,
    full_name: els.profileName.value.trim(),
    company: els.profileCompany.value.trim(),
    branch: els.profileBranch.value.trim(),
    division: els.profileDivision.value.trim(),
    project_id: els.profileProject.value,
    manager_id: els.profileManager.value,
  };

  if (!payload.full_name || !payload.company || !payload.branch || !payload.division || !payload.project_id || !payload.manager_id) {
    setMessage(els.profileMessage, "Complete every profile field before continuing.", true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    setMessage(els.profileMessage, `Profile save failed: ${error.message}`, true);
    return;
  }

  setMessage(els.profileMessage, "Profile saved.");
  await renderForAuthState();
}

function renderProfileSummary() {
  const project = getProject(app.profile.project_id);
  const manager = getManager(app.profile.manager_id);
  els.projectCode.textContent = project?.code || "-";
  els.profileSummary.innerHTML = [
    ["Company", app.profile.company],
    ["Branch", app.profile.branch],
    ["Division", app.profile.division],
    ["Project", projectLabel(project)],
    ["Manager", manager ? manager.manager_name : "-"],
  ]
    .map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`)
    .join("");
}

async function loadWeek() {
  setMessage(els.appMessage, "Loading week...");
  const { data: report, error: reportError } = await app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, status, manager_notes, submitted_at, reviewed_at")
    .eq("user_id", app.user.id)
    .eq("week_start", toDateInput(app.weekStart))
    .maybeSingle();

  if (reportError) {
    setMessage(els.appMessage, `Week load failed: ${reportError.message}`, true);
    return;
  }

  app.report = report || null;
  if (!app.report) {
    app.dailyReports = buildBlankDailyReports(null);
    renderDailyReports();
    setMessage(els.appMessage, "");
    return;
  }

  const { data: days, error: daysError } = await app.supabase
    .from("timesheet_daily_reports")
    .select("id, weekly_report_id, day_index, work_date, hours, accomplishments, blockers, next_steps")
    .eq("weekly_report_id", app.report.id)
    .order("day_index");

  if (daysError) {
    setMessage(els.appMessage, `Daily boxes failed: ${daysError.message}`, true);
    return;
  }

  app.dailyReports = mergeDailyReports(days || []);
  renderDailyReports();
  setMessage(els.appMessage, "");
}

function buildBlankDailyReports(reportId) {
  return weekdays.map((_day, index) => ({
    id: "",
    weekly_report_id: reportId || "",
    day_index: index,
    work_date: toDateInput(addDays(app.weekStart, index)),
    hours: 0,
    accomplishments: "",
    blockers: "",
    next_steps: "",
  }));
}

function mergeDailyReports(days) {
  const byIndex = new Map(days.map((day) => [day.day_index, day]));
  return buildBlankDailyReports(app.report.id).map((blank) => ({ ...blank, ...(byIndex.get(blank.day_index) || {}) }));
}

function renderDailyReports() {
  const locked = app.report && ["submitted", "approved"].includes(app.report.status);
  els.dailyGrid.innerHTML = "";

  for (const day of app.dailyReports) {
    const card = document.createElement("article");
    card.className = "day-card";
    card.dataset.dayIndex = String(day.day_index);
    card.innerHTML = `
      <header>
        <div>
          <h3>${weekdays[day.day_index]}</h3>
          <time>${formatShortDate(day.work_date)}</time>
        </div>
        <span class="status-pill">${formatHours(day.hours)}h</span>
      </header>
      <div class="day-body">
        <label class="field">
          <span>Hours</span>
          <input data-field="hours" type="number" min="0" max="24" step="0.25" value="${Number(day.hours || 0)}">
        </label>
        <label class="field">
          <span>Work performed</span>
          <textarea data-field="accomplishments" placeholder="Completed tasks, meetings, deliverables">${escapeHtml(day.accomplishments || "")}</textarea>
        </label>
        <label class="field">
          <span>Blockers</span>
          <textarea data-field="blockers" placeholder="Risks, delays, decisions needed">${escapeHtml(day.blockers || "")}</textarea>
        </label>
        <label class="field">
          <span>Next steps</span>
          <textarea data-field="next_steps" placeholder="Planned follow-up or tomorrow's focus">${escapeHtml(day.next_steps || "")}</textarea>
        </label>
      </div>
    `;

    for (const input of card.querySelectorAll("input, textarea")) {
      input.disabled = locked;
      input.addEventListener("input", updateTotalsFromDom);
    }

    els.dailyGrid.append(card);
  }

  const status = app.report?.status || "draft";
  els.reportStatus.textContent = status[0].toUpperCase() + status.slice(1);
  els.saveWeek.disabled = locked;
  els.submitWeek.disabled = locked;
  updateTotalsFromDom();
}

async function saveWeek(targetStatus) {
  if (!app.profile) return;

  const dailyPayload = collectDailyReports();
  if (dailyPayload.error) {
    setMessage(els.appMessage, dailyPayload.error, true);
    return;
  }

  setMessage(els.appMessage, targetStatus === "submitted" ? "Submitting week..." : "Saving draft...");
  const reportPayload = {
    id: app.report?.id || crypto.randomUUID(),
    user_id: app.user.id,
    week_start: toDateInput(app.weekStart),
    project_id: app.profile.project_id,
    manager_id: app.profile.manager_id,
    status: "draft",
    submitted_at: app.report?.submitted_at || null,
  };

  const { data: report, error: reportError } = await app.supabase
    .from("timesheet_weekly_reports")
    .upsert(reportPayload, { onConflict: "user_id,week_start" })
    .select("id, user_id, week_start, project_id, manager_id, status, manager_notes, submitted_at, reviewed_at")
    .single();

  if (reportError) {
    setMessage(els.appMessage, `Week save failed: ${reportError.message}`, true);
    return;
  }

  const rows = dailyPayload.rows.map((row) => ({
    ...row,
    id: row.id || crypto.randomUUID(),
    weekly_report_id: report.id,
  }));

  const { error: dayError } = await app.supabase.from("timesheet_daily_reports").upsert(rows, {
    onConflict: "weekly_report_id,day_index",
  });

  if (dayError) {
    setMessage(els.appMessage, `Daily save failed: ${dayError.message}`, true);
    return;
  }

  if (targetStatus === "submitted") {
    const { data: submittedReport, error: submitError } = await app.supabase
      .from("timesheet_weekly_reports")
      .update({ status: "submitted", submitted_at: new Date().toISOString() })
      .eq("id", report.id)
      .select("id, user_id, week_start, project_id, manager_id, status, manager_notes, submitted_at, reviewed_at")
      .single();

    if (submitError) {
      setMessage(els.appMessage, `Submit failed: ${submitError.message}`, true);
      return;
    }

    app.report = submittedReport;
  } else {
    app.report = report;
  }

  setMessage(els.appMessage, targetStatus === "submitted" ? "Week submitted." : "Draft saved.");
  await loadWeek();
  if (["manager", "admin"].includes(app.profile.role)) await loadPortfolio();
}

function collectDailyReports() {
  const rows = [];
  for (const card of els.dailyGrid.querySelectorAll(".day-card")) {
    const dayIndex = Number(card.dataset.dayIndex);
    const hours = Number(card.querySelector('[data-field="hours"]').value || 0);

    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      return { error: "Hours must be between 0 and 24 for each day." };
    }

    const existing = app.dailyReports.find((day) => day.day_index === dayIndex);
    rows.push({
      id: existing?.id || "",
      day_index: dayIndex,
      work_date: toDateInput(addDays(app.weekStart, dayIndex)),
      hours,
      accomplishments: card.querySelector('[data-field="accomplishments"]').value.trim(),
      blockers: card.querySelector('[data-field="blockers"]').value.trim(),
      next_steps: card.querySelector('[data-field="next_steps"]').value.trim(),
    });
  }

  return { rows };
}

function updateTotalsFromDom() {
  let total = 0;
  for (const input of els.dailyGrid.querySelectorAll('[data-field="hours"]')) {
    total += Number(input.value || 0);
  }
  els.totalHours.textContent = formatHours(total);
}

async function loadPortfolio() {
  if (!app.profile || !["manager", "admin"].includes(app.profile.role)) return;

  els.portfolioList.innerHTML = `<div class="empty-state"><p>Loading portfolio reports...</p></div>`;
  let query = app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, status, manager_notes, submitted_at, reviewed_at")
    .order("week_start", { ascending: false })
    .limit(30);

  if (els.portfolioStatus.value !== "all") {
    query = query.eq("status", els.portfolioStatus.value);
  }

  const { data: reports, error } = await query;
  if (error) {
    els.portfolioList.innerHTML = `<div class="empty-state"><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }

  if (!reports || reports.length === 0) {
    els.portfolioList.innerHTML = `<div class="empty-state"><p>No reports match this view.</p></div>`;
    return;
  }

  const reportIds = reports.map((report) => report.id);
  const userIds = [...new Set(reports.map((report) => report.user_id))];
  const [{ data: profiles }, { data: days }] = await Promise.all([
    app.supabase.from("timesheet_profiles").select("id, full_name, email, company, branch, division").in("id", userIds),
    app.supabase.from("timesheet_daily_reports").select("weekly_report_id, day_index, work_date, hours, accomplishments, blockers, next_steps").in("weekly_report_id", reportIds).order("day_index"),
  ]);

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const daysByReport = groupBy(days || [], "weekly_report_id");
  els.portfolioList.innerHTML = "";

  for (const report of reports) {
    els.portfolioList.append(renderReviewCard(report, profileMap.get(report.user_id), daysByReport.get(report.id) || []));
  }
}

function renderReviewCard(report, profile, days) {
  const project = getProject(report.project_id);
  const manager = getManager(report.manager_id);
  const total = days.reduce((sum, day) => sum + Number(day.hours || 0), 0);
  const card = document.createElement("article");
  card.className = "review-card";
  card.innerHTML = `
    <div class="review-head">
      <div>
        <h3>${escapeHtml(profile?.full_name || "Unknown resource")}</h3>
        <p class="helper">${escapeHtml(profile?.email || "")}</p>
      </div>
      <span class="status-pill ${escapeHtml(report.status)}">${escapeHtml(report.status)}</span>
    </div>
    <div class="review-meta">
      ${reviewMeta("Week", formatShortDate(report.week_start))}
      ${reviewMeta("Project", projectLabel(project))}
      ${reviewMeta("Branch", profile?.branch || "-")}
      ${reviewMeta("Division", profile?.division || "-")}
      ${reviewMeta("Manager", manager?.manager_name || "-")}
      ${reviewMeta("Total hours", `${formatHours(total)}h`)}
      ${reviewMeta("Company", profile?.company || "-")}
      ${reviewMeta("Submitted", report.submitted_at ? formatShortDate(report.submitted_at) : "-")}
    </div>
    <div class="review-days">
      ${days.map(renderReviewDay).join("")}
    </div>
  `;

  if (["submitted", "rejected"].includes(report.status) && ["manager", "admin"].includes(app.profile.role)) {
    const actions = document.createElement("div");
    actions.className = "toolbar";
    const approve = document.createElement("button");
    approve.className = "button primary";
    approve.type = "button";
    approve.textContent = "Approve";
    approve.addEventListener("click", () => reviewReport(report.id, "approved"));
    const reject = document.createElement("button");
    reject.className = "button danger";
    reject.type = "button";
    reject.textContent = "Reject";
    reject.addEventListener("click", () => reviewReport(report.id, "rejected"));
    actions.append(approve, reject);
    card.append(actions);
  }

  return card;
}

function reviewMeta(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
}

function renderReviewDay(day) {
  return `
    <div class="review-day">
      <span>${escapeHtml(weekdays[day.day_index] || "Day")}</span>
      <strong>${formatHours(day.hours)}h</strong>
      <p>${escapeHtml(day.accomplishments || "No update entered.")}</p>
      ${day.blockers ? `<p>Blocker: ${escapeHtml(day.blockers)}</p>` : ""}
    </div>
  `;
}

async function reviewReport(reportId, status) {
  const { error } = await app.supabase
    .from("timesheet_weekly_reports")
    .update({ status, reviewed_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    els.portfolioList.insertAdjacentHTML("afterbegin", `<div class="notice"><p>${escapeHtml(error.message)}</p></div>`);
    return;
  }

  await loadPortfolio();
}

function exportCsv() {
  const rows = [["Week", "Date", "Day", "Project", "Branch", "Division", "Manager", "Hours", "Work Performed", "Blockers", "Next Steps", "Status"]];
  const project = getProject(app.profile.project_id);
  const manager = getManager(app.profile.manager_id);

  for (const day of collectDailyReports().rows || []) {
    rows.push([
      toDateInput(app.weekStart),
      day.work_date,
      weekdays[day.day_index],
      projectLabel(project),
      app.profile.branch,
      app.profile.division,
      manager?.manager_name || "",
      String(day.hours),
      day.accomplishments,
      day.blockers,
      day.next_steps,
      app.report?.status || "draft",
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `cadmus-weekly-report-${toDateInput(app.weekStart)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function moveWeek(days) {
  app.weekStart = addDays(app.weekStart, days);
  els.weekStart.value = toDateInput(app.weekStart);
  loadWeek();
}

function getProject(id) {
  return app.projects.find((project) => project.id === id);
}

function getManager(id) {
  return app.managers.find((manager) => manager.id === id);
}

function projectLabel(project) {
  if (!project) return "-";
  return [project.code, project.name].filter(Boolean).join(" - ");
}

function groupBy(items, key) {
  const map = new Map();
  for (const item of items) {
    const value = item[key];
    if (!map.has(value)) map.set(value, []);
    map.get(value).push(item);
  }
  return map;
}

function startOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function parseLocalDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatShortDate(value) {
  const date = typeof value === "string" ? new Date(`${value.slice(0, 10)}T00:00:00`) : value;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatHours(value) {
  return Number(value || 0).toFixed(Number(value || 0) % 1 === 0 ? 0 : 2);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}
