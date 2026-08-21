import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const config = window.CADMUS_TIMESHEETS_CONFIG || {};
const reportingFormats = {
  daily_cards: "Daily Cards",
  weekly_grid: "Weekly Grid",
  work_log: "Work Log",
};
const ppmRoles = {
  resource: "Resource",
  manager: "Project Manager",
  admin: "Portfolio Manager",
};

const app = {
  supabase: null,
  user: null,
  profile: null,
  projects: [],
  managers: [],
  branches: [],
  divisions: [],
  tasks: [],
  adminProfiles: [],
  pendingInvite: null,
  adminProjectFocus: "all",
  passwordRecovery: false,
  report: null,
  dailyReports: [],
  reportFormat: "weekly_grid",
  weekStart: startOfWeek(new Date()),
};

const els = {
  setupNotice: document.querySelector("#setupNotice"),
  authView: document.querySelector("#authView"),
  profileView: document.querySelector("#profileView"),
  appView: document.querySelector("#appView"),
  portfolioView: document.querySelector("#portfolioView"),
  adminView: document.querySelector("#adminView"),
  authForm: document.querySelector("#authForm"),
  email: document.querySelector("#email"),
  password: document.querySelector("#password"),
  passwordSignIn: document.querySelector("#passwordSignIn"),
  passwordSignUp: document.querySelector("#passwordSignUp"),
  magicLink: document.querySelector("#magicLink"),
  resetPassword: document.querySelector("#resetPassword"),
  authMessage: document.querySelector("#authMessage"),
  userEmail: document.querySelector("#userEmail"),
  rolePill: document.querySelector("#rolePill"),
  signOut: document.querySelector("#signOut"),
  profileForm: document.querySelector("#profileForm"),
  profilePassword: document.querySelector("#profilePassword"),
  profilePasswordConfirm: document.querySelector("#profilePasswordConfirm"),
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
  withdrawWeek: document.querySelector("#withdrawWeek"),
  exportCsv: document.querySelector("#exportCsv"),
  reportFormat: document.querySelector("#reportFormat"),
  reportFormatTitle: document.querySelector("#reportFormatTitle"),
  dailyGrid: document.querySelector("#dailyGrid"),
  appMessage: document.querySelector("#appMessage"),
  totalHours: document.querySelector("#totalHours"),
  reportStatus: document.querySelector("#reportStatus"),
  projectCode: document.querySelector("#projectCode"),
  dueDate: document.querySelector("#dueDate"),
  portfolioStatus: document.querySelector("#portfolioStatus"),
  portfolioProject: document.querySelector("#portfolioProject"),
  portfolioWeek: document.querySelector("#portfolioWeek"),
  refreshPortfolio: document.querySelector("#refreshPortfolio"),
  portfolioList: document.querySelector("#portfolioList"),
  projectForm: document.querySelector("#projectForm"),
  managerForm: document.querySelector("#managerForm"),
  branchForm: document.querySelector("#branchForm"),
  divisionForm: document.querySelector("#divisionForm"),
  taskForm: document.querySelector("#taskForm"),
  adminExportForm: document.querySelector("#adminExportForm"),
  inviteForm: document.querySelector("#inviteForm"),
  adminProjectFocus: document.querySelector("#adminProjectFocus"),
  adminProjectName: document.querySelector("#adminProjectName"),
  adminProjectCode: document.querySelector("#adminProjectCode"),
  adminProjectClient: document.querySelector("#adminProjectClient"),
  adminFormatDaily: document.querySelector("#adminFormatDaily"),
  adminFormatGrid: document.querySelector("#adminFormatGrid"),
  adminFormatLog: document.querySelector("#adminFormatLog"),
  adminManagerProject: document.querySelector("#adminManagerProject"),
  adminManagerName: document.querySelector("#adminManagerName"),
  adminManagerEmail: document.querySelector("#adminManagerEmail"),
  adminBranchName: document.querySelector("#adminBranchName"),
  adminDivisionBranch: document.querySelector("#adminDivisionBranch"),
  adminDivisionName: document.querySelector("#adminDivisionName"),
  adminTaskProject: document.querySelector("#adminTaskProject"),
  adminTaskName: document.querySelector("#adminTaskName"),
  adminTaskCode: document.querySelector("#adminTaskCode"),
  adminExportBranch: document.querySelector("#adminExportBranch"),
  adminExportDivision: document.querySelector("#adminExportDivision"),
  adminExportStart: document.querySelector("#adminExportStart"),
  adminExportEnd: document.querySelector("#adminExportEnd"),
  userFilterForm: document.querySelector("#userFilterForm"),
  adminUserBranch: document.querySelector("#adminUserBranch"),
  adminUserDivision: document.querySelector("#adminUserDivision"),
  adminUserProject: document.querySelector("#adminUserProject"),
  adminUserStatus: document.querySelector("#adminUserStatus"),
  inviteEmails: document.querySelector("#inviteEmails"),
  inviteRole: document.querySelector("#inviteRole"),
  inviteProject: document.querySelector("#inviteProject"),
  inviteManager: document.querySelector("#inviteManager"),
  inviteBranch: document.querySelector("#inviteBranch"),
  inviteDivision: document.querySelector("#inviteDivision"),
  projectList: document.querySelector("#projectList"),
  managerList: document.querySelector("#managerList"),
  branchList: document.querySelector("#branchList"),
  divisionList: document.querySelector("#divisionList"),
  taskList: document.querySelector("#taskList"),
  userList: document.querySelector("#userList"),
  adminMessage: document.querySelector("#adminMessage"),
};

boot();

async function boot() {
  els.weekStart.value = toDateInput(app.weekStart);

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    els.setupNotice.classList.remove("hidden");
    els.authView.classList.add("hidden");
    return;
  }

  app.supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  bindEvents();
  await handleAuthCallback();
  subscribeToProjectSettings();

  const { data } = await app.supabase.auth.getSession();
  app.user = data.session?.user || null;
  await renderForAuthState();

  app.supabase.auth.onAuthStateChange(async (_event, session) => {
    app.user = session?.user || null;
    if (_event === "PASSWORD_RECOVERY") app.passwordRecovery = true;
    await renderForAuthState();
  });
}

function subscribeToProjectSettings() {
  app.supabase
    .channel("timesheet-project-settings")
    .on("postgres_changes", { event: "*", schema: "public", table: "timesheet_projects" }, async () => {
      if (!app.user) return;
      await loadReferenceData();
      if (app.profile) renderDailyReports();
      if (app.profile?.role === "admin") await renderAdminConsole();
    })
    .subscribe();
}

async function handleAuthCallback() {
  const url = new URL(window.location.href);
  const search = url.searchParams;
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const error = search.get("error_description") || hash.get("error_description") || search.get("error") || hash.get("error");

  if (error) {
    setMessage(els.authMessage, friendlyAuthError({ message: error.replaceAll("+", " ") }), true);
    cleanAuthUrl({ preserveInvite: true });
    return;
  }

  const tokenHash = search.get("token_hash") || hash.get("token_hash");
  const type = search.get("type") || hash.get("type");
  if (type === "recovery") app.passwordRecovery = true;
  if (tokenHash && type) {
    setMessage(els.authMessage, "Confirming email...");
    const { error: verifyError } = await app.supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (verifyError) {
      setMessage(els.authMessage, friendlyAuthError(verifyError), true);
      return;
    }
    cleanAuthUrl({ preserveInvite: true });
    setMessage(els.authMessage, "Email confirmed. You are signed in.");
    return;
  }

  const code = search.get("code");
  if (code) {
    setMessage(els.authMessage, "Finishing sign-in...");
    const { error: exchangeError } = await app.supabase.auth.exchangeCodeForSession(code);
    if (exchangeError) {
      setMessage(els.authMessage, friendlyAuthError(exchangeError), true);
      return;
    }
    cleanAuthUrl({ preserveInvite: true });
    setMessage(els.authMessage, "Email confirmed. You are signed in.");
  }
}

function cleanAuthUrl({ preserveInvite = false } = {}) {
  const inviteId = new URL(window.location.href).searchParams.get("invite");
  const cleanUrl = preserveInvite && inviteId
    ? `${window.location.origin}/timesheets/?invite=${encodeURIComponent(inviteId)}`
    : `${window.location.origin}/timesheets/`;
  window.history.replaceState({}, document.title, cleanUrl);
}

function authRedirectUrl() {
  const inviteId = new URL(window.location.href).searchParams.get("invite");
  return inviteId
    ? `${window.location.origin}/timesheets/?invite=${encodeURIComponent(inviteId)}`
    : `${window.location.origin}/timesheets/`;
}

function friendlyAuthError(error) {
  const message = error?.message || "Sign-in failed.";
  const normalized = message.toLowerCase();

  if (normalized.includes("email not confirmed") || normalized.includes("confirm")) {
    return "That email is waiting for confirmation. Open the confirmation email first, then come back and sign in.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many email attempts were sent. Check for an existing confirmation or sign-in email, then wait a minute before requesting another.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "That email and password did not match. If this is a new account, check your confirmation email first.";
  }

  return message;
}

