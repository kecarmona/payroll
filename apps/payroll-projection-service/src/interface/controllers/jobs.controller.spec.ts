import { Model } from 'mongoose';
import { JobsController } from './jobs.controller';
import { PayrollJobProjection } from '../../infrastructure/mongoose/payroll-job.schema';

describe('JobsController', () => {
  let controller: JobsController;
  let mockJobModel: { find: jest.Mock; findOne: jest.Mock };

  beforeEach(() => {
    mockJobModel = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    controller = new JobsController(
      mockJobModel as unknown as Model<PayrollJobProjection>,
    );
  });

  describe('findAll', () => {
    it('should return jobs filtered by companyId', async () => {
      const mockJobs = [
        { jobId: 'job-001', companyId: 'comp-001', status: 'COMPLETED' },
        { jobId: 'job-002', companyId: 'comp-001', status: 'PROCESSING' },
      ];
      const mockQuery = { sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(mockJobs) };
      mockJobModel.find.mockReturnValue(mockQuery);

      const result = await controller.findAll('comp-001');

      expect(mockJobModel.find).toHaveBeenCalledWith({ companyId: 'comp-001' });
      expect(mockQuery.sort).toHaveBeenCalledWith({ updatedAt: -1 });
      expect(result).toHaveLength(2);
      expect(result[0].jobId).toBe('job-001');
    });

    it('should return empty array when no jobs exist for company', async () => {
      const mockQuery = { sort: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) };
      mockJobModel.find.mockReturnValue(mockQuery);

      const result = await controller.findAll('comp-999');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single job', async () => {
      const mockJob = {
        jobId: 'job-001',
        companyId: 'comp-001',
        status: 'COMPLETED',
        totalEmployees: 5,
        processedCount: 4,
        failedCount: 1,
      };
      const mockQuery = { exec: jest.fn().mockResolvedValue(mockJob) };
      mockJobModel.findOne.mockReturnValue(mockQuery);

      const result = await controller.findOne('job-001', 'comp-001');

      expect(mockJobModel.findOne).toHaveBeenCalledWith({
        jobId: 'job-001',
        companyId: 'comp-001',
      });
      expect(result).toMatchObject({
        jobId: 'job-001',
        processedCount: 4,
        failedCount: 1,
      });
    });

    it('should return null when job is not found', async () => {
      const mockQuery = { exec: jest.fn().mockResolvedValue(null) };
      mockJobModel.findOne.mockReturnValue(mockQuery);

      const result = await controller.findOne('job-999', 'comp-001');

      expect(result).toBeNull();
    });
  });
});
