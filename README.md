## AUTHENTICATION BACKEND

Authentication-focused NestJS backend using Prisma, PostgreSQL, JWT, Passport, and Google OAuth.

## Overview

This application provides:

- Email/password signup and login
- Google OAuth login
- Access and refresh token handling
- Protected user profile routes
- Prisma-powered persistence on PostgreSQL

The API is mounted under the `/api` prefix.

## Tech Stack

- NestJS 11
- Prisma 7
- PostgreSQL
- JWT authentication
- Passport strategies and guards
- Argon2 password hashing
- Cookie parsing and validation pipes

## Setup

1. Install dependencies.

	```bash
	npm install
	```

2. Create your local environment file.

	```bash
	cp .env.example .env
	```

3. Start the development database.

	```bash
	npm run db:dev:up
	```

4. Apply Prisma migrations.

	```bash
	npm run prisma:dev:deploy
	```

5. Start the app in development mode.

	```bash
	npm run start:dev
	```

By default, the server listens on `http://localhost:3000`.

## Environment Variables

Use `.env` for local development and `.env.test` for the test environment.

Required variables:

- `DATABASE_URL`
- `ACCESS_SECRET`
- `REFRESH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Docker Compose also uses:

- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `POSTGRES_PORT`

The test environment also expects:

- `GOOGLE_CALLBACK_URL`
- `NODE_ENV=test`

## Available Scripts

```bash
npm run start:dev      # Start Nest in watch mode
npm run start          # Start the app once
npm run build          # Build the project
npm run start:prod     # Run the compiled app from dist/
npm run lint           # Lint and fix TypeScript files
npm run format         # Format source and test files
npm run test           # Run unit tests
npm run test:cov       # Run tests with coverage
npm run test:e2e       # Run end-to-end tests
```

Database helpers:

```bash
npm run db:dev:up
npm run db:dev:rm
npm run db:dev:restart
npm run db:test:up
npm run db:test:rm
npm run db:test:restart
```

## API Endpoints

### Auth

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/google/callback`
- `GET /api/auth/refresh`
- `POST /api/auth/updatePassword`
- `GET /api/auth/logout`

### Users

- `GET /api/users/me`
- `PUT /api/users/update`

Most user routes are protected with the access token guard, and refresh-sensitive routes use the refresh token guard.

## Database

Prisma models include:

- `User`
- `Otp`
- `OAuthAccounts`

The schema stores refresh token hashes and supports cascading deletes for related authentication records.

## Testing

End-to-end tests use the test database defined in `.env.test`. The `pretest:e2e` script resets the test database and applies migrations before running the suite.

## Notes

- The app enables CORS with credentials.
- Global validation is enabled with whitelist stripping for DTOs.
- Cookies are parsed for authentication flows that rely on them.