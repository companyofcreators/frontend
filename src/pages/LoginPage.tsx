import React, { useState, type FormEvent, type CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { auth as authApi } from '../lib/api';

const pageStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
  padding: '20px',
};

const cardStyle: CSSProperties = {
  background: '#ffffff',
  borderRadius: '16px',
  padding: '40px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
};

const logoStyle: CSSProperties = {
  fontSize: '32px',
  fontWeight: 800,
  color: '#2563eb',
  textAlign: 'center',
  marginBottom: '8px',
};

const subtitleStyle: CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  textAlign: 'center',
  marginBottom: '32px',
};

const inputGroupStyle: CSSProperties = {
  marginBottom: '20px',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: '#1e293b',
  marginBottom: '6px',
};

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: '14px',
  fontFamily: 'inherit',
  color: '#1e293b',
  background: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
};

const submitBtnStyle: CSSProperties = {
  width: '100%',
  padding: '12px 20px',
  fontSize: '15px',
  fontWeight: 600,
  color: '#ffffff',
  background: '#2563eb',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'background 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
};

const errorStyle: CSSProperties = {
  color: '#ef4444',
  fontSize: '13px',
  padding: '10px 14px',
  background: '#fef2f2',
  borderRadius: '8px',
  marginBottom: '16px',
  textAlign: 'center',
};

const linkStyle: CSSProperties = {
  textAlign: 'center',
  marginTop: '20px',
  fontSize: '14px',
  color: '#64748b',
};

const linkAnchorStyle: CSSProperties = {
  color: '#2563eb',
  textDecoration: 'none',
  fontWeight: 500,
};

const spinnerStyle: CSSProperties = {
  width: '16px',
  height: '16px',
  border: '2px solid rgba(255,255,255,0.3)',
  borderTopColor: '#ffffff',
  borderRadius: '50%',
  animation: 'btn-spin 0.6s linear infinite',
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);
  const [resent, setResent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsUnverified(false);
    setResent(false);

    if (!email.trim()) {
      setError('Введите Email');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Ошибка входа';
      if (msg.toLowerCase().includes('email не подтверждён') || msg.toLowerCase().includes('email не подтвержден')) {
        setIsUnverified(true);
        setError('Email не подтверждён. Проверьте почту и перейдите по ссылке в письме.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setResent(false);
    try {
      await authApi.resendVerification(email.trim());
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    (e.currentTarget as HTMLInputElement).style.borderColor = '#2563eb';
    (e.currentTarget as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    (e.currentTarget as HTMLInputElement).style.borderColor = '#e2e8f0';
    (e.currentTarget as HTMLInputElement).style.boxShadow = 'none';
  };

  return (
    <>
      <style>{`@keyframes btn-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={logoStyle}>Quicky</div>
          <div style={subtitleStyle}>Войдите в свой аккаунт</div>

          {error && (
            <div style={errorStyle}>
              {error}
              {isUnverified && (
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#2563eb',
                      background: '#ffffff',
                      border: '1px solid #2563eb',
                      borderRadius: '6px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.6 : 1,
                    }}
                  >
                    {loading ? 'Отправка...' : 'Отправить письмо повторно'}
                  </button>
                  {resent && (
                    <div style={{ color: '#16a34a', marginTop: '8px', fontSize: '13px' }}>
                      Письмо отправлено! Проверьте почту.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div style={inputGroupStyle}>
              <label style={labelStyle}>Email</label>
              <input
                style={inputStyle}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="example@email.com"
                autoComplete="email"
                required
              />
            </div>

            <div style={inputGroupStyle}>
              <label style={labelStyle}>Пароль</label>
              <input
                style={inputStyle}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Введите пароль"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              style={{
                ...submitBtnStyle,
                opacity: loading ? 0.8 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              disabled={loading}
            >
              {loading && <span style={spinnerStyle} />}
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div style={linkStyle}>
            Нет аккаунта?{' '}
            <Link to="/register" style={linkAnchorStyle}>
              Зарегистрироваться
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
