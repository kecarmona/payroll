import { EventEnvelope } from '@payroll/contracts';

/**
 * Port interface for serializing typed EventEnvelope instances to Buffer.
 *
 * Implementations define the wire format (JSON, Avro, Protobuf, etc.).
 * The port is format-agnostic — concrete adapters own encoding rules.
 *
 * @typeParam TPayload - The shape of the event payload, inferred from the envelope.
 */
export interface EventSerializer {
  /**
   * Serialize a typed EventEnvelope to a Buffer for transport.
   *
   * @param event - The event envelope to serialize.
   * @returns A Buffer containing the serialized event data.
   */
  serialize<TPayload>(event: EventEnvelope<TPayload>): Buffer;
}
