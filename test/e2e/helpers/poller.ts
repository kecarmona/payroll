import axios, { AxiosResponse } from 'axios';

/**
 * Error thrown when the poller exhausts all attempts without
 * the predicate being satisfied.
 */
export class PollerTimeoutError extends Error {
  constructor(
    public readonly url: string,
    public readonly attempts: number,
    public readonly lastResponse: AxiosResponse | null,
    public readonly lastError: Error | null,
  ) {
    super(
      `Polling timed out after ${attempts} attempts for URL: ${url}. ` +
        `Last response status: ${lastResponse?.status ?? 'N/A'}. ` +
        `Last error: ${lastError?.message ?? 'none'}`,
    );
    this.name = 'PollerTimeoutError';
  }
}

/** Configuration for the Poller. */
export interface PollerConfig {
  /** Interval between polling attempts in milliseconds (default: 1000). */
  intervalMs: number;
  /** Maximum number of polling attempts (default: 30). */
  maxAttempts: number;
}

/**
 * Async poller that repeatedly calls a URL until a predicate is met.
 *
 * Features:
 * - Configurable interval and max attempts
 * - Fail-fast on HTTP 404 (throws immediately)
 * - Throws PollerTimeoutError after max attempts
 * - Each attempt is a fresh GET request via axios
 */
export class Poller {
  private readonly intervalMs: number;
  private readonly maxAttempts: number;

  constructor(config?: Partial<PollerConfig>) {
    this.intervalMs = config?.intervalMs ?? 1_000;
    this.maxAttempts = config?.maxAttempts ?? 30;
  }

  /**
   * Polls the given URL until the predicate returns `true`.
   *
   * @param url - The full URL to poll via GET.
   * @param predicate - A function that receives the response and returns
   *   `true` when the desired state is reached.
   * @param headers - Optional headers for the GET request (e.g. auth).
   * @returns The last `AxiosResponse` that satisfied the predicate.
   * @throws PollerTimeoutError if max attempts are exhausted.
   * @throws AxiosError if the server returns 404 (fail-fast).
   */
  async waitFor(
    url: string,
    predicate: (response: AxiosResponse) => boolean,
    headers?: Record<string, string>,
  ): Promise<AxiosResponse> {
    let lastResponse: AxiosResponse | null = null;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        const response = await axios.get(url, {
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          timeout: 5_000,
          validateStatus: () => true, // Do not throw on non-2xx
        });

        lastResponse = response;

        // Fail-fast on 404 (resource not found — no point retrying)
        if (response.status === 404) {
          throw new PollerTimeoutError(
            url,
            attempt,
            response,
            new Error(`Resource not found (404) on attempt ${attempt}`),
          );
        }

        if (predicate(response)) {
          return response;
        }
      } catch (error) {
        // Re-throw PollerTimeoutError and non-axios errors immediately
        if (error instanceof PollerTimeoutError) {
          throw error;
        }
        if (!axios.isAxiosError(error)) {
          throw error;
        }
        lastError = error as Error;
      }

      // Wait before next attempt
      if (attempt < this.maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, this.intervalMs));
      }
    }

    throw new PollerTimeoutError(url, this.maxAttempts, lastResponse, lastError);
  }
}