function bindEvents() {
  els.authForm.addEventListener("submit", signIn);
  els.passwordSignIn.addEventListener("click", signInWithPassword);
  els.passwordSignUp.addEventListener("click", signUpWithPassword);
  els.resetPassword.addEventListener("click", sendPasswordReset);
  els.profileForm.addEventListener("submit", saveProfile);
  els.profileProject.addEventListener("change", () => populateManagerSelect());
  els.profileBranch.addEventListener("change", () => populateDivisionSelect());
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
  els.withdrawWeek.addEventListener("click", withdrawWeek);
  els.exportCsv.addEventListener("click", exportCsv);
  els.reportFormat.addEventListener("change", () => {
    app.reportFormat = els.reportFormat.value;
    renderDailyReports();
  });
  els.refreshPortfolio.addEventListener("click", loadPortfolio);
  els.portfolioStatus.addEventListener("change", loadPortfolio);
  els.portfolioProject.addEventListener("change", loadPortfolio);
  els.portfolioWeek.addEventListener("change", () => {
    els.portfolioWeek.value = toDateInput(startOfWeek(parseLocalDate(els.portfolioWeek.value)));
    loadPortfolio();
  });
  els.projectForm.addEventListener("submit", addProject);
  els.managerForm.addEventListener("submit", addManager);
  els.branchForm.addEventListener("submit", addBranch);
  els.divisionForm.addEventListener("submit", addDivision);
  els.taskForm.addEventListener("submit", addTask);
  els.adminExportForm.addEventListener("submit", exportAdminWork);
  els.adminExportBranch.addEventListener("change", populateAdminExportDivisions);
  els.userFilterForm.addEventListener("submit", (event) => event.preventDefault());
  els.adminUserBranch.addEventListener("change", () => {
    populateAdminUserDivisions();
    renderUserAdminList();
  });
  els.adminUserDivision.addEventListener("change", renderUserAdminList);
  els.adminUserProject.addEventListener("change", renderUserAdminList);
  els.adminUserStatus.addEventListener("change", renderUserAdminList);
  els.adminProjectFocus.addEventListener("change", async () => {
    app.adminProjectFocus = els.adminProjectFocus.value;
    await renderAdminConsole();
  });
  els.inviteForm.addEventListener("submit", sendBulkInvitations);
  els.inviteProject.addEventListener("change", populateInviteManagers);
  els.inviteBranch.addEventListener("change", populateInviteDivisions);
}

async function signIn(event) {
  event.preventDefault();
  setMessage(els.authMessage, "Sending sign-in link...");
  setMagicLinkCooldown();
  const email = els.email.value.trim();
  const redirectTo = authRedirectUrl();
  const { error } = await app.supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    setMessage(els.authMessage, friendlyAuthError(error), true);
    return;
  }

  setMessage(els.authMessage, "Check your email for the sign-in link.");
}

async function signInWithPassword() {
  const email = els.email.value.trim();
  const password = els.password.value;

  if (!email || !password) {
    setMessage(els.authMessage, "Enter email and password.", true);
    return;
  }

  setMessage(els.authMessage, "Signing in...");
  const { error } = await app.supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(els.authMessage, friendlyAuthError(error), true);
    return;
  }

  setMessage(els.authMessage, "Signed in.");
}

async function signUpWithPassword() {
  const email = els.email.value.trim();
  const password = els.password.value;

  if (!email || password.length < 8) {
    setMessage(els.authMessage, "Use an email and a password with at least 8 characters.", true);
    return;
  }

  setMessage(els.authMessage, "Creating account...");
  const { error } = await app.supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: authRedirectUrl() },
  });

  if (error) {
    setMessage(els.authMessage, friendlyAuthError(error), true);
    return;
  }

  setMessage(els.authMessage, "Account created. If confirmation is enabled, check your email once; otherwise sign in now.");
}

async function sendPasswordReset() {
  const email = els.email.value.trim();
  if (!email) {
    setMessage(els.authMessage, "Enter your email first, then reset your password.", true);
    return;
  }

  setMessage(els.authMessage, "Sending password reset...");
  const { error } = await app.supabase.auth.resetPasswordForEmail(email, {
    redirectTo: authRedirectUrl(),
  });

  if (error) {
    setMessage(els.authMessage, friendlyAuthError(error), true);
    return;
  }

  setMessage(els.authMessage, "Check your email for the password reset link.");
}

function setMagicLinkCooldown() {
  let remaining = 60;
  els.magicLink.disabled = true;
  els.magicLink.textContent = `Email Link (${remaining})`;
  const timer = window.setInterval(() => {
    remaining -= 1;
    els.magicLink.textContent = remaining > 0 ? `Email Link (${remaining})` : "Email Link";
    if (remaining <= 0) {
      els.magicLink.disabled = false;
      window.clearInterval(timer);
    }
  }, 1000);
}

async function renderForAuthState() {
  hideAllViews();
  els.signOut.classList.toggle("hidden", !app.user);
  els.rolePill.classList.add("hidden");

  if (!app.user) {
    els.authView.classList.remove("hidden");
    els.userEmail.textContent = "Not signed in";
    if (new URL(window.location.href).searchParams.get("invite")) {
      setMessage(els.authMessage, "Invitation link detected. Sign in or create an account with the invited email address to continue.");
    }
    return;
  }

  els.userEmail.textContent = app.user.email;
  await loadReferenceData();
  await loadPendingInvitation();
  await loadProfile();

  if (app.profile?.active === false) {
    els.authView.classList.remove("hidden");
    setMessage(els.authMessage, "This timesheet account is inactive. Contact your Portfolio Manager for access.", true);
    return;
  }

  if (!app.profile) {
    renderProfileForm();
    els.profileView.classList.remove("hidden");
    return;
  }

  if (app.passwordRecovery) {
    renderProfileForm();
    els.profileView.classList.remove("hidden");
    setMessage(els.profileMessage, "Create a new password before continuing.");
    return;
  }

  els.rolePill.textContent = roleLabel(app.profile.role);
  els.rolePill.classList.remove("hidden");
  els.appView.classList.remove("hidden");
  renderProfileSummary();
  await loadWeek();

  if (canReviewPortfolio()) {
    els.portfolioView.classList.remove("hidden");
    if (!els.portfolioWeek.value) els.portfolioWeek.value = toDateInput(app.weekStart);
    populatePortfolioProjectFilter();
    await loadPortfolio();
  }

  if (isPortfolioManager()) {
    els.adminView.classList.remove("hidden");
    await renderAdminConsole();
    setDefaultAdminExportWindow();
  }
}

function hideAllViews() {
  els.authView.classList.add("hidden");
  els.profileView.classList.add("hidden");
  els.appView.classList.add("hidden");
  els.portfolioView.classList.add("hidden");
  els.adminView.classList.add("hidden");
}

async function loadReferenceData() {
  const [
    { data: projects, error: projectError },
    { data: managers, error: managerError },
    { data: branches, error: branchError },
    { data: divisions, error: divisionError },
    { data: tasks, error: taskError },
  ] = await Promise.all([
    app.supabase.from("timesheet_projects").select("id, name, code, client, reporting_formats").eq("active", true).order("name"),
    app.supabase.from("timesheet_project_managers").select("id, project_id, manager_name, manager_email").eq("active", true).order("manager_name"),
    app.supabase.from("timesheet_branches").select("id, name").eq("active", true).order("name"),
    app.supabase.from("timesheet_divisions").select("id, branch_id, name").eq("active", true).order("name"),
    app.supabase.from("timesheet_tasks").select("id, project_id, name, code").eq("active", true).order("name"),
  ]);

  if (projectError) setMessage(els.profileMessage, `Project load failed: ${projectError.message}`, true);
  if (managerError) setMessage(els.profileMessage, `Manager load failed: ${managerError.message}`, true);
  if (branchError) setMessage(els.profileMessage, `Branch load failed: ${branchError.message}`, true);
  if (divisionError) setMessage(els.profileMessage, `Division load failed: ${divisionError.message}`, true);
  if (taskError) setMessage(els.profileMessage, `Task load failed: ${taskError.message}`, true);

  app.projects = projects || [];
  app.managers = managers || [];
  app.branches = branches || [];
  app.divisions = divisions || [];
  app.tasks = tasks || [];
}

async function loadProfile() {
  const { data, error } = await app.supabase
    .from("timesheet_profiles")
    .select("id, email, full_name, company, branch, division, project_id, manager_id, role, active")
    .eq("id", app.user.id)
    .maybeSingle();

  if (error) {
    setMessage(els.profileMessage, `Profile load failed: ${error.message}`, true);
    app.profile = null;
    return;
  }

  app.profile = data;
}

async function loadPendingInvitation() {
  const inviteId = new URL(window.location.href).searchParams.get("invite");
  let query = app.supabase
    .from("timesheet_invitations")
    .select("id, email, role, project_id, manager_id, branch, division, accepted_at")
    .eq("active", true)
    .is("accepted_at", null)
    .order("created_at", { ascending: false })
    .limit(1);

  if (inviteId) {
    query = query.eq("id", inviteId);
  } else {
    query = query.ilike("email", app.user.email);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    app.pendingInvite = null;
    return;
  }

  app.pendingInvite = data || null;
}

