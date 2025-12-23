import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
} from "@mui/material";
import PageHeader from "../../components/PageHeader";
import { useMyDealers } from "../../hooks/useMyDealers";
import { useDealerMaterials } from "../../hooks/useDealerMaterials";
import { orderAPI } from "../../services/api";
import { toast } from "react-toastify";

export default function SalesCreateOrderPage() {
  const { dealers } = useMyDealers();
  const [dealerId, setDealerId] = useState("");
  const { materials, mappings, loading: materialsLoading } = useDealerMaterials(
    dealerId || null
  );

  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const addLine = () =>
    setItems((prev) => [...prev, { materialId: "", qty: 1, unitPrice: 0 }]);

  const updateLine = (index, patch) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it))
    );
  };

  const getDefaultPrice = (materialId) => {
    const m = mappings?.find((m) => m.materialId === materialId);
    return m?.price ? Number(m.price) : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealerId) {
      toast.error("Please select a dealer");
      return;
    }
    if (!items.length) {
      toast.error("Please add at least one item");
      return;
    }

    setSubmitting(true);
    try {
      await orderAPI.createOrder({
        dealerId,
        notes,
        items: items.map((i) => ({
          materialId: i.materialId,
          qty: i.qty,
          unitPrice: i.unitPrice,
        })),
      });
      toast.success("Order created successfully");
      setItems([]);
      setNotes("");
    } catch (err) {
      console.error("Failed to create order:", err);
      toast.error(
        err?.response?.data?.error || err?.message || "Failed to create order"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Create Order"
        subtitle="Create an order for one of your assigned dealers"
      />

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Dealer */}
            <TextField
              select
              label="Dealer"
              value={dealerId}
              onChange={(e) => {
                setDealerId(e.target.value);
                setItems([]);
              }}
              fullWidth
              size="small"
            >
              <MenuItem value="">Select dealer</MenuItem>
              {dealers.map((d) => (
                <MenuItem key={d.id} value={d.id}>
                  {d.dealerCode} — {d.businessName}
                </MenuItem>
              ))}
            </TextField>

            {/* Items */}
            {dealerId && (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                  <Typography variant="subtitle1">Order Items</Typography>
                  <Button variant="outlined" size="small" onClick={addLine}>
                    Add Line
                  </Button>
                </Box>

                {materialsLoading && (
                  <Typography color="text.secondary">Loading materials…</Typography>
                )}

                {items.map((item, idx) => (
                  <Grid container spacing={2} key={idx}>
                    <Grid item xs={6} md={6}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Material"
                        value={item.materialId}
                        onChange={(e) => {
                          const matId = e.target.value;
                          updateLine(idx, {
                            materialId: matId,
                            unitPrice: getDefaultPrice(matId),
                          });
                        }}
                      >
                        <MenuItem value="">Select material</MenuItem>
                        {materials.map((m) => (
                          <MenuItem key={m.id} value={m.id}>
                            {m.materialNumber || m.code} — {m.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={3} md={2}>
                      <TextField
                        type="number"
                        label="Qty"
                        size="small"
                        fullWidth
                        inputProps={{ min: 1 }}
                        value={item.qty}
                        onChange={(e) =>
                          updateLine(idx, { qty: Number(e.target.value) || 1 })
                        }
                      />
                    </Grid>
                    <Grid item xs={3} md={4}>
                      <TextField
                        type="number"
                        label="Unit Price"
                        size="small"
                        fullWidth
                        inputProps={{ step: "0.01" }}
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLine(idx, {
                            unitPrice: Number(e.target.value) || 0,
                          })
                        }
                      />
                    </Grid>
                  </Grid>
                ))}
              </>
            )}

            {/* Notes */}
            <TextField
              label="Notes"
              multiline
              minRows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              size="small"
            />

            <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Create Order"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}


