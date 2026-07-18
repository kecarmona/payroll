import { randomUUID } from 'crypto';
import { IdentityEventType } from '@payroll/contracts';
import type { DomainEvent } from '@payroll/shared-kernel';

/**
 * Payload for the UserDeactivated domain event.
 */
export interface UserDeactivatedPayload {
  /** The deactivated user's unique identifier. */
  readonly userId: string;
  /** The tenant (company) the user belongs to. */
  readonly companyId: string;
}

/**
 * Domain event raised when a user account is deactivated.
 *
 * @example
 * ```ts
 * const event = new UserDeactivatedEvent({
 *   userId: 'usr-123',
 *   companyId: 'comp-1',
 * });
 * ```
 */
export class UserDeactivatedEvent implements DomainEvent<UserDeactivatedPayload> {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly occurredAt: Date;
  readonly companyId: string;
  readonly aggregateId: string;
  readonly payload: UserDeactivatedPayload;

  constructor(payload: UserDeactivatedPayload) {
    this.eventId = randomUUID();
    this.eventType = IdentityEventType.UserDeactivated;
    this.version = 1;
    this.occurredAt = new Date();
    this.companyId = payload.companyId;
    this.aggregateId = payload.userId;
    this.payload = payload;
  }
}
