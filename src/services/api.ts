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

export function newId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      : Math.random().toString(36).slice(2, 18);
  return `${prefix}_${rand}`;
}
