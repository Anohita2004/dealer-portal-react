import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Premium Loading Fallback
 * Used for React Suspense lazy loading boundaries
 */
export default function LoadingFallback() {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100%",
                background: (theme) =>
                    theme.palette.mode === 'dark'
                        ? 'radial-gradient(circle at center, #1F2937 0%, #111827 100%)'
                        : 'radial-gradient(circle at center, #FFFFFF 0%, #F9FAFB 100%)',
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{
                    duration: 0.8,
                    ease: "anticipate",
                }}
            >
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                    <CircularProgress
                        size={80}
                        thickness={2}
                        sx={{ color: 'primary.light', opacity: 0.3, position: 'absolute' }}
                        variant="determinate"
                        value={100}
                    />
                    <CircularProgress
                        size={80}
                        thickness={4}
                        color="primary"
                        sx={{
                            filter: 'drop-shadow(0 0 8px rgba(37, 99, 235, 0.4))'
                        }}
                    />
                </Box>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        mt: 4,
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        background: 'linear-gradient(90deg, #2563EB, #7C3AED)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem'
                    }}
                >
                    Initializing Portal
                </Typography>
            </motion.div>

            <motion.div
                animate={{
                    opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
            >
                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1, fontWeight: 400 }}
                >
                    Please wait a moment...
                </Typography>
            </motion.div>
        </Box>
    );
}

