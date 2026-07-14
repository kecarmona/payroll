import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PayrollPeriod } from '../../domain/payroll-period.entity';
import type { PayrollPeriodRepository } from '../../domain/payroll-period.repository';
import { TypeOrmPayrollPeriodEntity } from './typeorm-payroll-period.entity';

/**
 * TypeORM-backed implementation of the {@link PayrollPeriodRepository} port.
 *
 * Converts between the domain {@link PayrollPeriod} aggregate and the
 * {@link TypeOrmPayrollPeriodEntity} persistence model.
 */
@Injectable()
export class TypeOrmPayrollPeriodRepository implements PayrollPeriodRepository {
  private readonly repository: Repository<TypeOrmPayrollPeriodEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmPayrollPeriodEntity);
  }

  async save(period: PayrollPeriod): Promise<void> {
    const entity = this.toEntity(period);
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<PayrollPeriod | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompanyAndPeriod(
    companyId: string,
    month: number,
    year: number,
  ): Promise<PayrollPeriod | null> {
    const entity = await this.repository.findOne({
      where: { companyId, month, year },
    });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompanyId(companyId: string): Promise<PayrollPeriod[]> {
    const entities = await this.repository.find({ where: { companyId } });
    return entities.map((entity) => this.toDomain(entity));
  }

  private toEntity(period: PayrollPeriod): TypeOrmPayrollPeriodEntity {
    const entity = new TypeOrmPayrollPeriodEntity();
    entity.id = period.id;
    entity.companyId = period.companyId;
    entity.month = period.month;
    entity.year = period.year;
    entity.startDate = period.startDate;
    entity.endDate = period.endDate;
    entity.isClosed = period.isClosed;
    entity.version = period.version;
    return entity;
  }

  private toDomain(entity: TypeOrmPayrollPeriodEntity): PayrollPeriod {
    return PayrollPeriod.reconstitute({
      id: entity.id,
      companyId: entity.companyId,
      month: entity.month,
      year: entity.year,
      startDate: entity.startDate,
      endDate: entity.endDate,
      isClosed: entity.isClosed,
      version: entity.version,
    });
  }
}
