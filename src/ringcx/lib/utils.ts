/**
 * Common utility functions
 */

/**
 * Sleep for a specified duration
 * @param ms - Duration in milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Options for waitUntilTo function
 */
export interface WaitUntilToOptions {
  /** Timeout in milliseconds */
  timeout?: number;
  /** Interval between retries in milliseconds */
  interval?: number;
}

/**
 * Wait until a condition is met or timeout occurs
 * @param fn - Function that returns a promise resolving to the condition result
 * @param options - Wait options
 */
export async function waitUntilTo<T>(
  fn: () => Promise<T>,
  options: WaitUntilToOptions = {},
): Promise<T> {
  const { timeout = 30000, interval = 100 } = options;
  const startTime = Date.now();

  while (true) {
    try {
      const result = await fn();
      if (result !== undefined && result !== null && result !== false) {
        return result;
      }
    } catch (error) {
      // Continue waiting
    }

    if (Date.now() - startTime >= timeout) {
      throw new Error('waitUntilTo timeout');
    }

    await sleep(interval);
  }
}

/**
 * Check if a string is blank (null, undefined, or empty after trimming)
 * @param str - String to check
 */
export function isBlank(str: string | null | undefined): boolean {
  return str === null || str === undefined || str.trim() === '';
}
