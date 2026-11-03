import type { SavedAddress, User, WishlistItem } from "@/types";
import { apiClient } from "./client";

// Customer-only endpoints (requires the httpOnly session cookie). Identity comes from the cookie, not
// from any id the caller passes — callers keep passing `userId` for mock-mode compatibility, and the
// API-mode branch below simply ignores it.

export function updateProfile(input: { name: string; email: string; phone?: string }): Promise<User> {
  return apiClient.put<{ customer: User }>("/api/customer/profile", { ...input, phone: input.phone ?? "" }).then((r) => r.customer);
}

export async function listAddresses(): Promise<SavedAddress[]> {
  const { items } = await apiClient.get<{ items: SavedAddress[] }>("/api/customer/addresses");
  return items;
}

export async function saveAddress(address: Omit<SavedAddress, "id"> & { id?: string }): Promise<SavedAddress[]> {
  const { items } = await apiClient.put<{ items: SavedAddress[] }>("/api/customer/addresses", address);
  return items;
}

export async function deleteAddress(addressId: string): Promise<SavedAddress[]> {
  const { items } = await apiClient.delete<{ items: SavedAddress[] }>(`/api/customer/addresses/${encodeURIComponent(addressId)}`);
  return items;
}

export async function fetchWishlist(): Promise<WishlistItem[]> {
  const { items } = await apiClient.get<{ items: WishlistItem[] }>("/api/customer/wishlist");
  return items;
}

export async function toggleWishlist(productId: string, variantId?: string): Promise<{ saved: boolean; items: WishlistItem[] }> {
  return apiClient.post<{ saved: boolean; items: WishlistItem[] }>("/api/customer/wishlist/toggle", { productId, variantId });
}

export async function removeWishlistItem(productId: string): Promise<WishlistItem[]> {
  const { items } = await apiClient.delete<{ items: WishlistItem[] }>(`/api/customer/wishlist/${encodeURIComponent(productId)}`);
  return items;
}
