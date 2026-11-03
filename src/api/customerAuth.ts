import type { User } from "@/types";
import { apiClient } from "./client";

// Public customer-session endpoints. The server sets an httpOnly cookie; the browser never sees the
// token. Auth endpoints pass `skipAuthHandler` so their own 401s never trigger the global
// session-expiry handler (that would be a redirect loop on a plain wrong-password attempt).

export function register(input: { name: string; email: string; password: string }): Promise<User> {
  return apiClient.post<{ customer: User }>("/api/customer/auth/register", input, { skipAuthHandler: true }).then((r) => r.customer);
}

export function login(email: string, password: string): Promise<User> {
  return apiClient.post<{ customer: User }>("/api/customer/auth/login", { email, password }, { skipAuthHandler: true }).then((r) => r.customer);
}

export function logout(): Promise<void> {
  return apiClient.post<{ ok: boolean }>("/api/customer/auth/logout", {}, { skipAuthHandler: true }).then(() => undefined);
}

/** Restores a session from the httpOnly cookie after a refresh. Null when signed out. */
export async function me(): Promise<User | null> {
  try {
    const r = await apiClient.get<{ customer: User }>("/api/customer/auth/me", { skipAuthHandler: true });
    return r.customer;
  } catch {
    return null;
  }
}

export function requestPasswordReset(email: string): Promise<void> {
  return apiClient.post<{ ok: boolean }>("/api/customer/auth/password-reset/request", { email }, { skipAuthHandler: true }).then(() => undefined);
}

export function confirmPasswordReset(token: string, password: string): Promise<void> {
  return apiClient.post<{ ok: boolean }>("/api/customer/auth/password-reset/confirm", { token, password }, { skipAuthHandler: true }).then(() => undefined);
}
