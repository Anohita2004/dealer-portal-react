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
  InputAdornment,
  Tooltip,
  Autocomplete,
  Grid,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Plus, Trash2, ShoppingCart, Lock, Search, Edit2, Check, X, AlertCircle, Package, Calendar, Flag, FileText } from "lucide-react";
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
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [notes, setNotes] = useState("");
  
  // Order metadata
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [priority, setPriority] = useState("normal");
  const [referenceNumber, setReferenceNumber] = useState("");

  // Form state for adding new item
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialSearch, setMaterialSearch] = useState("");
  const [materialGroupFilter, setMaterialGroupFilter] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");

  // Material groups for filtering
  const [materialGroups, setMaterialGroups] = useState([]);

  // Check if user is accounts user (read-only for order creation)
  const isReadOnly = !canAccountsUserPerform(user, "create_orders");

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        // Dealer / sales roles must use dealer-scoped materials
        if (user?.dealerId) {
          const res = await materialAPI.getDealerMaterials(user.dealerId);
          const list =
            res?.materials || res?.data?.materials || res?.data || res || [];
          setMaterials(Array.isArray(list) ? list : []);
        } else {
          const res = await materialAPI.getMaterials();
          const list = res?.materials || res?.data || res || [];
          setMaterials(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        console.error("Failed to fetch materials:", err);
        toast.error("Failed to load materials for this dealer");
      }
    };

    const fetchMaterialGroups = async () => {
      try {
        const res = await materialAPI.getMaterialGroups();
        const groups = res?.groups || res?.data?.groups || res?.data || res || [];
        setMaterialGroups(Array.isArray(groups) ? groups : []);
      } catch (err) {
        console.error("Failed to fetch material groups:", err);
      }
    };

    fetchMaterials();
    fetchMaterialGroups();
  }, []);

  // Filter materials based on search and group
  useEffect(() => {
    let filtered = [...materials];

    // Filter by search term (name, materialNumber, description)
    if (materialSearch) {
      const searchLower = materialSearch.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name?.toLowerCase().includes(searchLower) ||
          m.materialNumber?.toLowerCase().includes(searchLower) ||
          m.materialCode?.toLowerCase().includes(searchLower) ||
          m.description?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by material group
    if (materialGroupFilter) {
      filtered = filtered.filter(
        (m) =>
          m.materialGroupId === materialGroupFilter ||
          m.group?.id === materialGroupFilter ||
          m.materialGroup?.id === materialGroupFilter
      );
    }

    setFilteredMaterials(filtered);
  }, [materials, materialSearch, materialGroupFilter]);

  // Get selected material details
  const getSelectedMaterial = () => {
    return materials.find((m) => m.id === selectedMaterial);
  };

  // Check stock availability
  const getStockInfo = (material) => {
    const stock = material?.stock ?? material?.availableStock ?? null;
    const minStock = material?.minStock ?? 0;
    
    if (stock === null) return { available: null, status: "unknown", label: "N/A" };
    
    if (stock <= 0) {
      return { available: 0, status: "out", label: "Out of Stock", color: "error" };
    }
    if (stock < minStock) {
      return { available: stock, status: "low", label: "Low Stock", color: "warning" };
    }
    return { available: stock, status: "ok", label: "In Stock", color: "success" };
  };

  // Validate quantity against stock
  const validateQuantity = (qty, material) => {
    const stockInfo = getStockInfo(material);
    if (stockInfo.available === null) return { valid: true }; // Can't validate if stock unknown
    
    if (Number(qty) > stockInfo.available) {
      return {
        valid: false,
        message: `Quantity exceeds available stock (${stockInfo.available} ${material?.uom || "units"})`,
      };
    }
    return { valid: true };
  };

  const addItem = () => {
    if (!selectedMaterial || !quantity) {
      toast.error("Please select a material and enter quantity");
      return;
    }

    const material = getSelectedMaterial();
    if (!material) {
      toast.error("Selected material not found");
      return;
    }

    const qty = Number(quantity);
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    // Validate stock availability
    const stockValidation = validateQuantity(qty, material);
    if (!stockValidation.valid) {
      toast.error(stockValidation.message);
      return;
    }

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
      materialNumber: material?.materialNumber || material?.materialCode || "",
      materialDescription: material?.description || "",
      materialGroupId: material?.materialGroupId || material?.group?.id || material?.materialGroup?.id || null,
      materialGroupName: material?.group?.name || material?.materialGroup?.name || "",
      qty: qty,
      unitPrice: price,
      amount: qty * price,
      uom: material?.uom || "EA",
      stock: material?.stock ?? material?.availableStock ?? null,
    };

    setOrderItems([...orderItems, newItem]);
    
    // Reset form
    setSelectedMaterial("");
    setMaterialSearch("");
    setQuantity("");
    setUnitPrice("");
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const startEditQuantity = (index) => {
    setEditingIndex(index);
    setEditQuantity(orderItems[index].qty.toString());
  };

  const saveEditQuantity = (index) => {
    const qty = Number(editQuantity);
    if (qty <= 0) {
      toast.error("Quantity must be greater than 0");
      return;
    }

    const item = orderItems[index];
    const material = materials.find((m) => m.id === item.materialId);
    
    if (material) {
      const stockValidation = validateQuantity(qty, material);
      if (!stockValidation.valid) {
        toast.error(stockValidation.message);
        return;
      }
    }

    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      qty: qty,
      amount: qty * updatedItems[index].unitPrice,
    };
    setOrderItems(updatedItems);
    setEditingIndex(null);
    setEditQuantity("");
  };

  const cancelEditQuantity = () => {
    setEditingIndex(null);
    setEditQuantity("");
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
          uom: item.uom || "EA",
          materialNumber: item.materialNumber,
          materialDescription: item.materialDescription,
          materialGroupId: item.materialGroupId,
        })),
        notes: notes || "",
        expectedDeliveryDate: expectedDeliveryDate || null,
        priority: priority || "normal",
        referenceNumber: referenceNumber || null,
      };

      await post("/orders", payload);
      toast.success("Order created successfully!");
      
      // Reset form
      setOrderItems([]);
      setNotes("");
      setExpectedDeliveryDate("");
      setPriority("normal");
      setReferenceNumber("");
      
      // Navigate to orders list
      setTimeout(() => {
        navigate("/orders/my");
      }, 1500);
    } catch (err) {
      console.error("Order create error:", err);
      if (err?.response?.status === 400 || err?.response?.status === 403) {
        toast.error(
          err?.response?.data?.error ||
            "Material not available for this dealer or order not allowed."
        );
      } else {
        toast.error(err?.response?.data?.error || "Failed to create order");
      }
    }
  };

  const totalAmount = orderItems.reduce((sum, item) => sum + item.amount, 0);
  const selectedMaterialData = getSelectedMaterial();
  const stockInfo = selectedMaterialData ? getStockInfo(selectedMaterialData) : null;

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

            {/* MATERIAL SEARCH */}
            <TextField
              fullWidth
              label="Search Materials"
              value={materialSearch}
              onChange={(e) => setMaterialSearch(e.target.value)}
              margin="normal"
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              placeholder="Search by name, number, or description..."
              disabled={isReadOnly}
            />

            {/* MATERIAL GROUP FILTER */}
            {materialGroups.length > 0 && (
              <TextField
                fullWidth
                select
                label="Filter by Group"
                value={materialGroupFilter}
                onChange={(e) => setMaterialGroupFilter(e.target.value)}
                margin="normal"
                size="small"
                disabled={isReadOnly}
              >
                <MenuItem value="">All Groups</MenuItem>
                {materialGroups.map((group) => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </TextField>
            )}

            {/* MATERIAL SELECT */}
            <Autocomplete
              options={filteredMaterials}
              getOptionLabel={(option) => 
                `${option.name || "Unknown"}${option.materialNumber ? ` (${option.materialNumber})` : ""}${option.uom ? ` - ${option.uom}` : ""}`
              }
              value={selectedMaterialData || null}
              onChange={(event, newValue) => {
                setSelectedMaterial(newValue?.id || "");
                if (newValue?.price) {
                  setUnitPrice(newValue.price);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Material"
                  margin="normal"
                  size="small"
                  disabled={isReadOnly}
                />
              )}
              renderOption={(props, option) => {
                const stock = getStockInfo(option);
                return (
                  <Box component="li" {...props} key={option.id}>
                    <Box sx={{ width: "100%" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.name}
                        </Typography>
                        {stock.available !== null && (
                          <Chip
                            label={stock.label}
                            size="small"
                            color={stock.color || "default"}
                            sx={{ ml: 1 }}
                          />
                        )}
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        {option.materialNumber && (
                          <Typography variant="caption" color="text.secondary">
                            #{option.materialNumber}
                          </Typography>
                        )}
                        {option.uom && (
                          <Typography variant="caption" color="text.secondary">
                            • {option.uom}
                          </Typography>
                        )}
                        {option.price && (
                          <Typography variant="caption" color="text.secondary">
                            • ₹{Number(option.price).toLocaleString()}
                          </Typography>
                        )}
                        {stock.available !== null && (
                          <Typography variant="caption" color="text.secondary">
                            • Stock: {stock.available}
                          </Typography>
                        )}
                      </Box>
                      {option.description && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                          {option.description.length > 50 
                            ? `${option.description.substring(0, 50)}...` 
                            : option.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              disabled={isReadOnly}
            />

            {/* MATERIAL DETAILS CARD */}
            {selectedMaterialData && (
              <Card variant="outlined" sx={{ mt: 2, p: 1.5, bgcolor: "grey.50" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Material Details
                  </Typography>
                  {stockInfo && stockInfo.available !== null && (
                    <Chip
                      label={stockInfo.label}
                      size="small"
                      color={stockInfo.color || "default"}
                    />
                  )}
                </Box>
                <Grid container spacing={1}>
                  {selectedMaterialData.materialNumber && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Material #</Typography>
                      <Typography variant="body2">{selectedMaterialData.materialNumber}</Typography>
                    </Grid>
                  )}
                  {selectedMaterialData.uom && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">UOM</Typography>
                      <Typography variant="body2">{selectedMaterialData.uom}</Typography>
                    </Grid>
                  )}
                  {stockInfo && stockInfo.available !== null && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Available Stock</Typography>
                      <Typography variant="body2">{stockInfo.available} {selectedMaterialData.uom || "units"}</Typography>
                    </Grid>
                  )}
                  {(selectedMaterialData.group?.name || selectedMaterialData.materialGroup?.name) && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Group</Typography>
                      <Typography variant="body2">
                        {selectedMaterialData.group?.name || selectedMaterialData.materialGroup?.name}
                      </Typography>
                    </Grid>
                  )}
                  {selectedMaterialData.description && (
                    <Grid item xs={12}>
                      <Typography variant="caption" color="text.secondary">Description</Typography>
                      <Typography variant="body2">{selectedMaterialData.description}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Card>
            )}

            {/* STOCK WARNING */}
            {selectedMaterialData && stockInfo && stockInfo.status === "out" && (
              <Alert severity="error" icon={<AlertCircle size={18} />} sx={{ mt: 2 }}>
                This material is currently out of stock
              </Alert>
            )}
            {selectedMaterialData && stockInfo && stockInfo.status === "low" && (
              <Alert severity="warning" icon={<AlertCircle size={18} />} sx={{ mt: 2 }}>
                Low stock available: {stockInfo.available} {selectedMaterialData.uom || "units"}
              </Alert>
            )}

            {/* QUANTITY */}
            <TextField
              fullWidth
              label={`Quantity${selectedMaterialData ? ` (${selectedMaterialData.uom || "EA"})` : ""}`}
              value={quantity}
              onChange={(e) => {
                const val = e.target.value;
                setQuantity(val);
                
                // Real-time stock validation
                if (selectedMaterialData && val) {
                  const qty = Number(val);
                  if (qty > 0) {
                    const validation = validateQuantity(qty, selectedMaterialData);
                    if (!validation.valid) {
                      // Warning will be shown via helper text
                    }
                  }
                }
              }}
              margin="normal"
              type="number"
              size="small"
              inputProps={{ min: 1 }}
              disabled={isReadOnly}
              error={
                selectedMaterialData &&
                quantity &&
                !validateQuantity(quantity, selectedMaterialData).valid
              }
              helperText={
                selectedMaterialData &&
                quantity &&
                !validateQuantity(quantity, selectedMaterialData).valid
                  ? validateQuantity(quantity, selectedMaterialData).message
                  : selectedMaterialData && stockInfo?.available !== null
                  ? `Available: ${stockInfo.available} ${selectedMaterialData.uom || "units"}`
                  : ""
              }
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
              helperText={
                selectedMaterialData?.price &&
                Number(unitPrice) !== Number(selectedMaterialData.price)
                  ? `Base price: ₹${Number(selectedMaterialData.price).toLocaleString()}`
                  : ""
              }
            />

            <Button
              variant="outlined"
              startIcon={<Plus size={18} />}
              fullWidth
              onClick={addItem}
              sx={{ mt: 2 }}
              disabled={
                isReadOnly ||
                !selectedMaterial ||
                !quantity ||
                (selectedMaterialData &&
                  !validateQuantity(quantity, selectedMaterialData).valid)
              }
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
                      <TableCell align="center">UOM</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderItems.map((item, index) => {
                      const isEditing = editingIndex === index;
                      return (
                        <TableRow key={index}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {item.materialName}
                              </Typography>
                              {item.materialNumber && (
                                <Typography variant="caption" color="text.secondary">
                                  #{item.materialNumber}
                                </Typography>
                              )}
                              {item.materialGroupName && (
                                <Chip
                                  label={item.materialGroupName}
                                  size="small"
                                  sx={{ mt: 0.5, height: 20 }}
                                />
                              )}
                              {item.stock !== null && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                                  Stock: {item.stock} {item.uom}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {isEditing ? (
                              <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
                                <TextField
                                  size="small"
                                  type="number"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(e.target.value)}
                                  inputProps={{ min: 1, style: { width: "60px", textAlign: "right" } }}
                                  sx={{ width: "80px" }}
                                />
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => saveEditQuantity(index)}
                                >
                                  <Check size={14} />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={cancelEditQuantity}
                                >
                                  <X size={14} />
                                </IconButton>
                              </Box>
                            ) : (
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                                <Typography>{item.qty}</Typography>
                                {!isReadOnly && (
                                  <IconButton
                                    size="small"
                                    onClick={() => startEditQuantity(index)}
                                    sx={{ p: 0.5 }}
                                  >
                                    <Edit2 size={14} />
                                  </IconButton>
                                )}
                              </Box>
                            )}
                          </TableCell>
                          <TableCell align="center">{item.uom || "EA"}</TableCell>
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
                      );
                    })}
                  </TableBody>
                </Table>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h6" color="primary">
                    ₹{totalAmount.toLocaleString()}
                  </Typography>
                </Box>

                {/* Order Metadata */}
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
                  <FileText size={16} />
                  Order Details
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Expected Delivery Date"
                      type="date"
                      value={expectedDeliveryDate}
                      onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      size="small"
                      disabled={isReadOnly}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Calendar size={16} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Priority</InputLabel>
                      <Select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        label="Priority"
                        disabled={isReadOnly}
                      >
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Reference Number (PO/Order Ref)"
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      size="small"
                      disabled={isReadOnly}
                      placeholder="Optional reference number..."
                    />
                  </Grid>
                </Grid>

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
