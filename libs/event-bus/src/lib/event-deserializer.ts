import { EventEnvelope } from '@payroll/contracts';

/**
 * Port interface for deserializing Buffer data back to typed EventEnvelope instances.
 *
 * Implementations define the wire format parsing (JSON, Avro, Protobuf, etc.).
 * MAY throw on malformed or incomplete input — callers MUST handle errors.
 *
 * @typeParam TPayload - The expected shape of the event payload, specified by the caller.
 */
export interface EventDeserializer {
  /**
   * Deserialize a Buffer into a typed EventEnvelope.
   *
   * @param data - The raw buffer containing serialized event data.
   * @returns A typed EventEnvelope with the specified payload shape.
   */
  deserialize<TPayload>(data: Buffer): EventEnvelope<TPayload>;
}
