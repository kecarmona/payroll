import { DataSource, Repository } from 'typeorm';
import { TypeOrmUserRepository } from './typeorm-user.repository';
import { TypeOrmUserEntity } from './typeorm-user.entity';
import { User } from '../../domain/user.entity';
import { UserId } from '../../domain/user-id';
import { UserEmail } from '../../domain/user-email';
import { UserRole } from '../../domain/user-role';
import type { PasswordHasher } from '../../domain/password-hasher';

class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return `hashed:${password}`;
  }
  async verify(password: string, hash: string): Promise<boolean> {
    return hash === `hashed:${password}`;
  }
}

describe('TypeOrmUserRepository', () => {
  let repository: TypeOrmUserRepository;
  let mockDataSource: jest.Mocked<DataSource>;
  let mockTypeOrmRepo: jest.Mocked<Repository<TypeOrmUserEntity>>;
  let testUser: User;

  const companyId = 'company-1';
  const hasher = new FakePasswordHasher();

  beforeAll(async () => {
    const userId = UserId.create();
    const email = UserEmail.from('repo-test@example.com');

    testUser = await User.register(
      userId,
      email,
      UserRole.HR,
      companyId,
      'securePassword',
      hasher,
    );
  });

  beforeEach(() => {
    mockTypeOrmRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<Repository<TypeOrmUserEntity>>;

    mockDataSource = {
      getRepository: jest.fn().mockReturnValue(mockTypeOrmRepo),
    } as unknown as jest.Mocked<DataSource>;

    repository = new TypeOrmUserRepository(mockDataSource);
  });

  describe('save', () => {
    it('should persist the user entity via TypeORM repository', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmUserEntity);

      await repository.save(testUser);

      expect(mockTypeOrmRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmUserEntity;

      expect(savedEntity.id).toBe(testUser.id);
      expect(savedEntity.email).toBe('repo-test@example.com');
      expect(savedEntity.passwordHash).toBe('hashed:securePassword');
      expect(savedEntity.roles).toEqual(['HR']);
      expect(savedEntity.companyId).toBe(companyId);
      expect(savedEntity.isActive).toBe(true);
      expect(savedEntity.version).toBe(0);
    });

    it('should map domain user roles to an array', async () => {
      mockTypeOrmRepo.save.mockResolvedValue({} as TypeOrmUserEntity);

      await repository.save(testUser);

      const savedEntity = mockTypeOrmRepo.save.mock.calls[0][0] as TypeOrmUserEntity;
      expect(Array.isArray(savedEntity.roles)).toBe(true);
      expect(savedEntity.roles).toContain('HR');
    });
  });

  describe('findById', () => {
    it('should return null when user is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findById(UserId.from('non-existent'));

      expect(result).toBeNull();
      expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'non-existent' },
      });
    });

    it('should reconstitute a User from a found entity', async () => {
      const entity: TypeOrmUserEntity = {
        id: testUser.id,
        email: 'repo-test@example.com',
        passwordHash: 'hashed:securePassword',
        roles: ['HR'],
        companyId,
        isActive: true,
        version: 0,
      } as TypeOrmUserEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(UserId.from(testUser.id));

      expect(result).not.toBeNull();
      expect(result!.id).toBe(testUser.id);
      expect(result!.email).toBe('repo-test@example.com');
      expect(result!.passwordHash).toBe('hashed:securePassword');
      expect(result!.role).toBe(UserRole.HR);
      expect(result!.companyId).toBe(companyId);
      expect(result!.isActive).toBe(true);
      expect(result!.version).toBe(0);
    });

    it('should handle empty roles array by defaulting to EMPLOYEE', async () => {
      const entity: TypeOrmUserEntity = {
        id: testUser.id,
        email: 'no-role@example.com',
        passwordHash: 'hash',
        roles: [],
        companyId,
        isActive: true,
        version: 0,
      } as TypeOrmUserEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findById(UserId.from(testUser.id));

      expect(result!.role).toBe(UserRole.EMPLOYEE);
    });
  });

  describe('findByEmail', () => {
    it('should return null when email is not found', async () => {
      mockTypeOrmRepo.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('unknown@example.com');

      expect(result).toBeNull();
    });

    it('should find a user by email', async () => {
      const entity: TypeOrmUserEntity = {
        id: testUser.id,
        email: 'findme@example.com',
        passwordHash: 'hash',
        roles: ['ADMIN'],
        companyId,
        isActive: true,
        version: 3,
      } as TypeOrmUserEntity;

      mockTypeOrmRepo.findOne.mockResolvedValue(entity);

      const result = await repository.findByEmail('findme@example.com');

      expect(result).not.toBeNull();
      expect(result!.email).toBe('findme@example.com');
      expect(result!.role).toBe(UserRole.ADMIN);
      expect(result!.version).toBe(3);
    });
  });
});
