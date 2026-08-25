# Backup And Restore Plan

This plan is written for the current GitHub Pages plus Supabase deployment model.

## Current Restore Points

The application code and schema are versioned in Git. Each meaningful production change should be committed before deployment.

The active schema file is:

```text
supabase-timesheets-schema.sql
```

After a production schema change, keep that file aligned with the live Supabase project.

## Free-Tier Operating Model

Supabase free-tier projects do not provide the same managed backup and point-in-time recovery posture expected in a paid production environment. For the current model, use manual restore points:

- commit and push the repository before each deployment
- export or preserve the SQL schema after each database change
- export important operational data before large changes
- test schema changes on a separate project when risk is meaningful

## Manual Backup Checklist

Before a production-impacting change:

1. Confirm `git status` is clean or commit the current work.
2. Save the current schema state.
3. Export key tables when data loss risk exists.
4. Record the Supabase project reference and migration name.
5. Apply the change.
6. Verify app load, RLS behavior, and critical workflows.

Recommended key tables:

- `timesheet_profiles`
- `timesheet_projects`
- `timesheet_project_managers`
- `timesheet_tasks`
- `timesheet_weekly_reports`
- `timesheet_daily_reports`
- `timesheet_report_audit`
- `timesheet_admin_audit`
- `timesheet_adjustment_requests`
- `timesheet_calendar_days`

## Restore Approach

For a schema-only restore:

1. Create or select a Supabase project.
2. Apply `supabase-timesheets-schema.sql`.
3. Configure Auth redirect URLs.
4. Confirm RLS is enabled on timesheet tables.
5. Reconnect the frontend config to the restored project URL and anon key.

For a data restore:

1. Restore parent/reference tables first.
2. Restore user/profile records with care because profiles reference Supabase Auth users.
3. Restore weekly reports before daily reports.
4. Restore audit records after report records.
5. Validate counts and sample user access.

## Paid-Tier Recommendation

Before enterprise production use, move the Supabase project to a tier that supports stronger backup guarantees. Enterprise reviewers will expect documented recovery point objectives, recovery time objectives, and tested restore procedures.

