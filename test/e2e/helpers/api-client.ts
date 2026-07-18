import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { config } from './config';

/**
 * Axios-based HTTP client for all 8 payroll microservices.
 *
 * Provides typed methods for every E2E-relevant endpoint.
 * Auto-attaches the JWT `Authorization` header after `login()`.
 * Auto-attaches `Idempotency-Key` headers for idempotent endpoints.
 */
export class ApiClient {
  private readonly http: AxiosInstance;
  private accessToken: string = '';

  constructor() {
    this.http = axios.create({
      timeout: config.httpTimeout,
      headers: {
        'Content-Type': 'application/json',
      },
      // Never throw on non-2xx so callers can inspect status codes
      validateStatus: () => true,
    });
  }

  /** Returns the current JWT access token (empty string if not logged in). */
  get token(): string {
    return this.accessToken;
  }

  /** Returns true if a JWT has been acquired. */
  get isAuthenticated(): boolean {
    return this.accessToken.length > 0;
  }

  // ---------------------------------------------------------------
  // Auth Service
  // ---------------------------------------------------------------

  /**
   * Registers a new user.
   * POST /auth/register
   */
  async register(
    email: string,
    password: string,
    role: string,
  ): Promise<AxiosResponse<{ userId: string }>> {
    return this.http.post(`${config.auth.baseUrl}${config.auth.endpoints.register}`, {
      email,
      password,
      role,
    });
  }

  /**
   * Authenticates a user and stores the JWT.
   * POST /auth/login
   *
   * After a successful login, the access token is automatically
   * attached to all subsequent requests via the Authorization header.
   */
  async login(email: string, password: string): Promise<AxiosResponse> {
    const response = await this.http.post(
      `${config.auth.baseUrl}${config.auth.endpoints.login}`,
      { email, password },
    );

    if (response.status === 200 && response.data?.accessToken) {
      this.accessToken = response.data.accessToken;
    }

    return response;
  }

  // ---------------------------------------------------------------
  // Employee Service
  // ---------------------------------------------------------------

  /**
   * Creates a new employee.
   * POST /employees
   */
  async createEmployee(data: {
    email: string;
    name: string;
    position: string;
    salaryAmount: number;
    salaryCurrency: string;
    department: string;
    companyId: string;
  }): Promise<AxiosResponse<{ employeeId: string }>> {
    return this.http.post(
      `${config.employee.baseUrl}${config.employee.endpoints.create}`,
      data,
      this.withAuth(),
    );
  }

  /**
   * Gets an employee by ID.
   * GET /employees/:id
   */
  async getEmployee(employeeId: string): Promise<AxiosResponse> {
    return this.http.get(
      `${config.employee.baseUrl}${config.employee.endpoints.get(employeeId)}`,
      this.withAuth(),
    );
  }

  // ---------------------------------------------------------------
  // Payroll Service
  // ---------------------------------------------------------------

  /**
   * Creates a payroll period.
   * POST /payroll/periods
   */
  async createPeriod(data: {
    companyId: string;
    month: number;
    year: number;
    startDate: string;
    endDate: string;
  }): Promise<AxiosResponse<{ periodId: string }>> {
    return this.http.post(
      `${config.payroll.baseUrl}${config.payroll.endpoints.createPeriod}`,
      data,
      this.withAuth(),
    );
  }

  /**
   * Creates a payroll job with idempotency support.
   * POST /payroll/jobs
   *
   * Requires an Idempotency-Key header for safe retry.
   */
  async createJob(
    data: { companyId: string; periodId: string },
    idempotencyKey: string,
  ): Promise<AxiosResponse<{ jobId: string; status: string }>> {
    return this.http.post(
      `${config.payroll.baseUrl}${config.payroll.endpoints.createJob}`,
      data,
      this.withAuth({ 'Idempotency-Key': idempotencyKey }),
    );
  }

  /**
   * Gets a payroll job by ID.
   * GET /payroll/jobs/:id
   */
  async getJob(jobId: string): Promise<AxiosResponse> {
    return this.http.get(
      `${config.payroll.baseUrl}${config.payroll.endpoints.getJob(jobId)}`,
      this.withAuth(),
    );
  }

  // ---------------------------------------------------------------
  // Projection Service
  // ---------------------------------------------------------------

  /**
   * Gets a projection job by its ID.
   * GET /api/projections/jobs/:jobId?companyId=
   */
  async getProjectionJob(
    jobId: string,
    companyId: string,
  ): Promise<AxiosResponse> {
    return this.http.get(
      `${config.projection.baseUrl}${config.projection.endpoints.getJob(jobId)}`,
      this.withAuth({ params: { companyId } }),
    );
  }

  /**
   * Lists transactions for a payroll job.
   * GET /api/projections/transactions?jobId=
   */
  async getTransactions(jobId: string): Promise<AxiosResponse> {
    return this.http.get(
      `${config.projection.baseUrl}${config.projection.endpoints.listTransactions}`,
      this.withAuth({ params: { jobId } }),
    );
  }

  /**
   * Gets a single payslip by ID.
   * GET /api/projections/payslips/:payslipId
   */
  async getPayslip(payslipId: string): Promise<AxiosResponse> {
    return this.http.get(
      `${config.projection.baseUrl}${config.projection.endpoints.getPayslip(payslipId)}`,
      this.withAuth(),
    );
  }

  /**
   * Searches payslips by employee ID.
   * GET /api/projections/payslips?employeeId=
   */
  async searchPayslipsByEmployee(employeeId: string): Promise<AxiosResponse> {
    return this.http.get(
      `${config.projection.baseUrl}${config.projection.endpoints.searchPayslips}`,
      this.withAuth({ params: { employeeId } }),
    );
  }

  // ---------------------------------------------------------------
  // Health Check
  // ---------------------------------------------------------------

  /**
   * Checks the health/liveness of a specific service.
   * GET /health/live
   */
  async healthCheck(serviceUrl: string): Promise<AxiosResponse> {
    return this.http.get(`${serviceUrl}${config.health.endpoint}`, {
      timeout: 5_000,
      validateStatus: () => true,
    });
  }

  // ---------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------

  /** Builds request config with JWT auth + optional extras. */
  private withAuth(extra?: Record<string, unknown>): AxiosRequestConfig {
    const headers: Record<string, string> = {};

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (extra) {
      // Copy flat string/number params into headers or axios config
      for (const [key, value] of Object.entries(extra)) {
        if (key === 'params') {
          // Pass through as axios query params
          continue;
        }
        headers[key] = String(value);
      }
    }

    return {
      headers,
      ...(extra?.params ? { params: extra.params as Record<string, string> } : {}),
    };
  }
}
