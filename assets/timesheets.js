import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const config = window.CADMUS_TIMESHEETS_CONFIG || {};
const themeStorageKey = "cadmus-timesheets-theme";
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
const minimumPasswordLength = 12;
const blockedPasswordTokens = new Set([
  "cadmus",
  "password",
  "timesheet",
  "welcome",
  "qwerty",
  "letmein",
  "admin",
  "project",
  "company",
]);

const app = {
  supabase: null,
  user: null,
  profile: null,
  projects: [],
  managers: [],
  branches: [],
  divisions: [],
  tasks: [],
  approvalChains: [],
  adminProfiles: [],
  adminAudit: [],
  pendingInvite: null,
  adminProjectFocus: "all",
  passwordRecovery: false,
  portfolioReminderTargets: {
    missing: [],
    approvals: [],
  },
  reviewQueue: {
    reports: [],
    daysByReport: new Map(),
  },
  report: null,
  reportAudits: [],
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
  themeToggle: document.querySelector("#themeToggle"),
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
  qualityPanel: document.querySelector("#qualityPanel"),
  appMessage: document.querySelector("#appMessage"),
  totalHours: document.querySelector("#totalHours"),
  reportStatus: document.querySelector("#reportStatus"),
  projectCode: document.querySelector("#projectCode"),
  dueDate: document.querySelector("#dueDate"),
  portfolioStatus: document.querySelector("#portfolioStatus"),
  portfolioProject: document.querySelector("#portfolioProject"),
  portfolioWeek: document.querySelector("#portfolioWeek"),
  refreshPortfolio: document.querySelector("#refreshPortfolio"),
  exportAudit: document.querySelector("#exportAudit"),
  portfolioDashboard: document.querySelector("#portfolioDashboard"),
  reviewQueueSummary: document.querySelector("#reviewQueueSummary"),
  portfolioList: document.querySelector("#portfolioList"),
  projectForm: document.querySelector("#projectForm"),
  managerForm: document.querySelector("#managerForm"),
  approvalChainForm: document.querySelector("#approvalChainForm"),
  branchForm: document.querySelector("#branchForm"),
  divisionForm: document.querySelector("#divisionForm"),
  taskForm: document.querySelector("#taskForm"),
  adminExportForm: document.querySelector("#adminExportForm"),
  inviteForm: document.querySelector("#inviteForm"),
  refreshExceptions: document.querySelector("#refreshExceptions"),
  adminExceptions: document.querySelector("#adminExceptions"),
  refreshAdminAudit: document.querySelector("#refreshAdminAudit"),
  exportAdminAudit: document.querySelector("#exportAdminAudit"),
  adminAuditList: document.querySelector("#adminAuditList"),
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
  approvalChainName: document.querySelector("#approvalChainName"),
  approvalChainProject: document.querySelector("#approvalChainProject"),
  approvalChainBranch: document.querySelector("#approvalChainBranch"),
  approvalChainDivision: document.querySelector("#approvalChainDivision"),
  approvalChainPrimary: document.querySelector("#approvalChainPrimary"),
  approvalChainBackup: document.querySelector("#approvalChainBackup"),
  approvalChainFinal: document.querySelector("#approvalChainFinal"),
  approvalChainRequireFinal: document.querySelector("#approvalChainRequireFinal"),
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
  adminApprovedExport: document.querySelector("#adminApprovedExport"),
  userFilterForm: document.querySelector("#userFilterForm"),
  adminUserBranch: document.querySelector("#adminUserBranch"),
  adminUserDivision: document.querySelector("#adminUserDivision"),
  adminUserProject: document.querySelector("#adminUserProject"),
  adminUserStatus: document.querySelector("#adminUserStatus"),
  inviteEmails: document.querySelector("#inviteEmails"),
  inviteCsv: document.querySelector("#inviteCsv"),
  validateInviteImport: document.querySelector("#validateInviteImport"),
  inviteImportPreview: document.querySelector("#inviteImportPreview"),
  inviteRole: document.querySelector("#inviteRole"),
  inviteProject: document.querySelector("#inviteProject"),
  inviteManager: document.querySelector("#inviteManager"),
  inviteBranch: document.querySelector("#inviteBranch"),
  inviteDivision: document.querySelector("#inviteDivision"),
  projectList: document.querySelector("#projectList"),
  managerList: document.querySelector("#managerList"),
  approvalChainList: document.querySelector("#approvalChainList"),
  branchList: document.querySelector("#branchList"),
  divisionList: document.querySelector("#divisionList"),
  taskList: document.querySelector("#taskList"),
  userList: document.querySelector("#userList"),
  adminMessage: document.querySelector("#adminMessage"),
};

applySavedTheme();
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

function applySavedTheme() {
  const savedTheme = readSavedTheme();
  setTheme(savedTheme === "light" ? "light" : "dark");
}

function toggleTheme() {
  const nextTheme = document.body.classList.contains("light-mode") ? "dark" : "light";
  setTheme(nextTheme);
  saveTheme(nextTheme);
}

function setTheme(theme) {
  const light = theme === "light";
  document.body.classList.toggle("light-mode", light);
  if (els.themeToggle) {
    els.themeToggle.textContent = light ? "Dark Mode" : "Light Mode";
    els.themeToggle.setAttribute("aria-pressed", String(light));
  }
}

