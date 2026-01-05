import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import OTPVerify from './OTPVerify';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
  InputAdornment,
  IconButton
} from '@mui/material';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await login(username, password);
      if (res?.otpSent) {
        setUserId(res.userId);
        setOtpSent(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (otpSent) return <OTPVerify userId={userId} />;

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: 'url("https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)'
      }
    }}>
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <Paper
            elevation={24}
            sx={{
              p: 5,
              borderRadius: 'var(--radius-2xl)',
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'rgba(31, 41, 55, 0.8)'
                  : 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Typography
                  variant="h4"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Welcome Back
                </Typography>
              </motion.div>
              <Typography variant="body2" color="text.secondary">
                Please enter your details to access the portal
              </Typography>
            </Box>

            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--radius-md)' }}>
                  {error}
                </Alert>
              </motion.div>
            )}

            <form onSubmit={submit}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <User size={20} color="var(--color-text-secondary)" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock size={20} color="var(--color-text-secondary)" />
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={!loading && <ArrowRight size={20} />}
                  sx={{
                    py: 1.5,
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.4)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 20px 25px -5px rgba(37, 99, 235, 0.4)',
                    },
                    transition: 'all 0.2s'
                  }}
                >
                  {loading ? 'Processing...' : 'Secure Login'}
                </Button>
              </Box>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                &copy; 2026 Dealer Management Portal. All rights reserved.
              </Typography>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}

