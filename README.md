# Columbarium Backend

NestJS API for the Columbarium project: PostgreSQL (Prisma), JWT auth, and email verification (SMTP).

## Requirements

- **Node.js** (latest LTS recommended, e.g. 20.x or 22.x)
- **PostgreSQL**
- SMTP server or credentials (for verification emails)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_*` – PostgreSQL connection
   - `JWT_SECRET` – long random string (e.g. 32+ chars) for signing tokens
   - `SMTP_*` – SMTP host, port, user, password, and from address
   - `APP_FRONTEND_URL` – base URL of your frontend (used in verification links)

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Database**

   Create a PostgreSQL database named `columbarium` (or the value of `DATABASE_NAME`).  
   Apply the schema with Prisma:

   ```bash
   npm run db:push
   # or use migrations: npm run db:migrate
   ```

4. **Run**

   ```bash
   # Development (watch mode)
   npm run start:dev

   # Production build
   npm run build
   npm run start:prod
   ```

   API base URL: `http://localhost:3000/api` (or your `PORT`).

## API (Auth)

Base path: `/api`.

| Method | Path             | Description                    | Body / Query                    |
|--------|------------------|--------------------------------|---------------------------------|
| POST   | `/auth/sign-up`  | Register (sends verification)  | `{ "email", "password" }`       |
| POST   | `/auth/sign-in`  | Sign in (returns JWT)           | `{ "email", "password" }`       |
| GET    | `/auth/verify-email` | Verify email (link click)  | Query: `?token=<token>`         |
| POST   | `/auth/verify-email` | Verify email (from frontend) | `{ "token" }`                   |
| GET    | `/auth/profile`  | Current user (JWT required)    | Header: `Authorization: Bearer <token>` |

### Sign-up

- Creates user and sends verification email (SMTP).
- User must verify email before signing in.
- Verification link: `{APP_FRONTEND_URL}/verify-email?token={token}` (you can also point the link to the backend: `GET /api/auth/verify-email?token={token}`).

### Sign-in

- Returns `{ "access_token", "user": { "id", "email" } }`.
- Fails with `401` if email is not verified.

### Protected routes

Send the JWT in the header:

```http
Authorization: Bearer <access_token>
```

## Project structure

- `src/config` – env validation and configuration
- `src/prisma` – PrismaService (DB client)
- `prisma/schema.prisma` – Prisma schema (User, EmailVerificationToken)
- `src/users` – UsersService (uses Prisma)
- `src/auth` – sign-up, sign-in, JWT, email verification (strategies, guards, DTOs)
- `src/email` – SMTP email service (Nodemailer)

## Scripts

- `npm run start` – start once
- `npm run start:dev` – start with watch
- `npm run build` – build for production
- `npm run start:prod` – run built app
- `npm run db:generate` – generate Prisma client
- `npm run db:push` – push schema to DB (no migrations)
- `npm run db:migrate` – run Prisma migrations
- `npm run db:studio` – open Prisma Studio
- `npm run lint` – run ESLint
- `npm run test` – unit tests
- `npm run test:e2e` – e2e tests

## License

UNLICENSED
# columbarium-backend
