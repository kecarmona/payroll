/**
 * Type alias for Kafka topic names.
 *
 * Using a branded type alias improves readability and allows future
 * migration to a branded/nominal type without changing call sites.
 */
export type TopicName = string;

/**
 * Port interface for resolving event types to Kafka topic names.
 *
 * Implementations define the lookup strategy (static map, config-based,
 * convention-based, or external registry).
 *
 * MAY throw for unregistered event types — callers MUST handle errors.
 */
export interface TopicRegistry {
  /**
   * Resolve an event type string to a Kafka topic name.
   *
   * @param eventType - The domain event type identifier (e.g. "PayrollJobCreated").
   * @returns The corresponding Kafka topic name.
   */
  resolve(eventType: string): TopicName;
}
