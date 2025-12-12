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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <Card sx={{ maxWidth: 500, p: 4, textAlign: "center" }}>
        <CardContent>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
            <Lock size={64} color="#ef4444" />
          </Box>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You do not have permission to access this page. Please contact your administrator if you believe this is an error.
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <Button variant="outlined" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button variant="contained" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

