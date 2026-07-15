# Design: Harden Service Security

## Architecture

```
┌─────────────────────────────────────────┐
│  libs/auth-guards/                       │
│  - JwtAuthGuard (validates JWT)          │
│  - RolesGuard (checks @Roles metadata)   │
│  - Roles decorator                       │
│  - CurrentUser decorator                 │
└─────────────────────────────────────────┘
         ▲                    ▲
         │ inject             │ inject
  ┌──────┴──────┐      ┌─────┴──────┐
  │ employee-svc │      │ payroll-svc│  ...
  │ @UseGuards   │      │ @UseGuards │
  └──────────────┘      └────────────┘
```

## Security Layers per Request

1. Helmet middleware — secure headers (XSS, CSP, etc.)
2. ThrottlerGuard — rate limiting
3. JwtAuthGuard — authenticate
4. RolesGuard — authorize
5. Controller handler — companyId scoping

## Implementation Plan

### 1. Create libs/auth-guards/
- Generate via Nx, extract guards from auth-service
- JwtAuthGuard reads JWT_SECRET from env, validates, attaches user
- RolesGuard reads @Roles() metadata from handler, checks user.roles

### 2. Update each service
- Install @nestjs/jwt, @nestjs/throttler, helmet
- Add guards to controllers
- Add ThrottlerModule to AppModule
- Add helmet middleware in main.ts
- Set bodyParser limit to 1mb

### 3. Update auth-service
- Switch to use shared guards from libs/auth-guards
- Remove local copies
