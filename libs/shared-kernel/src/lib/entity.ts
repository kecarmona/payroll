export abstract class Entity<TId extends string = string> {
  protected constructor(
    public readonly id: TId,
    public readonly companyId: string,
    public readonly version = 0,
  ) {}

  equals(entity?: Entity<TId>): boolean {
    if (!entity) {
      return false;
    }

    return this.id === entity.id && this.companyId === entity.companyId;
  }
}

