# نبض — Gym Management System — Project Architecture (Phase 1)

This document explains the purpose of every folder. No business logic is
implemented yet — this is the skeleton Phase 2+ will fill in.

```
gms-production/
├── client/                        # Frontend — your existing prototype, restructured
│   ├── public/                    # Static assets served as-is (favicon, logos)
│   │   └── img/                   # Member photo placeholders, brand assets
│   ├── pages/                     # HTML entry points: index.html, login.html
│   ├── css/                       # style.css (unchanged from prototype) + any new screens' styles
│   └── js/
│       ├── api/                   # One file per resource: membersApi.js, subscriptionsApi.js,
│       │                          # attendanceApi.js, posApi.js, weightApi.js, authApi.js...
│       │                          # Each wraps fetch() + attaches JWT + handles errors.
│       │                          # This is the ONLY layer allowed to talk to the network —
│       │                          # replaces every direct localStorage call from the prototype.
│       ├── views/                 # Render functions per screen (dashboard.js, members.js,
│       │                          # weight.js, pos.js, vip.js, attendance.js, settings.js...)
│       │                          # Pulled almost verbatim from your current app.js,
│       │                          # but data now comes from api/ instead of in-memory arrays.
│       ├── core/                  # Shared helpers: toast.js, modal.js, auth-guard.js,
│       │                          # router.js (view switching), format.js (dates/currency)
│       └── app.js                 # Bootstraps the SPA: auth check → load view → wire nav
│
├── server/                        # Backend — Node.js + Express, MVC + service layer
│   └── src/
│       ├── config/                # db.js (Prisma client singleton), env.js, cors.js, constants.js
│       ├── controllers/           # Thin — parse request, call a service, shape the response.
│       │                          # e.g. member.controller.js, subscription.controller.js
│       ├── services/              # ALL business logic lives here (the "real" MVC gap-filler).
│       │                          # e.g. calculating "days until expiry", recording a renewal
│       │                          # payment, computing today's revenue. Controllers stay dumb;
│       │                          # services are unit-testable and reusable across routes.
│       ├── routes/                # Express routers — map HTTP verb+path to a controller method.
│       │                          # e.g. member.routes.js → GET/POST/PUT/DELETE /api/members
│       ├── middlewares/           # auth.middleware.js (JWT verify), role.middleware.js (RBAC),
│       │                          # error.middleware.js (centralized error handler),
│       │                          # upload.middleware.js (multer config for images)
│       ├── validators/            # Request schema validation (one per resource) — rejects
│       │                          # bad input before it ever reaches a service/DB call
│       └── utils/                 # jwt.util.js, pagination.util.js, response.util.js,
│                                   # logger.util.js
│   ├── uploads/                   # Local disk storage for uploaded images (dev/self-hosted mode)
│   │   ├── members/               # Member profile photos
│   │   └── products/               # POS product images
│   └── logs/                      # Rotating request/error logs (e.g. via winston)
│
├── prisma/
│   ├── schema.prisma              # Single source of truth for the DB schema (Phase 2)
│   ├── migrations/                # Auto-generated, version-controlled SQL migrations
│   └── seed.js                    # Optional: seeds an admin user + default subscription types
│                                   # (replaces the old localStorage seedInitialData())
│
├── electron/
│   ├── main.js                    # Electron main process: creates the window, loads client/,
│   │                              # optionally spawns/points to the Express server
│   ├── preload.js                 # Secure bridge between renderer (client/) and main process
│   │                              # (e.g. for native file dialogs used in Export/Backup)
│   └── build/                     # electron-builder config, icons, installer assets
│
├── .env.example                   # DATABASE_URL, JWT_SECRET, PORT, etc.
├── package.json                   # Root scripts: dev, build, package (electron-builder)
└── README.md
```

## Why this shape

- **`client/` never imports server code and never touches Prisma directly.** It only
  speaks HTTP to `server/`, through the `api/` layer. This is what lets the exact
  same `client/` run either inside Electron or in a normal browser during development.
- **`controllers → services → prisma` is the MVC + service-layer pattern.** Controllers
  never contain business rules; that keeps routes thin, testable, and easy to reuse
  (e.g. the same "renew subscription" service can be called from an API route today
  and from a scheduled job later).
- **`middlewares/` centralizes cross-cutting concerns** (auth, error shape, file
  upload) so controllers stay focused on one resource each.
- **`electron/` is isolated from both `client/` and `server/`.** It's a thin shell:
  its only job is packaging and native OS integration (installer, auto-update,
  window management) — never business logic.

## Open decision before Phase 2

Per the note above: **central Postgres server vs. bundled local Postgres per machine.**
I'm proceeding with the schema design in Phase 2 assuming a central/remote Postgres
reachable via `DATABASE_URL`, since that's the architecture that scales to a
commercial, multi-branch product. Let me know if you want fully offline/bundled
Postgres instead — it changes the Electron packaging step in Phase 6 significantly.
