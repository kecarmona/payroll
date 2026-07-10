import { EventEnvelope } from '@payroll/contracts';

export interface EventHandler<TPayload = unknown> {
  readonly eventType: string;
  handle(event: EventEnvelope<TPayload>): Promise<void>;
}

