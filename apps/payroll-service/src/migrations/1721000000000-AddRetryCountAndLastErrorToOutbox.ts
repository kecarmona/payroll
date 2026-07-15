import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Add retry_count and last_error columns to the outbox table.
 *
 * These columns are required by the shared transactional-outbox library
 * to support retry logic and error observability in the outbox publisher.
 *
 * The columns are added as nullable to avoid blocking on existing rows.
 * `retry_count` defaults to 0 for new records; `last_error` remains NULL
 * unless a publish failure occurs.
 */
export class AddRetryCountAndLastErrorToOutbox1721000000000
  implements MigrationInterface
{
  name = 'AddRetryCountAndLastErrorToOutbox1721000000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outbox" ADD "retry_count" integer NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbox" ADD "last_error" text DEFAULT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "outbox" DROP COLUMN "last_error"`,
    );
    await queryRunner.query(
      `ALTER TABLE "outbox" DROP COLUMN "retry_count"`,
    );
  }
}