function readSavedTheme() {
  try {
    return localStorage.getItem(themeStorageKey) || "dark";
  } catch {
    return "dark";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(themeStorageKey, theme);
  } catch {
    // The toggle still works for the current page if browser storage is disabled.
  }
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
  if (els.themeToggle) els.themeToggle.addEventListener("click", toggleTheme);
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
  els.dailyGrid.addEventListener("input", renderQualityPanel);
  els.refreshPortfolio.addEventListener("click", loadPortfolio);
  els.exportAudit.addEventListener("click", exportAuditHistory);
  els.portfolioStatus.addEventListener("change", loadPortfolio);
  els.portfolioProject.addEventListener("change", loadPortfolio);
  els.portfolioWeek.addEventListener("change", () => {
    els.portfolioWeek.value = toDateInput(startOfWeek(parseLocalDate(els.portfolioWeek.value)));
    loadPortfolio();
  });
  els.projectForm.addEventListener("submit", addProject);
  els.managerForm.addEventListener("submit", addManager);
  els.approvalChainForm.addEventListener("submit", addApprovalChain);
  els.approvalChainProject.addEventListener("change", populateApprovalChainApprovers);
  els.approvalChainBranch.addEventListener("change", populateApprovalChainDivisions);
  els.branchForm.addEventListener("submit", addBranch);
  els.divisionForm.addEventListener("submit", addDivision);
  els.taskForm.addEventListener("submit", addTask);
  els.adminExportForm.addEventListener("submit", exportAdminWork);
  els.adminApprovedExport.addEventListener("click", exportApprovedTime);
  els.refreshExceptions.addEventListener("click", renderAdminExceptions);
  els.refreshAdminAudit.addEventListener("click", loadAndRenderAdminAudit);
  els.exportAdminAudit.addEventListener("click", exportAdminAuditLog);
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
  els.validateInviteImport.addEventListener("click", validateInviteImport);
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
  const passwordIssue = validatePassword(password, email);

  if (!email) {
    setMessage(els.authMessage, "Enter your email before creating an account.", true);
    return;
  }

  if (passwordIssue) {
    setMessage(els.authMessage, passwordIssue, true);
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

  setMessage(els.authMessage, "Account created. Check your email once to confirm access.");
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
    { data: approvalChains, error: approvalChainError },
  ] = await Promise.all([
    app.supabase.from("timesheet_projects").select("id, name, code, client, reporting_formats").eq("active", true).order("name"),
    app.supabase.from("timesheet_project_managers").select("id, project_id, manager_name, manager_email").eq("active", true).order("manager_name"),
    app.supabase.from("timesheet_branches").select("id, name").eq("active", true).order("name"),
    app.supabase.from("timesheet_divisions").select("id, branch_id, name").eq("active", true).order("name"),
    app.supabase.from("timesheet_tasks").select("id, project_id, name, code").eq("active", true).order("name"),
    app.supabase.from("timesheet_approval_chains").select("id, name, project_id, branch, division, primary_manager_id, backup_manager_id, final_approver_id, require_final_approval, active").eq("active", true).order("name"),
  ]);

  if (projectError) setMessage(els.profileMessage, `Project load failed: ${projectError.message}`, true);
  if (managerError) setMessage(els.profileMessage, `Manager load failed: ${managerError.message}`, true);
  if (branchError) setMessage(els.profileMessage, `Branch load failed: ${branchError.message}`, true);
  if (divisionError) setMessage(els.profileMessage, `Division load failed: ${divisionError.message}`, true);
  if (taskError) setMessage(els.profileMessage, `Task load failed: ${taskError.message}`, true);
  if (approvalChainError) setMessage(els.profileMessage, `Approval chain load failed: ${approvalChainError.message}`, true);

  app.projects = projects || [];
  app.managers = managers || [];
  app.branches = branches || [];
  app.divisions = divisions || [];
  app.tasks = tasks || [];
  app.approvalChains = approvalChains || [];
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
    .select("id, email, full_name, role, project_id, manager_id, branch, division, accepted_at")
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
  els.profileName.value = app.profile?.full_name || invite.full_name || app.user.user_metadata?.full_name || "";
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

  const passwordIssue = validatePassword(password, app.user.email);
  if (passwordIssue) {
    setMessage(els.profileMessage, passwordIssue, true);
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

function validatePassword(password, email = "") {
  if (password.length < minimumPasswordLength) {
    return `Create a password with at least ${minimumPasswordLength} characters.`;
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return "Use a mix of uppercase, lowercase, numbers, and symbols.";
  }

  const normalized = password.toLowerCase();
  const emailLocalPart = email.split("@")[0]?.toLowerCase();
  if (emailLocalPart && emailLocalPart.length >= 4 && normalized.includes(emailLocalPart)) {
    return "Do not include your email name in the password.";
  }

  for (const token of blockedPasswordTokens) {
    if (normalized.includes(token)) {
      return "Avoid company names, app names, and common words in the password.";
    }
  }

  if (/(.)\1{3,}/.test(password)) {
    return "Avoid repeated characters in the password.";
  }

  return "";
}

function renderProfileSummary() {
  const project = getProject(app.profile.project_id);
  const approvalRoute = resolveApprovalRoute(app.profile);
  const company = app.profile.company === "Cadmus Project Management" ? "Cadmus PM" : app.profile.company;
  els.projectCode.textContent = project?.code || "-";
  els.dueDate.textContent = formatShortDate(toDateInput(addDays(app.weekStart, 4)));
  els.profileSummary.innerHTML = [
    ["Company", company],
    ["Branch", app.profile.branch],
    ["Division", app.profile.division],
    ["Project", projectLabel(project)],
    ["Approval Route", approvalRouteSummary(approvalRoute)],
  ]
    .map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "-")}</strong></div>`)
    .join("");
}

async function loadWeek() {
  setMessage(els.appMessage, "Loading week...");
  const { data: report, error: reportError } = await app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, approval_chain_id, approval_chain_snapshot, status, manager_notes, submitted_at, reviewed_at")
    .eq("user_id", app.user.id)
    .eq("week_start", toDateInput(app.weekStart))
    .maybeSingle();

  if (reportError) {
    setMessage(els.appMessage, `Week load failed: ${reportError.message}`, true);
    return;
  }

  app.report = report || null;
  if (!app.report) {
    app.reportAudits = [];
    app.dailyReports = buildBlankDailyReports(null);
    renderDailyReports();
    setMessage(els.appMessage, "");
    return;
  }

  const [
    { data: days, error: daysError },
    { data: audits, error: auditError },
  ] = await Promise.all([
    app.supabase
      .from("timesheet_daily_reports")
      .select("id, weekly_report_id, day_index, line_index, work_date, task_id, hours, accomplishments, blockers, next_steps")
      .eq("weekly_report_id", app.report.id)
      .order("day_index")
      .order("line_index"),
    app.supabase
      .from("timesheet_report_audit")
      .select("actor_email, action, notes, created_at")
      .eq("weekly_report_id", app.report.id)
      .order("created_at", { ascending: false }),
  ]);

  if (daysError) {
    setMessage(els.appMessage, `Daily boxes failed: ${daysError.message}`, true);
    return;
  }

  if (auditError) {
    setMessage(els.appMessage, `Audit history failed: ${auditError.message}`, true);
    return;
  }

  app.reportAudits = audits || [];
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
  const locked = app.report && ["submitted", "pending_final", "approved"].includes(app.report.status);
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

  renderReportLifecycle({ locked });

  const status = app.report?.status || "draft";
  els.reportStatus.textContent = formatReportStatus(status);
  els.saveWeek.disabled = locked;
  els.submitWeek.disabled = locked;
  els.withdrawWeek.classList.toggle("hidden", !canWithdraw);
  els.withdrawWeek.disabled = !canWithdraw;
  updateTotalsFromDom();
  renderQualityPanel();
}

function renderReportLifecycle({ locked }) {
  const existing = els.dailyGrid.querySelector(".report-lifecycle");
  if (existing) existing.remove();
  if (!app.report && !app.reportAudits.length) return;

  const panel = document.createElement("section");
  panel.className = "report-lifecycle";
  const status = app.report?.status || "draft";
  const lockText = status === "approved"
    ? "Approved weeks are locked. Contact a Portfolio Manager if an adjustment is required."
    : status === "pending_final"
      ? "This week has primary approval and is waiting for final approval."
    : "Submitted weeks are locked while they are waiting for review. Withdraw to make changes before approval.";

  panel.innerHTML = `
    <div class="lifecycle-head">
      <div>
        <h3>Report History</h3>
        <p>${escapeHtml(locked ? lockText : "This week is editable until it is submitted for manager review.")}</p>
      </div>
      <span class="status-pill ${escapeHtml(status)}">${escapeHtml(formatReportStatus(status))}</span>
    </div>
    ${app.report?.manager_notes ? `<div class="review-note"><span>Latest review comment</span><p>${escapeHtml(app.report.manager_notes)}</p></div>` : ""}
    ${app.reportAudits.length ? `<div class="audit-list">${app.reportAudits.slice(0, 6).map(renderAuditItem).join("")}</div>` : ""}
  `;
  els.dailyGrid.append(panel);
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

  if (targetStatus === "submitted") {
    const quality = buildQualityChecks(dailyPayload.rows);
    renderQualityPanel(quality);
    const blockers = quality.items.filter((item) => item.level === "error");
    if (blockers.length) {
      setMessage(els.appMessage, "Resolve the quality checks before submitting.", true);
      return;
    }
  }

  setMessage(els.appMessage, targetStatus === "submitted" ? "Submitting week..." : "Saving draft...");
  const approvalRoute = resolveApprovalRoute(app.profile);
  const reportPayload = {
    id: app.report?.id || crypto.randomUUID(),
    user_id: app.user.id,
    week_start: toDateInput(app.weekStart),
    project_id: app.profile.project_id,
    manager_id: approvalRoute.primaryManagerId,
    approval_chain_id: approvalRoute.chain?.id || null,
    approval_chain_snapshot: approvalChainSnapshot(approvalRoute),
    status: "draft",
    submitted_at: app.report?.submitted_at || null,
  };

  const { data: report, error: reportError } = await app.supabase
    .from("timesheet_weekly_reports")
    .upsert(reportPayload, { onConflict: "user_id,week_start" })
    .select("id, user_id, week_start, project_id, manager_id, approval_chain_id, approval_chain_snapshot, status, manager_notes, submitted_at, reviewed_at")
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
      .select("id, user_id, week_start, project_id, manager_id, approval_chain_id, approval_chain_snapshot, status, manager_notes, submitted_at, reviewed_at")
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
    .update({ status: "draft", submitted_at: null, reviewed_at: null, reviewed_by: null, reviewer_email: null })
    .eq("id", app.report.id)
    .eq("status", "submitted")
    .select("id, user_id, week_start, project_id, manager_id, approval_chain_id, approval_chain_snapshot, status, manager_notes, submitted_at, reviewed_at")
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

function renderQualityPanel(existingQuality = null) {
  if (!els.qualityPanel || !app.profile) return;
  const locked = app.report && ["submitted", "pending_final", "approved"].includes(app.report.status);
  if (locked) {
    els.qualityPanel.innerHTML = "";
    return;
  }

  const dailyPayload = collectDailyReports("draft");
  if (dailyPayload.error) {
    els.qualityPanel.innerHTML = qualityPanelHtml({
      score: "Needs attention",
      tone: "error",
      items: [{ level: "error", title: dailyPayload.error, detail: "Fix this before saving or submitting." }],
    });
    return;
  }

  const quality = existingQuality || buildQualityChecks(dailyPayload.rows);
  els.qualityPanel.innerHTML = qualityPanelHtml(quality);
}

function buildQualityChecks(rows) {
  const items = [];
  const activeRows = rows.filter((row) => Number(row.hours || 0) > 0);
  const totalHours = activeRows.reduce((sum, row) => sum + Number(row.hours || 0), 0);
  const dayTotals = new Map();
  for (const row of rows) {
    dayTotals.set(row.day_index, (dayTotals.get(row.day_index) || 0) + Number(row.hours || 0));
  }

  if (totalHours <= 0) {
    items.push({ level: "error", title: "No hours entered", detail: "Enter time before submitting the week." });
  }

  for (const row of activeRows) {
    const day = weekdays[row.day_index] || "Day";
    if (!row.task_id) {
      items.push({ level: "error", title: `${day}: missing task code`, detail: "Choose a configured task for every row with hours." });
    }
    if (!row.accomplishments || row.accomplishments.length < 12) {
      items.push({ level: "warning", title: `${day}: thin accomplishment note`, detail: "Add enough context for a manager or auditor to understand the work." });
    }
    if (row.blockers && !row.next_steps) {
      items.push({ level: "warning", title: `${day}: blocker needs next step`, detail: "Add what happens next so managers can act on the blocker." });
    }
  }

  for (const [dayIndex, total] of dayTotals.entries()) {
    if (total > 12) {
      items.push({ level: "warning", title: `${weekdays[dayIndex]} has ${formatHours(total)} hours`, detail: "High day totals are allowed, but should be intentional." });
    }
  }

  if (app.report?.status === "rejected" && app.report.manager_notes) {
    items.push({ level: "warning", title: "Previously sent back", detail: app.report.manager_notes });
  }

  const errors = items.filter((item) => item.level === "error").length;
  const warnings = items.filter((item) => item.level === "warning").length;
  return {
    score: errors ? "Needs attention" : warnings ? "Review suggested" : "Ready to submit",
    tone: errors ? "error" : warnings ? "warning" : "ok",
    items,
  };
}

function qualityPanelHtml(quality) {
  const statusClass = quality.tone === "error" ? "rejected" : quality.tone === "warning" ? "submitted" : "approved";
  return `
    <div class="quality-head ${escapeHtml(quality.tone)}">
      <div>
        <h3>Pre-submit Checks</h3>
        <p>${escapeHtml(quality.score)}</p>
      </div>
      <span class="status-pill ${statusClass}">${quality.items.length ? `${quality.items.length} item${quality.items.length === 1 ? "" : "s"}` : "clear"}</span>
    </div>
    ${quality.items.length ? `<ul class="quality-list">${quality.items.map((item) => `
      <li class="${escapeHtml(item.level)}">
        <strong>${escapeHtml(item.title)}</strong>
        <span>${escapeHtml(item.detail)}</span>
      </li>
    `).join("")}</ul>` : ""}
  `;
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
  await loadPortfolioDashboard();
  if (els.portfolioStatus.value === "missing") {
    app.reviewQueue = { reports: [], daysByReport: new Map() };
    els.reviewQueueSummary.innerHTML = "";
    await loadMissingTimesheets();
    return;
  }

  const selectedWeek = els.portfolioWeek.value ? toDateInput(startOfWeek(parseLocalDate(els.portfolioWeek.value))) : "";
  let query = app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, approval_chain_id, approval_chain_snapshot, status, manager_notes, submitted_at, reviewed_at")
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
    app.reviewQueue = { reports: [], daysByReport: new Map() };
    els.reviewQueueSummary.innerHTML = "";
    els.portfolioList.innerHTML = `<div class="empty-state"><p>${escapeHtml(error.message)}</p></div>`;
    return;
  }

  if (!reports || reports.length === 0) {
    app.reviewQueue = { reports: [], daysByReport: new Map() };
    els.reviewQueueSummary.innerHTML = "";
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
  app.reviewQueue = { reports, daysByReport };
  renderReviewQueueSummary(reports, daysByReport);
  els.portfolioList.innerHTML = "";

  for (const report of reports) {
    els.portfolioList.append(renderReviewCard(report, profileMap.get(report.user_id), daysByReport.get(report.id) || [], auditsByReport.get(report.id) || []));
  }
}

function renderReviewQueueSummary(reports, daysByReport) {
  const statusCounts = countBy(reports, "status");
  const submitted = reports.filter((report) => report.status === "submitted");
  const stale = submitted.filter(isStaleSubmittedReport);
  const clean = submitted.filter((report) => isCleanSubmittedReport(report, daysByReport.get(report.id) || []));
  const totalHours = reports.reduce((sum, report) => {
    const days = daysByReport.get(report.id) || [];
    return sum + days.reduce((daySum, day) => daySum + Number(day.hours || 0), 0);
  }, 0);

  els.reviewQueueSummary.innerHTML = `
    <div class="queue-head">
      <div>
        <h3>Review Queue</h3>
        <p>${escapeHtml(reviewQueueScopeLabel())}</p>
      </div>
      <div class="ops-actions">
        <button class="button small-button" type="button" data-approve-clean ${clean.length ? "" : "disabled"}>Approve Clean</button>
        <span class="status-pill ${stale.length ? "rejected" : "approved"}">${stale.length ? `${stale.length} stale` : "current"}</span>
      </div>
    </div>
    <div class="queue-metric-grid">
      ${queueMetric("Loaded", reports.length, "Reports in this view")}
      ${queueMetric("Submitted", statusCounts.submitted || 0, "Awaiting manager action")}
      ${queueMetric("Clean", clean.length, "Eligible for guarded approval")}
      ${queueMetric("Stale", stale.length, "Submitted 3+ days ago")}
      ${queueMetric("Approved", statusCounts.approved || 0, "Locked reports")}
      ${queueMetric("Hours", `${formatHours(totalHours)}h`, "Total loaded report hours")}
    </div>
  `;

  els.reviewQueueSummary.querySelector("[data-approve-clean]")?.addEventListener("click", approveCleanSubmittedReports);
}

function reviewQueueScopeLabel() {
  const status = els.portfolioStatus.options[els.portfolioStatus.selectedIndex]?.text || "All";
  const project = els.portfolioProject.value && els.portfolioProject.value !== "all" ? projectLabel(getProject(els.portfolioProject.value)) : "All projects";
  const week = els.portfolioWeek.value ? `week of ${formatShortDate(els.portfolioWeek.value)}` : "latest loaded reports";
  return `${status} - ${project} - ${week}`;
}

function queueMetric(label, value, helper) {
  return `
    <div class="queue-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(helper)}</p>
    </div>
  `;
}

function isCleanSubmittedReport(report, days) {
  if (report.status !== "submitted" || isStaleSubmittedReport(report)) return false;
  const totalHours = days.reduce((sum, day) => sum + Number(day.hours || 0), 0);
  const hasBlockers = days.some((day) => String(day.blockers || "").trim());
  return totalHours > 0 && !hasBlockers;
}

async function exportAuditHistory() {
  if (els.portfolioStatus.value === "missing") {
    showPortfolioNotice("Audit export is available for saved reports. Choose Draft, Submitted, Approved, Rejected, or All.");
    return;
  }

  const selectedWeek = els.portfolioWeek.value ? toDateInput(startOfWeek(parseLocalDate(els.portfolioWeek.value))) : "";
  let query = app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, status, manager_notes, submitted_at, reviewed_at, reviewer_email")
    .order("week_start", { ascending: false })
    .limit(500);

  if (els.portfolioStatus.value !== "all" && els.portfolioStatus.value !== "missing") {
    query = query.eq("status", els.portfolioStatus.value);
  }

  if (els.portfolioProject.value && els.portfolioProject.value !== "all") {
    query = query.eq("project_id", els.portfolioProject.value);
  }

  if (selectedWeek) {
    query = query.eq("week_start", selectedWeek);
  }

  if (app.profile?.role === "manager" && app.profile.manager_id) {
    query = query.eq("manager_id", app.profile.manager_id);
  }

  const { data: reports, error } = await query;
  if (error) {
    showPortfolioNotice(error.message, true);
    return;
  }

  if (!reports?.length) {
    showPortfolioNotice("No audit rows match the current filters.");
    return;
  }

  const reportIds = reports.map((report) => report.id);
  const userIds = [...new Set(reports.map((report) => report.user_id))];
  const [{ data: profiles, error: profileError }, { data: audits, error: auditError }] = await Promise.all([
    app.supabase.from("timesheet_profiles").select("id, full_name, email, branch, division").in("id", userIds),
    app.supabase.from("timesheet_report_audit").select("weekly_report_id, actor_email, action, notes, created_at").in("weekly_report_id", reportIds).order("created_at", { ascending: false }),
  ]);

  if (profileError) {
    showPortfolioNotice(profileError.message, true);
    return;
  }

  if (auditError) {
    showPortfolioNotice(auditError.message, true);
    return;
  }

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const auditsByReport = groupBy(audits || [], "weekly_report_id");
  const rows = [["Week", "Resource", "Resource Email", "Branch", "Division", "Project", "Manager", "Status", "Action", "Actor", "Action Date", "Reviewer", "Submitted", "Reviewed", "Notes"]];

  for (const report of reports) {
    const profile = profileMap.get(report.user_id);
    const project = getProject(report.project_id);
    const manager = getManager(report.manager_id);
    const reportAudits = auditsByReport.get(report.id) || [];
    if (!reportAudits.length) {
      rows.push(buildAuditExportRow({ report, profile, project, manager }));
      continue;
    }

    for (const audit of reportAudits) {
      rows.push(buildAuditExportRow({ report, profile, project, manager, audit }));
    }
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const scope = [
    els.portfolioStatus.value || "all",
    els.portfolioProject.value && els.portfolioProject.value !== "all" ? projectLabel(getProject(els.portfolioProject.value)) : "all-projects",
    selectedWeek || "all-weeks",
  ].map(slugify).join("-");
  downloadCsv(csv, `cadmus-audit-history-${scope}.csv`);
}

function buildAuditExportRow({ report, profile, project, manager, audit = {} }) {
  return [
    report.week_start,
    profile?.full_name || "",
    profile?.email || "",
    profile?.branch || "",
    profile?.division || "",
    projectLabel(project),
    manager?.manager_name || "",
    report.status,
    audit.action ? formatAuditAction(audit.action) : "No audit event",
    audit.actor_email || "",
    audit.created_at || "",
    report.reviewer_email || "",
    report.submitted_at || "",
    report.reviewed_at || "",
    audit.notes || report.manager_notes || "",
  ];
}

function showPortfolioNotice(message, isError = false) {
  const notice = document.createElement("div");
  notice.className = "notice";
  notice.innerHTML = `<p>${escapeHtml(message)}</p>`;
  if (isError) notice.classList.add("error");
  els.portfolioList.prepend(notice);
}

async function loadPortfolioDashboard() {
  const selectedWeek = portfolioSelectedWeek();
  const selectedProjectId = els.portfolioProject.value || "all";
  let profilesQuery = app.supabase
    .from("timesheet_profiles")
    .select("id, full_name, email, branch, division, project_id, manager_id, active")
    .eq("active", true)
    .order("full_name");

  if (app.profile?.role === "manager") {
    profilesQuery = profilesQuery.eq("manager_id", app.profile.manager_id);
  }

  const { data: profiles, error: profileError } = await profilesQuery;
  if (profileError) {
    renderPortfolioDashboardError(profileError.message);
    return;
  }

  const scopedProfiles = selectedProjectId !== "all"
    ? (profiles || []).filter((profile) => profile.project_id === selectedProjectId)
    : profiles || [];

  if (!scopedProfiles.length) {
    renderPortfolioDashboard({
      selectedWeek,
      selectedProjectId,
      profiles: [],
      reports: [],
      days: [],
    });
    return;
  }

  const userIds = scopedProfiles.map((profile) => profile.id);
  let reportQuery = app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, status, submitted_at, reviewed_at")
    .in("user_id", userIds)
    .eq("week_start", selectedWeek);

  if (selectedProjectId !== "all") {
    reportQuery = reportQuery.eq("project_id", selectedProjectId);
  }

  const { data: reports, error: reportError } = await reportQuery;
  if (reportError) {
    renderPortfolioDashboardError(reportError.message);
    return;
  }

  const reportIds = (reports || []).map((report) => report.id);
  let days = [];
  if (reportIds.length) {
    const { data: dayRows, error: dayError } = await app.supabase
      .from("timesheet_daily_reports")
      .select("weekly_report_id, hours, task_id")
      .in("weekly_report_id", reportIds);

    if (dayError) {
      renderPortfolioDashboardError(dayError.message);
      return;
    }

    days = dayRows || [];
  }

  renderPortfolioDashboard({
    selectedWeek,
    selectedProjectId,
    profiles: scopedProfiles,
    reports: reports || [],
    days,
  });
}

function renderPortfolioDashboardError(message) {
  els.portfolioDashboard.innerHTML = `<div class="notice"><p>${escapeHtml(message)}</p></div>`;
}

function renderPortfolioDashboard({ selectedWeek, selectedProjectId, profiles, reports, days }) {
  const reportByUser = new Map(reports.map((report) => [report.user_id, report]));
  const daysByReport = groupBy(days, "weekly_report_id");
  const missingProfiles = profiles.filter((profile) => !reportByUser.has(profile.id) || ["draft", "rejected"].includes(reportByUser.get(profile.id)?.status));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const statusCounts = countBy(reports, "status");
  const totalHours = days.reduce((sum, day) => sum + Number(day.hours || 0), 0);
  const pendingApproval = statusCounts.submitted || 0;
  const approved = statusCounts.approved || 0;
  const submitted = pendingApproval + approved;
  const submissionRate = profiles.length ? Math.round((submitted / profiles.length) * 100) : 0;
  const overdueCount = isPortfolioWeekPastDue(selectedWeek) ? missingProfiles.length : 0;
  const reportHours = new Map(reports.map((report) => [
    report.id,
    (daysByReport.get(report.id) || []).reduce((sum, day) => sum + Number(day.hours || 0), 0),
  ]));
  const projectBreakdown = summarizeByProject(reports, reportHours);
  const branchBreakdown = summarizeByBranch(profiles, reports, reportHours);
  const projectLabelText = selectedProjectId === "all" ? "All projects" : projectLabel(getProject(selectedProjectId));
  app.portfolioReminderTargets = {
    missing: missingProfiles.map((profile) => buildMissingReminderTarget(profile, reportByUser.get(profile.id), selectedWeek)),
    approvals: reports
      .filter((report) => report.status === "submitted")
      .map((report) => buildApprovalReminderTarget(report, profileById.get(report.user_id), reportHours.get(report.id) || 0)),
  };

  els.portfolioDashboard.innerHTML = `
    <div class="ops-summary-head">
      <div>
        <h3>Operations Summary</h3>
        <p>${escapeHtml(projectLabelText)} - week of ${escapeHtml(formatShortDate(selectedWeek))}</p>
      </div>
      <div class="ops-actions">
        <span class="status-pill ${overdueCount ? "rejected" : "approved"}">${overdueCount ? `${overdueCount} late` : "on track"}</span>
        <button class="button small-button" type="button" data-export-reminders="missing" ${app.portfolioReminderTargets.missing.length ? "" : "disabled"}>Export Missing</button>
        <button class="button small-button" type="button" data-export-reminders="approvals" ${app.portfolioReminderTargets.approvals.length ? "" : "disabled"}>Export Approvals</button>
      </div>
    </div>
    <div class="ops-metric-grid">
      ${opsMetric("Submission Rate", `${submissionRate}%`, `${submitted} of ${profiles.length} submitted or approved`)}
      ${opsMetric("Pending Approval", pendingApproval, "Reports awaiting manager action")}
      ${opsMetric("Missing / Draft", missingProfiles.length, "Not submitted or sent back")}
      ${opsMetric("Approved", approved, "Reports locked for the week")}
      ${opsMetric("Total Hours", `${formatHours(totalHours)}h`, "Approved, submitted, draft, and rejected")}
      ${opsMetric("Active Resources", profiles.length, "In the selected project scope")}
    </div>
    <div class="ops-breakdown-grid">
      ${opsBreakdown("Project Load", projectBreakdown, "No reported hours yet.")}
      ${opsBreakdown("Branch Coverage", branchBreakdown, "No branch activity yet.")}
    </div>
  `;

  for (const button of els.portfolioDashboard.querySelectorAll("[data-export-reminders]")) {
    button.addEventListener("click", () => exportReminderTargets(button.dataset.exportReminders));
  }
}

function buildMissingReminderTarget(profile, report, selectedWeek) {
  return {
    name: profile.full_name || "Unnamed resource",
    email: profile.email || "",
    status: report?.status || "missing",
    week: selectedWeek,
    project: projectLabel(getProject(profile.project_id)),
    manager: getManager(profile.manager_id)?.manager_name || "",
    manager_email: getManager(profile.manager_id)?.manager_email || "",
    branch: profile.branch || "",
    division: profile.division || "",
  };
}

function buildApprovalReminderTarget(report, profile, hours) {
  const manager = getManager(report.manager_id);
  return {
    name: manager?.manager_name || "Project Manager",
    email: manager?.manager_email || "",
    status: "pending approval",
    week: report.week_start,
    project: projectLabel(getProject(report.project_id)),
    resource: profile?.full_name || profile?.email || "Unknown resource",
    resource_email: profile?.email || "",
    hours,
    submitted_at: report.submitted_at || "",
  };
}

function exportReminderTargets(type) {
  const targets = app.portfolioReminderTargets[type] || [];
  if (!targets.length) return;

  const rows = type === "approvals"
    ? [["Manager", "Manager Email", "Resource", "Resource Email", "Week", "Project", "Hours", "Status", "Submitted", "Suggested Message"]]
    : [["Resource", "Email", "Week", "Project", "Manager", "Manager Email", "Branch", "Division", "Status", "Suggested Message"]];

  for (const target of targets) {
    if (type === "approvals") {
      rows.push([
        target.name,
        target.email,
        target.resource,
        target.resource_email,
        target.week,
        target.project,
        formatHours(target.hours),
        target.status,
        target.submitted_at,
        approvalReminderMessage(target),
      ]);
    } else {
      rows.push([
        target.name,
        target.email,
        target.week,
        target.project,
        target.manager,
        target.manager_email,
        target.branch,
        target.division,
        target.status,
        missingReminderMessage(target),
      ]);
    }
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadCsv(csv, `cadmus-${type}-reminders-${portfolioSelectedWeek()}.csv`);
}

function missingReminderMessage(target) {
  const statusText = target.status === "missing" ? "has not been submitted" : `is currently ${target.status}`;
  return `Please submit your Cadmus timesheet for the week of ${formatShortDate(target.week)}. The current status ${statusText}. Project: ${target.project}.`;
}

function approvalReminderMessage(target) {
  return `Please review ${target.resource}'s Cadmus timesheet for the week of ${formatShortDate(target.week)}. It is pending approval for ${target.project} with ${formatHours(target.hours)} reported hours.`;
}

