# Phase 4 — Frontend connected to the backend

## What changed structurally

- `client/pages/index.html` — the same visual dashboard as before, now with
  **zero embedded data or business logic**. Every script tag is an external,
  single-purpose file.
- `client/pages/login.html` — new. Required because the backend now enforces
  JWT auth on every route; there was no login concept in the static prototype.
- `client/js/core/` — `http.js` (the *only* place `fetch()` is called anywhere
  in the client), `auth.js` (session storage + route guard + permission
  checks), `toast.js`, `format.js`.
- `client/js/api/` — one file per backend resource (`membersApi.js`,
  `authApi.js`, `subscriptionTypesApi.js`, `subscriptionsApi.js`,
  `paymentsApi.js`, `dashboardApi.js`). Each is a thin wrapper; no logic lives
  here beyond shaping the request.
- `client/js/views/` — `dashboard.js`, `members.js` render real screens from
  live API data. `placeholder.js` renders an honest "not connected yet" state
  for Weight Tracking / POS / VIP, since their backend endpoints don't exist
  until Phase 5 — no fake arrays were kept around to fake it.
- `client/js/app.js` — bootstrap only: auth guard, nav switching, clock,
  debounced global search, current-user display.

## Every dashboard number now comes from the database

`GET /api/dashboard/stats` is the single source for the 3 stat cards and the
expiring-subscriptions table — `dashboard.js` contains no arithmetic beyond
formatting. Same for the members table: pagination, search, and status
filtering are all real query parameters sent to `GET /api/members`.

## Small, functionality-required UI changes (not a redesign)

- **Add-member modal**: the old free-text "end date" field is gone — the
  backend computes `endDate` from the chosen subscription type's duration,
  so asking for it manually would let the two disagree. A "payment method"
  field was added, since creating a member now creates a real `Payment` row.
- **Subscription type is now a live dropdown** fetched from
  `/api/subscription-types`, not a hardcoded 3-option `<select>`.
- **A renew modal replaced the old one-click renew button** — renewing now
  requires picking a subscription type and payment method, because it
  creates a real `Subscription` + `Payment` pair server-side.
- **Pagination controls were added** to the members table (prev/next + page
  label) since the API paginates by default — this is exactly the kind of
  "functionality requires it" change your instructions allowed for.

## Validated in this sandbox

- Every client JS file passes `node --check`.
- Every `getElementById()` call in every JS file was cross-checked against
  actual `id` attributes in both HTML files — zero mismatches.
- Every inline `onclick`/`onsubmit`/`oninput` handler in the HTML was
  cross-checked against actual function definitions — zero missing handlers.
- Sidebar `data-view` values and `view-*` section ids were diffed — exact match.
- **Live end-to-end test**: loaded the real `auth.js` + `http.js` + `api/*.js`
  files in Node against a mock server that returns the exact `ApiResponse`
  shape the real backend does, and exercised: login → token storage →
  authenticated dashboard fetch → paginated members fetch → subscription
  types fetch → a wrong-password attempt correctly surfacing the backend's
  own Arabic error message through the shared error path. All five passed.

## What's still a placeholder, and why

Weight Tracking, POS/Revenue, and VIP show a clear "قيد الربط بالخادم" state
instead of any data. Their backend endpoints (`WeightLog`, `Measurement`,
`Product`, `Sale`, `Coach`, `WorkoutPlan`, `DietPlan`) don't exist yet — that's
explicitly Phase 5 in your own plan. Nothing here fakes it in the meantime.
