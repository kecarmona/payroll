import { DomainError } from '@payroll/shared-kernel';

/**
 * Error raised when authentication fails (wrong password, deactivated user, etc.).
 *
 * Uses a generic message to avoid leaking whether the email exists or the
 * password was wrong — a standard security practice against enumeration attacks.
 */
export class AuthenticationError extends DomainError {
  constructor() {
    super('auth-service', 'Invalid email or password');
  }
}

/**
 * Error raised when a refresh token is invalid, revoked, or expired.
 */
export class RefreshTokenError extends DomainError {
  constructor(message: string) {
    super('auth-service', message);
  }
}
