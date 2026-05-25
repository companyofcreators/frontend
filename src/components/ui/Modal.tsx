import React, { type CSSProperties, type ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children?: ReactNode;
  width?: number | string;
  footer?: ReactNode;
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  animation: 'modal-fade-in 0.2s ease',
};

const modalStyle: CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '16px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.2), 0 8px 20px rgba(0,0,0,0.1)',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  animation: 'modal-slide-in 0.25s ease',
  width: '100%',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '20px 24px 16px',
  borderBottom: '1px solid var(--border)',
};

const titleStyle: CSSProperties = {
  margin: 0,
  fontSize: '18px',
  fontWeight: 600,
  color: 'var(--text)',
};

const closeBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  border: 'none',
  background: 'transparent',
  borderRadius: '8px',
  cursor: 'pointer',
  color: 'var(--text-muted)',
  transition: 'background 0.15s ease, color 0.15s ease',
};

const bodyStyle: CSSProperties = {
  padding: '20px 24px',
  overflowY: 'auto',
  flex: 1,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  padding: '16px 24px',
  borderTop: '1px solid var(--border)',
};

export default function Modal({ open, onClose, title, children, width, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes modal-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-slide-in { from { opacity: 0; transform: translateY(-20px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
      <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={{ ...modalStyle, maxWidth: width ?? '560px' }}>
          {title && (
            <div style={headerStyle}>
              <h2 style={titleStyle}>{title}</h2>
              <button
                style={closeBtnStyle}
                onClick={onClose}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          )}
          <div style={bodyStyle}>{children}</div>
          {footer && <div style={footerStyle}>{footer}</div>}
        </div>
      </div>
    </>,
    document.body
  );
}
