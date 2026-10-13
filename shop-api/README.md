# Shop API: the whole company

A small but complete online-shop backend built with **NestJS 12 + Prisma 7 + PostgreSQL**. It puts together the pieces shown separately in the lessons, especially [Lesson 2: NestJS Fundamentals](../NestJS-Fundamentals.html).

> Think of a NestJS app as a company and each module as a department: Users, Orders, Payments. Each department has its own staff (services) and its own front desk (controllers). Staff are private by default. If the Orders department needs help from someone in Users, the Users department must **export** that person, and Orders must **import** the Users department. The `@Module()` decorator is the department's org chart. Nest reads all the org charts at startup and wires everyone together.

## The org chart

```
                         ┌──────────────────────────── AppModule (headquarters) ────────────────────────────┐
                         │  ConfigModule (handbook, global)   EventEmitterModule (announcement board)        │
                         │  PrismaModule  @Global  ── exports PrismaService (the filing room) to everyone    │
                         └──────────────────────────────────────────────────────────────────────────────────┘
   AuthModule (security desk)          UsersModule (HR)           ProductsModule (warehouse)
   imports UsersModule, JwtModule      exports UsersService       exports ProductsService
   registers the global guards              ▲      ▲                       ▲
            │                               │      │                       │
            └──────── imports ──────────────┘      │                       │
                                                   │                       │
                                   OrdersModule (sales) ── imports ────────┘
                                   imports UsersModule + ProductsModule, exports OrdersService
                                                   ▲
                                                   │ imports
                                   PaymentsModule (finance)
                                   provides PAYMENT_GATEWAY → FakePaymentGateway ("the bank")

   HR ── posts "user.deleted" on the announcement board ──▶ Sales listens and cancels that user's open orders
   (an event instead of an import, so Users never depends on Orders: no circular dependency)
```

| Company | Code | Where |
|---|---|---|
| Headquarters | `AppModule` | `src/app.module.ts` |
| Front door | `main.ts`: `/api` prefix, validation, helmet, CORS | `src/main.ts` |
| Filing room | `PrismaModule` / `PrismaService` (`@Global`) | `src/prisma/` |
| Company handbook | `ConfigModule` + `.env` checked at startup | `src/config/env.validation.ts` |
| Security desk | `AuthModule`, `JwtAuthGuard`, `RolesGuard`, `@Public`, `@Roles`, `@AdminOnly`, `@CurrentUser` | `src/auth/` |
| HR | `UsersModule` | `src/users/` |
| Warehouse | `ProductsModule` | `src/products/` |
| Sales | `OrdersModule` | `src/orders/` |
| Finance | `PaymentsModule` | `src/payments/` |
| Shared tools | middleware, exception filters, pipes, interceptors | `src/common/` |

## Run it

You need **Node.js 22.22.3+ or 24+** (the NestJS 12 CLI checks this) and **Docker**.

```bash
cp .env.example .env     # 1. settings (edit JWT_SECRET for anything beyond local practice)
npm install              # 2. packages (also generates the Prisma client)
npm run db:up            # 3. start PostgreSQL in Docker (host port 5433)
npm run db:migrate       # 4. create the tables (prisma migrate dev)
npm run db:seed          # 5. demo data: admin@shop.dev / an@shop.dev, password Password123!
npm run start:dev        # 6. http://localhost:3001/api, restarts on every save
```

Then open [`requests.http`](requests.http) in VS Code with the **REST Client** extension and click "Send Request" above each call, top to bottom. Or use curl / Postman.

### Scripts

| Command | What it does |
|---|---|
| `npm run start:dev` | Run with auto-restart |
| `npm run build` / `npm run start:prod` | Compile to `dist/` / run the compiled app |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | e2e tests: boots the whole app against the database |
| `npm run lint` / `npm run format` | oxlint / Prettier |
| `npm run db:up` / `db:down` | Start / stop the PostgreSQL container |
| `npm run db:migrate` | Create + apply a migration after editing `prisma/schema.prisma` |
| `npm run db:seed` | Fill demo data (safe to repeat) |
| `npm run db:reset` | ⚠️ Drop all data, re-apply migrations, re-seed (development only) |
| `npm run db:studio` | Browse the tables in Prisma Studio |

## The API (all routes start with `/api`)

Every route needs `Authorization: Bearer <token>` unless marked **public**. Successful answers are wrapped as `{ "data": …, "timestamp": … }`. Errors look like `{ "statusCode", "message", "path", "requestId", "timestamp" }`.

