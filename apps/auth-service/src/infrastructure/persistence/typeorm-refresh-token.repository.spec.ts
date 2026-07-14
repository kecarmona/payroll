/* eslint-disable @typescript-eslint/no-explicit-any */

import { DataSource, Repository } from 'typeorm';
import { TypeOrmRefreshTokenRepository } from './typeorm-refresh-token.repository';
import { TypeOrmRefreshTokenEntity } from './typeorm-refresh-token.entity';
import { RefreshToken } from '../../domain/refresh-token.entity';
import { UserId } from '../../domain/user-id';

describe('TypeOrmRefreshTokenRepository', () => {
  let repository: TypeOrmRefreshTokenRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmRefreshTokenEntity>>;
  let testToken: RefreshToken;

  const userId = UserId.create();
  const companyId = 'company-1';
  const tokenHash = 'hashed-token-value';
  const futureExpiry = new Date(Date.now() + 86400000);

  beforeAll(() => {
    testToken = RefreshToken.create(userId, tokenHash, futureExpiry, companyId);
  });

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmRefreshTokenEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmRefreshTokenRepository(mockDataSource);
  });

  describe('save', () => {
    it('should persist the refresh token entity', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmRefreshTokenEntity);

      await repository.save(testToken);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const entity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmRefreshTokenEntity;

      expect(entity.id).toBe(testToken.id);
      expect(entity.userId).toBe(userId.toString());
      expect(entity.tokenHash).toBe(tokenHash);
      expect(entity.expiresAt).toBe(futureExpiry);
      expect(entity.companyId).toBe(companyId);
      expect(entity.isRevoked).toBe(false);
      expect(entity.version).toBe(0);
    });
  });

  describe('findByTokenHash', () => {
    it('should return null when token hash is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByTokenHash('non-existent-hash');

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { tokenHash: 'non-existent-hash' },
      });
    });

    it('should reconstitute a RefreshToken from a found entity', async () => {
      const entity: TypeOrmRefreshTokenEntity = {
        id: testToken.id,
        userId: userId.toString(),
        tokenHash,
        expiresAt: futureExpiry,
        companyId,
        isRevoked: false,
        version: 0,
        createdAt: new Date(),
      } as TypeOrmRefreshTokenEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByTokenHash(tokenHash);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testToken.id);
      expect(result!.userId).toBe(userId.toString());
      expect(result!.tokenHash).toBe(tokenHash);
      expect(result!.companyId).toBe(companyId);
      expect(result!.isRevoked).toBe(false);
      expect(result!.version).toBe(0);
    });

    it('should restore a revoked token correctly', async () => {
      const revokedToken = RefreshToken.create(
        userId,
        'revoked-hash',
        new Date(Date.now() + 3600000),
        companyId,
      );
      revokedToken.revoke();

      const entity: TypeOrmRefreshTokenEntity = {
        id: revokedToken.id,
        userId: userId.toString(),
        tokenHash: 'revoked-hash',
        expiresAt: revokedToken.expiresAt,
        companyId,
        isRevoked: true,
        version: 1,
        createdAt: new Date(),
      } as TypeOrmRefreshTokenEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByTokenHash('revoked-hash');

      expect(result).not.toBeNull();
      expect(result!.isRevoked).toBe(true);
    });
  });

  describe('revokeAllForUser', () => {
    it('should revoke all active tokens for a user', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 2 } as any);

      await repository.revokeAllForUser(userId.toString());

      expect(mockTypeOrmRepo.update).toHaveBeenCalledWith(
        { userId: userId.toString(), isRevoked: false },
        { isRevoked: true },
      );
    });

    it('should succeed when there are no active tokens to revoke', async () => {
      mockTypeOrmRepo.update.mockResolvedValue({ affected: 0 } as any);

      await expect(
        repository.revokeAllForUser(userId.toString()),
      ).resolves.not.toThrow();
    });
  });
});
