# Phase 3 — Backend notes

## Setup (first time)

```bash
cd server
npm install
cp ../.env.example .env        # then edit DATABASE_URL to your local Postgres
npm run prisma:generate
npm run prisma:migrate         # creates the actual tables from schema.prisma
npm run prisma:seed            # roles, permissions, admin user, subscription types, settings
npm run dev                    # starts on http://localhost:4000
```

Default login after seeding: **`admin` / `Admin@12345`** — change it immediately via
`POST /api/auth/change-password` (a "force password change on first login" UI flow
belongs in Phase 4/5, this endpoint already exists to support it).

## API surface delivered in this phase

| Method | Path | Permission required |
|---|---|---|
| POST | `/api/auth/login` | — |
| GET | `/api/auth/me` | logged in |
| POST | `/api/auth/change-password` | logged in |
| GET/POST/PATCH | `/api/users` | `users.manage` |
| GET/POST/PATCH/DELETE | `/api/members` | `members.view/create/update/delete` |
| POST | `/api/members/:id/photo` | `members.update` |
| GET/POST/PATCH/DELETE | `/api/subscription-types` | read: any logged-in user · write: `subscriptiontypes.manage` |
| GET | `/api/subscriptions/expiring-soon` | `subscriptions.manage` |
| GET | `/api/subscriptions/member/:memberId` | `subscriptions.manage` |
| POST | `/api/subscriptions/member/:memberId/renew` | `subscriptions.manage` |
| GET | `/api/payments` | `payments.view` |
| GET | `/api/payments/today-summary` | `payments.view` |
| GET | `/api/dashboard/stats` | `dashboard.view` |
| GET | `/api/health` | — (no auth, used for a desktop "is the local server up" check) |

Every response follows one shape (`ApiResponse`): `{ success, statusCode, message, data, meta? }`.
Every error follows one shape (`error.middleware.js`): `{ success: false, statusCode, message, details? }`.

## Permission keys seeded

`users.manage`, `members.view`, `members.create`, `members.update`, `members.delete`,
`subscriptiontypes.manage`, `subscriptions.manage`, `payments.view`, `dashboard.view`

Default roles: **Owner** (all), **Manager** (all except `users.manage`),
**Receptionist** (members + subscriptions + payments + dashboard, no admin),
**Coach** (`members.view`, `dashboard.view` only — expands in Phase 5 once
workout/diet plan routes exist).

## Validated in this sandbox

- Every file passes `node --check` (syntax).
- The full `require()` graph resolves with zero missing/mistyped imports —
  verified by loading `app.js` against a stubbed Prisma client (this sandbox's
  network policy blocks Prisma's engine binary download, so a live DB
  connection can't be tested here — that will be the first thing to verify
  on your machine after `npm run prisma:migrate`).
- Live HTTP checks against the running app confirmed: `/api/health` → 200,
  an unknown route → 404 with the correct Arabic error body, and an
  unauthenticated request to `/api/members` → 401 *before* reaching the
  controller — i.e. the auth middleware is actually wired into the route
  chain, not just present in the file.

## Deliberate decisions worth flagging

- **`member.service.js`'s status filter is computed in application code**,
  not a raw SQL `WHERE`, because "active/expired" isn't a stored column —
  documented in the file itself with the performance tradeoff and the exact
  condition under which you'd want to revisit it.
- **A member's first subscription + first payment + first weight log are
  created in one Prisma `$transaction`** inside `member.service.create()` —
  if any piece fails, nothing is half-written.
- **`multer` pinned to `^2.0.0`**, not the commonly-copy-pasted `1.x` line,
  which has known patched vulnerabilities.

## Deferred to Phase 5 (per your own phase plan)

Attendance/check-in, Coaches + Workout/Diet plans, Weight history + Measurements
endpoints, Products/Inventory/POS Sales, Expenses, Notifications, Settings CRUD,
Reports/Charts, Export (PDF/Excel), Backup/Restore. These follow the exact same
controller → service → route pattern established here.