function openMissingReminder(profile, report, selectedWeek) {
  const target = buildMissingReminderTarget(profile, report, selectedWeek);
  if (!target.email) return;
  const subject = `Cadmus timesheet reminder - week of ${formatShortDate(selectedWeek)}`;
  window.location.href = mailtoUrl(target.email, subject, missingReminderMessage(target));
}

function mailtoUrl(email, subject, body) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function opsMetric(label, value, helper) {
  return `
    <div class="ops-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p>${escapeHtml(helper)}</p>
    </div>
  `;
}

function opsBreakdown(title, rows, emptyText) {
  return `
    <div class="ops-breakdown">
      <h4>${escapeHtml(title)}</h4>
      ${rows.length ? rows.slice(0, 5).map((row) => `
        <div class="ops-row">
          <span>${escapeHtml(row.label)}</span>
          <strong>${escapeHtml(formatHours(row.hours))}h</strong>
        </div>
      `).join("") : `<p>${escapeHtml(emptyText)}</p>`}
    </div>
  `;
}

function summarizeByProject(reports, reportHours) {
  const totals = new Map();
  for (const report of reports) {
    const label = projectLabel(getProject(report.project_id));
    totals.set(label, (totals.get(label) || 0) + Number(reportHours.get(report.id) || 0));
  }
  return [...totals.entries()]
    .map(([label, hours]) => ({ label, hours }))
    .sort((a, b) => b.hours - a.hours || a.label.localeCompare(b.label));
}

