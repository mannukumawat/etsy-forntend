import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications';
import type { NotificationItem } from '@/api/notifications';
import { EmptyState, ErrorState, Spinner } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/store/session';
import { cn } from '@/utils/cn';
import { formatDate } from '@/utils/dates';
import { useLanguage } from '@/hooks/useLocale';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const lang = useLanguage();
  const user = useAuth((s) => s.user)!;
  useDocumentTitle(t('account.notifications', { defaultValue: 'Notifications' }));

  const [markingAll, setMarkingAll] = useState(false);

  const { data, error, isLoading, reload } = useAsync(
    `notifications:list:${user.id}`,
    () => fetchNotifications(undefined, 50),
  );

  const [localItems, setLocalItems] = useState<NotificationItem[] | null>(null);
  const items = localItems ?? data?.items ?? [];

  const handleMarkRead = async (id: string) => {
    const previous = items;
    setLocalItems((prev) => (prev ?? items).map((n) => n.id === id ? { ...n, isRead: true } : n));
    // The read state is optimistic: if the server call fails, roll it back
    // instead of leaving the item shown as read while it is still unread.
    await markNotificationRead(id).catch(() => setLocalItems(previous));
  };

  const handleMarkAll = async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setLocalItems((prev) => (prev ?? items).map((n) => ({ ...n, isRead: true })));
    } catch { /* silent */ } finally {
      setMarkingAll(false);
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <ErrorState onRetry={reload} />;

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-ink">
          {t('account.notifications', { defaultValue: 'Notifications' })}
        </h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => void handleMarkAll()}
            disabled={markingAll}
            className="text-sm font-medium text-brand-600 hover:underline disabled:opacity-50"
          >
            {markingAll ? 'Marking…' : `Mark all as read (${unreadCount})`}
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-7 w-7" aria-hidden />}
          title={t('notifications.empty', { defaultValue: "You're all caught up" })}
        />
      ) : (
        <ul className="divide-y divide-sand-100 rounded-xl border border-sand-200 bg-white">
          {items.map((item) => (
            <li key={item.id}>
              <div
                className={cn(
                  'flex items-start gap-3 px-4 py-4',
                  !item.isRead && 'bg-brand-50/40',
                )}
              >
                {!item.isRead && (
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-500" />
                )}
                <div className={cn('min-w-0 flex-1', item.isRead && 'pl-5')}>
                  <p className="font-medium text-ink">{item.title}</p>
                  <p className="mt-0.5 text-sm text-ink-soft">{item.body}</p>
                  <p className="mt-1 text-xs text-ink-muted">{formatDate(item.createdAt, lang)}</p>
                </div>
                {!item.isRead && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(item.id)}
                    className="shrink-0 text-xs font-medium text-brand-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
