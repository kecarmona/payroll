/**
 * Base class for all domain value objects.
 *
 * A value object is defined by its attributes, not its identity.
 * Two value objects with the same property values are considered equal.
 * Value objects are immutable — their state is set at construction and
 * never changes.
 *
 * Equality is determined by deep structural comparison of the `props`
 * using JSON serialization. This is suitable for flat and shallowly-nested
 * value objects. For complex nested structures, override `equals()`.
 *
 * @typeParam TProps - Record type representing the value object's properties.
 */
export abstract class ValueObject<TProps extends Record<string, unknown>> {
  protected constructor(protected readonly props: TProps) {}

  /**
   * Compares this value object to another by structural equality.
   *
   * Two value objects are equal if their serialized properties match.
   * Returns `false` when the argument is `null` or `undefined`.
   *
   * @param valueObject - The value object to compare against.
   * @returns `true` if both value objects have identical properties.
   */
  equals(valueObject?: ValueObject<TProps>): boolean {
    if (!valueObject) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(valueObject.props);
  }
}

