export const PayrollEventType = {
  PayrollJobCreated: 'PayrollJobCreated',
  PayrollJobProcessingStarted: 'PayrollJobProcessingStarted',
  PayrollTransactionCreated: 'PayrollTransactionCreated',
  PayrollTransactionProcessingStarted: 'PayrollTransactionProcessingStarted',
  PayrollTransactionCompleted: 'PayrollTransactionCompleted',
  PayrollTransactionFailed: 'PayrollTransactionFailed',
  PayrollJobCompleted: 'PayrollJobCompleted',
  PayrollJobFailed: 'PayrollJobFailed',
  PayslipGenerated: 'PayslipGenerated',
} as const;

export type PayrollEventType = (typeof PayrollEventType)[keyof typeof PayrollEventType];

