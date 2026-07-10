# Technical Design Document

# Chapter 6

# Security

Project

Distributed Payroll Processing Engine

---

# Purpose

This document defines authentication, authorization and security controls for the platform.

---

# Security Principles

- Deny by default.
- Authenticate every user-facing request.
- Authorize every command.
- Scope all business operations by companyId.
- Never trust client-provided identity claims without verification.
- Avoid leaking sensitive payroll data in logs or events.

---

# Authentication

The Auth Service issues JWT access tokens.

Access tokens include:

- subject
- companyId
- roles
- issuedAt
- expiresAt

Refresh tokens are stored server-side and rotated.

---

# Authorization

Primary roles:

- ADMIN
- HR
- EMPLOYEE

Role expectations:

- ADMIN can manage company-level configuration and users.
- HR can manage employees and run payroll.
- EMPLOYEE can view their own payslips.

Every protected endpoint must define required roles.

---

# Tenant Isolation

companyId is mandatory for business data.

Rules:

- Non-admin users can only access their own company.
- Employee users can only access their own employee-scoped data.
- Cross-company queries are forbidden unless explicitly administrative.

---

# Input Validation

All HTTP inputs must be validated using NestJS validation pipes.

Validation must cover:

- Required fields.
- Data types.
- String lengths.
- Numeric ranges.
- UUID formats.
- Enum values.

---

# Sensitive Data

Sensitive fields:

- Password hashes.
- Refresh tokens.
- Salary amounts.
- Payslip details.
- Personal employee information.

Rules:

- Passwords are never stored in plaintext.
- Secrets are never committed to the repository.
- Logs must not include tokens, passwords or full payslip payloads.
- Events should include only fields required by consumers.

---

# API Protection

Required controls:

- JWT guard.
- RBAC guard.
- Rate limiting.
- Secure HTTP headers.
- Request body size limits.
- CORS restrictions for browser clients.

---

# Replay Protection

Critical commands must use Idempotency-Key.

Repeated requests with the same payload return the original response.

Repeated requests with different payloads return conflict.

---

# Security Testing

Required tests:

- Unauthorized requests return 401.
- Forbidden role access returns 403.
- Cross-tenant access is rejected.
- Invalid payloads return 400.
- Duplicate idempotency keys are handled safely.
- SQL injection attempts do not affect persistence.

