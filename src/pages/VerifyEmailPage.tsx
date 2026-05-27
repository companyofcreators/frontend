import { useEffect, useState, type CSSProperties } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/api';

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
  textAlign: 'center',
};

const logoStyle: CSSProperties = {
  fontSize: '32px',
  fontWeight: 800,
  color: '#2563eb',
  marginBottom: '24px',
};

const successStyle: CSSProperties = {
  color: '#16a34a',
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '8px',
};

const errorStyle: CSSProperties = {
  color: '#ef4444',
  fontSize: '16px',
  fontWeight: 600,
  marginBottom: '8px',
};

const subtitleStyle: CSSProperties = {
  fontSize: '14px',
  color: '#64748b',
  marginBottom: '24px',
  lineHeight: '1.5',
};

const buttonStyle: CSSProperties = {
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
  textDecoration: 'none',
  display: 'inline-block',
  boxSizing: 'border-box',
};

const spinnerStyle: CSSProperties = {
  display: 'inline-block',
  width: '30px',
  height: '30px',
  border: '3px solid rgba(37, 99, 235, 0.2)',
  borderTopColor: '#2563eb',
  borderRadius: '50%',
  animation: 'verify-spin 0.8s linear infinite',
  marginBottom: '16px',
};

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  const token = searchParams.get('token');
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    // If redirected from API after verification
    if (success === 'true') {
      setStatus('success');
      return;
    }
    if (error) {
      setStatus('error');
      const messages: Record<string, string> = {
        missing_token: 'Токен не указан.',
        invalid_token: 'Недействительный или истёкший токен. Возможно, он уже был использован или срок действия истёк.',
        internal: 'Внутренняя ошибка сервера. Попробуйте позже.',
      };
      setErrorMsg(messages[error] || 'Произошла ошибка при подтверждении.');
      return;
    }

    // If we have a token, call the API to verify
    if (token) {
      setStatus('loading');
      auth.verifyEmail(token)
        .then(() => setStatus('success'))
        .catch((err) => {
          setStatus('error');
          setErrorMsg(err instanceof Error ? err.message : 'Ошибка подтверждения');
        });
    } else {
      setStatus('error');
      setErrorMsg('Токен не указан. Пожалуйста, перейдите по ссылке из письма.');
    }
  }, [token, success, error]);

  return (
    <>
      <style>{`@keyframes verify-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={logoStyle}>Quicky</div>

          {status === 'loading' && (
            <>
              <div style={spinnerStyle} />
              <div style={subtitleStyle}>Подтверждаем ваш email...</div>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={successStyle}>Email успешно подтверждён!</div>
              <div style={subtitleStyle}>
                Теперь вы можете войти в свой аккаунт.
              </div>
              <Link to="/login" style={buttonStyle}>
                Войти
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={errorStyle}>Ошибка подтверждения</div>
              <div style={subtitleStyle}>{errorMsg}</div>
              <Link to="/login" style={buttonStyle}>
                На страницу входа
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
