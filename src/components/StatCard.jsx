import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Premium StatCard Component
 * Enhanced with motion and better design system alignment
 */
export default function StatCard({ title, value, icon, accent, scope, urgent = false, onClick, style = {} }) {
  const accentColor = accent || "var(--color-primary)";
  const isClickable = !!onClick;

  return (
    <Box
      component={motion.div}
      whileHover={isClickable ? { y: -4, boxShadow: 'var(--shadow-lg)' } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={onClick}
      className="card"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-3)",
        position: 'relative',
        overflow: 'hidden',
        border: urgent ? `2px solid ${accentColor}` : '1px solid var(--color-border)',
        cursor: isClickable ? "pointer" : "default",
        background: (theme) => theme.palette.mode === 'dark' ? 'rgba(31, 41, 55, 0.4)' : '#FFFFFF',
        ...style,
      }}
    >
      {/* Accent Line */}
      <Box sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        bgcolor: accentColor,
        opacity: 0.8
      }} />

      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: "var(--spacing-3)", flex: 1 }}>
          {icon && (
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-md)',
              bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
              color: accentColor,
              fontSize: "1.2rem"
            }}>
              {icon}
            </Box>
          )}
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                fontSize: '0.65rem'
              }}
            >
              {title}
            </Typography>
            {scope && (
              <Typography
                sx={{
                  display: 'block',
                  fontSize: "0.6rem",
                  color: accentColor,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  mt: 0.5
                }}
              >
                {scope}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>

      <Typography
        variant="h4"
        sx={{
          fontWeight: 800,
          color: "text.primary",
          lineHeight: 1,
          letterSpacing: '-0.02em'
        }}
      >
        {value}
      </Typography>

      {urgent && (
        <Box
          component={motion.div}
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: "error.main",
            fontSize: "0.7rem",
            fontWeight: 700,
            textTransform: 'uppercase'
          }}
        >
          <span>⚠️</span> Requires Attention
        </Box>
      )}
    </Box>
  );
}

