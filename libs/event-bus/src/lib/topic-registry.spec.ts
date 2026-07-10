import { TopicName, TopicRegistry } from './topic-registry';

describe('TopicRegistry', () => {
  it('should be defined as an interface', () => {
    const mockRegistry: TopicRegistry = {
      resolve: (eventType: string): TopicName => {
        return `topic.${eventType}`;
      },
    };

    expect(mockRegistry).toBeDefined();
    expect(typeof mockRegistry.resolve).toBe('function');
  });

  it('should return a TopicName (string) for a known event type', () => {
    const mockRegistry: TopicRegistry = {
      resolve: (eventType: string): TopicName => {
        const topics: Record<string, TopicName> = {
          PayrollJobCreated: 'payroll.job.created',
          PayrollTransactionCompleted: 'payroll.transaction.completed',
        };
        return topics[eventType] ?? 'unknown';
      },
    };

    const result = mockRegistry.resolve('PayrollJobCreated');

    expect(typeof result).toBe('string');
    expect(result).toBe('payroll.job.created');
  });

  it('should return different topic names for different event types', () => {
    const mockRegistry: TopicRegistry = {
      resolve: (eventType: string): TopicName => {
        const topics: Record<string, TopicName> = {
          PayrollJobCreated: 'payroll.job.created',
          PayrollTransactionCompleted: 'payroll.transaction.completed',
        };
        return topics[eventType] ?? 'unknown';
      },
    };

    const jobTopic = mockRegistry.resolve('PayrollJobCreated');
    const txTopic = mockRegistry.resolve('PayrollTransactionCompleted');

    expect(jobTopic).toBe('payroll.job.created');
    expect(txTopic).toBe('payroll.transaction.completed');
    expect(jobTopic).not.toBe(txTopic);
  });
});
