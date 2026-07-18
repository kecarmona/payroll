import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { TypeOrmNotificationRequestEntity } from './typeorm-notification-request.entity';

/**
 * TypeORM-backed repository for notification request entities.
 *
 * Provides data access for the notification_requests table.
 * Used within the outbox transaction scope to persist notification
 * requests alongside their outbox entries.
 */
@Injectable()
export class TypeOrmNotificationRequestRepository {
  private readonly repository: Repository<TypeOrmNotificationRequestEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmNotificationRequestEntity);
  }

  /**
   * Saves a notification request entity to the database.
   *
   * @param entity - The notification request entity to persist.
   */
  async save(entity: TypeOrmNotificationRequestEntity): Promise<void> {
    await this.repository.save(entity);
  }
}
