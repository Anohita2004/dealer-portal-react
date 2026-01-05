import React from "react";
import { Search } from "lucide-react";
import { Box, InputBase } from "@mui/material";

/**
 * Premium SearchInput Component
 */
export default function SearchInput({ placeholder = "Search...", value, onChange, style }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        padding: "8px 20px",
        borderRadius: "999px",
        background: (theme) => theme.palette.mode === 'dark' ? 'rgba(31, 41, 55, 0.5)' : '#FFFFFF',
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "var(--shadow-sm)",
        color: "text.secondary",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        width: '100%',
        maxWidth: 400,
        "&:focus-within": {
          borderColor: "primary.main",
          boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.15)',
          width: '100%',
          maxWidth: 500
        },
        ...style,
      }}
    >
      <Search size={18} />
      <InputBase
        fullWidth
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        sx={{
          color: "text.primary",
          fontSize: "0.875rem",
          fontWeight: 500,
          "& input::placeholder": {
            opacity: 0.6,
            color: 'text.secondary',
            fontStyle: 'italic'
          }
        }}
      />
      <Box sx={{
        display: { xs: 'none', md: 'flex' },
        alignItems: 'center',
        justifyContent: 'center',
        px: 1,
        py: 0.25,
        borderRadius: 'var(--radius-sm)',
        bgcolor: 'action.hover',
        fontSize: '0.65rem',
        fontWeight: 700,
        color: 'text.secondary',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        ⌘K
      </Box>
    </Box>
  );
}


