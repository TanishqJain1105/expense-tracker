# What we're doin

A running changelog of changes made to this repo.

## 2026-11-13 — Remove leftover theme-demo dashboard

Deleted:
- `app/(dash)/app1/page.tsx` — the `/app1` demo route
- `components/ui/app-1.tsx` — demo dashboard component (only imported by that page)
- `app/globals.css.backup` — stray backup file
- `components/Dashboard.tsx` — dead code; nothing imported it (`app/(dash)/page.tsx` uses `ExpenseDashboard`)
- `components/ui/revenue-charts-kpi.tsx` — only importer was `Dashboard.tsx`

Edited:
- `components/ui/app-1-utils/app-1-sidebar.tsx` — removed the "Theme demo" nav item
  pointing at `/app1`, plus the now-unused `LayoutTemplate` icon import
- `components/ui/app-1-utils/app-1-data.ts` — pruned to the only still-used exports
  (`App1Person`, `app1User`); dropped the demo chart/project/activity data and the
  `ChartConfig` import

Kept: `app/(dash)/dashboard/page.tsx` (redirect to `/`), `app-1-utils/sidebar.tsx`,
`app-1-utils/app-1-sidebar.tsx`. The `app1`/`App1` names on the remaining shared
sidebar files were left alone — renaming them was not trivially safe.

Verified: repo-wide grep for `app1`/`App1`/`app-1` shows no dangling imports;
`npx tsc --noEmit` passes; `npm run build` succeeds (`/app1` no longer in the route list).
