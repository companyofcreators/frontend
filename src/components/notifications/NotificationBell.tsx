import React, { useState, useEffect, useCallback, useRef, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications as notificationsApi } from '../../lib/api';
import { connectNotifications, wsManager } from '../../lib/ws';
import type { Notification, WSEvent } from '../../lib/types';
import { Bell, CheckCheck } from 'lucide-react';

interface NotificationBellProps {
  style?: CSSProperties;
}

const bellBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '38px',
  height: '38px',
  border: 'none',
  background: 'transparent',
  borderRadius: '8px',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  position: 'relative',
  transition: 'background 0.15s ease',
};

const badgeStyle: CSSProperties = {
  position: 'absolute',
  top: '2px',
  right: '2px',
  minWidth: '18px',
  height: '18px',
  borderRadius: '999px',
  background: 'var(--danger)',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 1,
  padding: '0 4px',
  boxSizing: 'border-box',
};

const dropdownStyle: CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  marginTop: '8px',
  width: '340px',
  maxHeight: '400px',
  overflowY: 'auto',
  background: 'var(--surface)',
  borderRadius: '12px',
  boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
  border: '1px solid var(--border)',
  zIndex: 250,
};

const dropdownHeaderStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '14px 16px',
  borderBottom: '1px solid var(--border)',
  fontWeight: 600,
  fontSize: '14px',
  color: 'var(--text)',
};

const markReadBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  color: 'var(--primary)',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  fontFamily: 'inherit',
  padding: '4px 8px',
  borderRadius: '6px',
  transition: 'background 0.15s ease',
};

const notificationItemStyle = (unread: boolean): CSSProperties => ({
  padding: '12px 16px',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
  background: unread ? 'var(--primary-light)' : 'transparent',
  transition: 'background 0.1s ease',
});

const notificationTitleStyle = (unread: boolean): CSSProperties => ({
  fontSize: '13px',
  fontWeight: unread ? 600 : 400,
  color: 'var(--text)',
  marginBottom: '2px',
});

const notificationMsgStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  lineHeight: 1.4,
};

const notificationTimeStyle: CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
  marginTop: '4px',
};

const emptyStateStyle: CSSProperties = {
  padding: '24px 16px',
  textAlign: 'center',
  color: 'var(--text-muted)',
  fontSize: '13px',
};

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 249,
};

function formatNotifTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

export default function NotificationBell({ style }: NotificationBellProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Fetch initial notifications
  useEffect(() => {
    notificationsApi
      .list()
      .then((list) => setNotifications(list))
      .catch(() => {});
  }, []);

  // Connect to WebSocket for real-time updates
  useEffect(() => {
    const disconnect = connectNotifications();

    const handleEvent = (event: WSEvent) => {
      if (event.type === 'notification.new') {
        setNotifications((prev) => {
          if (prev.some((n) => n.id === event.notification.id)) return prev;
          return [event.notification, ...prev];
        });
      }
      if (event.type === 'notification.unread_count') {
        // The count is tracked from the list; this can trigger a refresh
        notificationsApi
          .list()
          .then((list) => setNotifications(list))
          .catch(() => {});
      }
    };

    const unlisten = wsManager.listen('notifications', handleEvent);

    return () => {
      unlisten();
      disconnect();
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    try {
      await notificationsApi.readAll();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  }, []);

  const handleMarkOneRead = useCallback(
    async (id: string) => {
      try {
        await notificationsApi.readOne(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      } catch {
        // ignore
      }
    },
    []
  );

  return (
    <div ref={containerRef} style={{ position: 'relative', ...(style || {}) }}>
      <button
        style={bellBtnStyle}
        onClick={handleToggle}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        }}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} />
        {unreadCount > 0 && <span style={badgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <>
          <div style={backdropStyle} onClick={() => setOpen(false)} />
          <div style={dropdownStyle}>
            <div style={dropdownHeaderStyle}>
              <span>Notifications</span>
              {unreadCount > 0 && (
                <button style={markReadBtnStyle} onClick={handleMarkAllRead}>
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 && (
              <div style={emptyStateStyle}>No notifications yet</div>
            )}

            {notifications.map((notif) => (
              <div
                key={notif.id}
                style={notificationItemStyle(!notif.is_read)}
                onClick={async () => {
                  if (!notif.is_read) await handleMarkOneRead(notif.id);
                  // Navigate based on notification type if needed
                  if (notif.type.includes('order')) {
                    setOpen(false);
                    navigate('/orders');
                  } else if (notif.type.includes('offer')) {
                    setOpen(false);
                    navigate('/orders');
                  } else {
                    setOpen(false);
                  }
                }}
                onMouseEnter={(e) => {
                  if (!notif.is_read) {
                    (e.currentTarget as HTMLDivElement).style.background = '#bfdbfe';
                  } else {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = notif.is_read
                    ? 'transparent'
                    : 'var(--primary-light)';
                }}
              >
                <div style={notificationTitleStyle(!notif.is_read)}>{notif.title}</div>
                <div style={notificationMsgStyle}>{notif.message}</div>
                <div style={notificationTimeStyle}>{formatNotifTime(notif.created_at)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
