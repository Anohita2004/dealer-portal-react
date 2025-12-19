import React from "react";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "var(--color-background)",
        padding: "var(--spacing-6)",
      }}
    >
      <Card 
        sx={{ 
          maxWidth: 500, 
          p: 4, 
          textAlign: "center",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Lock size={64} style={{ color: "var(--color-error)" }} />
          </Box>
          <Typography 
            variant="h4" 
            gutterBottom 
            fontWeight="var(--font-weight-bold)"
            sx={{ 
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-2xl)",
              marginBottom: "var(--spacing-4)"
            }}
          >
            Access Denied
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              mb: 3,
              color: "var(--color-text-secondary)",
              fontSize: "var(--font-size-base)",
              lineHeight: "var(--line-height-relaxed)"
            }}
          >
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button 
              variant="outlined" 
              onClick={() => navigate(-1)}
              sx={{
                borderColor: "var(--color-primary)",
                color: "var(--color-primary)",
                "&:hover": {
                  borderColor: "var(--color-primary-dark)",
                  backgroundColor: "var(--color-primary-soft)",
                }
              }}
            >
              Go Back
            </Button>
            <Button 
              variant="contained" 
              onClick={() => navigate("/dashboard")}
              sx={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-surface)",
                "&:hover": {
                  backgroundColor: "var(--color-primary-dark)",
                }
              }}
            >
              Go to Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

