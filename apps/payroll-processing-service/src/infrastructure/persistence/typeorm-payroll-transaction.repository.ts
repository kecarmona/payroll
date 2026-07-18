import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PayrollTransaction } from '../../domain/payroll-transaction.entity';
import { PayrollTransactionStatus } from '../../domain/payroll-transaction-status';
import type { PayrollTransactionRepository } from '../../domain/payroll-transaction.repository';
import { TypeOrmPayrollTransactionEntity } from './typeorm-payroll-transaction.entity';

/**
 * TypeORM-backed implementation of the {@link PayrollTransactionRepository} port.
 *
 * Converts between the domain {@link PayrollTransaction} aggregate and the
 * {@link TypeOrmPayrollTransactionEntity} persistence model.
 */
@Injectable()
export class TypeOrmPayrollTransactionRepository
  implements PayrollTransactionRepository
{
  private readonly repository: Repository<TypeOrmPayrollTransactionEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmPayrollTransactionEntity);
  }

  async save(transaction: PayrollTransaction): Promise<void> {
    const entity = this.toEntity(transaction);
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<PayrollTransaction | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByJobId(jobId: string): Promise<PayrollTransaction[]> {
    const entities = await this.repository.find({ where: { jobId } });
    return entities.map((e) => this.toDomain(e));
  }

  private toEntity(tx: PayrollTransaction): TypeOrmPayrollTransactionEntity {
    const entity = new TypeOrmPayrollTransactionEntity();
    entity.id = tx.id;
    entity.companyId = tx.companyId;
    entity.jobId = tx.jobId;
    entity.employeeId = tx.employeeId;
    entity.periodId = tx.periodId;
    entity.status = tx.status;
    entity.grossPayCents = tx.grossPay?.amount ?? null;
    entity.deductionsCents = tx.deductions?.amount ?? null;
    entity.netPayCents = tx.netPay?.amount ?? null;
    entity.currency = tx.grossPay?.currency ?? null;
    entity.version = tx.version;
    return entity;
  }

  private toDomain(entity: TypeOrmPayrollTransactionEntity): PayrollTransaction {
    return PayrollTransaction.reconstitute({
      id: entity.id,
      companyId: entity.companyId,
      jobId: entity.jobId,
      employeeId: entity.employeeId,
      periodId: entity.periodId,
      status: entity.status as PayrollTransactionStatus,
      grossPayCents: entity.grossPayCents,
      deductionsCents: entity.deductionsCents,
      netPayCents: entity.netPayCents,
      currency: entity.currency,
      version: entity.version,
    });
  }
}
