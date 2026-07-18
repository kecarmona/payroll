import { UserRole } from './user-role';

describe('UserRole', () => {
  it('should have ADMIN role', () => {
    expect(UserRole.ADMIN).toBe('ADMIN');
  });

  it('should have HR role', () => {
    expect(UserRole.HR).toBe('HR');
  });

  it('should have EMPLOYEE role', () => {
    expect(UserRole.EMPLOYEE).toBe('EMPLOYEE');
  });

  it('should have exactly 3 roles', () => {
    const roles = Object.keys(UserRole);
    expect(roles).toHaveLength(3);
  });

  describe('type narrowing', () => {
    it('should allow switch-based narrowing on ADMIN', () => {
      const role: UserRole = UserRole.ADMIN;
      switch (role) {
        case UserRole.ADMIN:
          expect(role).toBe('ADMIN');
          break;
        default:
          expect(true).toBe(false); // should not reach here
      }
    });

    it('should allow switch-based narrowing on HR', () => {
      const role: UserRole = UserRole.HR;
      switch (role) {
        case UserRole.HR:
          expect(role).toBe('HR');
          break;
        default:
          expect(true).toBe(false); // should not reach here
      }
    });

    it('should allow switch-based narrowing on EMPLOYEE', () => {
      const role: UserRole = UserRole.EMPLOYEE;
      switch (role) {
        case UserRole.EMPLOYEE:
          expect(role).toBe('EMPLOYEE');
          break;
        default:
          expect(true).toBe(false); // should not reach here
      }
    });
  });
});
