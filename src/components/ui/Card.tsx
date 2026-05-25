import React, { type CSSProperties, type ReactNode } from 'react';

interface CardProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const cardStyle: CSSProperties = {
  background: 'var(--surface)',
  borderRadius: '12px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
  overflow: 'hidden',
  border: '1px solid var(--border)',
};

const sectionStyle: CSSProperties = {
  padding: '16px 20px',
};

const headerStyle: CSSProperties = {
  ...sectionStyle,
  borderBottom: '1px solid var(--border)',
  fontWeight: 600,
  fontSize: '16px',
  color: 'var(--text)',
};

const bodyStyle: CSSProperties = {
  ...sectionStyle,
  flex: 1,
};

const footerStyle: CSSProperties = {
  ...sectionStyle,
  borderTop: '1px solid var(--border)',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
};

export default function Card({ children, style, className, onClick, hoverable }: CardProps) {
  return (
    <div
      className={className}
      style={{
        ...cardStyle,
        ...(hoverable
          ? { cursor: 'pointer', transition: 'box-shadow 0.2s ease, transform 0.2s ease' }
          : {}),
        ...(style || {}),
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 4px 12px rgba(0,0,0,0.12), 0 2px 4px rgba(0,0,0,0.08)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        }
      }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...headerStyle, ...(style || {}) }}>{children}</div>;
}

export function CardBody({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...bodyStyle, ...(style || {}) }}>{children}</div>;
}

export function CardFooter({ children, style }: { children?: ReactNode; style?: CSSProperties }) {
  return <div style={{ ...footerStyle, ...(style || {}) }}>{children}</div>;
}
