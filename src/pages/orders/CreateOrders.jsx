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
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    materialAPI
      .getMaterials()
      .then((res) => {
        const list = Array.isArray(res) ? res : res.rows ? res.rows : [];
        setMaterials(list);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!selectedMaterial || !quantity) return alert("All fields required");

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
      <Card>
        <CardContent>
          <Typography variant="h5" mb={2}>
            Create New Order
          </Typography>

          <TextField
            fullWidth
            select
            label="Select Material"
            value={selectedMaterial}
            onChange={(e) => setSelectedMaterial(e.target.value)}
            margin="normal"
          >
            {materials.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            fullWidth
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            margin="normal"
            type="number"
          />

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
