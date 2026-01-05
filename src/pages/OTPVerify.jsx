import React, { useState, useContext, useEffect } from "react";
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
  const { verifyOTP, isAuthenticated, user, token, loading: authLoading } = useContext(AuthContext);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const navigate = useNavigate();

  // Navigate to dashboard once authentication state is confirmed
  useEffect(() => {
    // Wait for auth loading to complete and all auth state to be set
    if (verificationSuccess && !authLoading && isAuthenticated && user && token) {
      console.log("OTP Verification: All auth state confirmed, navigating to dashboard", {
        isAuthenticated,
        hasUser: !!user,
        hasToken: !!token,
        authLoading,
        userRole: user.role || user.roleDetails?.name || user.roleName
      });
      
      // Verify localStorage is also set (double-check)
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      
      if (!storedToken || !storedUser) {
        console.error("OTP Verification: localStorage not set, waiting...");
        return;
      }
      
      // Use window.location for a more reliable navigation that forces a full re-render
      // This ensures ProtectedRoute sees the updated auth state
      const timer = setTimeout(() => {
        console.log("OTP Verification: Navigating to dashboard");
        window.location.href = "/dashboard";
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [verificationSuccess, authLoading, isAuthenticated, user, token]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setVerificationSuccess(false);
    
    try {
      console.log("OTP Verification: Starting verification...");
      await verifyOTP(userId, otp);
      console.log("OTP Verification: Success, waiting for auth state update...");
      // Mark verification as successful - useEffect will handle navigation
      setVerificationSuccess(true);
    } catch (err) {
      console.error("OTP Verification: Error", err);
      setError(err.response?.data?.error || err.message || "Invalid OTP. Please try again.");
      setVerificationSuccess(false);
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


