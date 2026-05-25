import React, { type ButtonHTMLAttributes, type CSSProperties, type ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontWeight: 600,
  border: '2px solid transparent',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  fontFamily: 'inherit',
  lineHeight: 1,
  whiteSpace: 'nowrap',
  textDecoration: 'none',
  outline: 'none',
};

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: '13px', borderRadius: '6px' },
  md: { padding: '10px 20px', fontSize: '14px' },
  lg: { padding: '14px 28px', fontSize: '16px', borderRadius: '10px' },
};

function getVariantStyle(variant: ButtonVariant): CSSProperties {
  switch (variant) {
    case 'primary':
      return {
        background: 'var(--primary)',
        color: '#ffffff',
        borderColor: 'var(--primary)',
      };
    case 'secondary':
      return {
        background: 'var(--primary-light)',
        color: 'var(--primary)',
        borderColor: 'var(--primary-light)',
      };
    case 'danger':
      return {
        background: 'var(--danger)',
        color: '#ffffff',
        borderColor: 'var(--danger)',
      };
    case 'success':
      return {
        background: 'var(--success)',
        color: '#ffffff',
        borderColor: 'var(--success)',
      };
    case 'ghost':
      return {
        background: 'transparent',
        color: 'var(--text)',
        borderColor: 'transparent',
      };
    case 'outline':
      return {
        background: 'transparent',
        color: 'var(--primary)',
        borderColor: 'var(--primary)',
      };
    default:
      return {};
  }
}

const disabledStyle: CSSProperties = {
  opacity: 0.5,
  cursor: 'not-allowed',
  pointerEvents: 'none',
};

const spinnerStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: 'currentColor',
  borderRadius: '50%',
  animation: 'btn-spin 0.6s linear infinite',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  style,
  disabled,
  ...rest
}: ButtonProps) {
  const variantStyle = getVariantStyle(variant);
  const sizeStyle = sizeStyles[size];

  return (
    <>
      <style>{`@keyframes btn-spin{to{transform:rotate(360deg)}}`}</style>
      <button
        style={{
          ...baseStyle,
          ...sizeStyle,
          ...variantStyle,
          ...(disabled || loading ? disabledStyle : {}),
          ...(style || {}),
        }}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span style={spinnerStyle} />
        ) : icon ? (
          <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>
        ) : null}
        {children}
      </button>
    </>
  );
}
