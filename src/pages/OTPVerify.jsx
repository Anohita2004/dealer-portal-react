import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OTPVerify({ userId }) {
  const { verifyOTP } = useContext(AuthContext);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await verifyOTP(userId, otp);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        <div style={styles.card}>
          <h2 style={styles.title}>Verify OTP</h2>
          {error && <p style={styles.error}>{error}</p>}
          <form onSubmit={handleVerify}>
            <input
              style={styles.input}
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="submit" style={styles.button}>Verify</button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100vh',
    background: 'var(--bg-glow), var(--bg-base)',
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
    width: 360,
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
  error: {
    color: '#ff7070',
    marginBottom: '1rem',
  },
};

