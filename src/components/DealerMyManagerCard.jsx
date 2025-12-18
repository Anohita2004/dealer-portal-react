import React, { useEffect, useState } from "react";
import { Box, Typography, Chip } from "@mui/material";
import { User, Mail, Phone } from "lucide-react";
import { dealerAPI } from "../services/api";

export default function DealerMyManagerCard() {
  const [manager, setManager] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await dealerAPI.getMyManager();
        const m = data.manager || data;
        setManager(m || null);
      } catch (err) {
        // Silently ignore 403/404 or optional endpoint issues
        if (err?.response?.status !== 403 && err?.response?.status !== 404 && !err.silent) {
          console.error("Failed to load manager info:", err);
        }
        setManager(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          bgcolor: "#f9fafb",
          fontSize: 14,
        }}
      >
        Loading manager info...
      </Box>
    );
  }

  if (!manager) {
    return (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          bgcolor: "#f9fafb",
          fontSize: 14,
          color: "text.secondary",
        }}
      >
        Manager information is not available.
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        bgcolor: "#f9fafb",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <User size={18} />
        <Typography variant="subtitle2" fontWeight={600}>
          My Manager
        </Typography>
      </Box>

      <Typography variant="body1" fontWeight={600}>
        {manager.username || manager.name || "Manager"}
      </Typography>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 0.5 }}>
        {manager.role && (
          <Chip
            label={manager.roleDetails?.name || manager.role}
            size="small"
            color="primary"
            variant="outlined"
          />
        )}
      </Box>

      {manager.email && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
          <Mail size={14} />
          <Typography variant="body2">{manager.email}</Typography>
        </Box>
      )}

      {manager.phoneNumber && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <Phone size={14} />
          <Typography variant="body2">{manager.phoneNumber}</Typography>
        </Box>
      )}
    </Box>
  );
}


