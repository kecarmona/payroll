import { Model } from 'mongoose';
import { TransactionsController } from './transactions.controller';
import { PayrollTransactionProjection } from '../../infrastructure/mongoose/payroll-transaction.schema';

describe('TransactionsController', () => {
  let controller: TransactionsController;
  let mockTransactionModel: { find: jest.Mock };

  beforeEach(() => {
    mockTransactionModel = {
      find: jest.fn(),
    };

    controller = new TransactionsController(
      mockTransactionModel as unknown as Model<PayrollTransactionProjection>,
    );
  });

  describe('findByJob', () => {
    it('should return transactions filtered by jobId', async () => {
      const mockTransactions = [
        { transactionId: 'tx-001', jobId: 'job-001', status: 'COMPLETED' },
        { transactionId: 'tx-002', jobId: 'job-001', status: 'FAILED' },
      ];
      const mockQuery = { sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(mockTransactions) };
      mockTransactionModel.find.mockReturnValue(mockQuery);

      const result = await controller.findByJob('job-001');

      expect(mockTransactionModel.find).toHaveBeenCalledWith({ jobId: 'job-001' });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no transactions exist for job', async () => {
      const mockQuery = { sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) };
      mockTransactionModel.find.mockReturnValue(mockQuery);

      const result = await controller.findByJob('job-999');

      expect(result).toEqual([]);
    });
  });
});
