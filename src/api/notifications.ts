import { apiClient } from './client';

export interface NotificationItem {
  id: string;
  kind: 'customer' | 'owner';
  recipientId: string;
  event: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  pushStatus: string;
  createdAt: string;
}

export interface NotificationPage {
  items: NotificationItem[];
  nextCursor: string | null;
}

export function fetchNotifications(cursor?: string, limit = 20, signal?: AbortSignal): Promise<NotificationPage> {
  return apiClient.get<NotificationPage>('/api/customer/notifications', {
    query: { cursor, limit },
    signal,
  });
}

export function fetchUnreadCount(signal?: AbortSignal): Promise<{ count: number }> {
  return apiClient.get<{ count: number }>('/api/customer/notifications/unread-count', { signal });
}

export function markNotificationRead(id: string): Promise<{ ok: boolean }> {
  return apiClient.patch<{ ok: boolean }>(`/api/customer/notifications/${encodeURIComponent(id)}/read`, {});
}

export function markAllNotificationsRead(): Promise<{ ok: boolean }> {
  return apiClient.post<{ ok: boolean }>('/api/customer/notifications/read-all');
}

export function registerFcmToken(token: string): Promise<{ ok: boolean }> {
  return apiClient.post<{ ok: boolean }>('/api/customer/notifications/token', { token });
}

export function deleteFcmToken(token: string): Promise<{ ok: boolean }> {
  return apiClient.delete<{ ok: boolean }>('/api/customer/notifications/token', { body: { token } } as never);
}
