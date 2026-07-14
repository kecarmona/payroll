import { randomUUID } from 'crypto';
import { IdentityEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the UserRegistered domain event.
 *
 * Contains the essential identity and role information captured
 * at user registration time.
 */
export interface UserRegisteredPayload {
  /** The newly created user's unique identifier. */
  readonly userId: string;
  /** The registered email address. */
  readonly email: string;
  /** The role assigned at registration. */
  readonly role: string;
  /** The tenant (company) the user belongs to. */
  readonly companyId: string;
}

/**
 * Domain event raised when a new user account is registered.
 *
 * @example
 * ```ts
 * const event = new UserRegisteredEvent({
 *   userId: 'usr-123',
 *   email: 'user@example.com',
 *   role: 'ADMIN',
 *   companyId: 'comp-1',
 * });
 * ```
 */
export class UserRegisteredEvent implements DomainEvent<UserRegisteredPayload> {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: UserRegisteredPayload;

  constructor(payload: UserRegisteredPayload) {
    this.eventId = randomUUID();
    this.eventType = IdentityEventType.UserRegistered;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.userId;
    this.payload = payload;
  }
}
