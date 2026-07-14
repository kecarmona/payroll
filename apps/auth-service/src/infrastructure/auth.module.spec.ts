import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import {
  AuthModule,
  AUTH_REPOSITORY_TOKEN,
  REFRESH_TOKEN_REPOSITORY_TOKEN,
  PASSWORD_HASHER_TOKEN,
  TOKEN_SERVICE_TOKEN,
} from './auth.module';
import { TypeOrmUserRepository } from './persistence/typeorm-user.repository';
import { TypeOrmRefreshTokenRepository } from './persistence/typeorm-refresh-token.repository';
import { BcryptPasswordHasher } from './auth/bcrypt-password-hasher';
import { JwtTokenService } from './auth/jwt-token.service';

/**
 * Global module that provides a mock DataSource for the test environment.
 *
 * `TypeOrmModule.forFeature()` creates repository providers that inject
 * the `DataSource` class token. Without `TypeOrmModule.forRoot()`, there's
 * no real DataSource provider. This @Global() module makes the mock
 * DataSource available across the entire DI hierarchy, including the
 * TypeOrmFeatureModule's internal scope.
 */
@Global()
@Module({
  providers: [
    {
      provide: DataSource,
      useValue: {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn(),
          save: jest.fn(),
          update: jest.fn(),
        }),
        entityMetadatas: [],
        options: { type: 'postgres' },
      },
    },
  ],
  exports: [DataSource],
})
class GlobalMockDataSourceModule {}

/**
 * Helper to build a test module with AuthModule and a global mock DataSource.
 */
async function createAuthTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [GlobalMockDataSourceModule, AuthModule],
  }).compile();
}

describe('AuthModule', () => {
  it('should compile the module', async () => {
    const module = await createAuthTestModule();
    expect(module).toBeDefined();
  });

  it('should provide UserRepository implementation', async () => {
    const module = await createAuthTestModule();
    const userRepo = module.get<TypeOrmUserRepository>(AUTH_REPOSITORY_TOKEN);
    expect(userRepo).toBeDefined();
    expect(userRepo).toBeInstanceOf(TypeOrmUserRepository);
  });

  it('should provide RefreshTokenRepository implementation', async () => {
    const module = await createAuthTestModule();
    const refreshRepo = module.get<TypeOrmRefreshTokenRepository>(
      REFRESH_TOKEN_REPOSITORY_TOKEN,
    );
    expect(refreshRepo).toBeDefined();
    expect(refreshRepo).toBeInstanceOf(TypeOrmRefreshTokenRepository);
  });

  it('should provide PasswordHasher implementation', async () => {
    const module = await createAuthTestModule();
    const hasher = module.get<BcryptPasswordHasher>(PASSWORD_HASHER_TOKEN);
    expect(hasher).toBeDefined();
    expect(hasher).toBeInstanceOf(BcryptPasswordHasher);
  });

  it('should provide TokenService implementation', async () => {
    const module = await createAuthTestModule();
    const tokenService = module.get<JwtTokenService>(TOKEN_SERVICE_TOKEN);
    expect(tokenService).toBeDefined();
    expect(tokenService).toBeInstanceOf(JwtTokenService);
  });

  it('should have JwtService available from the imported JwtModule', async () => {
    const module = await createAuthTestModule();
    const jwtService = module.get<JwtService>(JwtService);
    expect(jwtService).toBeDefined();
    expect(jwtService).toBeInstanceOf(JwtService);
  });
});
