import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";
import { Building2, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import { dealerAPI } from "../services/api";
import DealerMyManagerCard from "../components/DealerMyManagerCard";
import { AuthContext } from "../context/AuthContext";

export default function DealerProfile() {
  const { user } = useContext(AuthContext);
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      // Check if user has dealerId before making the API call
      if (!user?.dealerId) {
        setError("Your account is not linked to a dealer. Please contact your administrator.");
        setLoading(false);
        return;
      }

      try {
        const data = await dealerAPI.getMyDealerProfile();
        const d = data.dealer || data;
        setDealer(d || null);
        setError(null);
      } catch (err) {
        console.error("Failed to load dealer profile:", err);
        
        // Provide more specific error messages
        if (err.response?.status === 403) {
          setError("You don't have permission to view dealer profile. Your account may not be properly linked to a dealer.");
          toast.error("Access denied: Your account is not linked to a dealer");
        } else if (err.response?.status === 404) {
          setError("Dealer profile not found. Please contact your administrator.");
          toast.error("Dealer profile not found");
        } else {
          setError("Failed to load dealer profile. Please try again later.");
          toast.error("Failed to load dealer profile");
        }
        setDealer(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dealer profile...</Typography>
      </Box>
    );
  }

  if (error || !dealer) {
    return (
      <Box sx={{ p: 3 }}>
        <PageHeader
          title="Dealer Profile"
          subtitle="Unable to load profile"
        />
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography color="error" variant="body1" sx={{ mb: 1 }}>
              {error || "Dealer profile is not available."}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {!user?.dealerId 
                ? "Your user account is not linked to a dealer. Please contact your administrator to link your account to a dealer."
                : "Please contact your administrator if you believe this is an error."}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const status = dealer.isBlocked
    ? "Blocked"
    : dealer.isActive === false
    ? "Inactive"
    : "Active";

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title={dealer.businessName || "My Company"}
        subtitle={dealer.dealerCode || ""}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <Building2 size={20} />
                <Typography variant="h6">Company Details</Typography>
              </Box>

              <Typography variant="body2" color="text.secondary">
                Dealer Code
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {dealer.dealerCode || "N/A"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Contact Person
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {dealer.contactPerson || "N/A"}
              </Typography>

              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1.5 }}>
                <Chip
                  label={status}
                  size="small"
                  color={
                    status === "Active"
                      ? "success"
                      : status === "Blocked"
                      ? "error"
                      : "default"
                  }
                />
                <Chip
                  label={dealer.isVerified ? "Verified" : "Not Verified"}
                  size="small"
                  color={dealer.isVerified ? "primary" : "default"}
                  variant={dealer.isVerified ? "filled" : "outlined"}
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1.5,
                }}
              >
                <MapPin size={20} />
                <Typography variant="h6">Address & Location</Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {dealer.address || "Address not provided"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {dealer.city || "City"}, {dealer.state || "State"}{" "}
                {dealer.pincode || ""}
              </Typography>

              {dealer.gstNumber && (
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    GST Number
                  </Typography>
                  <Typography variant="body1">{dealer.gstNumber}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Contact
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.75,
                }}
              >
                {dealer.email && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Mail size={16} />
                    <Typography variant="body2">{dealer.email}</Typography>
                  </Box>
                )}

                {dealer.phoneNumber && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Phone size={16} />
                    <Typography variant="body2">
                      {dealer.phoneNumber}
                    </Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <DealerMyManagerCard />
        </Grid>
      </Grid>
    </Box>
  );
}


