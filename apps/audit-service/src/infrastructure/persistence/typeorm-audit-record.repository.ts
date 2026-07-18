import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { AuditRecord } from '../../domain/audit-record.entity';
import type { AuditRecordRepository } from '../../domain/audit-record.repository';
import { TypeOrmAuditRecordEntity } from './typeorm-audit-record.entity';

/**
 * TypeORM-backed implementation of the {@link AuditRecordRepository} port.
 *
 * Converts between the domain {@link AuditRecord} and the
 * {@link TypeOrmAuditRecordEntity} persistence model. Uses the TypeORM
 * {@link Repository} pattern via {@link DataSource}.
 *
 * The repository performs **append-only** inserts. If a record with the
 * same `eventId` already exists, the save is a no-op (idempotent).
 */
@Injectable()
export class TypeOrmAuditRecordRepository implements AuditRecordRepository {
  private readonly repository: Repository<TypeOrmAuditRecordEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmAuditRecordEntity);
  }

  /**
   * Persists an audit record.
   *
   * If a record with the same `eventId` already exists, the operation
   * is a no-op (idempotent).
   *
   * @param record - The audit record to persist.
   */
  async save(record: AuditRecord): Promise<void> {
    const entity = this.toEntity(record);
    await this.repository.save(entity);
  }

  /**
   * Checks whether an audit record already exists for the given event ID.
   *
   * @param eventId - The source event's unique identifier.
   * @returns `true` if a record with this eventId already exists.
   */
  async existsByEventId(eventId: string): Promise<boolean> {
    const entity = await this.repository.findOne({
      where: { eventId },
    });

    return entity !== null;
  }

  /**
   * Converts a domain AuditRecord to a TypeORM entity for persistence.
   *
   * @param record - The domain AuditRecord.
   * @returns A TypeORM entity ready for persistence.
   */
  private toEntity(record: AuditRecord): TypeOrmAuditRecordEntity {
    const entity = new TypeOrmAuditRecordEntity();
    entity.id = record.id;
    entity.eventId = record.eventId;
    entity.eventType = record.eventType;
    entity.companyId = record.companyId;
    entity.correlationId = record.correlationId;
    entity.payloadSummary = record.payloadSummary;
    entity.occurredAt = record.occurredAt;
    entity.recordedAt = record.recordedAt;
    return entity;
  }
}
