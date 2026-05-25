import React, { type CSSProperties, type ReactNode } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children?: ReactNode;
  style?: CSSProperties;
}

const variantStyles: Record<BadgeVariant, CSSProperties> = {
  success: {
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  warning: {
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
  },
  danger: {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  info: {
    background: 'var(--primary-light)',
    color: 'var(--primary-dark)',
    border: '1px solid #bfdbfe',
  },
  neutral: {
    background: '#f1f5f9',
    color: '#475569',
    border: '1px solid var(--border)',
  },
};

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '3px 10px',
  fontSize: '12px',
  fontWeight: 600,
  borderRadius: '9999px',
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
};

export default function Badge({ variant = 'neutral', children, style }: BadgeProps) {
  const colorStyle = variantStyles[variant];
  return (
    <span style={{ ...baseStyle, ...colorStyle, ...(style || {}) }}>
      {children}
    </span>
  );
}