function renderProfileForm() {
  populateProjectSelect();
  populateBranchSelect();
  const invite = app.pendingInvite || {};
  els.profileName.value = app.profile?.full_name || app.user.user_metadata?.full_name || "";
  els.profileCompany.value = app.profile?.company || "Cadmus Project Management";
  els.profileBranch.value = app.profile?.branch || invite.branch || app.branches[0]?.name || "";
  populateDivisionSelect(app.profile?.division || invite.division || "");
  els.profileProject.value = app.profile?.project_id || invite.project_id || app.projects.find((project) => project.code === "BENCON")?.id || app.projects[0]?.id || "";
  populateManagerSelect(app.profile?.manager_id || invite.manager_id || "");
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

function populateBranchSelect() {
  els.profileBranch.innerHTML = "";
  els.profileBranch.append(new Option("Select branch", ""));
  for (const branch of app.branches) {
    els.profileBranch.append(new Option(branch.name, branch.name));
  }
}

function populateDivisionSelect(selectedValue = "") {
  const branch = app.branches.find((item) => item.name === els.profileBranch.value);
  const divisions = app.divisions.filter((division) => !division.branch_id || division.branch_id === branch?.id);
  els.profileDivision.innerHTML = "";
  els.profileDivision.append(new Option(divisions.length ? "Select division" : "No divisions configured", ""));
  for (const division of divisions) {
    els.profileDivision.append(new Option(division.name, division.name));
  }
  els.profileDivision.value = selectedValue && divisions.some((division) => division.name === selectedValue) ? selectedValue : "";
}

async function saveProfile(event) {
  event.preventDefault();
  setMessage(els.profileMessage, "Saving profile...");
  const password = els.profilePassword.value;
  const passwordConfirm = els.profilePasswordConfirm.value;

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

  if (password.length < 8) {
    setMessage(els.profileMessage, "Create a password with at least 8 characters.", true);
    return;
  }

  if (password !== passwordConfirm) {
    setMessage(els.profileMessage, "Password and confirmation must match.", true);
    return;
  }

  const { error: passwordError } = await app.supabase.auth.updateUser({ password });
  if (passwordError) {
    setMessage(els.profileMessage, `Password setup failed: ${friendlyAuthError(passwordError)}`, true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    setMessage(els.profileMessage, `Profile save failed: ${error.message}`, true);
    return;
  }

  if (app.pendingInvite?.id) {
    await app.supabase
      .from("timesheet_invitations")
      .update({ accepted_at: new Date().toISOString(), active: false })
      .eq("id", app.pendingInvite.id);
    app.pendingInvite = null;
    cleanAuthUrl();
  }

  setMessage(els.profileMessage, "Profile saved.");
  app.passwordRecovery = false;
  els.profilePassword.value = "";
  els.profilePasswordConfirm.value = "";
  await renderForAuthState();
}

function renderProfileSummary() {
  const project = getProject(app.profile.project_id);
  const manager = getManager(app.profile.manager_id);
  const company = app.profile.company === "Cadmus Project Management" ? "Cadmus PM" : app.profile.company;
  els.projectCode.textContent = project?.code || "-";
  els.dueDate.textContent = formatShortDate(toDateInput(addDays(app.weekStart, 4)));
  els.profileSummary.innerHTML = [
    ["Company", company],
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
    .select("id, weekly_report_id, day_index, line_index, work_date, task_id, hours, accomplishments, blockers, next_steps")
    .eq("weekly_report_id", app.report.id)
    .order("day_index")
    .order("line_index");

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
    line_index: 0,
    work_date: toDateInput(addDays(app.weekStart, index)),
    task_id: "",
    hours: 0,
    accomplishments: "",
    blockers: "",
    next_steps: "",
  }));
}

function mergeDailyReports(days) {
  const merged = [];
  for (let index = 0; index < weekdays.length; index += 1) {
    const lines = days
      .filter((day) => day.day_index === index)
      .sort((a, b) => Number(a.line_index || 0) - Number(b.line_index || 0));
    if (lines.length) {
      merged.push(...lines.map((line, lineIndex) => ({ ...line, line_index: Number(line.line_index ?? lineIndex) })));
    } else {
      merged.push(buildBlankDailyReports(app.report.id)[index]);
    }
  }
  return merged;
}

function renderDailyReports() {
  const locked = app.report && ["submitted", "approved"].includes(app.report.status);
  const canWithdraw = app.report?.status === "submitted";
  const enabledFormats = ["weekly_grid"];
  app.reportFormat = "weekly_grid";
  renderFormatSelector(enabledFormats);

  const projectTasks = getTasksForProject(app.profile?.project_id);
  const taskOptions = projectTasks
    .map((task) => `<option value="${escapeHtml(taskLabel(task))}"></option>`)
    .join("");
  els.dailyGrid.innerHTML = `<datalist id="taskOptions">${taskOptions}</datalist>`;

  if (app.reportFormat === "weekly_grid") {
    renderWeeklyGrid({ locked, projectTasks });
  } else if (app.reportFormat === "work_log") {
    renderWorkLog({ locked, projectTasks });
  } else {
    renderDailyCards({ locked, projectTasks });
  }

  const status = app.report?.status || "draft";
  els.reportStatus.textContent = status[0].toUpperCase() + status.slice(1);
  els.saveWeek.disabled = locked;
  els.submitWeek.disabled = locked;
  els.withdrawWeek.classList.toggle("hidden", !canWithdraw);
  els.withdrawWeek.disabled = !canWithdraw;
  updateTotalsFromDom();
}

function renderFormatSelector(enabledFormats) {
  els.reportFormat.innerHTML = "";
  for (const format of enabledFormats) {
    els.reportFormat.append(new Option(reportingFormats[format] || format, format));
  }
  els.reportFormat.value = app.reportFormat;
  els.reportFormat.disabled = enabledFormats.length <= 1;
  els.reportFormatTitle.textContent = reportingFormats[app.reportFormat] || "Daily Boxes";
}

function renderDailyCards({ locked, projectTasks }) {
  for (let dayIndex = 0; dayIndex < weekdays.length; dayIndex += 1) {
    const dayLines = getLinesForDay(dayIndex);
    const dayTotal = dayLines.reduce((sum, line) => sum + Number(line.hours || 0), 0);
    const card = document.createElement("article");
    card.className = "day-card";
    card.dataset.dayIndex = String(dayIndex);
    card.innerHTML = `
      <header>
        <div>
          <h3>${weekdays[dayIndex]}</h3>
          <time>${formatShortDate(toDateInput(addDays(app.weekStart, dayIndex)))}</time>
        </div>
        <span class="status-pill">${formatHours(dayTotal)}h</span>
      </header>
      <div class="day-body task-line-list"></div>
    `;

    const body = card.querySelector(".task-line-list");
    for (const line of dayLines) {
      body.append(renderTaskLine(line, { locked, projectTasks, variant: "card" }));
    }
    body.append(renderAddTaskButton(dayIndex, locked));

    els.dailyGrid.append(card);
  }
}

function renderWeeklyGrid({ locked }) {
  const table = document.createElement("div");
  table.className = "weekly-grid-table";
  table.innerHTML = `
    <div class="weekly-grid-head">Day</div>
    <div class="weekly-grid-head">Task</div>
    <div class="weekly-grid-head">Hours</div>
    <div class="weekly-grid-head">Notes</div>
  `;

  for (let dayIndex = 0; dayIndex < weekdays.length; dayIndex += 1) {
    const dayLines = getLinesForDay(dayIndex);
    let first = true;
    for (const day of dayLines) {
      const selectedTask = getTask(day.task_id);
      const lineKey = lineKeyFor(day);
      table.insertAdjacentHTML("beforeend", `
        <div class="weekly-grid-day">
          <div class="weekly-grid-day-title">
            ${first ? `<strong>${weekdays[dayIndex]}</strong><span>${formatShortDate(day.work_date)}</span>` : `<span>Task ${Number(day.line_index || 0) + 1}</span>`}
          </div>
        </div>
        <label class="field compact-field task-line" data-day-index="${dayIndex}" data-line-key="${escapeHtml(lineKey)}" data-existing-id="${escapeHtml(day.id || "")}">
          <span>Task</span>
          <input data-field="task_search" type="search" list="taskOptions" value="${escapeHtml(taskLabel(selectedTask))}">
        </label>
        <label class="field compact-field">
          <span>Hours</span>
          <input data-day-index="${dayIndex}" data-line-key="${escapeHtml(lineKey)}" data-field="hours" type="number" min="0" max="24" step="0.25" value="${Number(day.hours || 0)}">
        </label>
        <div class="weekly-grid-notes compact-field">
          <span>Notes</span>
          <input data-day-index="${dayIndex}" data-line-key="${escapeHtml(lineKey)}" data-field="accomplishments" type="text" value="${escapeHtml(day.accomplishments || "")}">
          <button class="button danger small-button" type="button" data-remove-line="${escapeHtml(lineKey)}" ${locked ? "disabled" : ""}>Remove</button>
        </div>
        <input data-day-index="${dayIndex}" data-line-key="${escapeHtml(lineKey)}" data-field="blockers" type="hidden" value="${escapeHtml(day.blockers || "")}">
        <input data-day-index="${dayIndex}" data-line-key="${escapeHtml(lineKey)}" data-field="next_steps" type="hidden" value="${escapeHtml(day.next_steps || "")}">
      `);
      first = false;
    }
    table.insertAdjacentHTML("beforeend", `
      <div class="weekly-grid-add-row">
        <button class="button small-button" type="button" data-add-task="${dayIndex}" ${locked ? "disabled" : ""}>Add ${weekdays[dayIndex]} Task</button>
      </div>
    `);
  }

  for (const input of table.querySelectorAll("input")) {
    input.disabled = locked;
    input.addEventListener("input", updateTotalsFromDom);
  }
  for (const button of table.querySelectorAll("[data-add-task]")) {
    button.addEventListener("click", () => addTaskLine(Number(button.dataset.addTask)));
  }
  for (const button of table.querySelectorAll("[data-remove-line]")) {
    button.addEventListener("click", () => removeTaskLine(button.dataset.removeLine));
  }
  els.dailyGrid.append(table);
}

