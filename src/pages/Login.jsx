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
    background: 'radial-gradient(circle at top, #1a1a2e 0%, #0f172a 50%, #000 100%)',
    backgroundImage:
      'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: "'Poppins', sans-serif",
    color: '#f5f5f5',
  },
  overlay: {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: '100%',
    height: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 380,
    background: 'rgba(255,255,255,0.05)',
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    borderRadius: 16,
    padding: '2rem 2.5rem',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  title: {
    marginBottom: '1.5rem',
    letterSpacing: 1,
    fontWeight: 600,
    fontSize: '1.5rem',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: 'none',
    borderRadius: 8,
    outline: 'none',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    fontSize: 14,
    marginBottom: '1rem',
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 13,
    marginBottom: '1.2rem',
    color: '#bbb',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  button: {
    width: '100%',
    padding: '12px',
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #1e3c72, #2a5298)',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 500,
    transition: 'all 0.3s ease',
  },
  link: {
    color: '#7eb2f2',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  registerText: {
    fontSize: 13,
    marginTop: '1rem',
    color: '#aaa',
  },
  error: {
    color: '#ff7070',
    marginBottom: '1rem',
  },
};
