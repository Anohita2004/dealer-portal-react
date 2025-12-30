import React, { useState, useEffect } from 'react';
import { fleetAPI, truckAPI, warehouseAPI, orderAPI } from '../../services/api';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaTruck, FaPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  MenuItem, 
  Chip,
  Autocomplete,
  Box,
  Typography,
  Divider,
  CircularProgress
} from '@mui/material';

const FleetAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    truckId: '',
    warehouseId: '',
    driverName: '',
    driverPhone: '',
    estimatedDeliveryAt: '',
    notes: ''
  });
  const [trucks, setTrucks] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderSearchTerm, setOrderSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    orderId: '',
    truckId: ''
  });

  useEffect(() => {
    fetchAssignments();
    fetchTrucks();
    fetchWarehouses();
  }, [filters]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fleetAPI.getAssignments(filters);
      setAssignments(response.assignments || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrucks = async () => {
    try {
      const response = await truckAPI.getAll({ status: 'available', limit: 100 });
      setTrucks(response.trucks || []);
    } catch (error) {
      console.error('Error fetching trucks:', error);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await warehouseAPI.getAll({ isActive: true, limit: 100 });
      setWarehouses(response.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
    }
  };

  const fetchApprovedOrders = async (searchTerm = '') => {
    try {
      setOrdersLoading(true);
      
      // Get list of orders that already have assignments
      let assignedOrderIds = new Set();
      try {
        const assignmentsResponse = await fleetAPI.getAssignments({ limit: 1000 });
        const allAssignments = assignmentsResponse.assignments || [];
        assignedOrderIds = new Set(allAssignments.map(a => a.orderId).filter(Boolean));
      } catch (error) {
        console.error('Error fetching assignments:', error);
      }
      
      // Fetch approved orders - try with status filter first, then fallback
      let allOrders = [];
      let response;
      
      // Try fetching with status filter (try both capitalized and lowercase)
      const statusValues = ['Approved', 'approved'];
      let fetchSuccess = false;
      
      for (const statusValue of statusValues) {
        if (fetchSuccess) break;
        
        try {
          const params = {
            status: statusValue,
            limit: 500,
            ...(searchTerm && searchTerm.length >= 2 && { search: searchTerm })
          };
          
          response = await orderAPI.getAllOrders(params);
          
          // Handle different response formats
          if (Array.isArray(response)) {
            allOrders = response;
          } else if (response?.orders && Array.isArray(response.orders)) {
            allOrders = response.orders;
          } else if (response?.data && Array.isArray(response.data)) {
            allOrders = response.data;
          }
          
          if (allOrders.length > 0) {
            fetchSuccess = true;
            console.log(`Successfully fetched ${allOrders.length} orders with status: ${statusValue}`);
          }
        } catch (error) {
          console.warn(`Failed to fetch with status "${statusValue}":`, error.response?.data || error.message);
        }
      }
      
      // If status filter didn't work, fetch all orders and filter client-side
      if (!fetchSuccess || allOrders.length === 0) {
        try {
          const params = {
            limit: 500,
            ...(searchTerm && searchTerm.length >= 2 && { search: searchTerm })
          };
          
          response = await orderAPI.getAllOrders(params);
          
          // Handle different response formats
          if (Array.isArray(response)) {
            allOrders = response;
          } else if (response?.orders && Array.isArray(response.orders)) {
            allOrders = response.orders;
          } else if (response?.data && Array.isArray(response.data)) {
            allOrders = response.data;
          }
          
          console.log(`Fetched ${allOrders.length} orders without status filter (will filter client-side)`);
        } catch (error) {
          console.error('Failed to fetch orders:', error.response?.data || error.message);
          throw error;
        }
      }
      
      console.log('Total orders fetched:', allOrders.length);
      
      // Filter to only approved orders that are ready for assignment
      const approvedOrders = allOrders.filter(order => {
        if (!order || !order.id) return false;
        
        // Exclude if already assigned
        if (assignedOrderIds.has(order.id)) {
          return false;
        }
        
        const status = (order.status || '').toLowerCase().trim();
        const approvalStatus = (order.approvalStatus || '').toLowerCase().trim();
        const workflowStatus = (order.workflow?.approvalStatus || '').toLowerCase().trim();
        
        // Check if order is approved (check multiple possible fields)
        const isApproved = 
          status === 'approved' || 
          approvalStatus === 'approved' || 
          workflowStatus === 'approved' ||
          status === 'processing'; // Processing orders are also ready for assignment
        
        // Exclude orders that are delivered, cancelled, or shipped
        const isExcluded = 
          status === 'delivered' || 
          status === 'cancelled' || 
          status === 'shipped' ||
          status === 'rejected';
        
        return isApproved && !isExcluded;
      });
      
      console.log('Filtered approved orders:', approvedOrders.length, 'orders');
      console.log('Sample approved orders:', approvedOrders.slice(0, 3));
      
      setOrders(approvedOrders);
    } catch (error) {
      console.error('Error fetching approved orders:', error);
      console.error('Error details:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to load approved orders');
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleCreate = () => {
    setFormData({
      orderId: '',
      truckId: '',
      warehouseId: '',
      driverName: '',
      driverPhone: '',
      estimatedDeliveryAt: '',
      notes: ''
    });
    setOrderSearchTerm('');
    setOrders([]);
    setOpenModal(true);
    // Fetch approved orders when modal opens
    fetchApprovedOrders();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        estimatedDeliveryAt: formData.estimatedDeliveryAt || undefined
      };
      await fleetAPI.assign(payload);
      toast.success('Truck assigned successfully');
      setOpenModal(false);
      fetchAssignments();
      fetchTrucks(); // Refresh to update truck status
    } catch (error) {
      console.error('Error assigning truck:', error);
      toast.error(error.response?.data?.error || 'Failed to assign truck');
    }
  };

  const handlePickup = async (id) => {
    try {
      await fleetAPI.markPickup(id);
      toast.success('Pickup marked successfully');
      fetchAssignments();
    } catch (error) {
      console.error('Error marking pickup:', error);
      toast.error('Failed to mark pickup');
    }
  };

  const handleDeliver = async (id) => {
    try {
      await fleetAPI.markDeliver(id);
      toast.success('Delivery marked successfully');
      fetchAssignments();
    } catch (error) {
      console.error('Error marking delivery:', error);
      toast.error('Failed to mark delivery');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'warning',
      picked_up: 'info',
      in_transit: 'primary',
      delivered: 'success',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      key: 'order',
      label: 'Order',
      render: (_, row) => row.order?.orderNumber || row.orderId
    },
    {
      key: 'truck',
      label: 'Truck',
      render: (_, row) => {
        const truck = row.truck;
        return truck ? `${truck.truckName} (${truck.licenseNumber})` : 'N/A';
      }
    },
    {
      key: 'warehouse',
      label: 'Warehouse',
      render: (_, row) => row.warehouse?.name || 'N/A'
    },
    { key: 'driverName', label: 'Driver' },
    { key: 'driverPhone', label: 'Driver Phone' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <Chip
          label={value?.replace('_', ' ') || 'N/A'}
          color={getStatusColor(value)}
          size="small"
        />
      )
    },
    {
      key: 'assignedAt',
      label: 'Assigned At',
      render: (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString();
      }
    },
    {
      key: 'estimatedDeliveryAt',
      label: 'Est. Delivery',
      render: (value) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleString();
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => {
        const status = row.status;
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            {status === 'assigned' && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<FaCheckCircle />}
                onClick={() => handlePickup(row.id)}
              >
                Mark Pickup
              </Button>
            )}
            {(status === 'picked_up' || status === 'in_transit') && (
              <Button
                size="small"
                variant="outlined"
                color="success"
                startIcon={<FaCheckCircle />}
                onClick={() => handleDeliver(row.id)}
              >
                Mark Delivered
              </Button>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div>
      <PageHeader
        title="Fleet Assignments"
        actions={
          <Button
            variant="contained"
            startIcon={<FaPlus />}
            onClick={handleCreate}
          >
            Assign Truck
          </Button>
        }
      />

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <TextField
            label="Status"
            select
            size="small"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            style={{ minWidth: '150px' }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="picked_up">Picked Up</MenuItem>
            <MenuItem value="in_transit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          <TextField
            label="Order ID"
            size="small"
            value={filters.orderId}
            onChange={(e) => setFilters({ ...filters, orderId: e.target.value, page: 1 })}
            style={{ minWidth: '200px' }}
          />
          <TextField
            label="Truck ID"
            size="small"
            value={filters.truckId}
            onChange={(e) => setFilters({ ...filters, truckId: e.target.value, page: 1 })}
            style={{ minWidth: '200px' }}
          />
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading assignments...</div>
        ) : (
          <DataTable
            rows={assignments}
            columns={columns}
            emptyMessage="No assignments found"
          />
        )}
      </Card>

      {/* Assign Truck Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Truck to Order</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Select Order
              </Typography>
              <Autocomplete
                options={orders}
                loading={ordersLoading}
                value={orders.find(o => o.id === formData.orderId) || null}
                onChange={(event, newValue) => {
                  setFormData({ ...formData, orderId: newValue?.id || '' });
                }}
                onInputChange={(event, newInputValue) => {
                  setOrderSearchTerm(newInputValue);
                  if (newInputValue.length >= 2) {
                    fetchApprovedOrders(newInputValue);
                  } else if (newInputValue.length === 0) {
                    fetchApprovedOrders();
                  }
                }}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return `${option.orderNumber || option.id} - ${option.dealer?.businessName || 'Unknown Dealer'}`;
                }}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                          {option.orderNumber || `Order #${option.id}`}
                        </Typography>
                        {option.totalAmount && (
                          <Chip 
                            label={`₹${Number(option.totalAmount).toLocaleString()}`}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Dealer: {option.dealer?.businessName || 'Unknown'}
                      </Typography>
                      {option.dealer?.city && (
                        <Typography variant="caption" color="text.secondary">
                          {option.dealer.city}, {option.dealer.state}
                        </Typography>
                      )}
                      {option.createdAt && (
                        <Typography variant="caption" color="text.secondary">
                          Created: {new Date(option.createdAt).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search Approved Orders"
                    required
                    placeholder="Type to search orders by number or dealer name..."
                    helperText={orders.length > 0 ? `${orders.length} approved orders available` : 'No approved orders found'}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {ordersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                noOptionsText={ordersLoading ? "Loading orders..." : "No approved orders found"}
                fullWidth
              />
              {formData.orderId && (
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Selected Order: {orders.find(o => o.id === formData.orderId)?.orderNumber || formData.orderId}
                  </Typography>
                </Box>
              )}
              <TextField
                label="Select Truck"
                select
                required
                value={formData.truckId}
                onChange={(e) => setFormData({ ...formData, truckId: e.target.value })}
                fullWidth
              >
                <MenuItem value="">Select a truck</MenuItem>
                {trucks.map(truck => (
                  <MenuItem key={truck.id} value={truck.id}>
                    {truck.truckName} - {truck.licenseNumber} ({truck.truckType})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Select Warehouse"
                select
                required
                value={formData.warehouseId}
                onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value })}
                fullWidth
              >
                <MenuItem value="">Select a warehouse</MenuItem>
                {warehouses.map(wh => (
                  <MenuItem key={wh.id} value={wh.id}>
                    {wh.name} - {wh.city}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Driver Name"
                required
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                fullWidth
              />
              <TextField
                label="Driver Phone"
                value={formData.driverPhone}
                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                fullWidth
              />
              <TextField
                label="Estimated Delivery"
                type="datetime-local"
                value={formData.estimatedDeliveryAt}
                onChange={(e) => setFormData({ ...formData, estimatedDeliveryAt: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                fullWidth
              />
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Assign
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default FleetAssignments;

