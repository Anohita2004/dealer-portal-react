import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  MenuItem,
  TextField,
} from "@mui/material";
import { materialAPI, orderAPI } from "../../services/api";

export default function CreateOrder() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await materialAPI.getMaterials();

      // Backend returns: { materials: [...] }
      setMaterials(data.materials || []);
    } catch (err) {
      console.error("Failed to load materials", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedMaterial || !quantity) {
      alert("Please select material & quantity.");
      return;
    }

    try {
      await orderAPI.createOrder({
        materialId: selectedMaterial,
        quantity: Number(quantity),
      });

      alert("Order created successfully!");
      setSelectedMaterial("");
      setQuantity("");
    } catch (err) {
      console.error(err);
      alert("Failed to create order");
    }
  };

  return (
    <Box p={4}>
      <Card sx={{ maxWidth: 500, margin: "0 auto" }}>
        <CardContent>
          <Typography variant="h5" fontWeight={600} mb={3}>
            Create New Order
          </Typography>

          {/* MATERIAL DROPDOWN */}
          <TextField
            select
            fullWidth
            label="Select Material"
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            margin="normal"
            disabled={loading}
          >
            {materials.length === 0 && (
              <MenuItem disabled>No materials found</MenuItem>
            )}

            {materials.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name} — {m.group?.name || "No Group"}
              </MenuItem>
            ))}
          </TextField>

          {/* QUANTITY */}
          <TextField
            fullWidth
            type="number"
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            margin="normal"
          />

          {/* SUBMIT BUTTON */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          >
            Submit Order
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

