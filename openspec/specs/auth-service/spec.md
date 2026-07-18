# Auth Service Specification

## Purpose

Identity and access bounded context — user registration, password-based authentication, JWT issuance, RBAC, and refresh token rotation. Every external request enters through this service.

## Requirements

### R1: User Registration

The system MUST accept email, password, role, and companyId for registration. Email MUST be validated for format. Password MUST be at least 8 characters and hashed with bcrypt. On success, a UserId MUST be returned and a UserRegistered domain event recorded.

- GIVEN a valid email, password (8+ chars), role, and companyId
- WHEN the register command is executed
- THEN a User is created with hashed password
- AND a UserRegistered event is recorded
- AND the UserId is returned

- GIVEN an email that already exists
- WHEN the register command is executed
- THEN a ValidationError is thrown with field "email"

### R2: User Authentication

The system MUST accept email and password, validate against the stored bcrypt hash, and issue a JWT access token (containing sub, email, roles[], companyId, iat, exp) plus a refresh token (stored hashed in DB). The response MUST be `{ accessToken, refreshToken, expiresIn }`.

- GIVEN valid email and matching password for an active user
- WHEN the login command is executed
- THEN a TokenResponse with accessToken, refreshToken, and expiresIn is returned
- AND the accessToken contains sub, email, roles[], companyId, iat, exp

- GIVEN a valid email with an incorrect password
- WHEN the login command is executed
- THEN authentication fails with a generic error message

- GIVEN a deactivated user's email and valid password
- WHEN the login command is executed
- THEN authentication fails

### R3: Refresh Token Rotation

The system MUST accept a refresh token string, validate it exists, is not revoked, and is not expired. On success, it MUST issue a new access token and rotate the refresh token (revoke old, issue new).

- GIVEN a valid, non-revoked, non-expired refresh token
- WHEN the refresh command is executed
- THEN a new access token and a rotated refresh token are returned
- AND the old refresh token is revoked

- GIVEN a revoked refresh token
- WHEN the refresh command is executed
- THEN the request is rejected

- GIVEN an expired refresh token
- WHEN the refresh command is executed
- THEN the request is rejected

### R4: JWT Authentication Guard

The system MUST extract the token from the `Authorization: Bearer <token>` header, validate its signature and expiration, and attach the decoded payload to the request.

- GIVEN a valid JWT with a correct signature and unexpired
- WHEN a protected route is accessed
- THEN the request passes and decoded user info is available

- GIVEN an expired JWT
- WHEN a protected route is accessed
- THEN 401 Unauthorized is returned

- GIVEN an invalid JWT (bad signature or malformed)
- WHEN a protected route is accessed
- THEN 401 Unauthorized is returned

- GIVEN a request without an Authorization header
- WHEN a protected route is accessed
- THEN 401 Unauthorized is returned

### R5: Role-Based Access Control Guard

The system MUST read required roles from route metadata and compare them with the user's roles from the JWT payload. Access MUST be granted only when the user has at least one required role.

- GIVEN a user with a role included in the route's required roles
- WHEN the RBAC guard evaluates the request
- THEN access is granted

- GIVEN a user whose roles do not include any required role
- WHEN the RBAC guard evaluates the request
- THEN 403 Forbidden is returned

### R6: User Deactivation

The system MUST accept a userId and set the user as inactive. A UserDeactivated domain event MUST be recorded. Deactivating an already inactive user MUST be idempotent.

- GIVEN an active user
- WHEN the deactivate command is executed
- THEN the user is marked inactive
- AND a UserDeactivated event is recorded

- GIVEN an already deactivated user
- WHEN the deactivate command is executed
- THEN the operation is a no-op (idempotent)
