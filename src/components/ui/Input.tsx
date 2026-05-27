import React, { type CSSProperties, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';

interface InputBaseProps {
  label?: string;
  error?: string;
  icon?: ReactNode;
  containerStyle?: CSSProperties;
}

type InputProps = InputBaseProps &
  InputHTMLAttributes<HTMLInputElement> & { textarea?: false; rows?: never };

type TextareaProps = InputBaseProps &
  TextareaHTMLAttributes<HTMLTextAreaElement> & { textarea: true; rows?: number };

type CombinedProps = InputProps | TextareaProps;

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: 'var(--text)',
  marginBottom: '6px',
};

const inputBaseStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '14px',
  fontFamily: 'inherit',
  color: 'var(--text)',
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
  boxSizing: 'border-box',
};

const inputFocusStyle: CSSProperties = {
  borderColor: 'var(--primary)',
  boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
};

const inputErrorStyle: CSSProperties = {
  borderColor: 'var(--danger)',
  boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
};

const errorTextStyle: CSSProperties = {
  fontSize: '12px',
  color: 'var(--danger)',
  marginTop: '4px',
};

const iconWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const iconStyle: CSSProperties = {
  position: 'absolute',
  left: '12px',
  display: 'flex',
  alignItems: 'center',
  color: 'var(--text-muted)',
  pointerEvents: 'none',
};

const inputWithIconStyle: CSSProperties = {
  paddingLeft: '38px',
};

export default function Input(props: CombinedProps) {
  const { label, error, icon, containerStyle, ...rest } = props;
  const [focused, setFocused] = React.useState(false);
  const isTextarea = (rest as TextareaProps).textarea === true;

  const computedInputStyle: CSSProperties = {
    ...inputBaseStyle,
    ...(icon ? inputWithIconStyle : {}),
    ...(focused ? inputFocusStyle : {}),
    ...(error ? inputErrorStyle : {}),
    ...((rest.style as CSSProperties) || {}),
  };

  const textareaStyle: CSSProperties = {
    ...computedInputStyle,
    resize: 'vertical',
    minHeight: '80px',
  };

  if (isTextarea) {
    const { textarea, rows, ...textareaRest } = rest as TextareaProps;
    void textarea;
    return (
      <div style={{ marginBottom: '16px', ...(containerStyle || {}) }}>
        {label && <label style={labelStyle}>{label}</label>}
        <div style={iconWrapStyle}>
          {icon && <span style={iconStyle}>{icon}</span>}
          <textarea
            style={textareaStyle}
            rows={rows ?? 4}
            onFocus={(e) => {
              setFocused(true);
              textareaRest.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              textareaRest.onBlur?.(e);
            }}
            {...textareaRest}
          />
        </div>
        {error && <div style={errorTextStyle}>{error}</div>}
      </div>
    );
  }

  const { textarea, ...inputRest } = rest as InputProps & { textarea?: boolean };
  void textarea;
  return (
    <div style={{ marginBottom: '16px', ...(containerStyle || {}) }}>
      {label && <label style={labelStyle}>{label}</label>}
      <div style={iconWrapStyle}>
        {icon && <span style={iconStyle}>{icon}</span>}
        <input
          style={computedInputStyle}
          onFocus={(e) => {
            setFocused(true);
            inputRest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputRest.onBlur?.(e);
          }}
          {...inputRest}
        />
      </div>
      {error && <div style={errorTextStyle}>{error}</div>}
    </div>
  );
}
