import type { SavedAddress, User } from '@/types';
import { customerApi, customerAuthApi } from '@/api';

export const authService = {
  login(email: string, password: string): Promise<User> {
    return customerAuthApi.login(email, password);
  },

  register(input: { name: string; email: string; password: string }): Promise<User> {
    return customerAuthApi.register(input);
  },

  logout(): Promise<void> {
    return customerAuthApi.logout();
  },

  me(): Promise<User | null> {
    return customerAuthApi.me();
  },

  requestPasswordReset(email: string): Promise<void> {
    return customerAuthApi.requestPasswordReset(email);
  },

  confirmPasswordReset(token: string, password: string): Promise<void> {
    return customerAuthApi.confirmPasswordReset(token, password);
  },

  updateProfile(patch: { name: string; email: string; phone?: string }): Promise<User> {
    return customerApi.updateProfile(patch);
  },

  listAddresses(): Promise<SavedAddress[]> {
    return customerApi.listAddresses();
  },

  saveAddress(address: Omit<SavedAddress, 'id'> & { id?: string }): Promise<SavedAddress[]> {
    return customerApi.saveAddress(address);
  },

  deleteAddress(addressId: string): Promise<SavedAddress[]> {
    return customerApi.deleteAddress(addressId);
  },
};
