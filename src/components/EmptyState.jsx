import React from "react";
import { Box, Typography } from "@mui/material";
import { motion } from "framer-motion";

/**
 * Premium Empty State Component
 * Used when tables or lists have no results
 */
export default function EmptyState({
  icon = "🔍",
  title = "No data found",
  description = "Try adjusting your filters or search terms."
}) {
  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      sx={{
        textAlign: "center",
        padding: "var(--spacing-12) var(--spacing-6)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: (theme) => theme.palette.mode === 'dark' ? 'rgba(31, 41, 55, 0.4)' : 'rgba(249, 250, 251, 0.5)',
        borderRadius: 'var(--radius-xl)',
        border: '1px dashed var(--color-border)',
        m: 2
      }}
    >
      <Box
        sx={{
          fontSize: "4rem",
          mb: 2,
          filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 100,
          height: 100,
          borderRadius: '50%',
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(55, 65, 81, 0.5)' : '#FFFFFF',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {icon}
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          mb: 1,
          color: "text.primary",
          letterSpacing: '-0.01em'
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: "text.secondary",
          maxWidth: 400,
          mx: "auto"
        }}
      >
        {description}
      </Typography>
    </Box>
  );
}



