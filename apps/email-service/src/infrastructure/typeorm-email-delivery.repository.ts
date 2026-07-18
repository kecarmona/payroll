import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmEmailDeliveryEntity } from './typeorm-email-delivery.entity';

/**
 * TypeORM-backed repository for email delivery entities.
 *
 * Provides data access for the email_deliveries table.
 * Used within the outbox transaction scope to persist email delivery
 * records alongside their outbox entries.
 */
@Injectable()
export class TypeOrmEmailDeliveryRepository {
  private readonly repository: Repository<TypeOrmEmailDeliveryEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmEmailDeliveryEntity);
  }

  /**
   * Saves an email delivery entity to the database.
   *
   * @param entity - The email delivery entity to persist.
   */
  async save(entity: TypeOrmEmailDeliveryEntity): Promise<void> {
    await this.repository.save(entity);
  }
}
