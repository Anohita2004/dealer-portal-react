import React, { useEffect, useState } from "react";
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

export default function DealerProfile() {
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await dealerAPI.getMyDealerProfile();
        const d = data.dealer || data;
        setDealer(d || null);
      } catch (err) {
        console.error("Failed to load dealer profile:", err);
        toast.error("Failed to load dealer profile");
        setDealer(null);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dealer profile...</Typography>
      </Box>
    );
  }

  if (!dealer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Dealer profile is not available.
        </Typography>
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


