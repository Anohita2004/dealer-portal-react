import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  MenuItem,
  TextField,
  IconButton,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
  Divider,
  Chip,
  Alert,
} from "@mui/material";
import { Plus, Trash2, ShoppingCart, Lock } from "lucide-react";
import { materialAPI, orderAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useApiCall } from "../../hooks/useApiCall";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import { toast } from "react-toastify";
import { isAccountsUser, getDisabledActionExplanation, canAccountsUserPerform } from "../../utils/accountsPermissions";

export default function CreateOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { post, loading } = useApiCall();
  const [materials, setMaterials] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState("");

  // Form state for adding new item
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");

  // Check if user is accounts user (read-only for order creation)
  const isReadOnly = !canAccountsUserPerform(user, "create_orders");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const res = await materialAPI.getMaterials();
        const list = res?.materials || res?.data || res || [];
        setMaterials(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error("Failed to fetch materials:", err);
        toast.error("Failed to load materials");
      }
    };
    fetchMaterials();
  }, []);

  const addItem = () => {
    if (!selectedMaterial || !quantity) {
      toast.error("Please select a material and enter quantity");
      return;
    }

    const material = materials.find((m) => m.id === selectedMaterial);
    const price = Number(material?.price || unitPrice || 0);
    
    if (price <= 0) {
      toast.error("Unit price must be greater than 0");
      return;
    }

    // Check if material already added
    if (orderItems.some((item) => item.materialId === selectedMaterial)) {
      toast.error("This material is already in the order");
      return;
    }

    const newItem = {
      materialId: selectedMaterial,
      materialName: material?.name || "Unknown",
      qty: Number(quantity),
      unitPrice: price,
      amount: Number(quantity) * price,
    };

    setOrderItems([...orderItems, newItem]);
    
    // Reset form
    setSelectedMaterial("");
    setQuantity("");
    setUnitPrice("");
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error("Please add at least one item to the order");
      return;
    }

    if (!user?.dealerId) {
      toast.error("Dealer ID missing. Please login again.");
      return;
    }

    try {
      const payload = {
        dealerId: user.dealerId,
        items: orderItems.map((item) => ({
          materialId: item.materialId,
          qty: item.qty,
          unitPrice: item.unitPrice,
        })),
        notes: notes || "",
      };

      await post("/orders", payload);
      toast.success("Order created successfully!");
      
      // Reset form
      setOrderItems([]);
      setNotes("");
      
      // Navigate to orders list
      setTimeout(() => {
        navigate("/orders/my");
      }, 1500);
    } catch (err) {
      console.error("Order create error:", err);
      toast.error(err.response?.data?.error || "Failed to create order");
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box p={3}>
      <PageHeader
        title="Create New Order"
        subtitle={isReadOnly ? "Read-only access. Orders cannot be created by accounts users." : "Add materials to your order and submit for approval"}
      />

      {/* Read-Only Notice for Accounts Users */}
      {isReadOnly && (
        <Alert severity="warning" icon={<Lock size={20} />} sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Action Not Permitted
          </Typography>
          <Typography variant="body2">
            {getDisabledActionExplanation(user, "create_orders")}
          </Typography>
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3, mt: 3 }}>
        {/* Left: Add Items Form */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ShoppingCart size={20} />
              Add Items
            </Typography>

            {/* MATERIAL SELECT */}
            <TextField
              fullWidth
              select
              label="Select Material"
              value={selectedMaterial}
              onChange={(e) => {
                setSelectedMaterial(e.target.value);
                const selected = materials.find((m) => m.id === e.target.value);
                if (selected?.price) {
                  setUnitPrice(selected.price);
                }
              }}
              margin="normal"
              size="small"
            >
              {materials.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.name} — ₹{Number(m.price || 0).toLocaleString()}
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
              size="small"
              inputProps={{ min: 1 }}
              disabled={isReadOnly}
            />

            {/* UNIT PRICE */}
            <TextField
              fullWidth
              label="Unit Price (₹)"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              margin="normal"
              type="number"
              size="small"
              inputProps={{ min: 0.01, step: 0.01 }}
              disabled={isReadOnly}
            />

            <Button
              variant="outlined"
              startIcon={<Plus size={18} />}
              fullWidth
              onClick={addItem}
              sx={{ mt: 2 }}
              disabled={isReadOnly || !selectedMaterial || !quantity}
            >
              Add to Order
            </Button>
          </CardContent>
        </Card>

        {/* Right: Order Summary */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Order Summary
            </Typography>

            {orderItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                No items added yet
              </Typography>
            ) : (
              <>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.materialName}</TableCell>
                        <TableCell align="right">{item.qty}</TableCell>
                        <TableCell align="right">₹{item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{item.amount.toLocaleString()}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeItem(index)}
                            disabled={isReadOnly}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{totalAmount.toLocaleString()}
                  </Typography>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Notes (Optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  margin="normal"
                  size="small"
                  placeholder="Add any notes or special instructions..."
                  disabled={isReadOnly}
                />

                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  size="large"
                  onClick={handleSubmit}
                  disabled={isReadOnly || loading || orderItems.length === 0}
                  sx={{ mt: 2 }}
                  startIcon={<ShoppingCart size={18} />}
                >
                  {loading ? "Submitting..." : "Submit Order for Approval"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
