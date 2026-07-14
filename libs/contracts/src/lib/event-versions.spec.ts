import { EVENT_VERSIONS } from './event-versions';
import { PayrollEventType } from './payroll-events';
import { IdentityEventType } from './identity-events';
import { EmployeeEventType } from './employee-events';
import { NotificationEventType } from './notification-events';

describe('EVENT_VERSIONS', () => {
  it('should have an entry for every PayrollEventType', () => {
    const payrollEvents = Object.values(PayrollEventType);
    for (const eventType of payrollEvents) {
      expect(typeof EVENT_VERSIONS[eventType]).toBe('number');
    }
  });

  it('should have an entry for every IdentityEventType', () => {
    const identityEvents = Object.values(IdentityEventType);
    for (const eventType of identityEvents) {
      expect(typeof EVENT_VERSIONS[eventType]).toBe('number');
    }
  });

  it('should have an entry for every EmployeeEventType', () => {
    const employeeEvents = Object.values(EmployeeEventType);
    for (const eventType of employeeEvents) {
      expect(typeof EVENT_VERSIONS[eventType]).toBe('number');
    }
  });

  it('should have an entry for every NotificationEventType', () => {
    const notificationEvents = Object.values(NotificationEventType);
    for (const eventType of notificationEvents) {
      expect(typeof EVENT_VERSIONS[eventType]).toBe('number');
    }
  });

  it('should have exactly 21 entries', () => {
    const keys = Object.keys(EVENT_VERSIONS);
    expect(keys).toHaveLength(21);
  });

  it('should have all versions set to 1', () => {
    for (const version of Object.values(EVENT_VERSIONS)) {
      expect(version).toBe(1);
    }
  });
});
