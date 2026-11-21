import type { SavedAddress, User } from '@/types';
import { customerApi, customerAuthApi } from '@/api';
import { unregisterFcmToken } from '@/api/notifications';
import { clearRegisteredFcmToken, getRegisteredFcmToken } from '@/hooks/useFcmToken';

export const authService = {
  login(email: string, password: string): Promise<User> {
    return customerAuthApi.login(email, password);
  },

  register(input: { name: string; email: string; phone?: string; password: string }): Promise<User> {
    return customerAuthApi.register(input);
  },

  async logout(): Promise<void> {
    // Best-effort: unregister this device's push token so the signed-out device
    // stops receiving the previous account's notifications. Never blocks logout.
    const fcmToken = getRegisteredFcmToken();
    if (fcmToken) {
      clearRegisteredFcmToken();
      await unregisterFcmToken(fcmToken).catch(() => {});
    }
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

  updateProfile(patch: {
    name: string; email: string; phone?: string;
    avatarUrl?: string; gender?: string; languages?: string; occupation?: string;
    pincode?: string; city?: string; state?: string; dateOfBirth?: string;
    maritalStatus?: string; numberOfKids?: string; education?: string; monthlyIncome?: string;
  }): Promise<User> {
    return customerApi.updateProfile(patch);
  },

  uploadAvatar(input: { fileName: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp'; base64: string; width: number | null; height: number | null }): Promise<User> {
    return customerApi.uploadAvatar(input);
  },

  deleteAccount(): Promise<void> {
    return customerApi.deleteAccount();
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