function summarizeByBranch(profiles, reports, reportHours) {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const totals = new Map();
  for (const report of reports) {
    const branch = profileMap.get(report.user_id)?.branch || "Unassigned";
    totals.set(branch, (totals.get(branch) || 0) + Number(reportHours.get(report.id) || 0));
  }
  return [...totals.entries()]
    .map(([label, hours]) => ({ label, hours }))
    .sort((a, b) => b.hours - a.hours || a.label.localeCompare(b.label));
}

function portfolioSelectedWeek() {
  return els.portfolioWeek.value ? toDateInput(startOfWeek(parseLocalDate(els.portfolioWeek.value))) : toDateInput(app.weekStart);
}

function isPortfolioWeekPastDue(weekStart) {
  return new Date() > addDays(parseLocalDate(weekStart), 4);
}

async function loadMissingTimesheets() {
  const selectedWeek = portfolioSelectedWeek();
  let profileQuery = app.supabase
    .from("timesheet_profiles")
    .select("id, full_name, email, branch, division, project_id, manager_id, active")
    .eq("active", true)
    .order("full_name");

  if (app.profile?.role === "manager") {
    profileQuery = profileQuery.eq("manager_id", app.profile.manager_id);
  }

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

  const submittedUserIds = new Set((reports || []).filter((report) => ["submitted", "pending_final", "approved"].includes(report.status)).map((report) => report.user_id));
  const reportByUser = new Map((reports || []).map((report) => [report.user_id, report]));
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
    const actions = document.createElement("div");
    actions.className = "review-actions";
    const buttons = document.createElement("div");
    buttons.className = "toolbar";
    const remind = document.createElement("button");
    remind.className = "button small-button";
    remind.type = "button";
    remind.textContent = "Email Reminder";
    remind.disabled = !profile.email;
    remind.addEventListener("click", () => openMissingReminder(profile, reportByUser.get(profile.id), selectedWeek));
    buttons.append(remind);
    actions.append(buttons);
    card.append(actions);
    els.portfolioList.append(card);
  }
}

