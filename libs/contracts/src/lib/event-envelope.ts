export interface EventEnvelope<TPayload = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly version: number;
  readonly timestamp: string;
  readonly companyId: string;
  readonly correlationId: string;
  readonly causationId: string;
  readonly producer: string;
  readonly payload: TPayload;
}

