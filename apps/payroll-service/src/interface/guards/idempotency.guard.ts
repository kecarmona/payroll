import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { createHash } from 'crypto';
import type { IdempotencyStore } from '../../domain/idempotency-store';
import { IDEMPOTENCY_STORE_TOKEN } from '../../infrastructure/payroll.module';

/**
 * Guard that enforces idempotent request processing via the `Idempotency-Key` header.
 *
 * ## Behavior
 *
 * | Situation | Action |
 * |---|---|
 * | Missing `Idempotency-Key` header | Returns 400 Bad Request |
 * | Key found with matching request hash | Returns the cached response (safe retry) |
 * | Key found with mismatching request hash | Returns 409 Conflict (different request, same key) |
 * | Key not found | Attaches key + hash to `request.idempotencyInfo` and allows through |
 *
 * ## Usage
 *
 * ```ts
 * @Post()
 * @UseGuards(IdempotencyGuard)
 * async createJob(@Body() dto: CreatePayrollJobDto) { ... }
 * ```
 *
 * When the guard allows the request through (key not found), downstream code
 * (e.g. the controller) MUST use the stored response from
 * `request.idempotencyInfo.key` and `request.idempotencyInfo.requestHash` to
 * persist the idempotency record along with the domain write.
 */
@Injectable()
export class IdempotencyGuard implements CanActivate {
  constructor(
    @Inject(IDEMPOTENCY_STORE_TOKEN)
    private readonly idempotencyStore: IdempotencyStore,
  ) {}

  /**
   * Validates the `Idempotency-Key` header and checks the idempotency store.
   *
   * @param context - The NestJS execution context.
   * @returns `true` if the request should proceed, or throws if blocked.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const idempotencyKey: string | undefined = request.headers['idempotency-key'];

    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    // Compute the request hash from the body
    const body = request.body ?? {};
    const requestHash = createHash('sha256')
      .update(JSON.stringify(body))
      .digest('hex');

    // Check the idempotency store
    const record = await this.idempotencyStore.findByKey(idempotencyKey);

    if (record) {
      // Key exists — check hash match
      if (record.requestHash === requestHash) {
        // Safe retry — return the cached response
        const response = context.switchToHttp().getResponse();
        response.status(record.responseStatus).json(record.responseBody);
        return false; // Request handled, do not proceed to controller
      }

      // Hash mismatch — different request with same key
      throw new ConflictException(
        `Idempotency key "${idempotencyKey}" was already used for a different request`,
      );
    }

    // Key not found — attach info and let the request proceed
    (request as Record<string, unknown>).idempotencyInfo = {
      key: idempotencyKey,
      requestHash,
    };

    return true;
  }
}
