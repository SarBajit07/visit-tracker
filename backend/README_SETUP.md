Setup (backend) — PostgreSQL

Prerequisites:
- Install PostgreSQL locally or provide a managed DB (we can switch to Supabase later).
- Optionally use pgAdmin to create the database and manage users.

From `backend/` run:

```bash
npm install
npx prisma generate
# Ensure DATABASE_URL in `.env` points to your Postgres DB (see example in `.env`).
npx prisma migrate dev --name init

# start server in dev
npm run dev
```

If using pgAdmin: create a new database (e.g. `office_visit_tracker`), then set `DATABASE_URL` accordingly.

For production, do NOT commit `.env`. Use your host's secrets manager (Render, Railway, Heroku, or Supabase secrets).

Attachments (local dev)
- The server exposes uploaded files at `/uploads/<filename>`.
- By default uploads are stored in `backend/uploads/`. Ensure this folder exists (a `.gitkeep` is added).
- Set `STORAGE_PROVIDER=local` in `.env` for local disk uploads. For production (Render) use S3/R2 and set `STORAGE_PROVIDER=s3` and the required S3 env vars.