function renderReviewCard(report, profile, days, audits = []) {
  const project = getProject(report.project_id);
  const approvalRoute = approvalRouteFromReport(report, profile);
  const total = days.reduce((sum, day) => sum + Number(day.hours || 0), 0);
  const stale = isStaleSubmittedReport(report);
  const card = document.createElement("article");
  card.className = `review-card${stale ? " stale-review-card" : ""}`;
  card.innerHTML = `
    <div class="review-head">
      <div>
        <h3>${escapeHtml(profile?.full_name || "Unknown resource")}</h3>
        <p class="helper">${escapeHtml(profile?.email || "")}</p>
      </div>
      <div class="review-status-stack">
        ${stale ? `<span class="status-pill rejected">${submittedAgeInDays(report)} days waiting</span>` : ""}
        <span class="status-pill ${escapeHtml(report.status)}">${escapeHtml(formatReportStatus(report.status))}</span>
      </div>
    </div>
    <div class="review-meta">
      ${reviewMeta("Week", formatShortDate(report.week_start))}
      ${reviewMeta("Project", projectLabel(project))}
      ${reviewMeta("Branch", profile?.branch || "-")}
      ${reviewMeta("Division", profile?.division || "-")}
      ${reviewMeta("Approval Route", approvalRouteSummary(approvalRoute))}
      ${reviewMeta("Total hours", `${formatHours(total)}h`)}
      ${reviewMeta("Company", profile?.company || "-")}
      ${reviewMeta("Submitted", report.submitted_at ? formatShortDate(report.submitted_at) : "-")}
      ${reviewMeta("Queue age", report.status === "submitted" && report.submitted_at ? `${submittedAgeInDays(report)} days` : "-")}
      ${reviewMeta("Review notes", report.manager_notes || "-")}
    </div>
    <div class="review-days">
      ${days.map(renderReviewDay).join("")}
    </div>
    ${audits.length ? `<div class="audit-list">${audits.slice(0, 5).map(renderAuditItem).join("")}</div>` : ""}
  `;

  if (["submitted", "pending_final", "rejected"].includes(report.status) && canReviewPortfolio()) {
    const actions = document.createElement("div");
    actions.className = "review-actions";
    const notes = document.createElement("textarea");
    notes.className = "review-notes";
    notes.placeholder = "Review comments";
    notes.value = report.manager_notes || "";
    const approve = document.createElement("button");
    approve.className = "button primary";
    approve.type = "button";
    approve.textContent = report.status === "pending_final" ? "Final Approve" : "Approve";
    approve.disabled = report.status === "pending_final" && !canCurrentUserFinalApprove(approvalRoute);
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

function isStaleSubmittedReport(report) {
  return report.status === "submitted" && submittedAgeInDays(report) >= 3;
}

function submittedAgeInDays(report) {
  if (!report.submitted_at) return 0;
  const submittedAt = new Date(report.submitted_at);
  if (Number.isNaN(submittedAt.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - submittedAt.getTime()) / 86400000));
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
  const trimmedNotes = notes.trim();
  if (status === "rejected" && trimmedNotes.length < 8) {
    els.portfolioList.insertAdjacentHTML("afterbegin", `<div class="notice"><p>Send-back comments are required so the resource knows what to fix.</p></div>`);
    return;
  }

  const report = app.reviewQueue.reports.find((item) => item.id === reportId);
  const profile = app.adminProfiles.find((item) => item.id === report?.user_id);
  const approvalRoute = approvalRouteFromReport(report, profile);
  const finalRequired = status === "approved" && approvalRoute.requireFinal;
  const finalApproverEmail = approvalRoute.final?.email || approvalRoute.final?.manager_email || "";
  const currentUserIsFinal = finalApproverEmail && finalApproverEmail.toLowerCase() === app.user.email.toLowerCase();
  const nextStatus = finalRequired && !currentUserIsFinal && !isPortfolioManager() ? "pending_final" : status;
  const reviewNotes = nextStatus === "pending_final"
    ? [trimmedNotes, "Primary approval complete; waiting for final approval."].filter(Boolean).join(" ")
    : trimmedNotes;

  const { error } = await app.supabase
    .from("timesheet_weekly_reports")
    .update({
      status: nextStatus,
      manager_notes: reviewNotes || null,
      reviewed_by: app.user.id,
      reviewer_email: app.user.email,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) {
    els.portfolioList.insertAdjacentHTML("afterbegin", `<div class="notice"><p>${escapeHtml(error.message)}</p></div>`);
    return;
  }

  await logTimesheetAudit(reportId, nextStatus === "pending_final" ? "final_requested" : status === "approved" ? "approved" : "rejected", reviewNotes);
  await loadPortfolio();
}

async function approveCleanSubmittedReports() {
  const { reports, daysByReport } = app.reviewQueue;
  const cleanReports = reports.filter((report) => isCleanSubmittedReport(report, daysByReport.get(report.id) || []));
  if (!cleanReports.length) {
    showPortfolioNotice("No clean submitted reports are eligible for bulk approval.");
    return;
  }

  const confirmed = window.confirm(`Approve ${cleanReports.length} clean submitted report${cleanReports.length === 1 ? "" : "s"} in the current queue? Stale reports, reports with blockers, and zero-hour reports will be skipped.`);
  if (!confirmed) return;

  let approved = 0;
  const failed = [];
  for (const report of cleanReports) {
    const profile = app.adminProfiles.find((item) => item.id === report.user_id);
    const approvalRoute = approvalRouteFromReport(report, profile);
    const finalApproverEmail = approvalRoute.final?.email || approvalRoute.final?.manager_email || "";
    const currentUserIsFinal = finalApproverEmail && finalApproverEmail.toLowerCase() === app.user.email.toLowerCase();
    const nextStatus = approvalRoute.requireFinal && !currentUserIsFinal && !isPortfolioManager() ? "pending_final" : "approved";
    const auditAction = nextStatus === "pending_final" ? "final_requested" : "approved";
    const auditNotes = nextStatus === "pending_final"
      ? "Bulk primary approval: waiting for final approval."
      : "Bulk approved: clean submitted report.";
    const { data, error } = await app.supabase
      .from("timesheet_weekly_reports")
      .update({
        status: nextStatus,
        manager_notes: report.manager_notes || null,
        reviewed_by: app.user.id,
        reviewer_email: app.user.email,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", report.id)
      .eq("status", "submitted")
      .select("id")
      .maybeSingle();

    if (error || !data) {
      failed.push(error?.message || "Report was no longer submitted.");
      continue;
    }

    await logTimesheetAudit(report.id, auditAction, auditNotes);
    approved += 1;
  }

  await loadPortfolio();
  if (failed.length) {
    showPortfolioNotice(`Approved ${approved}; ${failed.length} failed. ${failed.slice(0, 2).join(" | ")}`, true);
    return;
  }

  showPortfolioNotice(`Approved ${approved} clean submitted report${approved === 1 ? "" : "s"}.`);
}

async function renderAdminConsole() {
  await loadAdminProfiles();
  populateAdminSelects();
  renderAdminLists();
  await renderAdminExceptions();
  await loadAndRenderAdminAudit();
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

  const projectSelects = [els.adminManagerProject, els.adminTaskProject, els.inviteProject, els.approvalChainProject];
  for (const select of projectSelects) {
    populateProjectSelectElement(select, select === els.approvalChainProject ? "Any project" : "Select project", "");
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
  populateApprovalChainBranches();
  populateApprovalChainApprovers();
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

function populateApprovalChainBranches() {
  const current = els.approvalChainBranch.value || "";
  els.approvalChainBranch.innerHTML = "";
  els.approvalChainBranch.append(new Option("Any branch", ""));
  for (const branch of app.branches) {
    els.approvalChainBranch.append(new Option(branch.name, branch.name));
  }
  els.approvalChainBranch.value = app.branches.some((branch) => branch.name === current) ? current : "";
  populateApprovalChainDivisions();
}

function populateApprovalChainDivisions() {
  const selectedBranch = app.branches.find((branch) => branch.name === els.approvalChainBranch.value);
  const divisions = selectedBranch
    ? app.divisions.filter((division) => division.branch_id === selectedBranch.id)
    : app.divisions;
  const current = els.approvalChainDivision.value || "";
  els.approvalChainDivision.innerHTML = "";
  els.approvalChainDivision.append(new Option("Any division", ""));
  for (const division of divisions) {
    els.approvalChainDivision.append(new Option(division.name, division.name));
  }
  els.approvalChainDivision.value = divisions.some((division) => division.name === current) ? current : "";
}

function populateApprovalChainApprovers() {
  const projectId = els.approvalChainProject.value;
  const managers = app.managers.filter((manager) => !projectId || manager.project_id === projectId);
  const current = {
    primary: els.approvalChainPrimary.value,
    backup: els.approvalChainBackup.value,
    final: els.approvalChainFinal.value,
  };

  populateManagerSelectElement(els.approvalChainPrimary, managers, managers.length ? "Select primary" : "No managers configured", "");
  populateManagerSelectElement(els.approvalChainBackup, managers, "No backup", "");
  populateManagerSelectElement(els.approvalChainFinal, managers, "No final approver", "");

  els.approvalChainPrimary.value = managers.some((manager) => manager.id === current.primary) ? current.primary : "";
  els.approvalChainBackup.value = managers.some((manager) => manager.id === current.backup) ? current.backup : "";
  els.approvalChainFinal.value = managers.some((manager) => manager.id === current.final) ? current.final : "";
}

function populateManagerSelectElement(select, managers, placeholder, placeholderValue) {
  select.innerHTML = "";
  select.append(new Option(placeholder, placeholderValue));
  for (const manager of managers) {
    select.append(new Option(`${manager.manager_name} - ${manager.manager_email}`, manager.id));
  }
}

function renderAdminLists() {
  renderProjectAdminList();
  renderApprovalChainAdminList();
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

async function renderAdminExceptions() {
  if (!isPortfolioManager()) return;
  els.adminExceptions.innerHTML = `<div class="empty-state"><p>Checking portfolio exceptions...</p></div>`;

  const activeProfiles = app.adminProfiles.filter((profile) => profile.active !== false);
  const inactiveAssigned = app.adminProfiles.filter((profile) => profile.active === false && profile.project_id);
  const profilesMissingSetup = activeProfiles.filter((profile) => !profile.project_id || !profile.manager_id || !profile.branch || !profile.division);
  const managersWithoutProfiles = app.managers.filter((manager) => !activeProfiles.some((profile) => profile.manager_id === manager.id));
  const projectsMissingManagers = app.projects.filter((project) => !app.managers.some((manager) => manager.project_id === project.id));
  const projectsMissingTasks = app.projects.filter((project) => !app.tasks.some((task) => task.project_id === project.id));
  const missingSubmissions = await loadCurrentWeekMissingProfiles(activeProfiles);

  const groups = [
    {
      title: "Missing This Week",
      tone: missingSubmissions.length ? "rejected" : "approved",
      count: missingSubmissions.length,
      detail: `Week of ${formatShortDate(toDateInput(app.weekStart))}`,
      items: missingSubmissions.map((profile) => ({
        title: profile.full_name || profile.email,
        meta: [profile.email, projectLabel(getProject(profile.project_id)), getManager(profile.manager_id)?.manager_name].filter(Boolean).join(" - "),
      })),
      action: missingSubmissions.length ? () => focusPortfolioMissing() : null,
      actionLabel: "Open Missing",
    },
    {
      title: "Profile Setup Gaps",
      tone: profilesMissingSetup.length ? "rejected" : "approved",
      count: profilesMissingSetup.length,
      detail: "Active users missing project, manager, branch, or division",
      items: profilesMissingSetup.map((profile) => ({
        title: profile.full_name || profile.email,
        meta: missingProfileFields(profile).join(", "),
      })),
      action: profilesMissingSetup.length ? () => focusUserExceptions("active") : null,
      actionLabel: "Filter Users",
    },
    {
      title: "Inactive Assigned",
      tone: inactiveAssigned.length ? "submitted" : "approved",
      count: inactiveAssigned.length,
      detail: "Inactive users still mapped to active work",
      items: inactiveAssigned.map((profile) => ({
        title: profile.full_name || profile.email,
        meta: [projectLabel(getProject(profile.project_id)), profile.branch, profile.division].filter(Boolean).join(" - "),
      })),
      action: inactiveAssigned.length ? () => focusUserExceptions("inactive") : null,
      actionLabel: "Filter Users",
    },
    {
      title: "Project Configuration",
      tone: projectsMissingManagers.length || projectsMissingTasks.length ? "rejected" : "approved",
      count: projectsMissingManagers.length + projectsMissingTasks.length,
      detail: "Projects missing managers or task codes",
      items: [
        ...projectsMissingManagers.map((project) => ({ title: projectLabel(project), meta: "No resource manager configured" })),
        ...projectsMissingTasks.map((project) => ({ title: projectLabel(project), meta: "No task codes configured" })),
      ],
      action: null,
    },
    {
      title: "Unused Managers",
      tone: managersWithoutProfiles.length ? "submitted" : "approved",
      count: managersWithoutProfiles.length,
      detail: "Managers with no active resources assigned",
      items: managersWithoutProfiles.map((manager) => ({
        title: manager.manager_name,
        meta: [manager.manager_email, projectLabel(getProject(manager.project_id))].filter(Boolean).join(" - "),
      })),
      action: null,
    },
  ];

  els.adminExceptions.innerHTML = "";
  for (const group of groups) {
    els.adminExceptions.append(renderExceptionGroup(group));
  }
}

async function loadCurrentWeekMissingProfiles(activeProfiles) {
  const userIds = activeProfiles.map((profile) => profile.id);
  if (!userIds.length) return [];

  const { data, error } = await app.supabase
    .from("timesheet_weekly_reports")
    .select("user_id, status")
    .in("user_id", userIds)
    .eq("week_start", toDateInput(app.weekStart));

  if (error) {
    setMessage(els.adminMessage, `Exception check failed: ${error.message}`, true);
    return [];
  }

  const submittedUserIds = new Set((data || [])
    .filter((report) => ["submitted", "pending_final", "approved"].includes(report.status))
    .map((report) => report.user_id));
  return activeProfiles.filter((profile) => !submittedUserIds.has(profile.id));
}

function renderExceptionGroup(group) {
  const card = document.createElement("article");
  card.className = "exception-group";
  card.innerHTML = `
    <div class="exception-head">
      <div>
        <h4>${escapeHtml(group.title)}</h4>
        <p>${escapeHtml(group.detail)}</p>
      </div>
      <span class="status-pill ${escapeHtml(group.tone)}">${group.count}</span>
    </div>
    <ul class="exception-list">
      ${group.items.length
        ? group.items.slice(0, 6).map((item) => `<li><strong>${escapeHtml(item.title || "-")}</strong><span>${escapeHtml(item.meta || "-")}</span></li>`).join("")
        : `<li><strong>Clear</strong><span>No exceptions found.</span></li>`}
      ${group.items.length > 6 ? `<li><strong>+${group.items.length - 6} more</strong><span>Use the related admin filters to review the remaining items.</span></li>` : ""}
    </ul>
  `;

  if (group.action) {
    const button = document.createElement("button");
    button.className = "button small-button";
    button.type = "button";
    button.textContent = group.actionLabel;
    button.addEventListener("click", group.action);
    card.append(button);
  }

  return card;
}

function missingProfileFields(profile) {
  const missing = [];
  if (!profile.project_id) missing.push("project");
  if (!profile.manager_id) missing.push("manager");
  if (!profile.branch) missing.push("branch");
  if (!profile.division) missing.push("division");
  return missing;
}

function focusPortfolioMissing() {
  els.portfolioStatus.value = "missing";
  els.portfolioWeek.value = toDateInput(app.weekStart);
  loadPortfolio();
  els.portfolioView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusUserExceptions(status = "active") {
  els.adminUserStatus.value = status;
  els.adminUserBranch.value = "all";
  populateAdminUserDivisions();
  els.adminUserProject.value = "all";
  renderUserAdminList();
  els.userFilterForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadAndRenderAdminAudit() {
  if (!isPortfolioManager()) return;
  els.adminAuditList.innerHTML = `<li class="admin-item"><span>Loading change log...</span></li>`;

  const { data, error } = await app.supabase
    .from("timesheet_admin_audit")
    .select("id, actor_email, action, entity_type, entity_id, entity_label, details, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    app.adminAudit = [];
    els.adminAuditList.innerHTML = `<li class="admin-item"><span>${escapeHtml(error.message)}</span></li>`;
    return;
  }

  app.adminAudit = data || [];
  renderAdminAuditList();
}

function renderAdminAuditList() {
  if (!app.adminAudit.length) {
    els.adminAuditList.innerHTML = `<li class="admin-item"><span>No admin changes logged yet.</span></li>`;
    return;
  }

  els.adminAuditList.innerHTML = "";
  for (const item of app.adminAudit) {
    const row = document.createElement("li");
    row.className = "admin-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(formatAdminAuditAction(item.action))}</strong>
        <span>${escapeHtml([item.entity_label || formatEntityType(item.entity_type), item.actor_email, formatShortDate(item.created_at)].filter(Boolean).join(" - "))}</span>
      </div>
    `;
    els.adminAuditList.append(row);
  }
}

async function exportAdminAuditLog() {
  if (!isPortfolioManager()) return;
  setMessage(els.adminMessage, "Exporting admin change log...");

  const { data, error } = await app.supabase
    .from("timesheet_admin_audit")
    .select("actor_email, action, entity_type, entity_id, entity_label, details, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    setMessage(els.adminMessage, `Admin change log export failed: ${error.message}`, true);
    return;
  }

  const rows = [["Date", "Actor", "Action", "Entity Type", "Entity", "Entity ID", "Details"]];
  for (const item of data || []) {
    rows.push([
      item.created_at,
      item.actor_email || "",
      formatAdminAuditAction(item.action),
      formatEntityType(item.entity_type),
      item.entity_label || "",
      item.entity_id || "",
      JSON.stringify(item.details || {}),
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  downloadCsv(csv, `cadmus-admin-change-log-${toDateInput(new Date())}.csv`);
  setMessage(els.adminMessage, `Exported ${Math.max(0, rows.length - 1)} admin change rows.`);
}

async function logAdminChange(action, entityType, entityId, entityLabel, details = {}) {
  if (!isPortfolioManager()) return;

  const { error } = await app.supabase.from("timesheet_admin_audit").insert({
    actor_id: app.user.id,
    actor_email: app.user.email,
    action,
    entity_type: entityType,
    entity_id: entityId || null,
    entity_label: entityLabel || null,
    details,
  });

  if (error) {
    setMessage(els.adminMessage, `Change saved, but audit logging failed: ${error.message}`, true);
  }
}

function formatAdminAuditAction(action) {
  return {
    created: "Created",
    updated: "Updated",
    deactivated: "Deactivated",
    invited: "Invitation Sent",
  }[action] || titleCase(String(action || "changed").replaceAll("_", " "));
}

function formatEntityType(entityType) {
  return {
    approval_chain: "Approval Chain",
    project: "Project",
    project_manager: "Resource Manager",
    branch: "Branch",
    division: "Division",
    task: "Task",
    user: "User",
    invitation: "Invitation",
  }[entityType] || titleCase(String(entityType || "item").replaceAll("_", " "));
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

function renderApprovalChainAdminList() {
  const chains = filterApprovalChainsByFocusedProject(app.approvalChains);
  if (!chains.length) {
    els.approvalChainList.innerHTML = `<li class="admin-item"><span>No approval chains configured.</span></li>`;
    return;
  }

  els.approvalChainList.innerHTML = "";
  for (const chain of chains) {
    const row = document.createElement("li");
    row.className = "admin-item";
    row.innerHTML = `
      <div>
        <strong>${escapeHtml(chain.name)}</strong>
        <span>${escapeHtml(approvalChainDetail(chain))}</span>
        <span>${escapeHtml(approvalRouteLabel(chain))}</span>
      </div>
      <button class="button danger small-button" type="button">Remove</button>
    `;
    row.querySelector("button").addEventListener("click", () => deactivateAdminItem("timesheet_approval_chains", chain.id, "Approval chain removed."));
    els.approvalChainList.append(row);
  }
}

function filterApprovalChainsByFocusedProject(chains) {
  if (app.adminProjectFocus === "all") return chains;
  return chains.filter((chain) => !chain.project_id || chain.project_id === app.adminProjectFocus);
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
          <span class="admin-row-status" data-user-status>Ready</span>
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
    const statusNode = row.querySelector("[data-user-status]");

    roleSelect.addEventListener("change", async () => {
      const previousRole = user.role || "resource";
      const nextRole = roleSelect.value;
      if (!confirmManagedUserChange(user, { role: nextRole })) {
        roleSelect.value = previousRole;
        return;
      }
      await updateManagedUser(user.id, { role: nextRole }, statusNode);
    });
    projectSelect.addEventListener("change", () => {
      populateManagerOptionsForProject(managerSelect, projectSelect.value, "");
      updateManagedUser(user.id, { project_id: projectSelect.value || null, manager_id: managerSelect.value || null }, statusNode);
    });
    managerSelect.addEventListener("change", () => updateManagedUser(user.id, { manager_id: managerSelect.value || null }, statusNode));
    branchSelect.addEventListener("change", () => {
      populateDivisionOptionsForBranch(divisionSelect, branchSelect.value, "");
      updateManagedUser(user.id, { branch: branchSelect.value, division: divisionSelect.value }, statusNode);
    });
    divisionSelect.addEventListener("change", () => updateManagedUser(user.id, { division: divisionSelect.value }, statusNode));
    row.querySelector("[data-toggle-active]").addEventListener("click", () => {
      const nextActive = user.active === false;
      if (!confirmManagedUserChange(user, { active: nextActive })) return;
      updateManagedUser(user.id, { active: nextActive }, statusNode);
    });

    els.userList.append(row);
  }
}

function confirmManagedUserChange(user, patch) {
  const displayName = user.full_name || user.email || "this user";
  if (user.id === app.user?.id && patch.role && patch.role !== "admin") {
    setMessage(els.adminMessage, "You cannot remove your own Portfolio Manager access.", true);
    return false;
  }

  if (user.id === app.user?.id && patch.active === false) {
    setMessage(els.adminMessage, "You cannot deactivate your own account.", true);
    return false;
  }

  if (patch.role === "admin" && user.role !== "admin") {
    return window.confirm(`Promote ${displayName} to Portfolio Manager? This grants portfolio setup and user-management access.`);
  }

  if (patch.active === false) {
    return window.confirm(`Deactivate ${displayName}? They will no longer be able to use the timesheet portal.`);
  }

  return true;
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

async function updateManagedUser(userId, patch, statusNode = null) {
  setMessage(els.adminMessage, "Updating user...");
  setRowStatus(statusNode, "Saving...");
  const { error } = await app.supabase
    .from("timesheet_profiles")
    .update(patch)
    .eq("id", userId);

  if (error) {
    setRowStatus(statusNode, "Update failed", true);
    setMessage(els.adminMessage, `User update failed: ${error.message}`, true);
    await renderAdminConsole();
    return;
  }

  const user = app.adminProfiles.find((profile) => profile.id === userId);
  if (user) Object.assign(user, patch);
  await logAdminChange("updated", "user", userId, user?.full_name || user?.email || userId, patch);
  setMessage(els.adminMessage, "User updated.");
  setRowStatus(statusNode, "Saved");
  await loadAndRenderAdminAudit();
  window.setTimeout(renderUserAdminList, 700);
}

function setRowStatus(node, message, isError = false) {
  if (!node) return;
  node.textContent = message;
  node.classList.toggle("error", isError);
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
  await finishAdminSave(error, els.projectForm, "Project saved.", {
    action: "created",
    entityType: "project",
    entityLabel: `${payload.name} (${payload.code || "no code"})`,
    details: payload,
  });
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
  await logAdminChange("updated", "project", projectId, projectLabel(project), { reporting_formats: selected });
  if (app.profile?.project_id === projectId) renderDailyReports();
  await loadAndRenderAdminAudit();
  setMessage(els.adminMessage, "Project views updated.");
}

async function deactivateAdminItem(table, id, successMessage) {
  setMessage(els.adminMessage, "Removing value...");
  const auditTarget = adminAuditTargetForTable(table, id);
  const { error } = await app.supabase.from(table).update({ active: false }).eq("id", id);

  if (error) {
    setMessage(els.adminMessage, error.message, true);
    return;
  }

  await logAdminChange("deactivated", auditTarget.entityType, id, auditTarget.entityLabel, { table });
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
  await finishAdminSave(error, els.managerForm, "Resource manager saved.", {
    action: "created",
    entityType: "project_manager",
    entityLabel: `${payload.manager_name} - ${payload.manager_email}`,
    details: { ...payload, project: projectLabel(getProject(payload.project_id)) },
  });
}

async function addApprovalChain(event) {
  event.preventDefault();
  setMessage(els.adminMessage, "Adding approval chain...");
  const payload = {
    name: els.approvalChainName.value.trim(),
    project_id: els.approvalChainProject.value || null,
    branch: els.approvalChainBranch.value || null,
    division: els.approvalChainDivision.value || null,
    primary_manager_id: els.approvalChainPrimary.value,
    backup_manager_id: els.approvalChainBackup.value || null,
    final_approver_id: els.approvalChainFinal.value || null,
    require_final_approval: els.approvalChainRequireFinal.checked,
    active: true,
  };

  if (!payload.name || !payload.primary_manager_id) {
    setMessage(els.adminMessage, "Chain name and primary approver are required.", true);
    return;
  }

  if (payload.require_final_approval && !payload.final_approver_id) {
    setMessage(els.adminMessage, "Choose a final approver or turn off final approval.", true);
    return;
  }

  const { error } = await app.supabase.from("timesheet_approval_chains").insert(payload);
  await finishAdminSave(error, els.approvalChainForm, "Approval chain saved.", {
    action: "created",
    entityType: "approval_chain",
    entityLabel: payload.name,
    details: {
      ...payload,
      project: projectLabel(getProject(payload.project_id)),
      route: approvalRouteLabel(payload),
    },
  });
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
  await finishAdminSave(error, els.branchForm, "Branch saved.", {
    action: "created",
    entityType: "branch",
    entityLabel: payload.name,
    details: payload,
  });
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
  await finishAdminSave(error, els.divisionForm, "Division saved.", {
    action: "created",
    entityType: "division",
    entityLabel: payload.name,
    details: { ...payload, branch: app.branches.find((branch) => branch.id === payload.branch_id)?.name || "" },
  });
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
  await finishAdminSave(error, els.taskForm, "Task saved.", {
    action: "created",
    entityType: "task",
    entityLabel: taskLabel(payload),
    details: { ...payload, project: projectLabel(getProject(payload.project_id)) },
  });
}

async function sendBulkInvitations(event) {
  event.preventDefault();
  if (!isPortfolioManager()) return;

  const importResult = buildInvitationImportRows();
  renderInviteImportPreview(importResult);
  if (importResult.errors.length) {
    setMessage(els.adminMessage, "Fix the import errors before sending invitations.", true);
    return;
  }

  const invitationsToSend = importResult.rows;
  if (!invitationsToSend.length) {
    setMessage(els.adminMessage, "Add at least one email or CSV row before sending invitations.", true);
    return;
  }

  setMessage(els.adminMessage, `Sending ${invitationsToSend.length} invitations...`);
  let sent = 0;
  let linkOnly = 0;
  const failed = [];
  const inviteLinks = [];

  for (const row of invitationsToSend) {
    const invitation = {
      id: crypto.randomUUID(),
      email: row.email,
      full_name: row.full_name || null,
      role: row.role,
      project_id: row.project_id,
      manager_id: row.manager_id,
      branch: row.branch,
      division: row.division,
      invited_by: app.user.id,
      active: true,
    };
    const { error: inviteError } = await app.supabase.from("timesheet_invitations").insert(invitation);
    if (inviteError) {
      failed.push(`${row.email}: ${inviteError.message}`);
      continue;
    }

    const redirectTo = `${window.location.origin}/timesheets/?invite=${invitation.id}`;
    inviteLinks.push({ email: row.email, role: row.role, link: redirectTo });
    const { error: emailError } = await app.supabase.auth.signInWithOtp({
      email: row.email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });

    if (emailError) {
      if (isEmailThrottleError(emailError)) {
        linkOnly += 1;
      } else {
        failed.push(`${row.email}: ${friendlyAuthError(emailError)}`);
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

  await logAdminChange("invited", "invitation", null, `${inviteLinks.length} invitation${inviteLinks.length === 1 ? "" : "s"}`, {
    count: inviteLinks.length,
    sent,
    linkOnly,
    importMode: importResult.mode,
    projects: [...new Set(invitationsToSend.map((row) => projectLabel(getProject(row.project_id))))],
    roles: [...new Set(invitationsToSend.map((row) => row.role))],
  });
  els.inviteForm.reset();
  els.inviteImportPreview.innerHTML = "";
  populateInviteBranches();
  populateInviteManagers();
  await loadAndRenderAdminAudit();
  setMessage(els.adminMessage, linkOnly ? `Sent ${sent}. Supabase throttled ${linkOnly}; manual invite links were downloaded.` : `Sent ${sent} invitations.`);
}

function validateInviteImport() {
  const result = buildInvitationImportRows();
  renderInviteImportPreview(result);
  setMessage(
    els.adminMessage,
    result.errors.length ? `${result.errors.length} import issue${result.errors.length === 1 ? "" : "s"} found.` : `${result.rows.length} invitation row${result.rows.length === 1 ? "" : "s"} ready.`,
    Boolean(result.errors.length),
  );
}

function buildInvitationImportRows() {
  const csvText = els.inviteCsv.value.trim();
  if (csvText) return parseInvitationCsv(csvText);
  return buildDefaultInvitationRows();
}

function buildDefaultInvitationRows() {
  const emails = parseEmailList(els.inviteEmails.value);
  const errors = [];
  const rows = [];
  if (!emails.length) errors.push({ row: "-", message: "Add at least one email address." });
  if (!els.inviteProject.value) errors.push({ row: "-", message: "Choose a project." });

  for (const email of emails) {
    rows.push({
      rowNumber: "-",
      email,
      role: els.inviteRole.value,
      project_id: els.inviteProject.value || null,
      manager_id: els.inviteManager.value || null,
      branch: els.inviteBranch.value || null,
      division: els.inviteDivision.value || null,
      source: "default",
    });
  }

  return { mode: "default", rows, errors };
}

function parseInvitationCsv(csvText) {
  const records = parseCsvRecords(csvText);
  const errors = [];
  const rows = [];
  if (!records.length) return { mode: "csv", rows, errors: [{ row: "-", message: "Paste CSV rows before validating." }] };

  const header = records[0].map((value) => normalizeLookup(value).replaceAll(" ", "_"));
  const requiredHeaders = ["email"];
  for (const required of requiredHeaders) {
    if (!header.includes(required)) errors.push({ row: 1, message: `Missing ${required} column.` });
  }
  if (errors.length) return { mode: "csv", rows, errors };

  const seen = new Set();
  for (let index = 1; index < records.length; index += 1) {
    const values = records[index];
    if (!values.some((value) => String(value || "").trim())) continue;
    const record = Object.fromEntries(header.map((name, columnIndex) => [name, values[columnIndex]?.trim() || ""]));
    const rowNumber = index + 1;
    const rowErrors = validateInvitationRecord(record, rowNumber, seen);
    errors.push(...rowErrors);
    if (rowErrors.length) continue;

    rows.push(resolveInvitationRecord(record, rowNumber));
  }

  return { mode: "csv", rows, errors };
}

function validateInvitationRecord(record, rowNumber, seen) {
  const errors = [];
  const email = record.email?.toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ row: rowNumber, message: "Valid email is required." });
  if (seen.has(email)) errors.push({ row: rowNumber, message: "Duplicate email in import." });
  seen.add(email);

  const role = normalizeRole(record.role || els.inviteRole.value);
  if (!ppmRoles[role]) errors.push({ row: rowNumber, message: "Role must be resource, manager, or admin." });

  if (!resolveProject(record.project || record.project_code || record.project_name || els.inviteProject.value)) {
    errors.push({ row: rowNumber, message: "Project does not match an active project." });
  }

  const project = resolveProject(record.project || record.project_code || record.project_name || els.inviteProject.value);
  const managerValue = record.manager || record.manager_email;
  if (managerValue && !resolveManager(managerValue, project?.id)) {
    errors.push({ row: rowNumber, message: "Manager does not match the selected project." });
  }

  if (record.branch && !app.branches.some((branch) => normalizeLookup(branch.name) === normalizeLookup(record.branch))) {
    errors.push({ row: rowNumber, message: "Branch does not match an active branch." });
  }

  if (record.division && !resolveDivision(record.division, record.branch || els.inviteBranch.value)) {
    errors.push({ row: rowNumber, message: "Division does not match the selected branch." });
  }

  return errors;
}

function resolveInvitationRecord(record, rowNumber) {
  const project = resolveProject(record.project || record.project_code || record.project_name || els.inviteProject.value);
  const manager = resolveManager(record.manager || record.manager_email || els.inviteManager.value, project?.id);
  const branch = record.branch || els.inviteBranch.value || "";
  const division = record.division || els.inviteDivision.value || "";
  return {
    rowNumber,
    email: record.email.toLowerCase(),
    full_name: record.full_name || record.name || "",
    role: normalizeRole(record.role || els.inviteRole.value),
    project_id: project?.id || null,
    manager_id: manager?.id || null,
    branch: branch || null,
    division: division || null,
    source: "csv",
  };
}

function renderInviteImportPreview(result) {
  if (!result.rows.length && !result.errors.length) {
    els.inviteImportPreview.innerHTML = "";
    return;
  }

  els.inviteImportPreview.innerHTML = `
    <div class="import-summary ${result.errors.length ? "has-errors" : ""}">
      <strong>${result.errors.length ? `${result.errors.length} issue${result.errors.length === 1 ? "" : "s"}` : `${result.rows.length} ready`}</strong>
      <span>${result.mode === "csv" ? "CSV import" : "Email list"}</span>
    </div>
    ${result.errors.length ? `<ul>${result.errors.slice(0, 8).map((error) => `<li>Row ${escapeHtml(error.row)}: ${escapeHtml(error.message)}</li>`).join("")}</ul>` : ""}
    ${result.rows.length ? `<ul>${result.rows.slice(0, 8).map((row) => `<li>${escapeHtml(row.email)} - ${escapeHtml(roleLabel(row.role))} - ${escapeHtml(projectLabel(getProject(row.project_id)))}</li>`).join("")}</ul>` : ""}
  `;
}

async function finishAdminSave(error, form, successMessage, auditEvent = null) {
  if (error) {
    setMessage(els.adminMessage, error.message, true);
    return;
  }

  if (auditEvent) {
    await logAdminChange(auditEvent.action, auditEvent.entityType, auditEvent.entityId || null, auditEvent.entityLabel, auditEvent.details || {});
  }

  form.reset();
  if (form === els.projectForm) {
    els.adminFormatDaily.checked = false;
    els.adminFormatGrid.checked = true;
    els.adminFormatLog.checked = false;
  }
  if (form === els.approvalChainForm) {
    if (app.adminProjectFocus !== "all") els.approvalChainProject.value = app.adminProjectFocus;
    populateApprovalChainBranches();
    populateApprovalChainApprovers();
  }
  await loadReferenceData();
  await renderAdminConsole();
  renderDailyReports();
  setMessage(els.adminMessage, successMessage);
}

function adminAuditTargetForTable(table, id) {
  const targets = {
    timesheet_approval_chains: {
      entityType: "approval_chain",
      item: app.approvalChains.find((chain) => chain.id === id),
      labelFor: (item) => item?.name || "",
    },
    timesheet_projects: {
      entityType: "project",
      item: app.projects.find((project) => project.id === id),
      labelFor: (item) => projectLabel(item),
    },
    timesheet_project_managers: {
      entityType: "project_manager",
      item: app.managers.find((manager) => manager.id === id),
      labelFor: (item) => item ? `${item.manager_name} - ${item.manager_email}` : "",
    },
    timesheet_branches: {
      entityType: "branch",
      item: app.branches.find((branch) => branch.id === id),
      labelFor: (item) => item?.name || "",
    },
    timesheet_divisions: {
      entityType: "division",
      item: app.divisions.find((division) => division.id === id),
      labelFor: (item) => item?.name || "",
    },
    timesheet_tasks: {
      entityType: "task",
      item: app.tasks.find((task) => task.id === id),
      labelFor: (item) => taskLabel(item),
    },
  };
  const target = targets[table] || {};
  return {
    entityType: target.entityType || table,
    entityLabel: target.labelFor ? target.labelFor(target.item) : id,
  };
}

function setDefaultAdminExportWindow() {
  if (!els.adminExportStart.value) els.adminExportStart.value = toDateInput(app.weekStart);
  if (!els.adminExportEnd.value) els.adminExportEnd.value = toDateInput(addDays(app.weekStart, 4));
}

async function exportAdminWork(event) {
  event.preventDefault();
  if (app.profile?.role !== "admin") return;

  setMessage(els.adminMessage, "Building export...");
  const exportData = await loadAdminExportData();
  if (!exportData) return;

  downloadAdminWorkCsv(exportData);
  setMessage(els.adminMessage, `Exported ${exportData.days.length} work rows.`);
}

async function exportApprovedTime() {
  if (app.profile?.role !== "admin") return;

  setMessage(els.adminMessage, "Building approved time export...");
  const exportData = await loadAdminExportData({ status: "approved" });
  if (!exportData) return;

  const summaries = summarizeApprovedTime(exportData);
  if (!summaries.length) {
    setMessage(els.adminMessage, "No approved time totals are available for that window.", true);
    return;
  }

  downloadApprovedTimeCsv(exportData, summaries);
  setMessage(els.adminMessage, `Exported ${summaries.length} approved time summary rows.`);
}

async function loadAdminExportData({ status = "" } = {}) {
  const branch = els.adminExportBranch.value;
  const division = els.adminExportDivision.value;
  const startDate = els.adminExportStart.value;
  const endDate = els.adminExportEnd.value;

  if (!branch || !startDate || !endDate) {
    setMessage(els.adminMessage, "Choose a branch, start date, and end date before exporting.", true);
    return null;
  }

  if (startDate > endDate) {
    setMessage(els.adminMessage, "End date must be after the start date.", true);
    return null;
  }

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
    return null;
  }

  if (!profiles?.length) {
    setMessage(els.adminMessage, "No resources match that branch/division.", true);
    return null;
  }

  const userIds = profiles.map((profile) => profile.id);
  const reportStart = toDateInput(startOfWeek(parseLocalDate(startDate)));
  const reportEnd = toDateInput(startOfWeek(parseLocalDate(endDate)));
  let reportQuery = app.supabase
    .from("timesheet_weekly_reports")
    .select("id, user_id, week_start, project_id, manager_id, approval_chain_id, approval_chain_snapshot, status, submitted_at, reviewed_at, reviewer_email")
    .in("user_id", userIds)
    .gte("week_start", reportStart)
    .lte("week_start", reportEnd)
    .order("week_start", { ascending: true });

  if (status) {
    reportQuery = reportQuery.eq("status", status);
  }

  const { data: reports, error: reportError } = await reportQuery;
  if (reportError) {
    setMessage(els.adminMessage, `Report lookup failed: ${reportError.message}`, true);
    return null;
  }

  if (!reports?.length) {
    setMessage(els.adminMessage, status === "approved" ? "No approved reports exist in that window." : "No reports exist in that window.", true);
    return null;
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
    return null;
  }

  if (!days?.length) {
    setMessage(els.adminMessage, "No daily work entries match that window.", true);
    return null;
  }

  return { profiles, reports, days, branch, division, startDate, endDate };
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
      approvalRouteSummary(approvalRouteFromReport(report, profile)),
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

function downloadApprovedTimeCsv(exportData, summaries = summarizeApprovedTime(exportData)) {
  const rows = [[
    "Resource",
    "Email",
    "Company",
    "Branch",
    "Division",
    "Project",
    "Project Code",
    "Client",
    "Manager",
    "Task",
    "Task Code",
    "Week",
    "Approved Hours",
    "Approved Date",
    "Reviewer",
    "Source Rows",
  ]];

  for (const row of summaries) {
    rows.push([
      row.resource,
      row.email,
      row.company,
      row.branch,
      row.division,
      row.project,
      row.projectCode,
      row.client,
      row.manager,
      row.task,
      row.taskCode,
      row.week,
      formatHours(row.hours),
      row.reviewedAt,
      row.reviewer,
      String(row.sourceRows),
    ]);
  }

  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\n");
  const scope = [exportData.branch, exportData.division && exportData.division !== "all" ? exportData.division : "all-divisions"].filter(Boolean).map(slugify).join("-");
  downloadCsv(csv, `cadmus-approved-time-${scope}-${exportData.startDate}-to-${exportData.endDate}.csv`);
}

function summarizeApprovedTime({ profiles, reports, days }) {
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const reportMap = new Map(reports.map((report) => [report.id, report]));
  const summaries = new Map();

  for (const day of days) {
    const report = reportMap.get(day.weekly_report_id);
    if (!report || report.status !== "approved") continue;

    const profile = profileMap.get(report.user_id);
    const project = getProject(report.project_id);
    const approvalRoute = approvalRouteFromReport(report, profile);
    const task = getTask(day.task_id);
    const key = [
      profile?.id || "",
      report.project_id || "",
      report.manager_id || "",
      day.task_id || "",
      report.week_start,
    ].join("|");

    if (!summaries.has(key)) {
      summaries.set(key, {
        resource: profile?.full_name || "",
        email: profile?.email || "",
        company: profile?.company || "",
        branch: profile?.branch || "",
        division: profile?.division || "",
        project: project?.name || "",
        projectCode: project?.code || "",
        client: project?.client || "",
        manager: approvalRouteSummary(approvalRoute),
        task: task?.name || "",
        taskCode: task?.code || "",
        week: report.week_start,
        hours: 0,
        reviewedAt: report.reviewed_at || "",
        reviewer: report.reviewer_email || "",
        sourceRows: 0,
      });
    }

    const summary = summaries.get(key);
    summary.hours += Number(day.hours || 0);
    summary.sourceRows += 1;
  }

  return [...summaries.values()].sort((a, b) =>
    a.week.localeCompare(b.week)
    || a.project.localeCompare(b.project)
    || a.resource.localeCompare(b.resource)
    || a.task.localeCompare(b.task)
  );
}

function exportCsv() {
  const rows = [["Week", "Date", "Day", "Project", "Task", "Branch", "Division", "Manager", "Hours", "Notes", "Blockers", "Next Steps", "Status"]];
  const project = getProject(app.profile.project_id);
  const approvalRoute = app.report ? approvalRouteFromReport(app.report, app.profile) : resolveApprovalRoute(app.profile);

  for (const day of collectDailyReports().rows || []) {
    rows.push([
      toDateInput(app.weekStart),
      day.work_date,
      weekdays[day.day_index],
      projectLabel(project),
      taskLabel(getTask(day.task_id)),
      app.profile.branch,
      app.profile.division,
      approvalRouteSummary(approvalRoute),
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

function resolveApprovalRoute(profile) {
  const chain = findApprovalChainForProfile(profile);
  const primaryManagerId = chain?.primary_manager_id || profile?.manager_id || "";
  return {
    chain,
    primaryManagerId,
    primary: getManager(primaryManagerId),
    backup: getManager(chain?.backup_manager_id),
    final: getManager(chain?.final_approver_id),
    requireFinal: Boolean(chain?.require_final_approval),
  };
}

function approvalRouteFromReport(report, profile = null) {
  if (report?.approval_chain_snapshot && Object.keys(report.approval_chain_snapshot).length) {
    return {
      chain: report.approval_chain_snapshot.chain || null,
      primaryManagerId: report.approval_chain_snapshot.primary?.id || report.manager_id || profile?.manager_id || "",
      primary: report.approval_chain_snapshot.primary || getManager(report.manager_id),
      backup: report.approval_chain_snapshot.backup || null,
      final: report.approval_chain_snapshot.final || null,
      requireFinal: Boolean(report.approval_chain_snapshot.requireFinal),
    };
  }
  return resolveApprovalRoute(profile || { project_id: report?.project_id, manager_id: report?.manager_id });
}

function findApprovalChainForProfile(profile) {
  if (!profile) return null;
  const matching = app.approvalChains.filter((chain) =>
    chain.active !== false
    && (!chain.project_id || chain.project_id === profile.project_id)
    && (!chain.branch || chain.branch === profile.branch)
    && (!chain.division || chain.division === profile.division)
  );

  return matching.sort((a, b) => approvalChainSpecificity(b) - approvalChainSpecificity(a))[0] || null;
}

function approvalChainSpecificity(chain) {
  return (chain.project_id ? 4 : 0) + (chain.branch ? 2 : 0) + (chain.division ? 1 : 0);
}

function approvalChainSnapshot(route) {
  return {
    chain: route.chain ? {
      id: route.chain.id,
      name: route.chain.name,
      project_id: route.chain.project_id || null,
      branch: route.chain.branch || null,
      division: route.chain.division || null,
    } : null,
    primary: approvalManagerSnapshot(route.primary),
    backup: approvalManagerSnapshot(route.backup),
    final: approvalManagerSnapshot(route.final),
    requireFinal: route.requireFinal,
  };
}

function approvalManagerSnapshot(manager) {
  return manager ? {
    id: manager.id,
    name: manager.manager_name,
    email: manager.manager_email,
  } : null;
}

function approvalRouteSummary(route) {
  return route?.primary?.name || route?.primary?.manager_name || route?.primary?.manager_email || "No approver";
}

function approvalRouteLabel(chainOrRoute) {
  const route = chainOrRoute?.primaryManagerId ? chainOrRoute : {
    primary: getManager(chainOrRoute?.primary_manager_id),
    backup: getManager(chainOrRoute?.backup_manager_id),
    final: getManager(chainOrRoute?.final_approver_id),
    requireFinal: Boolean(chainOrRoute?.require_final_approval),
  };
  const parts = [`Primary: ${route.primary?.manager_name || route.primary?.name || "-"}`];
  if (route.backup) parts.push(`Backup: ${route.backup.manager_name || route.backup.name}`);
  if (route.final) parts.push(`${route.requireFinal ? "Final" : "Optional final"}: ${route.final.manager_name || route.final.name}`);
  return parts.join(" | ");
}

function canCurrentUserFinalApprove(route) {
  if (isPortfolioManager()) return true;
  const finalEmail = route?.final?.email || route?.final?.manager_email || "";
  return Boolean(finalEmail && finalEmail.toLowerCase() === app.user?.email?.toLowerCase());
}

function approvalChainDetail(chain) {
  return [
    chain.project_id ? projectLabel(getProject(chain.project_id)) : "Any project",
    chain.branch || "Any branch",
    chain.division || "Any division",
  ].filter(Boolean).join(" - ");
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

function formatReportStatus(status) {
  return {
    draft: "Draft",
    submitted: "Submitted",
    pending_final: "Pending Final",
    approved: "Approved",
    rejected: "Sent Back",
  }[status] || titleCase(String(status || "draft").replaceAll("_", " "));
}

function formatAuditAction(action) {
  return {
    draft_saved: "Draft saved",
    submitted: "Submitted",
    withdrawn: "Withdrawn",
    final_requested: "Sent to final approval",
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

function titleCase(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
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

function parseCsvRecords(value) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const text = String(value || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" && !quoted) {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((record) => record.some((field) => String(field || "").trim()));
}

function normalizeRole(value) {
  const normalized = normalizeLookup(value);
  if (["project manager", "manager", "pm"].includes(normalized)) return "manager";
  if (["portfolio manager", "admin", "administrator"].includes(normalized)) return "admin";
  return normalized || "resource";
}

function resolveProject(value) {
  const normalized = normalizeLookup(value);
  if (!normalized) return null;
  return app.projects.find((project) =>
    normalizeLookup(project.id) === normalized
    || normalizeLookup(project.code) === normalized
    || normalizeLookup(project.name) === normalized
    || normalizeLookup(projectLabel(project)) === normalized
  ) || null;
}

function resolveManager(value, projectId = "") {
  const normalized = normalizeLookup(value);
  if (!normalized) return null;
  return app.managers.find((manager) =>
    (!projectId || manager.project_id === projectId)
    && (
      normalizeLookup(manager.id) === normalized
      || normalizeLookup(manager.manager_name) === normalized
      || normalizeLookup(manager.manager_email) === normalized
      || normalizeLookup(`${manager.manager_name} - ${manager.manager_email}`) === normalized
    )
  ) || null;
}

function resolveDivision(value, branchName = "") {
  const normalized = normalizeLookup(value);
  if (!normalized) return null;
  const branch = app.branches.find((item) => normalizeLookup(item.name) === normalizeLookup(branchName));
  return app.divisions.find((division) =>
    normalizeLookup(division.name) === normalized
    && (!branch || !division.branch_id || division.branch_id === branch.id)
  ) || null;
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

function countBy(items, key) {
  return items.reduce((counts, item) => {
    const value = item[key] || "unknown";
    counts[value] = (counts[value] || 0) + 1;
    return counts;
  }, {});
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
