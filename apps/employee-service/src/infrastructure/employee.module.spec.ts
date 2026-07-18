import { Global, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import {
  EmployeeModule,
  EMPLOYEE_REPOSITORY_TOKEN,
  EVENT_PUBLISHER_TOKEN,
} from './employee.module';
import { TypeOrmEmployeeRepository } from './persistence/typeorm-employee.repository';

/**
 * Global module that provides a mock DataSource for the test environment.
 *
 * `TypeOrmModule.forFeature()` creates repository providers that inject
 * the `DataSource` class token. Without `TypeOrmModule.forRoot()`, there is
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
          find: jest.fn(),
          save: jest.fn(),
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
 * Helper to build a test module with EmployeeModule and a global mock DataSource.
 */
async function createEmployeeTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [GlobalMockDataSourceModule, EmployeeModule],
  }).compile();
}

describe('EmployeeModule', () => {
  it('should compile the module', async () => {
    const module = await createEmployeeTestModule();
    expect(module).toBeDefined();
  });

  it('should provide EmployeeRepository implementation', async () => {
    const module = await createEmployeeTestModule();
    const repo = module.get<TypeOrmEmployeeRepository>(
      EMPLOYEE_REPOSITORY_TOKEN,
    );
    expect(repo).toBeDefined();
    expect(repo).toBeInstanceOf(TypeOrmEmployeeRepository);
  });

  it('should provide EventPublisher implementation', async () => {
    const module = await createEmployeeTestModule();
    const publisher = module.get(EVENT_PUBLISHER_TOKEN);
    expect(publisher).toBeDefined();
  });
});
