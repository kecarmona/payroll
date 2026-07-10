export default {
  displayName: 'service-foundation',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/service-foundation',
  moduleNameMapper: {
    '^@payroll/shared-kernel$': '<rootDir>/../shared-kernel/src/index.ts',
  },
};