function renderWorkLog({ locked }) {
  const list = document.createElement("div");
  list.className = "work-log-list";

  for (const day of app.dailyReports) {
    const selectedTask = getTask(day.task_id);
    const lineKey = lineKeyFor(day);
    const row = document.createElement("article");
    row.className = "work-log-row task-line";
    row.dataset.dayIndex = String(day.day_index);
    row.dataset.lineKey = lineKey;
    row.dataset.existingId = day.id || "";
    row.innerHTML = `
      <div class="work-log-date">
        <strong>${weekdays[day.day_index]}</strong>
        <span>${formatShortDate(day.work_date)}</span>
      </div>
      <label class="field"><span>Task</span><input data-field="task_search" type="search" list="taskOptions" value="${escapeHtml(taskLabel(selectedTask))}"></label>
      <label class="field hours-field"><span>Hours</span><input data-field="hours" type="number" min="0" max="24" step="0.25" value="${Number(day.hours || 0)}"></label>
      <label class="field"><span>Notes</span><input data-field="accomplishments" type="text" value="${escapeHtml(day.accomplishments || "")}"></label>
      <label class="field"><span>Blockers</span><input data-field="blockers" type="text" value="${escapeHtml(day.blockers || "")}"></label>
      <label class="field"><span>Next steps</span><input data-field="next_steps" type="text" value="${escapeHtml(day.next_steps || "")}"></label>
      <button class="button danger small-button" type="button" data-remove-line>Remove</button>
    `;

    for (const input of row.querySelectorAll("input, button")) {
      input.disabled = locked;
      if (input.matches("input")) input.addEventListener("input", updateTotalsFromDom);
    }
    row.querySelector("[data-remove-line]").addEventListener("click", () => removeTaskLine(lineKey));
    list.append(row);
  }

  for (let dayIndex = 0; dayIndex < weekdays.length; dayIndex += 1) {
    list.append(renderAddTaskButton(dayIndex, locked));
  }
  els.dailyGrid.append(list);
}

function renderTaskLine(line, { locked, projectTasks, variant }) {
  const selectedTask = getTask(line.task_id);
  const lineKey = lineKeyFor(line);
  const item = document.createElement("div");
  item.className = `task-line ${variant === "card" ? "task-line-card" : ""}`;
  item.dataset.dayIndex = String(line.day_index);
  item.dataset.lineKey = lineKey;
  item.dataset.existingId = line.id || "";
  item.innerHTML = `
    <div class="task-line-head">
      <strong>Task ${Number(line.line_index || 0) + 1}</strong>
      <button class="button danger small-button" type="button" data-remove-line>Remove</button>
    </div>
    <label class="field">
      <span>Task</span>
      <input data-field="task_search" type="search" list="taskOptions" value="${escapeHtml(taskLabel(selectedTask))}" placeholder="${projectTasks.length ? "Search task code or name" : "No tasks configured"}">
    </label>
    <label class="field">
      <span>Hours</span>
      <input data-field="hours" type="number" min="0" max="24" step="0.25" value="${Number(line.hours || 0)}">
    </label>
    <label class="field">
      <span>Notes</span>
      <textarea data-field="accomplishments" placeholder="Completed tasks, meetings, deliverables">${escapeHtml(line.accomplishments || "")}</textarea>
    </label>
    <label class="field">
      <span>Blockers</span>
      <textarea data-field="blockers" placeholder="Risks, delays, decisions needed">${escapeHtml(line.blockers || "")}</textarea>
    </label>
    <label class="field">
      <span>Next steps</span>
      <textarea data-field="next_steps" placeholder="Planned follow-up or tomorrow's focus">${escapeHtml(line.next_steps || "")}</textarea>
    </label>
  `;

  for (const input of item.querySelectorAll("input, textarea, button")) {
    input.disabled = locked;
    if (input.matches("input, textarea")) input.addEventListener("input", updateTotalsFromDom);
  }
  item.querySelector("[data-remove-line]").addEventListener("click", () => removeTaskLine(lineKey));
  return item;
}

function renderAddTaskButton(dayIndex, locked) {
  const wrapper = document.createElement("div");
  wrapper.className = "add-task-line";
  wrapper.innerHTML = `<button class="button small-button" type="button" ${locked ? "disabled" : ""}>Add ${weekdays[dayIndex]} Task</button>`;
  wrapper.querySelector("button").addEventListener("click", () => addTaskLine(dayIndex));
  return wrapper;
}

function addTaskLine(dayIndex) {
  snapshotVisibleLines();
  const nextLineIndex = Math.max(-1, ...getLinesForDay(dayIndex).map((line) => Number(line.line_index || 0))) + 1;
  app.dailyReports.push({
    id: "",
    weekly_report_id: app.report?.id || "",
    day_index: dayIndex,
    line_index: nextLineIndex,
    work_date: toDateInput(addDays(app.weekStart, dayIndex)),
    task_id: "",
    hours: 0,
    accomplishments: "",
    blockers: "",
    next_steps: "",
    local_key: crypto.randomUUID(),
  });
  renumberDailyLines();
  renderDailyReports();
}

function removeTaskLine(lineKey) {
  snapshotVisibleLines();
  const line = app.dailyReports.find((item) => lineKeyFor(item) === lineKey);
  if (!line) return;
  const dayLines = getLinesForDay(line.day_index);
  if (dayLines.length <= 1) {
    Object.assign(line, { task_id: "", hours: 0, accomplishments: "", blockers: "", next_steps: "" });
  } else {
    app.dailyReports = app.dailyReports.filter((item) => lineKeyFor(item) !== lineKey);
  }
  renumberDailyLines();
  renderDailyReports();
}

function getLinesForDay(dayIndex) {
  return app.dailyReports
    .filter((line) => line.day_index === dayIndex)
    .sort((a, b) => Number(a.line_index || 0) - Number(b.line_index || 0));
}

function snapshotVisibleLines() {
  const lineElements = [...els.dailyGrid.querySelectorAll(".task-line")];
  if (!lineElements.length) return;
  for (const lineElement of lineElements) {
    const line = app.dailyReports.find((item) => lineKeyFor(item) === lineElement.dataset.lineKey);
    if (!line) continue;
    const values = getReportInputsForLine(lineElement);
    Object.assign(line, {
      task_id: resolveTaskId(values.task_search, app.profile.project_id) || line.task_id || "",
      hours: Number(values.hours || 0),
      accomplishments: values.accomplishments,
      blockers: values.blockers,
      next_steps: values.next_steps,
    });
  }
}

function renumberDailyLines() {
  for (let dayIndex = 0; dayIndex < weekdays.length; dayIndex += 1) {
    getLinesForDay(dayIndex).forEach((line, index) => {
      line.line_index = index;
      line.work_date = toDateInput(addDays(app.weekStart, dayIndex));
    });
  }
}

function lineKeyFor(line) {
  return line.id || line.local_key || `${line.day_index}-${line.line_index}`;
}

async function saveWeek(targetStatus) {
  if (!app.profile) return;

  const dailyPayload = collectDailyReports(targetStatus);
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
    onConflict: "weekly_report_id,day_index,line_index",
  });

  if (dayError) {
    setMessage(els.appMessage, `Daily save failed: ${dayError.message}`, true);
    return;
  }

  const savedIds = rows.map((row) => row.id).filter(Boolean);
  let deleteQuery = app.supabase.from("timesheet_daily_reports").delete().eq("weekly_report_id", report.id);
  if (savedIds.length) deleteQuery = deleteQuery.not("id", "in", `(${savedIds.join(",")})`);
  const { error: deleteError } = await deleteQuery;
  if (deleteError) {
    setMessage(els.appMessage, `Cleanup failed: ${deleteError.message}`, true);
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
    await logTimesheetAudit(report.id, "submitted");
  } else {
    app.report = report;
    await logTimesheetAudit(report.id, "draft_saved");
  }

  setMessage(els.appMessage, targetStatus === "submitted" ? "Week submitted." : "Draft saved.");
  await loadWeek();
  if (canReviewPortfolio()) await loadPortfolio();
}

async function withdrawWeek() {
  if (!app.report || app.report.status !== "submitted") return;

  setMessage(els.appMessage, "Withdrawing submission...");
  const { data: report, error } = await app.supabase
    .from("timesheet_weekly_reports")
    .update({ status: "draft", submitted_at: null, reviewed_at: null })
    .eq("id", app.report.id)
    .eq("status", "submitted")
    .select("id, user_id, week_start, project_id, manager_id, status, manager_notes, submitted_at, reviewed_at")
    .single();

  if (error) {
    setMessage(els.appMessage, `Withdraw failed: ${error.message}`, true);
    return;
  }

  app.report = report;
  await logTimesheetAudit(report.id, "withdrawn");
  setMessage(els.appMessage, "Submission withdrawn. You can edit and resubmit this week.");
  await loadWeek();
  if (canReviewPortfolio()) await loadPortfolio();
}

