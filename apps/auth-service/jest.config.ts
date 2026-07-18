export default {
  displayName: 'auth-service',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/auth-service',
  moduleNameMapper: {
    '^@payroll/shared-kernel$': '<rootDir>/../../libs/shared-kernel/src/index.ts',
    '^@payroll/contracts$': '<rootDir>/../../libs/contracts/src/index.ts',
  },
};
