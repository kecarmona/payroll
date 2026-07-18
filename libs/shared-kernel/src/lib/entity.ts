/**
 * Base class for all domain entities.
 *
 * An entity is an object defined by its identity, not its attributes.
 * Two entities with the same `id` and `companyId` are considered equal
 * regardless of their other properties.
 *
 * @typeParam TId - The type of the entity identifier (defaults to `string`).
 *                  Use branded types like `'CompanyId'` for type safety.
 */
export abstract class Entity<TId extends string = string> {
  /**
   * @param id        - The unique identifier for this entity.
   * @param companyId - The tenant identifier for multi-tenancy isolation.
   * @param version   - The optimistic concurrency version (starts at 0).
   */
  protected constructor(
    public readonly id: TId,
    public readonly companyId: string,
    public readonly version = 0,
  ) {}

  /**
   * Compares this entity to another by identity.
   *
   * Two entities are considered equal if they share the same `id` and `companyId`.
   * This is an identity comparison, NOT a value comparison.
   *
   * @param entity - The entity to compare against.
   * @returns `true` if both entities have the same identity.
   */
  equals(entity?: Entity<TId>): boolean {
    if (!entity) {
      return false;
    }

    return this.id === entity.id && this.companyId === entity.companyId;
  }
}

