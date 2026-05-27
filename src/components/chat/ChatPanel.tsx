import React, { useState, useEffect, useRef, useCallback, type CSSProperties, type KeyboardEvent } from 'react';
import { chat as chatApi } from '../../lib/api';
import {
  connectChat,
  sendChatMessage,
  sendTypingStart,
  sendTypingStop,
  markMessagesRead,
  wsManager,
} from '../../lib/ws';
import type { Message, WSEvent } from '../../lib/types';
import { Send } from 'lucide-react';

interface ChatPanelProps {
  chatId: string;
  userId: string;
}

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  background: 'var(--surface)',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  padding: '14px 18px',
  borderBottom: '1px solid var(--border)',
  fontWeight: 600,
  fontSize: '15px',
  color: 'var(--text)',
  background: 'var(--bg)',
};

const messagesContainerStyle: CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const messageRowStyle = (isOwn: boolean): CSSProperties => ({
  display: 'flex',
  justifyContent: isOwn ? 'flex-end' : 'flex-start',
});

const messageBubbleStyle = (isOwn: boolean): CSSProperties => ({
  maxWidth: '75%',
  padding: '10px 14px',
  borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
  background: isOwn ? 'var(--primary)' : '#f1f5f9',
  color: isOwn ? '#fff' : 'var(--text)',
  fontSize: '14px',
  lineHeight: 1.5,
  wordBreak: 'break-word',
});

const messageTimeStyle = (isOwn: boolean): CSSProperties => ({
  fontSize: '11px',
  color: isOwn ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
  marginTop: '4px',
  textAlign: isOwn ? 'right' : 'left',
});

const inputContainerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 16px',
  borderTop: '1px solid var(--border)',
  background: 'var(--surface)',
};

const inputStyle: CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'inherit',
  color: 'var(--text)',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: '24px',
  outline: 'none',
  transition: 'border-color 0.2s ease',
};

const sendBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  border: 'none',
  background: 'var(--primary)',
  color: '#fff',
  cursor: 'pointer',
  transition: 'opacity 0.2s ease',
};

const typingStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-muted)',
  fontStyle: 'italic',
  padding: '0 16px 4px',
  minHeight: '18px',
};

const emptyStateStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: 'var(--text-muted)',
  fontSize: '14px',
};

export default function ChatPanel({ chatId, userId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to bottom helper
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Load message history from REST API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setMessages([]);

    chatApi
      .messages(chatId)
      .then((msgs) => {
        setMessages(msgs);
        scrollToBottom();
      })
      .catch(() => {
        // Failed to load messages, will show empty state
      })
      .finally(() => setLoading(false));
  }, [chatId, scrollToBottom]);

  // Connect to WebSocket for real-time messages
  useEffect(() => {
    const disconnect = connectChat();

    const handleEvent = (event: WSEvent) => {
      if (event.type === 'message.new' && event.chat_id === chatId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === event.message.id)) return prev;
          return [...prev, event.message];
        });
        scrollToBottom();
        // Mark as read
        if (event.message.sender_id !== userId) {
          markMessagesRead(chatId);
        }
      }

      if (
        event.type === 'typing' &&
        event.chat_id === chatId &&
        event.user_id !== userId
      ) {
        if (event.is_typing) {
          setTypingUserId(event.user_id);
          // Auto-clear typing after 3 seconds
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTypingUserId(null), 3000);
        } else {
          setTypingUserId(null);
        }
      }

      if (event.type === 'messages.read' && event.chat_id === chatId) {
        // Another user read our messages; not much to update visually
      }
    };

    const unlisten = wsManager.listen('chat', handleEvent);

    return () => {
      unlisten();
      disconnect();
    };
  }, [chatId, userId, scrollToBottom]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = useCallback(async () => {
    const text = newMessage.trim();
    if (!text) return;

    setSending(true);
    setSendError('');
    setNewMessage('');
    sendTypingStop(chatId);

    // Try WebSocket first, fall back to REST API
    const sentViaWS = sendChatMessage(chatId, text);
    if (!sentViaWS) {
      try {
        await chatApi.send(chatId, text);
        // Reload messages to show the new one
        const msgs = await chatApi.messages(chatId);
        setMessages(msgs);
      } catch (err) {
        setSendError(err instanceof Error ? err.message : 'Не удалось отправить сообщение');
        setNewMessage(text); // restore input on failure
      }
    }
    setSending(false);
  }, [chatId, newMessage]);

  const handleInputChange = useCallback(
    (value: string) => {
      setNewMessage(value);
      if (value && !typingTimerRef.current) {
        sendTypingStart(chatId);
      }
      if (!value) {
        sendTypingStop(chatId);
      }
    },
    [chatId]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  // Focus input and mark as read
  useEffect(() => {
    markMessagesRead(chatId);
  }, [chatId]);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
          ' ' +
          d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>Chat</div>

      <div ref={containerRef} style={messagesContainerStyle}>
        {loading && (
          <div style={emptyStateStyle}>Loading messages...</div>
        )}

        {!loading && messages.length === 0 && (
          <div style={emptyStateStyle}>No messages yet. Start the conversation!</div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === userId;
          return (
            <div key={msg.id} style={messageRowStyle(isOwn)}>
              <div>
                <div style={messageBubbleStyle(isOwn)}>{msg.message}</div>
                <div style={messageTimeStyle(isOwn)}>{formatTime(msg.created_at)}</div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {sendError && (
        <div style={{ ...typingStyle, color: 'var(--danger)', fontStyle: 'normal', padding: '0 16px 4px' }}>
          {sendError}
        </div>
      )}

      {typingUserId && (
        <div style={typingStyle}>Someone is typing...</div>
      )}

      <div style={inputContainerStyle}>
        <input
          style={inputStyle}
          value={newMessage}
          onChange={(e) => handleInputChange(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          onFocus={() => {
            if (inputStyle.borderColor) {
              inputStyle.borderColor = undefined;
            }
          }}
        />
        <button
          style={{
            ...sendBtnStyle,
            opacity: newMessage.trim() && !sending ? 1 : 0.5,
          }}
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
