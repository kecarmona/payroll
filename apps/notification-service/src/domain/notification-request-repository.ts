import type { NotificationRequest } from './notification-request';

/**
 * Port interface for persisting notification requests.
 *
 * Defines the contract for storing and retrieving NotificationRequest
 * aggregates from the backing store.
 */
export interface NotificationRequestRepository {
  /**
   * Saves a notification request aggregate.
   *
   * @param request - The notification request to persist.
   */
  save(request: NotificationRequest): Promise<void>;
}
