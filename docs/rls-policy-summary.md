# RLS Policy Summary

This document summarizes the row-level security intent for Cadmus Resource Reporting. The database policies in `supabase-timesheets-schema.sql` are the source of truth.

## Core Principle

The browser uses the Supabase anon public key, so every sensitive action must be authorized by Supabase Row Level Security. UI checks improve the experience, but RLS controls access.

## Reference Data

Authenticated users can read active setup records needed to operate the app:

- projects
- project managers
- branches
- divisions
- task codes
- approval chains
- active business calendar days

Portfolio Managers can manage these setup records.

## Profiles

Users can create and update their own profile when their email domain is allowed. Portfolio Managers can administer user profiles, including role, project, manager, branch, division, and active status.

Managers can read profiles in their direct manager scope or approval-chain scope so they can review submitted work.

## Weekly Reports

Resources can create, save, submit, and withdraw their own weekly reports while the report is in an editable state.

Submitted, pending-final, and approved reports are locked from normal resource editing. Sent-back reports are editable so the resource can correct and resubmit.

Managers can approve or send back reports in their scope. Final approval is limited to the final approver when an approval chain requires it, unless the actor is a Portfolio Manager.

## Daily Report Lines

Resources can insert, update, or delete daily report lines only when the related weekly report is editable for them.

Reviewers can read daily report lines only when the related weekly report is within their manager or approval-chain scope.

## Adjustment Requests

Resources can request an adjustment only for their own approved weekly report.

Reviewers in scope can approve or reject open adjustment requests. When approved, the report is moved into the sent-back state so the resource can make the correction and resubmit.

Adjustment decisions are recorded in both `timesheet_adjustment_requests` and `timesheet_report_audit`.

## Notification Queue

Notification records are queued for workflow events such as submission, approval, rejection, and adjustment decisions. These records do not send email by themselves; they provide an integration-ready queue for a future Edge Function, webhook, or manual export process.

Users and reviewers can see notification records tied to their own work or review scope. Portfolio Managers can manage notification records.

## Audit Tables

Report lifecycle audit records are readable by the report owner, in-scope reviewers, and Portfolio Managers.

Admin audit records are readable and creatable by Portfolio Managers only.

## Known Hardening Opportunities

- Optimize RLS policies to use Supabase's recommended `select auth.uid()` pattern for better scale.
- Consolidate overlapping permissive policies where practical.
- Add automated policy tests for resource, manager, final approver, and Portfolio Manager accounts.

