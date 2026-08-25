# Environment Strategy

Cadmus Resource Reporting is currently built as a static GitHub Pages app backed by Supabase.

## Current State

The production site is served from GitHub Pages. The timesheet frontend reads Supabase configuration from:

```text
assets/timesheets-config.js
```

This file may contain the Supabase Project URL and anon public key. It must not contain database passwords, service role keys, or other privileged secrets.

## Recommended Environments

Use separate Supabase projects for each environment once the app moves beyond lightweight internal use.

Development:

- used for schema experiments and local UI work
- may contain disposable or synthetic data
- safe place to test migrations before touching production

Staging:

- mirrors production configuration
- uses sanitized test data
- validates release candidates and RLS behavior

Production:

- contains live labor records
- restricted admin access
- documented backup and restore process
- approved Auth redirect URLs only

## Configuration Rules

Each environment should have its own:

- Supabase Project URL
- Supabase anon public key
- Auth redirect URLs
- allowed domains
- seed/setup data

No frontend environment should use:

- database password
- Supabase service role key
- personal access token
- SMTP credential
- payroll/accounting credential

## Release Flow

Recommended release sequence:

1. Commit the code and schema changes.
2. Apply schema changes to development.
3. Validate key workflows.
4. Apply schema changes to staging.
5. Validate with realistic users and role combinations.
6. Apply schema changes to production.
7. Push the frontend deployment.
8. Record the release in a changelog.

## Enterprise Direction

For enterprise review, keep environment separation explicit even if only one live environment exists today. The important story is that the app is already structured to separate public frontend config from privileged backend operations.

