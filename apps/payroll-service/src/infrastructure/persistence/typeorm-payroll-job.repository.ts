import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PayrollJob } from '../../domain/payroll-job.entity';
import { PayrollJobStatus } from '../../domain/payroll-job-status';
import type { PayrollJobRepository } from '../../domain/payroll-job.repository';
import { TypeOrmPayrollJobEntity } from './typeorm-payroll-job.entity';

/**
 * TypeORM-backed implementation of the {@link PayrollJobRepository} port.
 *
 * Converts between the domain {@link PayrollJob} aggregate and the
 * {@link TypeOrmPayrollJobEntity} persistence model.
 */
@Injectable()
export class TypeOrmPayrollJobRepository implements PayrollJobRepository {
  private readonly repository: Repository<TypeOrmPayrollJobEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmPayrollJobEntity);
  }

  async save(job: PayrollJob): Promise<void> {
    const entity = this.toEntity(job);
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<PayrollJob | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByCompanyAndPeriod(
    companyId: string,
    periodId: string,
  ): Promise<PayrollJob | null> {
    const entity = await this.repository.findOne({
      where: { companyId, periodId },
    });
    return entity ? this.toDomain(entity) : null;
  }

  private toEntity(job: PayrollJob): TypeOrmPayrollJobEntity {
    const entity = new TypeOrmPayrollJobEntity();
    entity.id = job.id;
    entity.companyId = job.companyId;
    entity.periodId = job.periodId;
    entity.status = job.status.value;
    entity.version = job.version;
    return entity;
  }

  private toDomain(entity: TypeOrmPayrollJobEntity): PayrollJob {
    return PayrollJob.reconstitute({
      id: entity.id,
      companyId: entity.companyId,
      periodId: entity.periodId,
      status: PayrollJobStatus.from(entity.status),
      version: entity.version,
    });
  }
}
