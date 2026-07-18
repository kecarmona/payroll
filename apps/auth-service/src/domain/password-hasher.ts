/**
 * Port interface for password hashing operations.
 *
 * Defines the contract for hashing plain-text passwords and verifying
 * them against stored hashes. The implementation lives in the
 * infrastructure layer (e.g., bcrypt), keeping the domain decoupled
 * from any specific hashing algorithm.
 *
 * Implementations MUST use a cryptographically secure hashing algorithm
 * (e.g., bcrypt, argon2) with appropriate work factor configuration.
 */
export interface PasswordHasher {
  /**
   * Hashes a plain-text password.
   *
   * @param password - The plain-text password to hash.
   * @returns A promise that resolves to the hashed password string.
   */
  hash(password: string): Promise<string>;

  /**
   * Verifies a plain-text password against a stored hash.
   *
   * @param password - The plain-text password to verify.
   * @param hash - The stored hash to compare against.
   * @returns A promise that resolves to `true` if the password matches the hash.
   */
  verify(password: string, hash: string): Promise<boolean>;
}
