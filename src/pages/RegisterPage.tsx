import React, { useState, type FormEvent, type CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

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
  maxWidth: '460px',
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
  marginBottom: '18px',
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
  marginTop: '8px',
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

const passwordHintsStyle: CSSProperties = {
  marginBottom: '18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const hintStyle = (valid: boolean): CSSProperties => ({
  fontSize: '12px',
  color: valid ? '#16a34a' : '#64748b',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

function validatePassword(pw: string): { minLength: boolean; hasUpper: boolean; hasDigit: boolean } {
  return {
    minLength: pw.length >= 8,
    hasUpper: /[A-ZА-ЯA-ZЁ]/.test(pw),
    hasDigit: /\d/.test(pw),
  };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pwChecks = validatePassword(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim()) {
      setError('Введите имя');
      return;
    }
    if (!lastName.trim()) {
      setError('Введите фамилию');
      return;
    }
    if (!email.trim()) {
      setError('Введите Email');
      return;
    }
    if (!phone.trim()) {
      setError('Введите телефон');
      return;
    }
    if (!pwChecks.minLength || !pwChecks.hasUpper || !pwChecks.hasDigit) {
      setError('Пароль не соответствует требованиям');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
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
          <div style={subtitleStyle}>Создайте новый аккаунт</div>

          {error && <div style={errorStyle}>{error}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Имя</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.currentTarget.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Иван"
                  required
                />
              </div>
              <div style={{ ...inputGroupStyle, flex: 1 }}>
                <label style={labelStyle}>Фамилия</label>
                <input
                  style={inputStyle}
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.currentTarget.value)}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                  placeholder="Иванов"
                  required
                />
              </div>
            </div>

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
              <label style={labelStyle}>Телефон</label>
              <input
                style={inputStyle}
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.currentTarget.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="+7 (999) 123-45-67"
                autoComplete="tel"
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
                placeholder="Придумайте пароль"
                autoComplete="new-password"
                required
              />
            </div>

            <div style={passwordHintsStyle}>
              <div style={hintStyle(pwChecks.minLength)}>
                {pwChecks.minLength ? '\u2713' : '\u25CB'} Минимум 8 символов
              </div>
              <div style={hintStyle(pwChecks.hasUpper)}>
                {pwChecks.hasUpper ? '\u2713' : '\u25CB'} Заглавная буква
              </div>
              <div style={hintStyle(pwChecks.hasDigit)}>
                {pwChecks.hasDigit ? '\u2713' : '\u25CB'} Цифра
              </div>
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
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div style={linkStyle}>
            Уже есть аккаунт?{' '}
            <Link to="/login" style={linkAnchorStyle}>
              Войти
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
