# Cadmus Project Management

Static business site for Cadmus Project Management, ready for GitHub Pages.

## Cadmus Resource Reporting

The timesheet and portfolio reporting app lives at `/timesheets/`. It is a static frontend backed by Supabase and uses only the Supabase project URL plus anon public key in browser-delivered configuration.

Enterprise handoff notes are maintained in [docs/cadmus-resource-reporting-enterprise-readiness.md](docs/cadmus-resource-reporting-enterprise-readiness.md).

Supporting operations documents:

- [Security policy](SECURITY.md)
- [RLS policy summary](docs/rls-policy-summary.md)
- [Backup and restore plan](docs/backup-restore-plan.md)
- [Environment strategy](docs/environment-strategy.md)

## Deployment

GitHub Pages should serve this repository from the root of the default branch.

Custom domain:

```txt
cadmusprojects.com
```

DNS records for Porkbun:

```txt
A     @     185.199.108.153
A     @     185.199.109.153
A     @     185.199.110.153
A     @     185.199.111.153
CNAME www   <github-username>.github.io
```
