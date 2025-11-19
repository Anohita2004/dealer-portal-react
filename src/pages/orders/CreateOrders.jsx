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
  const [unitPrice, setUnitPrice] = useState("");
  
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    materialAPI
      .getMaterials()
      .then((res) => {
        const list = res?.materials || [];
        setMaterials(list);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!selectedMaterial || !quantity)
      return alert("All fields required");

    if (!user?.dealerId) {
      return alert("Dealer ID missing. Login again.");
    }

    const material = materials.find((m) => m.id === selectedMaterial);
    const price = Number(material?.price || unitPrice || 1);

    try {
      const payload = {
        dealerId: user.dealerId,    // 🔥 REQUIRED BY BACKEND
        items: [
          {
            materialId: selectedMaterial,
            qty: Number(quantity),
            unitPrice: price        // 🔥 NEVER SEND 0
          }
        ],
        notes: ""
      };

      await orderAPI.createOrder(payload);

      alert("Order created successfully!");

      setSelectedMaterial("");
      setQuantity("");
      setUnitPrice("");

    } catch (err) {
      console.error("Order create error:", err);
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

          {/* MATERIAL SELECT */}
          <TextField
            fullWidth
            select
            label="Select Material"
            value={selectedMaterial}
            onChange={(e) => {
              setSelectedMaterial(e.target.value);

              const selected = materials.find(
                (m) => m.id === e.target.value
              );

              // auto-fill unit price
              if (selected?.price) {
                setUnitPrice(selected.price);
              }
            }}
            margin="normal"
          >
            {materials.map((m) => (
              <MenuItem key={m.id} value={m.id}>
                {m.name} — ₹{m.price}
              </MenuItem>
            ))}
          </TextField>

          {/* QUANTITY */}
          <TextField
            fullWidth
            label="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            margin="normal"
            type="number"
          />

          {/* UNIT PRICE (auto-filled but editable) */}
          <TextField
            fullWidth
            label="Unit Price"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
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