function collectDailyReports(targetStatus = "draft") {
  const rows = [];
  const lineElements = [...els.dailyGrid.querySelectorAll(".task-line")];
  const dayTotals = new Map();
  for (const line of lineElements) {
    const dayIndex = Number(line.dataset.dayIndex);
    const lineKey = line.dataset.lineKey;
    const values = getReportInputsForLine(line);
    const hours = Number(values.hours || 0);
    const taskSearch = values.task_search.trim();
    const taskId = resolveTaskId(taskSearch, app.profile.project_id);

    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      return { error: "Hours must be between 0 and 24 for each task line." };
    }

    if (taskSearch && !taskId) {
      return { error: "Choose tasks from the task list. Admins can add missing tasks in Admin Setup." };
    }

    if (hours > 0 && !taskId) {
      return { error: "Choose a task for every row with hours." };
    }

    if (hours > 0 && !values.accomplishments.trim()) {
      return { error: "Enter notes for every row with hours." };
    }

    dayTotals.set(dayIndex, (dayTotals.get(dayIndex) || 0) + hours);
    const existing = app.dailyReports.find((day) => lineKeyFor(day) === lineKey);
    rows.push({
      id: line.dataset.existingId || existing?.id || "",
      day_index: dayIndex,
      line_index: Number(existing?.line_index ?? rows.filter((row) => row.day_index === dayIndex).length),
      work_date: toDateInput(addDays(app.weekStart, dayIndex)),
      task_id: taskId || null,
      hours,
      accomplishments: values.accomplishments.trim(),
      blockers: values.blockers.trim(),
      next_steps: values.next_steps.trim(),
    });
  }

  for (const [dayIndex, total] of dayTotals.entries()) {
    if (total > 24) {
      return { error: `${weekdays[dayIndex]} has more than 24 total hours. Adjust the task lines before saving.` };
    }
  }

  if (targetStatus === "submitted") {
    const weekStart = startOfWeek(parseLocalDate(els.weekStart.value));
    if (weekStart > startOfWeek(new Date())) {
      return { error: "Future weeks can be saved as drafts, but they cannot be submitted yet." };
    }

    const totalHours = [...dayTotals.values()].reduce((sum, total) => sum + total, 0);
    if (totalHours <= 0) {
      return { error: "Enter time before submitting the week." };
    }
  }

  return { rows };
}

async function logTimesheetAudit(reportId, action, notes = "") {
  if (!reportId) return;
  await app.supabase.from("timesheet_report_audit").insert({
    weekly_report_id: reportId,
    actor_id: app.user.id,
    actor_email: app.user.email,
    action,
    notes: notes.trim() || null,
  });
}

function getReportInputsForLine(line) {
  const scoped = (field) => line.querySelector(`[data-field="${field}"]`)
    || els.dailyGrid.querySelector(`[data-line-key="${line.dataset.lineKey}"][data-field="${field}"]`);
  return {
    task_search: scoped("task_search")?.value || "",
    hours: scoped("hours")?.value || "0",
    accomplishments: scoped("accomplishments")?.value || "",
    blockers: scoped("blockers")?.value || "",
    next_steps: scoped("next_steps")?.value || "",
  };
}

function updateTotalsFromDom() {
  let total = 0;
  for (const input of els.dailyGrid.querySelectorAll('[data-field="hours"]')) {
    total += Number(input.value || 0);
  }
  els.totalHours.textContent = formatHours(total);
}

