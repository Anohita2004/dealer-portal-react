import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import OTPVerify from './OTPVerify';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await login(username, password);
      if (res?.otpSent) {
        setUserId(res.userId);
        setOtpSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  if (otpSent) return <OTPVerify userId={userId} />;

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <div style={styles.card}>
          <h2 style={styles.title}>LOGIN</h2>
          {error && <p style={styles.error}>{error}</p>}
          <form onSubmit={submit}>
            <input
              style={styles.input}
              placeholder="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              style={styles.input}
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div style={styles.options}>
              
              
            </div>
            <button type="submit" style={styles.button}>Send OTP</button>
            
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    background: 'var(--color-background)',
    backgroundImage:
      'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'var(--font-family)',
    color: 'var(--color-text-primary)',
  },
  overlay: {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 380,
    background: 'var(--color-surface)',
    boxShadow: 'var(--shadow-xl)',
    borderRadius: 'var(--radius-xl)',
    padding: 'var(--spacing-8) var(--spacing-10)',
    textAlign: 'center',
    border: '1px solid var(--color-border)',
  },
  title: {
    marginBottom: 'var(--spacing-6)',
    letterSpacing: '0.05em',
    fontWeight: 'var(--font-weight-bold)',
    fontSize: 'var(--font-size-2xl)',
    color: 'var(--color-text-primary)',
  },
  input: {
    width: '100%',
    padding: 'var(--spacing-3) var(--spacing-4)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontSize: 'var(--font-size-sm)',
    marginBottom: 'var(--spacing-4)',
    transition: 'all var(--transition-base)',
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 'var(--font-size-xs)',
    marginBottom: 'var(--spacing-3)',
    color: 'var(--color-text-secondary)',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--spacing-2)',
  },
  button: {
    width: '100%',
    padding: 'var(--spacing-3)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    background: 'var(--color-primary)',
    color: 'var(--color-surface)',
    cursor: 'pointer',
    fontWeight: 'var(--font-weight-semibold)',
    fontSize: 'var(--font-size-sm)',
    transition: 'all var(--transition-base)',
    boxShadow: 'var(--shadow-sm)',
  },
  link: {
    color: 'var(--color-primary)',
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'color var(--transition-fast)',
  },
  registerText: {
    fontSize: 'var(--font-size-xs)',
    marginTop: 'var(--spacing-4)',
    color: 'var(--color-text-secondary)',
  },
  error: {
    color: 'var(--color-error)',
    marginBottom: 'var(--spacing-4)',
    fontSize: 'var(--font-size-sm)',
  },
};