| Method & path | Who | Notes |
|---|---|---|
| `GET /health` | public | App + database check |
| `POST /auth/register` | public | `{ email, password, name? }` → 201 |
| `POST /auth/login` | public | `{ email, password }` → `{ accessToken }` (valid 15 min) |
| `GET /users/me`, `PATCH /users/me` | logged in | Your profile |
| `GET /users?page=`, `GET /users/:id` | admin | |
| `DELETE /users/:id` | admin | 204, soft delete, cancels their pending orders |
| `GET /products`, `GET /products/:id` | public | |
| `POST /products`, `PATCH /products/:id`, `DELETE /products/:id` | admin | |
| `POST /orders` | logged in | `{ items: [{ productId, quantity }], note? }`, reserves stock in one transaction |
| `GET /orders?status=&page=&limit=&sort=-createdAt` | logged in | Your orders only. `sort` accepts `createdAt`, `total` (prefix `-` for descending) |
| `GET /orders/:id` | logged in | Someone else's order → 404 |
| `GET /orders/track/:trackingCode` | public | Status only |
| `PATCH /orders/:id/status` | admin | `PENDING → CANCELLED` (restocks) or `PAID → SHIPPED` |
| `POST /payments` | logged in | `{ orderId }`: charge the fake bank, order becomes `PAID` |

## What happens during one request

`POST /api/orders` travels through the building in this order (Lesson 2, "Request lifecycle"):

1. **Middleware** `requestId` stamps an `X-Request-Id`.
2. **Guards** `JwtAuthGuard` checks the token, then `RolesGuard` checks `@Roles`.
3. **Interceptors (before)** `LoggingInterceptor` starts a timer, `TimeoutInterceptor` starts a 5 s clock.
4. **Pipes** `ValidationPipe` checks the body against `CreateOrderDto`.
5. **Controller → service** `OrdersController.create` → `OrdersService.create` asks HR (`UsersService`) and the warehouse (`ProductsService`) for help inside one database transaction.
6. **Interceptors (after)** `TransformInterceptor` wraps the result as `{ data, timestamp }`.
7. **Exception filters** handle anything thrown along the way: `PrismaExceptionFilter` for known database errors, `AllExceptionsFilter` for everything else.

## Break it on purpose (the best way to learn)

1. **Forget an export.** In `src/users/users.module.ts`, delete `exports: [UsersService]` and run `npm run start:dev`. Nest refuses to start:
   ```
   Nest can't resolve dependencies of the AuthService (?, JwtService). Please make sure that
   the argument UsersService at index [0] is available in the AuthModule module.
   ```
   Read it literally: inside AuthModule, nobody can find UsersService. Put the export back.
2. **Forget an import.** Remove `ProductsModule` from `imports` in `src/orders/orders.module.ts`. Same error, now for `OrdersService`.
3. **Hire a duplicate.** Add `UsersService` to the `providers` of `OrdersModule` and put a `console.log('UsersService created')` in its constructor. The app still starts (its own dependencies are global), but the log appears **twice**: Orders now has a private copy instead of HR's. That's the hidden bug the lesson warns about.
4. **Create a circular dependency.** Make `UsersModule` import `OrdersModule`. Then read how `user-deleted.event.ts` + `UserDeletedListener` avoid that.
5. **Make the public private.** Remove `@Public()` from `GET /products` and call it without a token: 401.
6. **Swap the bank.** Write a `DecliningPaymentGateway` whose `charge()` throws, and change `useClass` in `PaymentsModule`. Nothing else changes, because everything depends on the `PAYMENT_GATEWAY` token, not the class.

## Where this project differs from the lesson snippets, and why

- **NestJS 12 is ESM.** Relative imports end in `.js` (`'./users.service.js'`) even though the files are `.ts`. Tests use **Vitest** (`vi.fn()`), linting uses **oxlint**.
- **Prisma 7.**
  - The client is generated into `src/generated/prisma` and imported from `../generated/prisma/client.js` (not `@prisma/client`).
  - The database URL and seed command live in `prisma.config.ts`, and `PrismaService` passes a `PrismaPg` driver adapter.
  - `migrate dev` no longer runs the seed automatically.
- **The global guards are registered in `AuthModule`, not `AppModule`.** They need `JwtService`, which only exists inside AuthModule. `APP_GUARD` providers are global no matter which module declares them.
- **`InsufficientStockException` lives in `products/`,** because the warehouse is the one who knows the stock level.
- **`CreateProductDto.stock` has no `= 0` default.** `PartialType` copies defaults, so `PATCH { price }` would silently reset the stock to 0. The database default handles it.
- **There is no `/users/me/orders`.** It would make Users depend on Orders, which is a cycle. Your orders are at `GET /orders`.
- **Only short-lived access tokens.** Refresh tokens, argon2 and Passport strategies are in [Lesson 7](../Authentication-and-Authorization.html).
