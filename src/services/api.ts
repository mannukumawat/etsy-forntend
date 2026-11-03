// Mock transport helpers. Every service function goes through `mockRequest`, which adds latency and
// (optionally) random failures so loading and error states can be exercised without a backend.
//
// Phase 2: replace `mockRequest(() => ...)` bodies with `fetch('/api/...')` calls returning the same types.

export class ApiError extends Error {
  constructor(
    public code: string,
    message?: string,
    public details?: unknown,
  ) {
    super(message ?? code);
    this.name = 'ApiError';
  }
}

export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function failureRate(): number {
  const fromEnv = Number(import.meta.env?.VITE_MOCK_FAILURE_RATE ?? 0);
  return Number.isFinite(fromEnv) ? Math.min(1, Math.max(0, fromEnv)) : 0;
}

const isTest = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test';

export async function mockRequest<T>(handler: () => T | Promise<T>, latency: [number, number] = [250, 650]): Promise<T> {
  if (!isTest) {
    const [min, max] = latency;
    await delay(min + Math.random() * (max - min));
    if (Math.random() < failureRate()) {
      throw new ApiError('network', 'Simulated network error');
    }
  }
  return handler();
}

/** Deep copy so callers can't mutate the in-memory "database". */
export function clone<T>(value: T): T {
  return structuredClone(value);
}

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${rand}`;
}
