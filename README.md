# Laundry Service API

Backend API for managing multi-outlet laundry operations built with Express.js, Prisma, and PostgreSQL.

## Features

- Auth with JWT access/refresh tokens and bcrypt password hashing
- Outlet-scoped RBAC (SUPERADMIN, ADMIN, CASHIER, COURIER)
- Customer, service, voucher, order, payment, and reporting modules
- Centralized validation (zod) and error handling
- Swagger docs served at `/docs`
- Pino logging, Helmet, CORS, and rate limiting middleware
- Prisma schema targeting Neon PostgreSQL with seed data
- Vitest + Supertest test suite (integration tests run when `DATABASE_URL` is configured)

## Getting Started

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run dev
```

Swagger UI: http://localhost:4000/docs

### Environment Variables

See `.env.example` for all required configuration.

### Database (Neon)

Use a Neon pooled connection string. Example:

```
postgres://<user>:<password>@<neon-host>/<db>?sslmode=require&pgbouncer=true&connect_timeout=15
```

### Useful Scripts

- `npm run dev` – start development server with ts-node
- `npm run build` / `npm run start` – build with tsup and run compiled server
- `npm run prisma:migrate` – run Prisma migrations
- `npm run prisma:seed` – seed initial data (creates superadmin, outlets, services, voucher, etc.)
- `npm test` – run Vitest suite (skips integration tests when `DATABASE_URL` is unset)

## Example Requests

```bash
# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"superadmin@laundry.test","password":"SuperSecure123!"}'

# Create customer
curl -X POST http://localhost:4000/api/v1/customers \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jane Doe","phone":"+628777777777","email":"jane@example.com"}'

# Create order
curl -X POST http://localhost:4000/api/v1/orders \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{
        "outletId":"<OUTLET_ID>",
        "customerId":"<CUSTOMER_ID>",
        "items":[{"serviceId":"<SERVICE_ID>","qty":2}],
        "voucherCode":"DISC10"
      }'

# Add payment
curl -X POST http://localhost:4000/api/v1/orders/<ORDER_ID>/payments \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"method":"cash","amount":50000}'
```

## Deployment Notes

1. Provision a Neon PostgreSQL project and create a pooled connection string.
2. Configure environment variables (`DATABASE_URL`, JWT secrets, CORS origins, etc.).
3. Run migrations and seed data:
   ```bash
   npm install --production
   npx prisma migrate deploy
   npm run prisma:seed
   ```
4. Build the application (`npm run build`) and run with `npm start` or deploy via a process manager (PM2, systemd, etc.).
5. Ensure the hosting platform forwards the `X-Forwarded-*` headers if behind a proxy (Express `trust proxy` is enabled).

## Testing

Integration tests require a dedicated Postgres database. Set `DATABASE_URL` to a test database before running:

```bash
DATABASE_URL="postgres://..." npm test
```

When `DATABASE_URL` is not provided the integration suite is skipped automatically.
