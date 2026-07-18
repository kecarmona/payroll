import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Money } from '@payroll/shared-kernel';
import { Payslip } from '../../domain/payslip.entity';
import type { PayslipRepository } from '../../domain/payslip.repository';
import { TypeOrmPayslipEntity } from './typeorm-payslip.entity';

/**
 * TypeORM-backed implementation of the {@link PayslipRepository} port.
 *
 * Converts between the domain {@link Payslip} entity and the
 * {@link TypeOrmPayslipEntity} persistence model.
 */
@Injectable()
export class TypeOrmPayslipRepository implements PayslipRepository {
  private readonly repository: Repository<TypeOrmPayslipEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = dataSource.getRepository(TypeOrmPayslipEntity);
  }

  async save(payslip: Payslip): Promise<void> {
    const entity = new TypeOrmPayslipEntity();
    entity.id = payslip.id;
    entity.transactionId = payslip.transactionId;
    entity.jobId = payslip.jobId;
    entity.employeeId = payslip.employeeId;
    entity.companyId = payslip.companyId;
    entity.periodId = payslip.periodId;
    entity.grossPayCents = payslip.grossPay.amount;
    entity.deductionsCents = payslip.deductions.amount;
    entity.netPayCents = payslip.netPay.amount;
    entity.currency = payslip.grossPay.currency;
    entity.generatedAt = payslip.generatedAt;
    await this.repository.save(entity);
  }

  async findById(id: string): Promise<Payslip | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByTransactionId(transactionId: string): Promise<Payslip | null> {
    const entity = await this.repository.findOne({ where: { transactionId } });
    return entity ? this.toDomain(entity) : null;
  }

  private toDomain(entity: TypeOrmPayslipEntity): Payslip {
    return new Payslip(
      entity.id,
      entity.transactionId,
      entity.jobId,
      entity.employeeId,
      entity.companyId,
      entity.periodId,
      Money.fromCents(entity.grossPayCents, entity.currency),
      Money.fromCents(entity.deductionsCents, entity.currency),
      Money.fromCents(entity.netPayCents, entity.currency),
    );
  }
}
