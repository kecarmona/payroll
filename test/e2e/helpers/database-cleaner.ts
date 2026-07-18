import { Client as PgClient } from 'pg';
import { MongoClient } from 'mongodb';
import { config } from './config';

/**
 * Database cleaner for E2E test isolation.
 *
 * Connects directly to PostgreSQL (all services) and MongoDB (projection
 * service) and removes all data without dropping databases or schemas.
 *
 * ## Important
 *
 * The services are RUNNING and connected to these databases. This cleaner
 * only TRUNCATES table data and DELETES MongoDB documents. It never drops
 * databases, schemas, collections, or indexes.
 */
export class DatabaseCleaner {
  /**
   * Truncates all tables across every service PostgreSQL database and
   * removes all documents from the MongoDB projection database.
   *
   * Call this in `beforeEach` or `beforeAll` to ensure clean state.
   */
  async clean(): Promise<void> {
    await Promise.all([
      this.cleanPostgresDatabases(),
      this.cleanMongoDB(),
    ]);
  }

  // ---------------------------------------------------------------
  // PostgreSQL: truncate all tables in each service database
  // ---------------------------------------------------------------

  private async cleanPostgresDatabases(): Promise<void> {
    const databases = Object.values(config.postgres.databases);

    await Promise.all(
      databases.map((dbName) => this.truncateDatabase(dbName)),
    );
  }

  /**
   * Connects to a single PostgreSQL database and truncates every
   * table in the `public` schema using CASCADE to handle foreign keys.
   */
  private async truncateDatabase(dbName: string): Promise<void> {
    const client = new PgClient({
      host: config.postgres.host,
      port: config.postgres.port,
      user: config.postgres.user,
      password: config.postgres.password,
      database: dbName,
    });

    try {
      await client.connect();

      // Retrieve all user tables in the public schema
      const result = await client.query<{ tablename: string }>(
        `SELECT tablename
         FROM pg_tables
         WHERE schemaname = 'public'
         ORDER BY tablename`,
      );

      const tables = result.rows.map((r: { tablename: string }) => r.tablename);

      if (tables.length === 0) {
        return; // No tables to truncate
      }

      // Truncate all tables in a single statement with CASCADE
      const truncateSql = `TRUNCATE TABLE ${tables
        .map((t: string) => `"${t}"`)
        .join(', ')} CASCADE`;

      await client.query(truncateSql);
    } finally {
      await client.end().catch(() => {
        /* ignore close errors */
      });
    }
  }

  // ---------------------------------------------------------------
  // MongoDB: delete all documents across all collections
  // ---------------------------------------------------------------

  private async cleanMongoDB(): Promise<void> {
    const client = new MongoClient(config.mongodb.uri);

    try {
      await client.connect();
      const db = client.db();

      const collections = await db.listCollections().toArray();

      await Promise.all(
        collections.map((col) =>
          db.collection(col.name).deleteMany({}).catch(() => {
            /* ignore collection-level errors */
          }),
        ),
      );
    } finally {
      await client.close().catch(() => {
        /* ignore close errors */
      });
    }
  }
}
