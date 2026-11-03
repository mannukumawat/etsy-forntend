import { DEMO_ACCOUNT } from '@/config/store';
import type { SavedAddress, User } from '@/types';
import { API_MODE, customerApi, customerAuthApi } from '@/api';
import { ApiError, clone, mockRequest, newId } from './api';
import { db, type DbUser } from './mockDb';

// SIMULATED authentication. Passwords are compared only for the documented demo account and are never stored.
// Phase 2 endpoints (suggested): POST /api/auth/login, /register, /forgot-password, /logout; GET/PATCH /api/me;
// GET/POST/PATCH/DELETE /api/me/addresses. Use httpOnly cookies for sessions — not localStorage.

function toUser(u: DbUser): User {
  const { addresses: _addresses, ...user } = u;
  return clone(user);
}

function findByEmail(email: string): DbUser | undefined {
  const e = email.trim().toLowerCase();
  return [...db.users.values()].find((u) => u.email.toLowerCase() === e);
}

function requireUser(userId: string): DbUser {
  const u = db.users.get(userId);
  if (!u) throw new ApiError('unauthorized', 'Session expired');
  return u;
}

export const authService = {
  login(email: string, password: string): Promise<User> {
    if (API_MODE) return customerAuthApi.login(email, password);
    return mockRequest(() => {
      const user = findByEmail(email);
      if (!user) throw new ApiError('no_account');
      if (user.isDemoAccount && password !== DEMO_ACCOUNT.password) throw new ApiError('invalid_credentials');
      // Accounts registered during this session have no stored password, so any non-empty password is accepted.
      return toUser(user);
    }, [500, 900]);
  },

  register(input: { name: string; email: string; password: string }): Promise<User> {
    if (API_MODE) return customerAuthApi.register(input);
    return mockRequest(() => {
      if (findByEmail(input.email)) throw new ApiError('email_taken');
      const user: DbUser = {
        id: newId('u'),
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        isDemoAccount: false,
        addresses: [],
      };
      db.users.set(user.id, user);
      return toUser(user);
    }, [600, 1000]);
  },

  logout(): Promise<void> {
    if (API_MODE) return customerAuthApi.logout();
    return Promise.resolve();
  },

  /** Restores a session from the httpOnly cookie after a refresh. Null in mock mode or when signed out. */
  me(): Promise<User | null> {
    if (!API_MODE) return Promise.resolve(null);
    return customerAuthApi.me();
  },

  requestPasswordReset(email: string): Promise<void> {
    if (API_MODE) return customerAuthApi.requestPasswordReset(email);
    // Always resolves to avoid revealing whether an account exists.
    return mockRequest(() => undefined, [600, 1000]);
  },

  /** New real capability: setting a new password from the link sent by requestPasswordReset. The mock
   *  never modelled this step (it had no real password storage to reset). */
  confirmPasswordReset(token: string, password: string): Promise<void> {
    if (API_MODE) return customerAuthApi.confirmPasswordReset(token, password);
    return mockRequest(() => undefined, [600, 1000]);
  },

  updateProfile(userId: string, patch: { name: string; email: string; phone?: string }): Promise<User> {
    if (API_MODE) return customerApi.updateProfile(patch);
    return mockRequest(() => {
      const user = requireUser(userId);
      const other = findByEmail(patch.email);
      if (other && other.id !== userId) throw new ApiError('email_taken');
      user.name = patch.name.trim();
      user.email = patch.email.trim().toLowerCase();
      user.phone = patch.phone?.trim() || undefined;
      return toUser(user);
    });
  },

  listAddresses(userId: string): Promise<SavedAddress[]> {
    if (API_MODE) return customerApi.listAddresses();
    return mockRequest(() => clone(requireUser(userId).addresses), [150, 350]);
  },

  saveAddress(userId: string, address: Omit<SavedAddress, 'id'> & { id?: string }): Promise<SavedAddress[]> {
    if (API_MODE) return customerApi.saveAddress(address);
    return mockRequest(() => {
      const user = requireUser(userId);
      const record: SavedAddress = { ...address, id: address.id ?? newId('addr') };
      const exists = user.addresses.some((a) => a.id === record.id);
      user.addresses = exists ? user.addresses.map((a) => (a.id === record.id ? record : a)) : [...user.addresses, record];
      if (record.isDefault || user.addresses.length === 1) {
        user.addresses = user.addresses.map((a) => ({ ...a, isDefault: a.id === record.id }));
      }
      return clone(user.addresses);
    });
  },

  deleteAddress(userId: string, addressId: string): Promise<SavedAddress[]> {
    if (API_MODE) return customerApi.deleteAddress(addressId);
    return mockRequest(() => {
      const user = requireUser(userId);
      const wasDefault = user.addresses.find((a) => a.id === addressId)?.isDefault;
      user.addresses = user.addresses.filter((a) => a.id !== addressId);
      if (wasDefault && user.addresses[0]) user.addresses[0].isDefault = true;
      return clone(user.addresses);
    });
  },
};
