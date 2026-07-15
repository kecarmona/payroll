import { IdempotencyService } from './idempotency.service';

describe('IdempotencyService', () => {
  let service: IdempotencyService;
  let mockJobModel: { exists: jest.Mock };
  let mockTransactionModel: { exists: jest.Mock };
  let mockPayslipModel: { exists: jest.Mock };

  beforeEach(() => {
    mockJobModel = { exists: jest.fn() };
    mockTransactionModel = { exists: jest.fn() };
    mockPayslipModel = { exists: jest.fn() };

    service = new IdempotencyService(
      mockJobModel as never,
      mockTransactionModel as never,
      mockPayslipModel as never,
    );
  });

  describe('isProcessed', () => {
    it('should return false when eventId does not exist in any collection', async () => {
      mockJobModel.exists.mockResolvedValue(null);
      mockTransactionModel.exists.mockResolvedValue(null);
      mockPayslipModel.exists.mockResolvedValue(null);

      const result = await service.isProcessed('evt-001');

      expect(result).toBe(false);
      expect(mockJobModel.exists).toHaveBeenCalledWith({ lastEventId: 'evt-001' });
      expect(mockTransactionModel.exists).toHaveBeenCalledWith({ lastEventId: 'evt-001' });
      expect(mockPayslipModel.exists).toHaveBeenCalledWith({ lastEventId: 'evt-001' });
    });

    it('should return true when eventId exists in job collection', async () => {
      mockJobModel.exists.mockResolvedValue({ _id: 'abc' });

      const result = await service.isProcessed('evt-001');

      expect(result).toBe(true);
    });

    it('should return true when eventId exists in transaction collection', async () => {
      mockJobModel.exists.mockResolvedValue(null);
      mockTransactionModel.exists.mockResolvedValue({ _id: 'abc' });

      const result = await service.isProcessed('evt-001');

      expect(result).toBe(true);
    });

    it('should return true when eventId exists in payslip collection', async () => {
      mockJobModel.exists.mockResolvedValue(null);
      mockTransactionModel.exists.mockResolvedValue(null);
      mockPayslipModel.exists.mockResolvedValue({ _id: 'abc' });

      const result = await service.isProcessed('evt-001');

      expect(result).toBe(true);
    });

    it('should stop checking after finding a match', async () => {
      mockJobModel.exists.mockResolvedValue({ _id: 'abc' });

      await service.isProcessed('evt-001');

      expect(mockTransactionModel.exists).not.toHaveBeenCalled();
      expect(mockPayslipModel.exists).not.toHaveBeenCalled();
    });
  });
});
