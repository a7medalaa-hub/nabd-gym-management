# Phase 2 — Schema notes

## Entities (24 models, 6 enums)

Access control: `User`, `Role`, `Permission`, `RolePermission`
Members: `Member`
Subscriptions/money: `SubscriptionType`, `Subscription`, `Payment`
Attendance: `Attendance`
Coaching: `Coach`, `WorkoutPlan`, `WorkoutPlanDay`, `WorkoutExercise`, `DietPlan`, `DietMeal`
Progress tracking: `WeightLog`, `Measurement`
Commerce: `Product`, `InventoryTransaction`, `Sale`, `SaleItem`
Finance: `Expense`
Ops: `Notification`, `Setting`

## Key relationships
- `Member 1—N Subscription N—1 SubscriptionType` — a member's history of purchased plans, each snapshotting `priceAtPurchase` so later price changes to a `SubscriptionType` never rewrite history.
- `Member 1—N Payment`, optionally linked to a `Subscription` — every money-in event tied to a member.
- `Sale 1—N SaleItem N—1 Product`, `Sale N—1 Member?` — POS invoices; member link is optional to allow walk-in sales.
- `Product 1—N InventoryTransaction` — full audit trail of stock in/out/adjustment/sale, instead of just a mutable `stockQuantity` counter.
- `Member 1—N WorkoutPlan N—1 Coach`, `WorkoutPlan 1—N WorkoutPlanDay 1—N WorkoutExercise` — same for `DietPlan → DietMeal`.
- `Role N—N Permission` via `RolePermission` — real RBAC, not a hardcoded role string.

## Indexing rationale
- `Subscription.endDate` — the dashboard's "expiring soon" query filters/sorts on this constantly.
- `Payment.createdAt`, `Sale.createdAt` — both power "today's revenue" aggregation.
- `Member.phone` unique — phone is the natural lookup key at the front desk (matches the prototype's quick-search).
- `Attendance(memberId, checkInAt)` composite — supports both "this member's history" and "who's checked in today" queries efficiently.

## Deliberate simplifications (documented, not accidental)
- `WorkoutPlanDay.dayLabel` and `DietMeal.mealName` are free-text strings, not enums — the prototype already uses natural Arabic labels ("السبت", "ما قبل التمرين") and coaches should be able to phrase plans freely.
- `WorkoutExercise` exists but the MVP UI can leave it unused (relying on `WorkoutPlanDay.notes` instead) — the table is there so per-exercise set/rep tracking can be switched on later with zero schema migration.
- `Expense.category` is free text, not an enum, so gym owners aren't locked into a fixed category list.

## Still open for Phase 3
- Exact `Permission` key list (e.g. `members.create`, `pos.sell`, `reports.view`) and default `Role` seed data (Owner/Manager/Receptionist/Coach) — will be defined alongside the auth middleware, since permissions should be designed against the actual routes they gate.
