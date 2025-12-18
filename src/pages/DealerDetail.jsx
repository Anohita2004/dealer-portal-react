import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";
import { dealerAPI } from "../services/api";

export default function DealerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDealer = async () => {
      try {
        const data = await dealerAPI.getDealerById(id);
        const d = data.dealer || data;
        setDealer(d || null);
      } catch (err) {
        console.error("Failed to load dealer:", err);
        toast.error("Failed to load dealer details");
        setDealer(null);
      } finally {
        setLoading(false);
      }
    };

    loadDealer();
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading dealer details...</Typography>
      </Box>
    );
  }

  if (!dealer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.secondary">
          Dealer not found or you do not have access.
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
        title={dealer.businessName || "Dealer Details"}
        subtitle={dealer.dealerCode || ""}
        actions={[
          <Button
            key="back"
            variant="outlined"
            startIcon={<ArrowLeft size={18} />}
            onClick={() => navigate(-1)}
          >
            Back
          </Button>,
        ]}
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
                <Typography variant="h6">Dealer Information</Typography>
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
                <Typography variant="h6">Address & Hierarchy</Typography>
              </Box>

              <Typography variant="body1" sx={{ mb: 0.5 }}>
                {dealer.address || "Address not provided"}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {dealer.city || "City"}, {dealer.state || "State"}{" "}
                {dealer.pincode || ""}
              </Typography>

              <Box sx={{ mt: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Region / Area / Territory
                </Typography>
                <Typography variant="body1">
                  {(dealer.region && dealer.region.name) || "Region: N/A"}{" "}
                  {" / "}
                  {(dealer.area && dealer.area.name) || "Area: N/A"}{" "}
                  {" / "}
                  {(dealer.territory && dealer.territory.name) ||
                    "Territory: N/A"}
                </Typography>
              </Box>
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
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Assigned Manager
              </Typography>

              {dealer.manager ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  <Typography variant="body1" fontWeight={600}>
                    {dealer.manager.username || dealer.manager.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {dealer.manager.roleDetails?.name || dealer.manager.role}
                  </Typography>
                  {dealer.manager.email && (
                    <Typography variant="body2">
                      Email: {dealer.manager.email}
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No manager assigned.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}


