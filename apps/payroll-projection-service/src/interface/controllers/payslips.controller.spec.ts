import { Model } from 'mongoose';
import { PayslipsController } from './payslips.controller';
import { PayslipProjection } from '../../infrastructure/mongoose/payslip.schema';

describe('PayslipsController', () => {
  let controller: PayslipsController;
  let mockPayslipModel: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    mockPayslipModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    controller = new PayslipsController(
      mockPayslipModel as unknown as Model<PayslipProjection>,
    );
  });

  describe('searchByEmployee', () => {
    it('should return payslips filtered by employeeId', async () => {
      const mockPayslips = [
        { payslipId: 'ps-001', employeeId: 'emp-001', netPay: 400000 },
        { payslipId: 'ps-002', employeeId: 'emp-001', netPay: 350000 },
      ];
      const mockQuery = { sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(mockPayslips) };
      mockPayslipModel.find.mockReturnValue(mockQuery);

      const result = await controller.searchByEmployee('emp-001');

      expect(mockPayslipModel.find).toHaveBeenCalledWith({ employeeId: 'emp-001' });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no payslips exist for employee', async () => {
      const mockQuery = { sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) };
      mockPayslipModel.find.mockReturnValue(mockQuery);

      const result = await controller.searchByEmployee('emp-999');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single payslip', async () => {
      const mockPayslip = {
        payslipId: 'ps-001',
        employeeId: 'emp-001',
        grossPay: 500000,
        deductions: 100000,
        netPay: 400000,
      };
      const mockQuery = { exec: jest.fn().mockResolvedValue(mockPayslip) };
      mockPayslipModel.findOne.mockReturnValue(mockQuery);

      const result = await controller.findOne('ps-001');

      expect(mockPayslipModel.findOne).toHaveBeenCalledWith({ payslipId: 'ps-001' });
      expect(result).toMatchObject({ payslipId: 'ps-001' });
    });

    it('should return null when payslip is not found', async () => {
      const mockQuery = { exec: jest.fn().mockResolvedValue(null) };
      mockPayslipModel.findOne.mockReturnValue(mockQuery);

      const result = await controller.findOne('ps-999');

      expect(result).toBeNull();
    });
  });
});
