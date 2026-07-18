/**
 * Shared configuration for the E2E test suite.
 *
 * Defines service URLs, database connection strings, and timing
 * constants. All services run on localhost with sequential ports.
 *
 * ## Service Port Map
 *
 * | Service | Port |
 * |---------|------|
 * | auth-service | 3001 |
 * | employee-service | 3002 |
 * | payroll-service | 3003 |
 * | payroll-processing-service | 3004 |
 * | payroll-projection-service | 3005 |
 * | notification-service | 3006 |
 * | email-service | 3007 |
 * | audit-service | 3008 |
 *
 * ## Database Names
 *
 * Each service uses its own PostgreSQL database (except projection
 * which uses MongoDB). All PostgreSQL services share the same
 * host/port/credentials.
 */

/** Base URL builder for a service on a given port. */
const serviceUrl = (port: number): string => `http://localhost:${port}`;

export const config = {
  /** Auth service — registration and JWT authentication. */
  auth: {
    baseUrl: serviceUrl(3001),
    endpoints: {
      register: '/auth/register',
      login: '/auth/login',
      refresh: '/auth/refresh',
    },
  },

  /** Employee service — employee CRUD. */
  employee: {
    baseUrl: serviceUrl(3002),
    endpoints: {
      create: '/employees',
      get: (id: string) => `/employees/${id}`,
      list: '/employees',
    },
  },

  /** Payroll service — period and job orchestration. */
  payroll: {
    baseUrl: serviceUrl(3003),
    endpoints: {
      createPeriod: '/payroll/periods',
      listPeriods: '/payroll/periods',
      createJob: '/payroll/jobs',
      getJob: (id: string) => `/payroll/jobs/${id}`,
    },
  },

  /** Payroll processing service — handles Kafka job consumption. */
  processing: {
    baseUrl: serviceUrl(3004),
    endpoints: {},
  },

  /** Payroll projection service — read models in MongoDB. */
  projection: {
    baseUrl: serviceUrl(3005),
    endpoints: {
      getJob: (jobId: string) => `/api/projections/jobs/${jobId}`,
      listJobs: '/api/projections/jobs',
      listTransactions: '/api/projections/transactions',
      getPayslip: (payslipId: string) => `/api/projections/payslips/${payslipId}`,
      searchPayslips: '/api/projections/payslips',
    },
  },

  /** Notification service — Kafka consumer only (no REST writes). */
  notification: {
    baseUrl: serviceUrl(3006),
    endpoints: {},
  },

  /** Email service — Kafka consumer only (no REST writes). */
  email: {
    baseUrl: serviceUrl(3007),
    endpoints: {},
  },

  /** Audit service — append-only event log. No GET endpoints. */
  audit: {
    baseUrl: serviceUrl(3008),
    endpoints: {},
  },

  /** Health check endpoints (identical path on all services). */
  health: {
    endpoint: '/health/live',
  },

  /**
   * PostgreSQL connection parameters.
   *
   * All service databases share the same host, port, user, and password.
   * Each service has a dedicated database name.
   */
  postgres: {
    host: 'localhost',
    port: 5432,
    user: 'payroll',
    password: 'payroll',
    databases: {
      auth: 'payroll_auth',
      employees: 'payroll_employees',
      payroll: 'payroll_payroll',
      processing: 'payroll_processing',
      notifications: 'payroll_notifications',
      email: 'payroll_emails',
      audit: 'payroll_audit',
    },
  },

  /**
   * MongoDB connection string.
   *
   * The projection service stores denormalized read models here.
   */
  mongodb: {
    uri: 'mongodb://localhost:27017/payroll_projections',
  },

  /** Kafka broker connection for test-side producers (idempotency tests). */
  kafka: {
    broker: 'localhost:9092',
    topics: {
      /**
       * All payroll events are published to a single topic.
       * The `eventType` field in the message body differentiates
       * between PayrollJobCreated, PayslipGenerated, etc.
       */
      payrollEvents: 'payroll.events',
    },
  },

  /** Polling configuration for async waits. */
  polling: {
    intervalMs: 1_000,
    maxAttempts: 60,
  },

  /** Default timeout for HTTP requests (ms). */
  httpTimeout: 10_000,
} as const;

export type Config = typeof config;
