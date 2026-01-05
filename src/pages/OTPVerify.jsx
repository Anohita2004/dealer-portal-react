import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container
} from "@mui/material";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";

export default function OTPVerify({ userId }) {
  const { verifyOTP } = useContext(AuthContext);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOTP(userId, otp);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
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
              textAlign: 'center'
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Box sx={{
                display: 'inline-flex',
                p: 2,
                borderRadius: '50%',
                bgcolor: 'primary.soft',
                color: 'primary.main',
                mb: 2
              }}>
                <ShieldCheck size={40} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                Verify Your Identity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                We've sent a secure code to your registered device.
              </Typography>
            </Box>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Alert severity="error" sx={{ mb: 3, borderRadius: 'var(--radius-md)' }}>
                  {error}
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleVerify}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  fullWidth
                  autoFocus
                  label="Enter 6-digit OTP"
                  variant="outlined"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  inputProps={{
                    maxLength: 6,
                    style: { textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.25rem', fontWeight: 700 }
                  }}
                />

                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loading || otp.length < 4}
                  endIcon={!loading && <ArrowRight size={20} />}
                  sx={{
                    py: 1.5,
                    borderRadius: 'var(--radius-lg)',
                    fontWeight: 700
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </Button>

                <Button
                  variant="text"
                  size="small"
                  startIcon={<RefreshCw size={16} />}
                  sx={{ color: 'text.secondary', fontWeight: 600 }}
                >
                  Resend Code
                </Button>
              </Box>
            </form>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}


