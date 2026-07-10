import { IdentityEventType } from './identity-events';

describe('IdentityEventType', () => {
  it('should define UserRegistered constant', () => {
    expect(IdentityEventType.UserRegistered).toBe('UserRegistered');
  });

  it('should define UserAuthenticated constant', () => {
    expect(IdentityEventType.UserAuthenticated).toBe('UserAuthenticated');
  });

  it('should define PasswordChanged constant', () => {
    expect(IdentityEventType.PasswordChanged).toBe('PasswordChanged');
  });

  it('should define UserDeactivated constant', () => {
    expect(IdentityEventType.UserDeactivated).toBe('UserDeactivated');
  });

  it('should have exactly 4 entries', () => {
    const entries = Object.keys(IdentityEventType);
    expect(entries).toHaveLength(4);
  });

  it('should have all values matching their keys', () => {
    for (const [key, value] of Object.entries(IdentityEventType)) {
      expect(key).toBe(value);
    }
  });
});
