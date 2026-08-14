# Technical Requirements Document
### Field Sales Visit Tracker — Office Visit CRM Dashboard

*Prepared for: Sarbajit Timalsina | Version 1.0 | Date: August 14, 2026*

---

## 1. Overview

This document defines the requirements for a personal, single-user web application used to track offline sales and marketing visits to offices for a SaaS product. The system replaces manual note-taking with a structured dashboard that records every visit, tracks follow-ups, and surfaces conversion insights over time.

## 2. Objectives

- **Fast field capture** — Log every office visit with contact details, status, and notes, in under a minute from a phone.
- **Follow-up discipline** — Never lose a lead due to a missed follow-up date.
- **Visit history** — See visit history per office instead of a single overwritten record.
- **Pipeline visibility** — View conversion trends (interested → converted) over weeks/months.
- **Future-proofing** — Architecture supports adding sales reps and roles without a rebuild.

## 3. Scope

### 3.1 In Scope
- Single admin login (JWT-based, httpOnly cookie).
- Office and visit CRUD with full visit history per office.
- Status pipeline, priority tagging, and follow-up reminders.
- Geolocation capture and map view of visited offices.
- File attachment (business card / photo) per visit.
- Dashboard analytics (visit counts, conversion rate, today's follow-ups).
- CSV/Excel export of visit data.
- Mobile-first, installable PWA for use in the field.

### 3.2 Out of Scope (v1)
- Multi-user roles and permissions (planned for v2 — schema allows for it via `user_id`).
- Automated email/SMS follow-up notifications (v2 candidate).
- Payment or billing integration.

## 4. User Roles

v1 has a single role: **Admin** (the salesperson). No signup flow is needed — the admin account is seeded directly in the database. The schema still models a `user_id` foreign key on every record so a team mode can be added later without a data migration.

## 5. Functional Requirements

### 5.1 Authentication
- Login with email + password against a single seeded admin account.
- JWT issued on login, stored in an httpOnly, secure cookie.
- Protected API routes verify the JWT via middleware; unauthenticated requests return 401.
- Logout clears the cookie.

### 5.2 Office & Visit Management
- **Office creation** — Create a new office record (name, address, locality) the first time it's visited; subsequent visits link to the same office.
- **Visit logging** — Log a visit against an office: date, contact name, designation, contact number, status, priority, notes, product/pain-point tags, next follow-up date.
- **Location capture** — Auto-capture latitude/longitude via the browser Geolocation API at the time of logging, with manual override if permission is denied.
- **Attachments** — Attach a photo (business card, signage) to a visit, uploaded to object storage with the URL saved on the record.
- **Visit history** — View all visits for a given office as a timeline, most recent first.
- **Edit/delete** — Edit or delete a visit entry.

### 5.3 Status & Priority
- Status values: `Interested`, `Follow-up`, `Converted`, `Rejected`, `No Response`.
- Priority values: `Hot`, `Warm`, `Cold` — independent of status, used for sorting the follow-up queue.

### 5.4 Dashboard & Analytics
- **Follow-up widget** — "Today's Follow-ups" widget: offices where `next_followup_date` is today or overdue, sorted by priority.
- **Trend stats** — Visit count and conversion rate (converted ÷ total) by week and by month.
- **Status breakdown** — Simple chart showing count per status.
- **Map view** — Plots all visited offices using stored lat/long.

### 5.5 Search, Filter & Export
- Filter the visit list by status, priority, locality, and date range.
- Free-text search across office name and contact name.
- Export the filtered result set to CSV/Excel.

### 5.6 Mobile / Field Use
- Quick-add form optimized for one-handed phone use, reachable in two taps from the home screen.
- PWA install support with basic offline queueing — a visit logged with no signal is saved locally and synced when connectivity returns.

## 6. Data Model

PostgreSQL, accessed via **Prisma ORM** for type-safe queries and migrations. Four core tables plus one join-style attachment table, defined as a Prisma schema and migrated with `prisma migrate`.

### 6.1 `users`

| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| email | VARCHAR, UNIQUE | Login identifier |
| password_hash | VARCHAR | bcrypt hash |
| name | VARCHAR | |
| created_at | TIMESTAMP | Default now() |

### 6.2 `offices`

| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| name | VARCHAR | Office / company name |
| address | VARCHAR | Free text |
| locality | VARCHAR | Area, for filtering |
| latitude | DECIMAL | Captured on first visit |
| longitude | DECIMAL | Captured on first visit |
| created_at | TIMESTAMP | Default now() |

### 6.3 `visits`

| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| office_id | FK → offices.id | Cascade on delete |
| user_id | FK → users.id | Who logged it |
| visit_date | DATE | |
| status | ENUM | interested, follow_up, converted, rejected, no_response |
| priority | ENUM | hot, warm, cold |
| contact_name | VARCHAR | |
| contact_designation | VARCHAR | e.g. Owner, Receptionist |
| contact_number | VARCHAR | |
| interest_tags | TEXT[] / JSONB | Which product features they cared about |
| notes | TEXT | |
| next_followup_date | DATE | Nullable |
| latitude / longitude | DECIMAL | Captured at log time |
| created_at | TIMESTAMP | Default now() |

### 6.4 `visit_attachments`

| Column | Type | Notes |
|---|---|---|
| id | UUID / SERIAL | Primary key |
| visit_id | FK → visits.id | Cascade on delete |
| file_url | VARCHAR | Object storage URL |
| uploaded_at | TIMESTAMP | Default now() |

## 7. API Endpoints (REST)

| Method & Path | Description | Auth |
|---|---|---|
| POST /api/auth/login | Authenticate and set JWT cookie | Public |
| POST /api/auth/logout | Clear session cookie | Required |
| GET /api/offices | List offices (search/filter by locality) | Required |
| POST /api/offices | Create a new office | Required |
| GET /api/offices/:id | Office detail with visit timeline | Required |
| POST /api/visits | Log a new visit | Required |
| GET /api/visits | List visits (filter: status, priority, date range) | Required |
| PATCH /api/visits/:id | Edit a visit | Required |
| DELETE /api/visits/:id | Delete a visit | Required |
| POST /api/visits/:id/attachments | Upload attachment for a visit | Required |
| GET /api/dashboard/summary | Counts, conversion rate, today's follow-ups | Required |
| GET /api/export/visits.csv | Export filtered visits as CSV | Required |

## 8. Technology Stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | Next.js + Tailwind CSS | App Router; shadcn/ui for tables, forms, badges |
| Backend | Node.js + Express.js | REST API, JWT auth middleware |
| ORM | Prisma | Schema, migrations, and type-safe queries against PostgreSQL |
| Database | PostgreSQL | |
| File storage | Object storage (e.g. Cloudflare R2 / S3-compatible) | For visit attachments |
| Maps | LocationIQ or Geoapify | Consistent with prior geocoding choice on Nona-mart |
| Hosting | VPS with Docker Compose, or Render/Railway for a quick v1 | Matches existing deployment familiarity |

## 9. Non-Functional Requirements

- **Usability** — Mobile-first responsive layout; core flows usable one-handed on a phone.
- **Performance** — Quick-add visit form should load and be submittable in under 2 seconds on a typical mobile connection.
- **Security** — Passwords hashed with bcrypt; JWT in httpOnly, secure, sameSite cookies; all inputs validated server-side.
- **Offline support** — PWA manifest + service worker for installability and basic offline queueing of new visit entries.
- **Extensibility** — Schema designed so a user_id/role model can be extended to a multi-rep team without breaking changes.

## 10. Future Enhancements (v2+)

- Multi-user support with an Admin role that sees all reps' visits and a Rep role scoped to their own.
- Automated follow-up reminders via email or SMS.
- Lead scoring based on visit frequency and status progression.
- Integration with the SaaS product's own signup data to auto-mark an office as "Converted."
