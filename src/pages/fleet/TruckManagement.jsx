import React, { useState, useEffect } from 'react';
import { truckAPI } from '../../services/api';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaTruck, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Chip } from '@mui/material';

const TruckManagement = () => {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [formData, setFormData] = useState({
    truckName: '',
    licenseNumber: '',
    truckType: 'medium',
    capacity: '',
    regionId: '',
    isActive: true
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    regionId: '',
    isActive: true
  });

  useEffect(() => {
    fetchTrucks();
  }, [filters]);

  const fetchTrucks = async () => {
    try {
      setLoading(true);
      const response = await truckAPI.getAll(filters);
      setTrucks(response.trucks || []);
    } catch (error) {
      console.error('Error fetching trucks:', error);
      toast.error('Failed to load trucks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTruck(null);
    setFormData({
      truckName: '',
      licenseNumber: '',
      truckType: 'medium',
      capacity: '',
      regionId: '',
      isActive: true
    });
    setOpenModal(true);
  };

  const handleEdit = (truck) => {
    setEditingTruck(truck);
    setFormData({
      truckName: truck.truckName || '',
      licenseNumber: truck.licenseNumber || '',
      truckType: truck.truckType || 'medium',
      capacity: truck.capacity || '',
      regionId: truck.regionId || '',
      isActive: truck.isActive !== undefined ? truck.isActive : true
    });
    setOpenModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacity: parseFloat(formData.capacity)
      };

      if (editingTruck) {
        await truckAPI.update(editingTruck.id, payload);
        toast.success('Truck updated successfully');
      } else {
        await truckAPI.create(payload);
        toast.success('Truck created successfully');
      }
      setOpenModal(false);
      fetchTrucks();
    } catch (error) {
      console.error('Error saving truck:', error);
      toast.error(error.response?.data?.error || 'Failed to save truck');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this truck?')) return;
    try {
      await truckAPI.delete(id);
      toast.success('Truck deleted successfully');
      fetchTrucks();
    } catch (error) {
      console.error('Error deleting truck:', error);
      toast.error('Failed to delete truck');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'success',
      assigned: 'warning',
      in_transit: 'info',
      delivered: 'default',
      maintenance: 'error'
    };
    return colors[status] || 'default';
  };

  const columns = [
    { field: 'truckName', headerName: 'Truck Name', width: 150 },
    { field: 'licenseNumber', headerName: 'License Number', width: 150 },
    {
      field: 'truckType',
      headerName: 'Type',
      width: 120,
      renderCell: (params) => (
        <span style={{ textTransform: 'capitalize' }}>{params.value}</span>
      )
    },
    {
      field: 'capacity',
      headerName: 'Capacity (tons)',
      width: 130,
      renderCell: (params) => `${params.value} tons`
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
      field: 'currentLat',
      headerName: 'Location',
      width: 150,
      renderCell: (params) => {
        if (params.row.currentLat && params.row.currentLng) {
          return (
            <span>
              {params.row.currentLat.toFixed(4)}, {params.row.currentLng.toFixed(4)}
            </span>
          );
        }
        return <span style={{ color: 'gray' }}>No location</span>;
      }
    },
    {
      field: 'lastLocationUpdate',
      headerName: 'Last Update',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return <span style={{ color: 'gray' }}>Never</span>;
        return new Date(params.value).toLocaleString();
      }
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 100,
      renderCell: (params) => (
        <span style={{ color: params.value ? 'green' : 'red' }}>
          {params.value ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FaEdit />}
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<FaTrash />}
            onClick={() => handleDelete(params.row.id)}
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Truck Management"
        icon={<FaTruck />}
        action={
          <Button
            variant="contained"
            startIcon={<FaPlus />}
            onClick={handleCreate}
          >
            Create Truck
          </Button>
        }
      />

      <Card>
        <div style={{ marginBottom: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <TextField
            label="Search"
            size="small"
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            style={{ minWidth: '200px' }}
          />
          <TextField
            label="Status"
            select
            size="small"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            style={{ minWidth: '150px' }}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="available">Available</MenuItem>
            <MenuItem value="assigned">Assigned</MenuItem>
            <MenuItem value="in_transit">In Transit</MenuItem>
            <MenuItem value="delivered">Delivered</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
          </TextField>
          <TextField
            label="Active Status"
            select
            size="small"
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
            style={{ minWidth: '150px' }}
          >
            <MenuItem value={true}>Active</MenuItem>
            <MenuItem value={false}>Inactive</MenuItem>
            <MenuItem value="">All</MenuItem>
          </TextField>
        </div>

        <DataTable
          rows={trucks}
          columns={columns}
          loading={loading}
          page={filters.page - 1}
          pageSize={filters.limit}
          onPageChange={(newPage) => setFilters({ ...filters, page: newPage + 1 })}
          onPageSizeChange={(newPageSize) => setFilters({ ...filters, limit: newPageSize, page: 1 })}
        />
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTruck ? 'Edit Truck' : 'Create Truck'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <TextField
                label="Truck Name"
                required
                value={formData.truckName}
                onChange={(e) => setFormData({ ...formData, truckName: e.target.value })}
                fullWidth
              />
              <TextField
                label="License Number"
                required
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                fullWidth
              />
              <TextField
                label="Truck Type"
                select
                required
                value={formData.truckType}
                onChange={(e) => setFormData({ ...formData, truckType: e.target.value })}
                fullWidth
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </TextField>
              <TextField
                label="Capacity (tons)"
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                fullWidth
                inputProps={{ step: '0.1', min: '0' }}
              />
              <TextField
                label="Status"
                select
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value })}
                fullWidth
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </TextField>
            </div>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingTruck ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
};

export default TruckManagement;

