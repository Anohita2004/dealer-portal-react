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
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Login</h2>
      {error && <div style={{color:'red'}}>{error}</div>}
      <form onSubmit={submit}>
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} required />
        <br/><br/>
        <input placeholder="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        <br/><br/>
        <button type="submit">Send OTP</button>
      </form>
    </div>
  );
}