async function loadPortfolio() {
  if (!app.profile || !canReviewPortfolio()) return;

  els.portfolioList.innerHTML = `<div class="empty-state"><p>Loading portfolio reports...</p></div>`;
  if (els.portfolioStatus.value === "missing") {
    await loadMissingTimesheets();
    return;
  }

  const selectedWeek = els.portfolioWeek.value ? toDateInput(startOfWeek(parseLocalDate(els.portfolioWeek.value))) : "";
  let query = app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, status, manager_notes, submitted_at, reviewed_at")
    .order("week_start", { ascending: false })
    .limit(30);

  if (els.portfolioStatus.value !== "all") {
    query = query.eq("status", els.portfolioStatus.value);
  }

  if (els.portfolioProject.value && els.portfolioProject.value !== "all") {
    query = query.eq("project_id", els.portfolioProject.value);
  }

  if (selectedWeek) {
    query = query.eq("week_start", selectedWeek);
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
  const [{ data: profiles }, { data: days }, { data: audits }] = await Promise.all([
    app.supabase.from("timesheet_profiles").select("id, full_name, email, company, branch, division, active").in("id", userIds),
    app.supabase.from("timesheet_daily_reports").select("weekly_report_id, day_index, line_index, work_date, task_id, hours, accomplishments, blockers, next_steps").in("weekly_report_id", reportIds).order("day_index").order("line_index"),
    app.supabase.from("timesheet_report_audit").select("weekly_report_id, actor_email, action, notes, created_at").in("weekly_report_id", reportIds).order("created_at", { ascending: false }),
  ]);

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const daysByReport = groupBy(days || [], "weekly_report_id");
  const auditsByReport = groupBy(audits || [], "weekly_report_id");
  els.portfolioList.innerHTML = "";

  for (const report of reports) {
    els.portfolioList.append(renderReviewCard(report, profileMap.get(report.user_id), daysByReport.get(report.id) || [], auditsByReport.get(report.id) || []));
  }
}

async function loadMissingTimesheets() {
  const selectedWeek = els.portfolioWeek.value ? toDateInput(startOfWeek(parseLocalDate(els.portfolioWeek.value))) : toDateInput(app.weekStart);
  let profileQuery = app.supabase
    .from("timesheet_profiles")
    .select("id, full_name, email, branch, division, project_id, manager_id, active")
    .eq("active", true)
    .order("full_name");

  if (els.portfolioProject.value && els.portfolioProject.value !== "all") {
    profileQuery = profileQuery.eq("project_id", els.portfolioProject.value);
  }

  const { data: profiles, error: profileError } = await profileQuery;
  if (profileError) {
    els.portfolioList.innerHTML = `<div class="empty-state"><p>${escapeHtml(profileError.message)}</p></div>`;
    return;
  }

  const userIds = (profiles || []).map((profile) => profile.id);
  if (!userIds.length) {
    els.portfolioList.innerHTML = `<div class="empty-state"><p>No active resources match this view.</p></div>`;
    return;
  }

  const { data: reports, error: reportError } = await app.supabase
    .from("timesheet_weekly_reports")
    .select("user_id, status")
    .in("user_id", userIds)
    .eq("week_start", selectedWeek);

  if (reportError) {
    els.portfolioList.innerHTML = `<div class="empty-state"><p>${escapeHtml(reportError.message)}</p></div>`;
    return;
  }

  const submittedUserIds = new Set((reports || []).filter((report) => ["submitted", "approved"].includes(report.status)).map((report) => report.user_id));
  const missing = (profiles || []).filter((profile) => !submittedUserIds.has(profile.id));

  if (!missing.length) {
    els.portfolioList.innerHTML = `<div class="empty-state"><p>Everyone in this view has submitted for ${escapeHtml(formatShortDate(selectedWeek))}.</p></div>`;
    return;
  }

  els.portfolioList.innerHTML = "";
  for (const profile of missing) {
    const card = document.createElement("article");
    card.className = "review-card";
    card.innerHTML = `
      <div class="review-head">
        <div>
          <h3>${escapeHtml(profile.full_name || "Unnamed resource")}</h3>
          <p class="helper">${escapeHtml(profile.email || "")}</p>
        </div>
        <span class="status-pill rejected">missing</span>
      </div>
      <div class="review-meta">
        ${reviewMeta("Week", formatShortDate(selectedWeek))}
        ${reviewMeta("Project", projectLabel(getProject(profile.project_id)))}
        ${reviewMeta("Branch", profile.branch || "-")}
        ${reviewMeta("Division", profile.division || "-")}
        ${reviewMeta("Manager", getManager(profile.manager_id)?.manager_name || "-")}
      </div>
    `;
    els.portfolioList.append(card);
  }
}

function renderReviewCard(report, profile, days, audits = []) {
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
      ${reviewMeta("Review notes", report.manager_notes || "-")}
    </div>
    <div class="review-days">
      ${days.map(renderReviewDay).join("")}
    </div>
    ${audits.length ? `<div class="audit-list">${audits.slice(0, 5).map(renderAuditItem).join("")}</div>` : ""}
  `;

  if (["submitted", "rejected"].includes(report.status) && canReviewPortfolio()) {
    const actions = document.createElement("div");
    actions.className = "review-actions";
    const notes = document.createElement("textarea");
    notes.className = "review-notes";
    notes.placeholder = "Review comments";
    notes.value = report.manager_notes || "";
    const approve = document.createElement("button");
    approve.className = "button primary";
    approve.type = "button";
    approve.textContent = "Approve";
    approve.addEventListener("click", () => reviewReport(report.id, "approved", notes.value));
    const reject = document.createElement("button");
    reject.className = "button danger";
    reject.type = "button";
    reject.textContent = "Send Back";
    reject.addEventListener("click", () => reviewReport(report.id, "rejected", notes.value));
    const buttons = document.createElement("div");
    buttons.className = "toolbar";
    buttons.append(approve, reject);
    actions.append(notes, buttons);
    card.append(actions);
  }

  return card;
}

function renderAuditItem(audit) {
  return `
    <div>
      <strong>${escapeHtml(formatAuditAction(audit.action))}</strong>
      <span>${escapeHtml([audit.actor_email, formatShortDate(audit.created_at)].filter(Boolean).join(" - "))}</span>
      ${audit.notes ? `<p>${escapeHtml(audit.notes)}</p>` : ""}
    </div>
  `;
}

function reviewMeta(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`;
}

function renderReviewDay(day) {
  const task = getTask(day.task_id);
  return `
    <div class="review-day">
      <span>${escapeHtml(weekdays[day.day_index] || "Day")}</span>
      <strong>${formatHours(day.hours)}h</strong>
      ${task ? `<p>Task: ${escapeHtml(taskLabel(task))}</p>` : ""}
      <p>${escapeHtml(day.accomplishments || "No update entered.")}</p>
      ${day.blockers ? `<p>Blocker: ${escapeHtml(day.blockers)}</p>` : ""}
    </div>
  `;
}

async function reviewReport(reportId, status, notes = "") {
  const { error } = await app.supabase
    .from("timesheet_weekly_reports")
    .update({ status, manager_notes: notes.trim() || null, reviewed_at: new Date().toISOString() })
    .eq("id", reportId);

  if (error) {
    els.portfolioList.insertAdjacentHTML("afterbegin", `<div class="notice"><p>${escapeHtml(error.message)}</p></div>`);
    return;
  }

  await logTimesheetAudit(reportId, status === "approved" ? "approved" : "rejected", notes);
  await loadPortfolio();
}

async function renderAdminConsole() {
  await loadAdminProfiles();
  populateAdminSelects();
  renderAdminLists();
}

async function loadAdminProfiles() {
  if (!isPortfolioManager()) {
    app.adminProfiles = [];
    return;
  }

  const { data, error } = await app.supabase
    .from("timesheet_profiles")
    .select("id, email, full_name, company, branch, division, project_id, manager_id, role, active, updated_at")
    .order("full_name");

  if (error) {
    app.adminProfiles = [];
    setMessage(els.adminMessage, `User load failed: ${error.message}`, true);
    return;
  }

  app.adminProfiles = data || [];
}

function populateAdminSelects() {
  populateProjectSelectElement(els.adminProjectFocus, "All active projects", "all");
  els.adminProjectFocus.value = app.adminProjectFocus;

  const projectSelects = [els.adminManagerProject, els.adminTaskProject, els.inviteProject];
  for (const select of projectSelects) {
    populateProjectSelectElement(select, "Select project", "");
    if (app.adminProjectFocus !== "all") select.value = app.adminProjectFocus;
  }

  els.adminDivisionBranch.innerHTML = "";
  els.adminDivisionBranch.append(new Option("Select branch", ""));
  for (const branch of app.branches) {
    els.adminDivisionBranch.append(new Option(branch.name, branch.id));
  }

  els.adminExportBranch.innerHTML = "";
  els.adminExportBranch.append(new Option("Select branch", ""));
  for (const branch of app.branches) {
    els.adminExportBranch.append(new Option(branch.name, branch.name));
  }
  populateAdminExportDivisions();
  populateAdminUserFilters();
  populateInviteBranches();
  populateInviteManagers();
}

function populatePortfolioProjectFilter() {
  const current = els.portfolioProject.value || "all";
  populateProjectSelectElement(els.portfolioProject, "All projects", "all");
  els.portfolioProject.value = app.projects.some((project) => project.id === current) ? current : "all";
}

function populateProjectSelectElement(select, placeholder, placeholderValue) {
  select.innerHTML = "";
  select.append(new Option(placeholder, placeholderValue));
  for (const project of app.projects) {
    select.append(new Option(projectLabel(project), project.id));
  }
}

function populateAdminExportDivisions() {
  const selectedBranch = app.branches.find((branch) => branch.name === els.adminExportBranch.value);
  const divisions = app.divisions.filter((division) => division.branch_id === selectedBranch?.id);
  els.adminExportDivision.innerHTML = "";
  els.adminExportDivision.append(new Option("All divisions", "all"));
  for (const division of divisions) {
    els.adminExportDivision.append(new Option(division.name, division.name));
  }
}

function populateAdminUserFilters() {
  const currentBranch = els.adminUserBranch.value || "all";
  const currentProject = els.adminUserProject.value || "all";

  els.adminUserBranch.innerHTML = "";
  els.adminUserBranch.append(new Option("All branches", "all"));
  for (const branch of app.branches) {
    els.adminUserBranch.append(new Option(branch.name, branch.name));
  }
  els.adminUserBranch.value = app.branches.some((branch) => branch.name === currentBranch) ? currentBranch : "all";

  populateAdminUserDivisions();

  populateProjectSelectElement(els.adminUserProject, "All projects", "all");
  els.adminUserProject.value = app.projects.some((project) => project.id === currentProject) ? currentProject : "all";
}

function populateAdminUserDivisions() {
  const selectedBranch = app.branches.find((branch) => branch.name === els.adminUserBranch.value);
  const current = els.adminUserDivision.value || "all";
  const divisions = selectedBranch
    ? app.divisions.filter((division) => division.branch_id === selectedBranch.id)
    : app.divisions;

  els.adminUserDivision.innerHTML = "";
  els.adminUserDivision.append(new Option("All divisions", "all"));
  for (const division of divisions) {
    els.adminUserDivision.append(new Option(division.name, division.name));
  }
  els.adminUserDivision.value = divisions.some((division) => division.name === current) ? current : "all";
}

function populateInviteBranches() {
  const current = els.inviteBranch.value;
  els.inviteBranch.innerHTML = "";
  els.inviteBranch.append(new Option("Select branch", ""));
  for (const branch of app.branches) {
    els.inviteBranch.append(new Option(branch.name, branch.name));
  }
  els.inviteBranch.value = app.branches.some((branch) => branch.name === current) ? current : "";
  populateInviteDivisions();
}

function populateInviteDivisions() {
  const selectedBranch = app.branches.find((branch) => branch.name === els.inviteBranch.value);
  const divisions = app.divisions.filter((division) => division.branch_id === selectedBranch?.id);
  const current = els.inviteDivision.value;
  els.inviteDivision.innerHTML = "";
  els.inviteDivision.append(new Option("Select division", ""));
  for (const division of divisions) {
    els.inviteDivision.append(new Option(division.name, division.name));
  }
  els.inviteDivision.value = divisions.some((division) => division.name === current) ? current : "";
}

function populateInviteManagers() {
  const projectId = els.inviteProject.value;
  const managers = app.managers.filter((manager) => manager.project_id === projectId);
  const current = els.inviteManager.value;
  els.inviteManager.innerHTML = "";
  els.inviteManager.append(new Option(managers.length ? "Select manager" : "No managers configured", ""));
  for (const manager of managers) {
    els.inviteManager.append(new Option(`${manager.manager_name} - ${manager.manager_email}`, manager.id));
  }
  els.inviteManager.value = managers.some((manager) => manager.id === current) ? current : "";
}

function renderAdminLists() {
  renderProjectAdminList();
  const managers = filterByFocusedProject(app.managers);
  const tasks = filterByFocusedProject(app.tasks);
  renderAdminList(
    els.managerList,
    managers,
    (manager) => manager.manager_name,
    (manager) => `${projectLabel(getProject(manager.project_id))} - ${manager.manager_email}`,
    (manager) => deactivateAdminItem("timesheet_project_managers", manager.id, "Resource manager removed."),
  );
  renderAdminList(
    els.branchList,
    app.branches,
    (branch) => branch.name,
    () => "Available for profile setup",
    (branch) => deactivateAdminItem("timesheet_branches", branch.id, "Branch removed."),
  );
  renderAdminList(
    els.divisionList,
    app.divisions,
    (division) => division.name,
    (division) => app.branches.find((branch) => branch.id === division.branch_id)?.name || "All branches",
    (division) => deactivateAdminItem("timesheet_divisions", division.id, "Division removed."),
  );
  renderAdminList(
    els.taskList,
    tasks,
    (task) => taskLabel(task),
    (task) => projectLabel(getProject(task.project_id)),
    (task) => deactivateAdminItem("timesheet_tasks", task.id, "Task removed."),
  );
  renderUserAdminList();
}

function filterByFocusedProject(items) {
  if (app.adminProjectFocus === "all") return items;
  return items.filter((item) => item.project_id === app.adminProjectFocus || item.id === app.adminProjectFocus);
}

function renderProjectAdminList() {
  els.projectList.innerHTML = "";
  if (!app.projects.length) {
    els.projectList.innerHTML = `<li class="admin-item"><span>No active projects configured.</span></li>`;
    return;
  }

  for (const project of app.projects) {
    const formats = getEnabledFormatsForProject(project.id);
    const item = document.createElement("li");
    item.className = "admin-item admin-item-stacked";
    item.innerHTML = `
      <div class="admin-item-main">
        <div>
          <strong>${escapeHtml(projectLabel(project))}</strong>
          <span>${escapeHtml(project.client || "No client entered")}</span>
        </div>
        <button class="button danger small-button" type="button">Remove</button>
      </div>
      <div class="format-options compact-options">
        ${Object.entries(reportingFormats).map(([value, label]) => `
          <label><input type="checkbox" value="${escapeHtml(value)}" ${formats.includes(value) ? "checked" : ""}> ${escapeHtml(label)}</label>
        `).join("")}
      </div>
    `;

    item.querySelector("button").addEventListener("click", () => deactivateAdminItem("timesheet_projects", project.id, "Project removed."));
    for (const input of item.querySelectorAll('.format-options input[type="checkbox"]')) {
      input.addEventListener("change", () => updateProjectFormats(project.id, item));
    }
    els.projectList.append(item);
  }
}

function renderAdminList(container, items, titleFor, detailFor, removeAction) {
  if (!items.length) {
    container.innerHTML = `<li class="admin-item"><span>No values configured.</span></li>`;
    return;
  }

  container.innerHTML = "";
  for (const item of items) {
    const row = document.createElement("li");
    row.className = "admin-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(titleFor(item) || "-")}</strong>
        <span>${escapeHtml(detailFor(item) || "-")}</span>
      </div>
      <button class="button danger small-button" type="button">Remove</button>
    `;
    row.querySelector("button").addEventListener("click", () => removeAction(item));
    container.append(row);
  }
}

function renderUserAdminList() {
  const branch = els.adminUserBranch.value || "all";
  const division = els.adminUserDivision.value || "all";
  const projectId = els.adminUserProject.value || "all";
  const status = els.adminUserStatus.value || "active";
  let users = [...app.adminProfiles];

  if (branch !== "all") users = users.filter((user) => user.branch === branch);
  if (division !== "all") users = users.filter((user) => user.division === division);
  if (projectId !== "all") users = users.filter((user) => user.project_id === projectId);
  if (status === "active") users = users.filter((user) => user.active !== false);
  if (status === "inactive") users = users.filter((user) => user.active === false);

  if (!users.length) {
    els.userList.innerHTML = `<li class="admin-item"><span>No users match this view.</span></li>`;
    return;
  }

  els.userList.innerHTML = "";
  for (const user of users) {
    const row = document.createElement("li");
    row.className = "admin-item admin-item-stacked user-admin-item";
    row.innerHTML = `
      <div class="admin-item-main">
        <div>
          <strong>${escapeHtml(user.full_name || user.email)}</strong>
          <span>${escapeHtml([user.email, roleLabel(user.role), user.active === false ? "Inactive" : "Active"].join(" - "))}</span>
        </div>
        <button class="button danger small-button" type="button" data-toggle-active>${user.active === false ? "Reactivate" : "Deactivate"}</button>
      </div>
      <div class="profile-grid tight-grid">
        <label class="field"><span>Tier</span><select data-user-field="role">
          <option value="resource">Resource</option>
          <option value="manager">Project Manager</option>
          <option value="admin">Portfolio Manager</option>
        </select></label>
        <label class="field"><span>Project</span><select data-user-field="project_id"></select></label>
        <label class="field"><span>Manager</span><select data-user-field="manager_id"></select></label>
        <label class="field"><span>Branch</span><select data-user-field="branch"></select></label>
        <label class="field"><span>Division</span><select data-user-field="division"></select></label>
      </div>
    `;

    const roleSelect = row.querySelector('[data-user-field="role"]');
    roleSelect.value = user.role || "resource";

    const projectSelect = row.querySelector('[data-user-field="project_id"]');
    populateProjectSelectElement(projectSelect, "Select project", "");
    projectSelect.value = user.project_id || "";

    const managerSelect = row.querySelector('[data-user-field="manager_id"]');
    populateManagerOptionsForProject(managerSelect, projectSelect.value, user.manager_id);

    const branchSelect = row.querySelector('[data-user-field="branch"]');
    branchSelect.append(new Option("Select branch", ""));
    for (const branchItem of app.branches) branchSelect.append(new Option(branchItem.name, branchItem.name));
    branchSelect.value = user.branch || "";

    const divisionSelect = row.querySelector('[data-user-field="division"]');
    populateDivisionOptionsForBranch(divisionSelect, branchSelect.value, user.division);

    roleSelect.addEventListener("change", () => updateManagedUser(user.id, { role: roleSelect.value }));
    projectSelect.addEventListener("change", () => {
      populateManagerOptionsForProject(managerSelect, projectSelect.value, "");
      updateManagedUser(user.id, { project_id: projectSelect.value || null, manager_id: managerSelect.value || null });
    });
    managerSelect.addEventListener("change", () => updateManagedUser(user.id, { manager_id: managerSelect.value || null }));
    branchSelect.addEventListener("change", () => {
      populateDivisionOptionsForBranch(divisionSelect, branchSelect.value, "");
      updateManagedUser(user.id, { branch: branchSelect.value, division: divisionSelect.value });
    });
    divisionSelect.addEventListener("change", () => updateManagedUser(user.id, { division: divisionSelect.value }));
    row.querySelector("[data-toggle-active]").addEventListener("click", () => updateManagedUser(user.id, { active: user.active === false }));

    els.userList.append(row);
  }
}

function populateManagerOptionsForProject(select, projectId, selectedId = "") {
  select.innerHTML = "";
  const managers = app.managers.filter((manager) => manager.project_id === projectId);
  select.append(new Option(managers.length ? "Select manager" : "No managers configured", ""));
  for (const manager of managers) {
    select.append(new Option(`${manager.manager_name} - ${manager.manager_email}`, manager.id));
  }
  select.value = selectedId && managers.some((manager) => manager.id === selectedId) ? selectedId : "";
}

function populateDivisionOptionsForBranch(select, branchName, selectedValue = "") {
  const branch = app.branches.find((item) => item.name === branchName);
  const divisions = app.divisions.filter((division) => !division.branch_id || division.branch_id === branch?.id);
  select.innerHTML = "";
  select.append(new Option(divisions.length ? "Select division" : "No divisions configured", ""));
  for (const division of divisions) {
    select.append(new Option(division.name, division.name));
  }
  select.value = selectedValue && divisions.some((division) => division.name === selectedValue) ? selectedValue : "";
}

async function updateManagedUser(userId, patch) {
  setMessage(els.adminMessage, "Updating user...");
  const { error } = await app.supabase
    .from("timesheet_profiles")
    .update(patch)
    .eq("id", userId);

  if (error) {
    setMessage(els.adminMessage, `User update failed: ${error.message}`, true);
    await renderAdminConsole();
    return;
  }

  const user = app.adminProfiles.find((profile) => profile.id === userId);
  if (user) Object.assign(user, patch);
  setMessage(els.adminMessage, "User updated.");
  renderUserAdminList();
}

async function addProject(event) {
  event.preventDefault();
  setMessage(els.adminMessage, "Adding project...");
  const payload = {
    name: els.adminProjectName.value.trim(),
    code: els.adminProjectCode.value.trim().toUpperCase() || null,
    client: els.adminProjectClient.value.trim() || "Cadmus",
    reporting_formats: getSelectedAdminFormats(),
    active: true,
  };

  if (!payload.name || payload.reporting_formats.length === 0) {
    setMessage(els.adminMessage, "Project name and at least one reporting format are required.", true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_projects").upsert(payload, { onConflict: "code" });
  await finishAdminSave(error, els.projectForm, "Project saved.");
}

async function updateProjectFormats(projectId, row) {
  const selected = [...row.querySelectorAll('.format-options input[type="checkbox"]:checked')].map((input) => input.value);
  if (selected.length === 0) {
    setMessage(els.adminMessage, "Each active project needs at least one reporting format.", true);
    await renderAdminConsole();
    return;
  }

  setMessage(els.adminMessage, "Updating project views...");
  const { error } = await app.supabase
    .from("timesheet_projects")
    .update({ reporting_formats: selected })
    .eq("id", projectId);

  if (error) {
    setMessage(els.adminMessage, error.message, true);
    await renderAdminConsole();
    return;
  }

  const project = getProject(projectId);
  if (project) project.reporting_formats = selected;
  if (app.profile?.project_id === projectId) renderDailyReports();
  setMessage(els.adminMessage, "Project views updated.");
}

async function deactivateAdminItem(table, id, successMessage) {
  setMessage(els.adminMessage, "Removing value...");
  const { error } = await app.supabase.from(table).update({ active: false }).eq("id", id);

  if (error) {
    setMessage(els.adminMessage, error.message, true);
    return;
  }

  await loadReferenceData();
  if (app.profile?.role === "admin") await renderAdminConsole();
  if (app.profile) renderProfileSummary();
  if (app.profile) renderDailyReports();
  setMessage(els.adminMessage, successMessage);
}

async function addManager(event) {
  event.preventDefault();
  setMessage(els.adminMessage, "Adding resource manager...");
  const payload = {
    project_id: els.adminManagerProject.value,
    manager_name: els.adminManagerName.value.trim(),
    manager_email: els.adminManagerEmail.value.trim(),
    active: true,
  };

  if (!payload.project_id || !payload.manager_name || !payload.manager_email) {
    setMessage(els.adminMessage, "Project, manager name, and email are required.", true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_project_managers").upsert(payload, { onConflict: "project_id,manager_email" });
  await finishAdminSave(error, els.managerForm, "Resource manager saved.");
}

async function addBranch(event) {
  event.preventDefault();
  setMessage(els.adminMessage, "Adding branch...");
  const payload = {
    name: els.adminBranchName.value.trim(),
    active: true,
  };

  if (!payload.name) {
    setMessage(els.adminMessage, "Branch name is required.", true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_branches").upsert(payload, { onConflict: "name" });
  await finishAdminSave(error, els.branchForm, "Branch saved.");
}

async function addDivision(event) {
  event.preventDefault();
  setMessage(els.adminMessage, "Adding division...");
  const payload = {
    branch_id: els.adminDivisionBranch.value || null,
    name: els.adminDivisionName.value.trim(),
    active: true,
  };

  if (!payload.branch_id || !payload.name) {
    setMessage(els.adminMessage, "Branch and division name are required.", true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_divisions").upsert(payload, { onConflict: "branch_id,name" });
  await finishAdminSave(error, els.divisionForm, "Division saved.");
}

async function addTask(event) {
  event.preventDefault();
  setMessage(els.adminMessage, "Adding task...");
  const payload = {
    project_id: els.adminTaskProject.value,
    name: els.adminTaskName.value.trim(),
    code: els.adminTaskCode.value.trim().toUpperCase() || null,
    active: true,
  };

  if (!payload.project_id || !payload.name) {
    setMessage(els.adminMessage, "Project and task name are required.", true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_tasks").upsert(payload, { onConflict: "project_id,name" });
  await finishAdminSave(error, els.taskForm, "Task saved.");
}

async function sendBulkInvitations(event) {
  event.preventDefault();
  if (!isPortfolioManager()) return;

  const emails = parseEmailList(els.inviteEmails.value);
  const payloadBase = {
    role: els.inviteRole.value,
    project_id: els.inviteProject.value || null,
    manager_id: els.inviteManager.value || null,
    branch: els.inviteBranch.value || null,
    division: els.inviteDivision.value || null,
    invited_by: app.user.id,
    active: true,
  };

  if (!emails.length || !payloadBase.project_id) {
    setMessage(els.adminMessage, "Add at least one email and choose a project.", true);
    return;
  }

  setMessage(els.adminMessage, `Sending ${emails.length} invitations...`);
  let sent = 0;
  let linkOnly = 0;
  const failed = [];
  const inviteLinks = [];

  for (const email of emails) {
    const invitation = {
      id: crypto.randomUUID(),
      email,
      ...payloadBase,
    };
    const { error: inviteError } = await app.supabase.from("timesheet_invitations").insert(invitation);
    if (inviteError) {
      failed.push(`${email}: ${inviteError.message}`);
      continue;
    }

    const redirectTo = `${window.location.origin}/timesheets/?invite=${invitation.id}`;
    inviteLinks.push({ email, role: payloadBase.role, link: redirectTo });
    const { error: emailError } = await app.supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });

    if (emailError) {
      if (isEmailThrottleError(emailError)) {
        linkOnly += 1;
      } else {
        failed.push(`${email}: ${friendlyAuthError(emailError)}`);
        await app.supabase.from("timesheet_invitations").update({ active: false }).eq("id", invitation.id);
      }
    } else {
      sent += 1;
    }
  }

  if (inviteLinks.length) {
    downloadInvitationLinks(inviteLinks);
  }

  if (failed.length) {
    setMessage(els.adminMessage, `Sent ${sent}. Created ${linkOnly} manual links. Failed ${failed.length}: ${failed.join(" | ")}`, true);
    return;
  }

  els.inviteForm.reset();
  populateInviteBranches();
  populateInviteManagers();
  setMessage(els.adminMessage, linkOnly ? `Sent ${sent}. Supabase throttled ${linkOnly}; manual invite links were downloaded.` : `Sent ${sent} invitations.`);
}

async function finishAdminSave(error, form, successMessage) {
  if (error) {
    setMessage(els.adminMessage, error.message, true);
    return;
  }

  form.reset();
  if (form === els.projectForm) {
    els.adminFormatDaily.checked = false;
    els.adminFormatGrid.checked = true;
    els.adminFormatLog.checked = false;
  }
  await loadReferenceData();
  await renderAdminConsole();
  renderDailyReports();
  setMessage(els.adminMessage, successMessage);
}

function setDefaultAdminExportWindow() {
  if (!els.adminExportStart.value) els.adminExportStart.value = toDateInput(app.weekStart);
  if (!els.adminExportEnd.value) els.adminExportEnd.value = toDateInput(addDays(app.weekStart, 4));
}

async function exportAdminWork(event) {
  event.preventDefault();
  if (app.profile?.role !== "admin") return;

  const branch = els.adminExportBranch.value;
  const division = els.adminExportDivision.value;
  const startDate = els.adminExportStart.value;
  const endDate = els.adminExportEnd.value;

  if (!branch || !startDate || !endDate) {
    setMessage(els.adminMessage, "Choose a branch, start date, and end date before exporting.", true);
    return;
  }

  if (startDate > endDate) {
    setMessage(els.adminMessage, "End date must be after the start date.", true);
    return;
  }

  setMessage(els.adminMessage, "Building export...");

  let profileQuery = app.supabase
    .from("timesheet_profiles")
    .select("id, email, full_name, company, branch, division")
    .eq("branch", branch);

  if (division && division !== "all") {
    profileQuery = profileQuery.eq("division", division);
  }

  const { data: profiles, error: profileError } = await profileQuery.order("full_name");
  if (profileError) {
    setMessage(els.adminMessage, `Profile lookup failed: ${profileError.message}`, true);
    return;
  }

  if (!profiles?.length) {
    setMessage(els.adminMessage, "No resources match that branch/division.", true);
    return;
  }

  const userIds = profiles.map((profile) => profile.id);
  const reportStart = toDateInput(startOfWeek(parseLocalDate(startDate)));
  const reportEnd = toDateInput(startOfWeek(parseLocalDate(endDate)));
  const { data: reports, error: reportError } = await app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, status, submitted_at, reviewed_at")
    .in("user_id", userIds)
    .gte("week_start", reportStart)
    .lte("week_start", reportEnd)
    .order("week_start", { ascending: true });

  if (reportError) {
    setMessage(els.adminMessage, `Report lookup failed: ${reportError.message}`, true);
    return;
  }

  if (!reports?.length) {
    setMessage(els.adminMessage, "No reports exist in that window.", true);
    return;
  }

  const reportIds = reports.map((report) => report.id);
  const { data: days, error: dayError } = await app.supabase
    .from("timesheet_daily_reports")
    .select("weekly_report_id, day_index, line_index, work_date, task_id, hours, accomplishments, blockers, next_steps")
    .in("weekly_report_id", reportIds)
    .gte("work_date", startDate)
    .lte("work_date", endDate)
    .order("work_date", { ascending: true })
    .order("line_index", { ascending: true });

  if (dayError) {
    setMessage(els.adminMessage, `Work lookup failed: ${dayError.message}`, true);
    return;
  }

  if (!days?.length) {
    setMessage(els.adminMessage, "No daily work entries match that window.", true);
    return;
  }

  downloadAdminWorkCsv({ profiles, reports, days, branch, division, startDate, endDate });
  setMessage(els.adminMessage, `Exported ${days.length} work rows.`);
}

function downloadAdminWorkCsv({ profiles, reports, days, branch, division, startDate, endDate }) {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const reportMap = new Map(reports.map((report) => [report.id, report]));
  const rows = [[
    "Resource",
    "Email",
    "Company",
    "Branch",
    "Division",
    "Week",
    "Date",
    "Day",
    "Project",
    "Manager",
    "Task",
    "Hours",
    "Notes",
    "Blockers",
    "Next Steps",
    "Status",
  ]];

  for (const day of days) {
    const report = reportMap.get(day.weekly_report_id);
    const profile = profileMap.get(report?.user_id);
    rows.push([
      profile?.full_name || "",
      profile?.email || "",
      profile?.company || "",
      profile?.branch || "",
      profile?.division || "",
      report?.week_start || "",
      day.work_date,
      weekdays[day.day_index] || "",
      projectLabel(getProject(report?.project_id)),
      getManager(report?.manager_id)?.manager_name || "",
      taskLabel(getTask(day.task_id)),
      String(day.hours || 0),
      day.accomplishments || "",
      day.blockers || "",
      day.next_steps || "",
      report?.status || "",
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const scope = [branch, division && division !== "all" ? division : "all-divisions"].filter(Boolean).map(slugify).join("-");
  downloadCsv(csv, `cadmus-work-export-${scope}-${startDate}-to-${endDate}.csv`);
}

function exportCsv() {
  const rows = [["Week", "Date", "Day", "Project", "Task", "Branch", "Division", "Manager", "Hours", "Notes", "Blockers", "Next Steps", "Status"]];
  const project = getProject(app.profile.project_id);
  const manager = getManager(app.profile.manager_id);

  for (const day of collectDailyReports().rows || []) {
    rows.push([
      toDateInput(app.weekStart),
      day.work_date,
      weekdays[day.day_index],
      projectLabel(project),
      taskLabel(getTask(day.task_id)),
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
  downloadCsv(csv, `cadmus-weekly-report-${toDateInput(app.weekStart)}.csv`);
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
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

function getTask(id) {
  return app.tasks.find((task) => task.id === id);
}

function getTasksForProject(projectId) {
  return app.tasks.filter((task) => !task.project_id || task.project_id === projectId);
}

function canReviewPortfolio() {
  return ["manager", "admin"].includes(app.profile?.role);
}

function isPortfolioManager() {
  return app.profile?.role === "admin";
}

function roleLabel(role) {
  return ppmRoles[role] || role || "Resource";
}

function formatAuditAction(action) {
  return {
    draft_saved: "Draft saved",
    submitted: "Submitted",
    withdrawn: "Withdrawn",
    approved: "Approved",
    rejected: "Sent back",
  }[action] || action || "Updated";
}

function getEnabledFormatsForProject(projectId) {
  const project = getProject(projectId);
  const formats = Array.isArray(project?.reporting_formats) ? project.reporting_formats : ["daily_cards"];
  return formats.filter((format) => reportingFormats[format]);
}

function getSelectedAdminFormats() {
  return [
    els.adminFormatDaily,
    els.adminFormatGrid,
    els.adminFormatLog,
  ]
    .filter((input) => input.checked)
    .map((input) => input.value);
}

function formatLabel(format) {
  return reportingFormats[format] || format;
}

function resolveTaskId(value, projectId) {
  const normalized = normalizeLookup(value);
  const task = getTasksForProject(projectId).find((item) => normalizeLookup(taskLabel(item)) === normalized);
  return task?.id || "";
}

function projectLabel(project) {
  if (!project) return "-";
  return [project.code, project.name].filter(Boolean).join(" - ");
}

function taskLabel(task) {
  if (!task) return "";
  return [task.code, task.name].filter(Boolean).join(" - ");
}

function normalizeLookup(value) {
  return String(value || "").trim().toLowerCase();
}

function parseEmailList(value) {
  const seen = new Set();
  return String(value || "")
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter((email) => {
      if (!email || seen.has(email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
      seen.add(email);
      return true;
    });
}

function isEmailThrottleError(error) {
  const message = String(error?.message || "").toLowerCase();
  return message.includes("rate limit") || message.includes("too many");
}

function downloadInvitationLinks(inviteLinks) {
  const rows = [["Email", "Tier", "Setup Link"]];
  for (const invite of inviteLinks) {
    rows.push([invite.email, roleLabel(invite.role), invite.link]);
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadCsv(csv, `cadmus-invite-links-${toDateInput(new Date())}.csv`);
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

function slugify(value) {
  return String(value || "export")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
