import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  Button,
  Grid,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  IconButton,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from "@mui/material";
import {
  ShoppingCart,
  Trash2,
  Search,
  Plus,
  Minus,
  CheckCircle,
  Truck,
  CreditCard,
  FileText
} from "lucide-react";
import PageHeader from "../../components/PageHeader";
import { useMyDealers } from "../../hooks/useMyDealers";
import { useDealerMaterials } from "../../hooks/useDealerMaterials";
import { orderAPI } from "../../services/api";
import { toast } from "react-toastify";

// Format currency helper
const formatCurrency = (val) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export default function SalesCreateOrderPage() {
  const { dealers } = useMyDealers();
  const [activeStep, setActiveStep] = useState(0);

  // Form State
  const [dealerId, setDealerId] = useState("");
  const [items, setItems] = useState([]);
  const [orderMeta, setOrderMeta] = useState({
    poNumber: "",
    requestedDate: "",
    notes: ""
  });

  const [submitting, setSubmitting] = useState(false);

  // Material Data
  const { materials, mappings, loading: materialsLoading } = useDealerMaterials(dealerId || null);
  const [materialSearch, setMaterialSearch] = useState("");

  const steps = ["Select Dealer", "Add Items", "Review & Submit"];

  // Handlers
  const handleDealerChange = (e) => {
    setDealerId(e.target.value);
    setItems([]); // Clear cart when dealer changes
  };

  const handleAddItem = (material) => {
    const existing = items.find(i => i.materialId === material.id);
    if (existing) {
      toast.info("Item already in cart");
      return;
    }

    // Use price if passed, otherwise try to lookup (fallback)
    let unitPrice = material.price;
    if (unitPrice === undefined) {
      const mapping = mappings?.find(m => String(m.materialId) === String(material.id));
      unitPrice = mapping?.price ? Number(mapping.price) : (material.basePrice || 0);
    }

    setItems([...items, {
      materialId: material.id,
      name: material.name,
      code: material.materialNumber || material.code,
      qty: 1,
      unitPrice: Number(unitPrice)
    }]);
    toast.success("Item added to cart");
  };

  const updateQty = (id, delta) => {
    setItems(items.map(item => {
      if (item.materialId === id) {
        const newQty = Math.max(1, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  const removeItem = (id) => {
    setItems(items.filter(i => i.materialId !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  };

  const handleSubmit = async () => {
    if (!dealerId) return toast.error("Please select a dealer");
    if (!items.length) return toast.error("Please add items");

    setSubmitting(true);
    try {
      await orderAPI.createOrder({
        dealerId,
        notes: orderMeta.notes,
        poNumber: orderMeta.poNumber,
        requestedDate: orderMeta.requestedDate,
        items: items.map(i => ({
          materialId: i.materialId,
          qty: i.qty,
          unitPrice: i.unitPrice
        }))
      });
      toast.success("Order Created Successfully!");
      setActiveStep(0);
      setDealerId("");
      setItems([]);
      setOrderMeta({ poNumber: "", requestedDate: "", notes: "" });
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter materials
  const filteredMaterials = useMemo(() => {
    if (!materialSearch) return materials;
    return materials.filter(m =>
      m.name.toLowerCase().includes(materialSearch.toLowerCase()) ||
      (m.materialNumber || m.code).toLowerCase().includes(materialSearch.toLowerCase())
    );
  }, [materials, materialSearch]);

  const selectedDealer = dealers.find(d => d.id === dealerId);

  // Render Steps
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Card variant="outlined">
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>Dealer Selection</Typography>
                  <TextField
                    select
                    label="Select Dealer"
                    value={dealerId}
                    onChange={handleDealerChange}
                    fullWidth
                    helperText="Select the dealer you are creating this order for"
                  >
                    {dealers.map((d) => (
                      <MenuItem key={d.id} value={d.id}>
                        {d.dealerCode} — {d.businessName}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {selectedDealer && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ bgcolor: 'secondary.soft', p: 3, borderRadius: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Dealer Overview</Typography>
                      <Typography variant="h6">{selectedDealer.businessName}</Typography>
                      <Box sx={{ mt: 2, display: 'grid', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Credit Limit:</Typography>
                          <Typography variant="body2" fontWeight="bold">₹25,00,000</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Available Credit:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="success.main">₹12,45,000</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">Outstanding:</Typography>
                          <Typography variant="body2" fontWeight="bold" color="error.main">₹12,55,000</Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            {/* Catalog */}
            <Grid item xs={12} md={7}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6">Product Catalog</Typography>
                    <TextField
                      size="small"
                      placeholder="Search products..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Search size={16} /></InputAdornment>
                      }}
                    />
                  </Box>
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {materialsLoading ? (
                      <Typography>Loading catalog...</Typography>
                    ) : (
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Name</TableCell>
                            <TableCell align="right">Price</TableCell>
                            <TableCell align="center">Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredMaterials.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                                <Typography color="text.secondary">No products found matching "{materialSearch}"</Typography>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredMaterials.map(m => {
                              // Try to find dealer-specific price, fallback to material base price
                              const mapping = mappings?.find(map => String(map.materialId) === String(m.id));
                              const price = mapping?.price || m.price || m.basePrice || 0;

                              return (
                                <TableRow key={m.id} hover>
                                  <TableCell>
                                    <Box>
                                      <Typography variant="body2" fontWeight={500}>{m.name}</Typography>
                                      <Typography variant="caption" color="text.secondary">{m.description || "No description"}</Typography>
                                    </Box>
                                  </TableCell>
                                  <TableCell>{m.materialNumber || m.code}</TableCell>
                                  <TableCell align="right">{formatCurrency(price)}</TableCell>
                                  <TableCell align="center">
                                    <Button
                                      size="small"
                                      variant={items.some(i => i.materialId === m.id) ? "outlined" : "contained"}
                                      color={items.some(i => i.materialId === m.id) ? "success" : "primary"}
                                      startIcon={items.some(i => i.materialId === m.id) ? <CheckCircle size={14} /> : <Plus size={14} />}
                                      onClick={() => handleAddItem({ ...m, price })} // Pass the resolved price
                                      disabled={items.some(i => i.materialId === m.id)}
                                    >
                                      {items.some(i => i.materialId === m.id) ? "Added" : "Add"}
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid >

            {/* Cart */}
            < Grid item xs={12} md={5} >
              <Card variant="outlined" sx={{ height: '100%', bgcolor: 'background.paper' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                    <ShoppingCart size={20} /> Cart ({items.length})
                  </Typography>
                  {items.length === 0 ? (
                    <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                      <Typography>Your cart is empty</Typography>
                      <Typography variant="caption">Select products from the catalog</Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {items.map(item => (
                        <Card key={item.materialId} variant="outlined" sx={{ p: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle2">{item.name}</Typography>
                              <Typography variant="caption" color="text.secondary">{item.code}</Typography>
                            </Box>
                            <Typography fontWeight={600}>{formatCurrency(item.qty * item.unitPrice)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <IconButton size="small" onClick={() => updateQty(item.materialId, -1)} disabled={item.qty <= 1}>
                                <Minus size={14} />
                              </IconButton>
                              <Typography sx={{ minWidth: 20, textAlign: 'center' }}>{item.qty}</Typography>
                              <IconButton size="small" onClick={() => updateQty(item.materialId, 1)}>
                                <Plus size={14} />
                              </IconButton>
                            </Box>
                            <IconButton size="small" color="error" onClick={() => removeItem(item.materialId)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Box>
                        </Card>
                      ))}
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">Total</Typography>
                        <Typography variant="h6" color="primary">{formatCurrency(calculateTotal())}</Typography>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid >
          </Grid >
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>Order Details</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="PO Number (Optional)"
                        fullWidth
                        value={orderMeta.poNumber}
                        onChange={(e) => setOrderMeta({ ...orderMeta, poNumber: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        type="date"
                        label="Requested Delivery Date"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                        value={orderMeta.requestedDate}
                        onChange={(e) => setOrderMeta({ ...orderMeta, requestedDate: e.target.value })}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Order Notes / Special Instructions"
                        multiline
                        rows={3}
                        fullWidth
                        value={orderMeta.notes}
                        onChange={(e) => setOrderMeta({ ...orderMeta, notes: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card variant="outlined" sx={{ bgcolor: 'primary.soft' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Order Summary</Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Dealer</Typography>
                    <Typography fontWeight={500}>{selectedDealer?.businessName}</Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Items</Typography>
                    <Typography fontWeight={500}>{items.length} skus</Typography>
                  </Box>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal</Typography>
                    <Typography>{formatCurrency(calculateTotal())}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Tax (18%)</Typography>
                    <Typography>{formatCurrency(calculateTotal() * 0.18)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="h5" fontWeight="bold">Total</Typography>
                    <Typography variant="h5" fontWeight="bold" color="primary">
                      {formatCurrency(calculateTotal() * 1.18)}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    sx={{ mt: 3 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? "Placing Order..." : "Confirm Order"}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        );

      default: return null;
    }
  };

  return (
    <Box p={3}>
      <PageHeader
        title="Create Sales Order"
        subtitle="Advanced order entry for Sales Executives"
        action={
          <Button variant="outlined" onClick={() => window.history.back()}>
            Cancel
          </Button>
        }
      />

      <Box sx={{ mb: 4 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
        </Stepper>
      </Box>

      {renderStepContent(activeStep)}

      {/* Navigation Buttons */}
      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {activeStep > 0 && (
          <Button onClick={() => setActiveStep(prev => prev - 1)}>Back</Button>
        )}
        {activeStep < 2 && (
          <Button
            variant="contained"
            onClick={() => {
              if (activeStep === 0 && !dealerId) return toast.error("Select a dealer");
              setActiveStep(prev => prev + 1);
            }}
          >
            Next
          </Button>
        )}
      </Box>
    </Box>
  );
}
