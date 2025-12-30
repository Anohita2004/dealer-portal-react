import React, { useState, useEffect } from 'react';
import { fleetAPI, truckAPI, warehouseAPI, orderAPI } from '../../services/api';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaTruck, FaPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip } from '@mui/material';

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

  const fetchOrders = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setOrders([]);
      return;
    }
    try {
      const response = await orderAPI.getAll({ search: searchTerm, limit: 20 });
      setOrders(response.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
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
    setOpenModal(true);
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
      field: 'order',
      headerName: 'Order',
      width: 150,
      renderCell: (params) => params.row.order?.orderNumber || params.row.orderId
    },
    {
      field: 'truck',
      headerName: 'Truck',
      width: 180,
      renderCell: (params) => {
        const truck = params.row.truck;
        return truck ? `${truck.truckName} (${truck.licenseNumber})` : 'N/A';
      }
    },
    {
      field: 'warehouse',
      headerName: 'Warehouse',
      width: 200,
      renderCell: (params) => params.row.warehouse?.name || 'N/A'
    },
    {
      field: 'driverName',
      headerName: 'Driver',
      width: 150
    },
    {
      field: 'driverPhone',
      headerName: 'Driver Phone',
      width: 130
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={params.value?.replace('_', ' ') || 'N/A'}
          color={getStatusColor(params.value)}
          size="small"
        />
      )
    },
    {
      field: 'assignedAt',
      headerName: 'Assigned At',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleString();
      }
    },
    {
      field: 'estimatedDeliveryAt',
      headerName: 'Est. Delivery',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        return new Date(params.value).toLocaleString();
      }
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => {
        const status = params.row.status;
        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            {status === 'assigned' && (
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<FaCheckCircle />}
                onClick={() => handlePickup(params.row.id)}
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
                onClick={() => handleDeliver(params.row.id)}
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
        icon={<FaTruck />}
        action={
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

        <DataTable
          rows={assignments}
          columns={columns}
          loading={loading}
          page={filters.page - 1}
          pageSize={filters.limit}
          onPageChange={(newPage) => setFilters({ ...filters, page: newPage + 1 })}
          onPageSizeChange={(newPageSize) => setFilters({ ...filters, limit: newPageSize, page: 1 })}
        />
      </Card>

      {/* Assign Truck Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Truck to Order</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <TextField
                label="Order ID"
                required
                value={formData.orderId}
                onChange={(e) => {
                  setFormData({ ...formData, orderId: e.target.value });
                  fetchOrders(e.target.value);
                }}
                fullWidth
                helperText="Enter order ID or search for orders"
              />
              {orders.length > 0 && (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                  {orders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setFormData({ ...formData, orderId: order.id });
                        setOrders([]);
                      }}
                      style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                    >
                      {order.orderNumber} - {order.dealer?.businessName || 'N/A'}
                    </div>
                  ))}
                </div>
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

