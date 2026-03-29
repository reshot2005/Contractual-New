# Contractual.pro

A premium marketplace connecting high-tier freelancers with innovative businesses.

## Project Overview
Contractual.pro is a professional platform designed to facilitate secure contracts, verified payments, and elite gig opportunities. This repository contains the complete monorepo for the project.

## Folder Structure
- `frontend/` - Everything user sees. Next.js app, UI components, frontend API routes.
- `backend/` - Database and schema. Prisma configuration, migrations, and seed scripts.

## Tech Stack
- Frontend: Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui
- Backend: PostgreSQL, Prisma ORM
- Auth: NextAuth.js
- Real-time: Socket.io / Pusher
- File Uploads: UploadThing

## Getting Started

1. Install dependencies:
   ```bash
   # From root
   pnpm install
   ```

2. Environment Variables:
   Copy `.env.example` to `.env` in the root and configure values.
   Copy the respective variables to `frontend/.env.local` and `backend/.env`.

3. Database Setup:
   ```bash
   # From root
   npm run db:push
   npm run db:generate
   ```

4. Start Development Server:
   ```bash
   # From root
   npm run dev
   ```

## Deployment Guide

### Vercel (Frontend)
- Root Directory: `frontend`
- Build Command: `npm run build`
- Install Command: `npm install`
- Environment Variables: Setup from `.env.local`

### Render (Backend / Database)
- Contractual.pro utilizes Render solely for hosting the PostgreSQL database instance. No server code is deployed to Render. Ensure the `DATABASE_URL` is configured correctly on the Vercel app.

## Admin Access
Admin routes are protected. To access `/workspace-admin`, use the configured `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` values from the `.env` file.
# Contractual-New-Prod-FInal
