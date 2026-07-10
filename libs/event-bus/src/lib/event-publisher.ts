import { EventEnvelope } from '@payroll/contracts';

export interface EventPublisher {
  publish<TPayload>(topic: string, event: EventEnvelope<TPayload>): Promise<void>;
}

