import React, { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { useAuth } from '../lib/auth';
import { chat as chatApi } from '../lib/api';
import { wsManager, connectChat } from '../lib/ws';
import type { Chat, WSEvent } from '../lib/types';
import ChatPanel from '../components/chat/ChatPanel';
import Badge from '../components/ui/Badge';
import { MessageSquare } from 'lucide-react';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const pageStyle: CSSProperties = {
  display: 'flex',
  height: 'calc(100vh - 100px)',
  maxHeight: 'calc(100vh - 100px)',
  gap: '0',
  overflow: 'hidden',
};

const sidebarStyle: CSSProperties = {
  width: '320px',
  flexShrink: 0,
  background: 'var(--surface)',
  borderRadius: '12px 0 0 12px',
  border: '1px solid var(--border)',
  borderRight: 'none',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const sidebarHeaderStyle: CSSProperties = {
  padding: '16px 20px',
  borderBottom: '1px solid var(--border)',
  fontSize: '16px',
  fontWeight: 600,
  color: 'var(--text)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const chatListStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
};

const chatItemStyle = (active: boolean): CSSProperties => ({
  padding: '14px 20px',
  borderBottom: '1px solid var(--border)',
  cursor: 'pointer',
  background: active ? 'var(--primary-light)' : 'transparent',
  transition: 'background 0.1s ease',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
});

const chatAvatarStyle: CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'var(--primary)',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '14px',
  fontWeight: 600,
  flexShrink: 0,
};

const chatInfoStyle: CSSProperties = {
  flex: 1,
  minWidth: 0,
};

const chatNameStyle: CSSProperties = {
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--text)',
  marginBottom: '3px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const chatLastMsgStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const chatTimeStyle: CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
  whiteSpace: 'nowrap',
  marginTop: '2px',
};

const rightPanelStyle: CSSProperties = {
  flex: 1,
  background: 'var(--surface)',
  borderRadius: '0 12px 12px 0',
  border: '1px solid var(--border)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

const placeholderStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'var(--text-muted)',
  fontSize: '16px',
  flexDirection: 'column',
  gap: '12px',
};

const emptyListStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'var(--text-muted)',
  fontSize: '14px',
  textAlign: 'center',
  padding: '20px',
};

export default function ChatPage() {
  const { userId } = useAuth();

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedChat = chats.find((c) => c.id === selectedChatId) ?? null;

  const fetchChats = useCallback(async () => {
    try {
      setError('');
      const list = await chatApi.list();
      setChats(list);
      // Auto-select first chat if none selected
      setSelectedChatId((current) => current ?? list[0]?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки чатов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchChats();
  }, [fetchChats]);

  // WebSocket for chat updates
  useEffect(() => {
    const disconnect = connectChat();

    const handleEvent = (event: WSEvent) => {
      if (event.type === 'message.new') {
        setChats((prev) =>
          prev.map((c) =>
            c.id === event.chat_id
              ? {
                  ...c,
                  last_message: event.message,
                  unread_count: c.id === selectedChatId ? 0 : c.unread_count + 1,
                }
              : c
          )
        );
      }
    };

    const unlisten = wsManager.listen('chat', handleEvent);

    return () => {
      unlisten();
      disconnect();
    };
  }, [selectedChatId]);

  if (!userId) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
        Необходимо войти в систему
      </div>
    );
  }

  return (
    <div style={pageStyle} className="chat-page">
      <style>{`
        @media (max-width: 768px) {
          .chat-page { flex-direction: column !important; height: auto !important; max-height: none !important; }
        }
      `}</style>

      {/* Chat list sidebar */}
      <div style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <MessageSquare size={20} />
          Чаты
        </div>
        <div style={chatListStyle}>
          {loading && (
            <div style={emptyListStyle}>Загрузка чатов...</div>
          )}

          {!loading && error && (
            <div style={{ ...emptyListStyle, color: 'var(--danger)' }}>{error}</div>
          )}

          {!loading && !error && chats.length === 0 && (
            <div style={emptyListStyle}>Нет активных чатов</div>
          )}

          {chats.map((chat) => {
            const otherName =
              chat.last_message?.sender_id === userId
                ? 'Вы'
                : chat.master_id === userId
                  ? chat.customer_id.substring(0, 8)
                  : chat.master_id.substring(0, 8);
            const initial = otherName.charAt(0).toUpperCase();

            return (
              <div
                key={chat.id}
                style={chatItemStyle(chat.id === selectedChatId)}
                onClick={() => {
                  setSelectedChatId(chat.id);
                }}
                onMouseEnter={(e) => {
                  if (chat.id !== selectedChatId) {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (chat.id !== selectedChatId) {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                  }
                }}
              >
                <div style={chatAvatarStyle}>{initial}</div>
                <div style={chatInfoStyle}>
                  <div style={chatNameStyle}>
                    Заказ: {chat.order_id.substring(0, 8)}
                  </div>
                  {chat.last_message && (
                    <div style={chatLastMsgStyle}>
                      {chat.last_message.message.substring(0, 60)}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  {chat.last_message && (
                    <div style={chatTimeStyle}>
                      {formatDate(chat.last_message.created_at)}
                    </div>
                  )}
                  {chat.unread_count > 0 && (
                    <Badge variant="info">{chat.unread_count}</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div style={rightPanelStyle}>
        {selectedChat ? (
          <ChatPanel chatId={selectedChat.id} userId={userId} />
        ) : (
          <div style={placeholderStyle}>
            <MessageSquare size={48} style={{ color: 'var(--border)' }} />
            Выберите чат
          </div>
        )}
      </div>
    </div>
  );
}
