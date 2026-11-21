import type { User } from "@/types";
import { apiClient, setCsrfToken } from "./client";

type CustomerSessionResponse = { customer: User; csrfToken: string };

// Public customer-session endpoints. The server sets an httpOnly cookie; the browser never sees the
// token. Auth endpoints pass `skipAuthHandler` so their own 401s never trigger the global
// session-expiry handler (that would be a redirect loop on a plain wrong-password attempt).

export async function register(input: { name: string; email: string; phone?: string; password: string }): Promise<User> {
  const { customer, csrfToken } = await apiClient.post<CustomerSessionResponse>("/api/customer/auth/register", input, { skipAuthHandler: true });
  setCsrfToken(csrfToken);
  return customer;
}

export async function login(email: string, password: string): Promise<User> {
  const { customer, csrfToken } = await apiClient.post<CustomerSessionResponse>("/api/customer/auth/login", { email, password }, { skipAuthHandler: true });
  setCsrfToken(csrfToken);
  return customer;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post<{ ok: boolean }>("/api/customer/auth/logout", {}, { skipAuthHandler: true });
  } finally {
    setCsrfToken(null);
  }
}

/** Restores a session from the httpOnly cookie after a refresh. Null when signed out. */
export async function me(): Promise<User | null> {
  try {
    const { customer, csrfToken } = await apiClient.get<CustomerSessionResponse>("/api/customer/auth/me", { skipAuthHandler: true });
    setCsrfToken(csrfToken);
    return customer;
  } catch {
    setCsrfToken(null);
    return null;
  }
}

export function requestPasswordReset(email: string): Promise<void> {
  return apiClient.post<{ ok: boolean }>("/api/customer/auth/password-reset/request", { email }, { skipAuthHandler: true }).then(() => undefined);
}

export function confirmPasswordReset(token: string, password: string): Promise<void> {
  return apiClient.post<{ ok: boolean }>("/api/customer/auth/password-reset/confirm", { token, password }, { skipAuthHandler: true }).then(() => undefined);
}
