# Security Policy

## Scope

This policy covers the Cadmus Project Management static site and the Cadmus Resource Reporting app at `/timesheets/`.

## Frontend Secrets

The timesheet app is designed for GitHub Pages and must only expose:

- Supabase Project URL
- Supabase anon public key

Never place database passwords, service role keys, personal access tokens, SMTP credentials, or other privileged secrets in frontend files. Browser-delivered configuration lives in `assets/timesheets-config.js` and must remain limited to public Supabase client configuration and non-secret workflow settings.

## Data Access Model

Supabase Row Level Security is the authority for application access. The frontend hides controls by role for usability, but every protected read/write must be enforced by database policy.

Current roles:

- `resource`: manages their own profile and weekly reports.
- `manager`: reviews reports assigned directly or through approval-chain scope.
- `admin`: Portfolio Manager access for setup, user administration, reporting, and audit review.

## Audit Requirements

Labor record events are written to `timesheet_report_audit`. Administrative setup and access changes are written to `timesheet_admin_audit`.

Audit records should be treated as operational evidence. Do not edit or delete audit records through the application.

## Authentication

Supabase Auth is used for sign-in. Allowed email domains are managed in `timesheet_allowed_domains`.

Recommended production settings:

- enable leaked password protection
- require strong passwords
- configure redirect URLs only for approved app URLs
- review session duration and refresh-token behavior before enterprise rollout
- prefer Microsoft Entra ID SSO when available

## Reporting Vulnerabilities

Report suspected security issues to the Cadmus project owner or Portfolio Manager responsible for this deployment. Do not include passwords, service role keys, or user personal data in issue reports unless a secure transfer path has been established.

