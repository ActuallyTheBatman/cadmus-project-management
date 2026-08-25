# Cadmus Resource Reporting Enterprise Readiness

Cadmus Resource Reporting is a GitHub Pages front end backed by Supabase. The browser uses only the Supabase project URL and anon public key. Database passwords, service role keys, and other privileged secrets must never be placed in frontend files.

## Operating Model

- Resource users enter weekly time and task updates, save drafts, submit reports, and view their report history.
- Project Managers review submitted reports, approve clean reports, send reports back with comments, and monitor missing or late submissions.
- Portfolio Managers administer users, invitations, projects, managers, branches, divisions, task codes, approval chains, allowed email domains, exports, and audit logs.

## Role And Permission Model

- Resource: manage only their own profile and weekly reports.
- Project Manager: review reports in their manager or approval-chain scope.
- Portfolio Manager: administer setup, user access, reporting configuration, approved-time exports, and admin audit records.
- Access is enforced in Supabase with row-level security policies. The UI hides controls by role, but database policies are the authority.

## Security Posture

- Frontend credentials are limited to the Supabase URL and anon public key.
- Supabase Row Level Security is enabled across the timesheet tables.
- Allowed email domains restrict sign-in/invitation eligibility.
- Admin changes are written to `timesheet_admin_audit`.
- Report lifecycle changes are written to `timesheet_report_audit`.
- Portfolio Managers cannot deactivate their own account or remove their own Portfolio Manager access in the UI.
- Recommended next hardening: document policy-by-table ownership, add periodic RLS review, and maintain separate dev/staging/prod Supabase projects.

## Auditability

Audit trails exist for:

- draft save
- submission
- withdrawal
- final approval request
- approval
- rejection/send-back
- profile/admin updates
- project/manager/task/domain/approval-chain setup changes

Report audit records include structured metadata such as status changes, approval route, total hours, task-line count, reviewer, and bulk-action markers.

## Workflow Rules

Current behavior:

- Standard week starts Monday.
- Submission deadline is configurable in frontend workflow settings and defaults to Friday.
- Weekly capacity is configurable in frontend workflow settings and defaults to 40 hours.
- Submitted and approved reports are locked from normal resource editing.
- Rejected reports can be corrected and resubmitted.
- Managers can approve, final approve, send back with comments, and bulk approve clean submitted reports.
- Resources can request an adjustment for an approved week.
- Reviewers can approve an adjustment request, which reopens the week through the sent-back correction flow.
- Portfolio Managers can configure holidays, PTO, and non-working days in the business calendar.
- Workflow notification records are queued for submissions, review decisions, and adjustment events.

Recommended next workflow hardening:

- move workflow settings into an admin-managed database table when per-project/per-organization policies are required
- connect notification queue records to an email, Teams, or webhook sender
- define retention and archive rules for old labor records

## Reporting

Current reporting includes:

- executive dashboard metrics
- utilization
- approval backlog
- missing/draft counts
- late submission counts
- project, branch, division, manager, and task load charts
- missing-reminder export
- approval-reminder export
- operations summary export
- audit history export
- approved-time export for Portfolio Managers

Recommended next reporting hardening:

- PDF summary package
- scheduled weekly manager packet
- payroll/accounting export templates
- report definitions documented by audience

## Integrations Roadmap

Recommended order:

1. Microsoft Entra ID SSO through Supabase Auth.
2. Teams or email reminder workflow for missing/submitted/rejected/approved events.
3. Payroll/accounting export format agreed with downstream system owners.
4. Webhook/API event model for report lifecycle events.
5. SCIM provisioning for enterprise identity lifecycle management.

## Environment Plan

Recommended:

- Development: disposable Supabase project for schema and UI testing.
- Staging: persistent Supabase project with sanitized test data and GitHub Pages preview or staging path.
- Production: locked Supabase project and production GitHub Pages deployment.

Each environment should use its own Supabase URL and anon key. No production database password should be stored in the repository.

## Backup And Restore

Recommended:

- Use Supabase-managed backups when available for the selected tier.
- Export schema after each production migration.
- Keep `supabase-timesheets-schema.sql` current with the live database.
- Test restore into a non-production project before relying on the process.
- See [Backup And Restore Plan](backup-restore-plan.md) for the current free-tier restore approach.

## Handoff Documents

- [Security Policy](../SECURITY.md)
- [RLS Policy Summary](rls-policy-summary.md)
- [Backup And Restore Plan](backup-restore-plan.md)
- [Environment Strategy](environment-strategy.md)

## Onboarding Checklist

1. Configure Supabase URL and anon public key.
2. Apply `supabase-timesheets-schema.sql`.
3. Configure Auth redirect URLs.
4. Add allowed email domains.
5. Add branches and divisions.
6. Add projects and task codes.
7. Add project managers.
8. Configure approval chains.
9. Invite initial users.
10. Validate RLS with resource, manager, and Portfolio Manager accounts.

## Product Packaging Gaps

Recommended next product items:

- in-app getting-started checklist for Portfolio Managers
- sample/demo data mode
- release notes/changelog
- support/contact path inside the app
- implementation guide for enterprise architecture review
