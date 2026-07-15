export default {
  displayName: 'payroll-processing-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/payroll-processing-service',
  moduleNameMapper: {
    '^@payroll/shared-kernel$': '<rootDir>/../../libs/shared-kernel/src/index.ts',
    '^@payroll/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
    '^@payroll/transactional-outbox$': '<rootDir>/../../libs/transactional-outbox/src/index.ts',
    '^@payroll/event-bus$': '<rootDir>/../../libs/event-bus/src/index.ts',
    '^@payroll/service-foundation$': '<rootDir>/../../libs/service-foundation/src/index.ts',
  },
};
