import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { truckAPI } from '../../services/api';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaTruck, FaPlus, FaEdit } from 'react-icons/fa';
import { Button, TextField, MenuItem, Chip } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const TruckManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
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
    navigate('/fleet/trucks/create');
  };

  const handleEdit = (truck) => {
    navigate(`/fleet/trucks/${truck.id}`);
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
    { key: 'truckName', label: 'Truck Name' },
    { key: 'licenseNumber', label: 'License Number' },
    {
      key: 'truckType',
      label: 'Type',
      render: (value) => (
        <span style={{ textTransform: 'capitalize' }}>{value}</span>
      )
    },
    {
      key: 'capacity',
      label: 'Capacity (tons)',
      render: (value) => `${value} tons`
    },
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
      key: 'location',
      label: 'Location',
      render: (_, row) => {
        const lat = Number(row.currentLat);
        const lng = Number(row.currentLng);
        if (!isNaN(lat) && !isNaN(lng)) {
          return (
            <span>
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          );
        }
        return <span style={{ color: 'gray' }}>No location</span>;
      }
    },
    {
      key: 'lastLocationUpdate',
      label: 'Last Update',
      render: (value) => {
        if (!value) return <span style={{ color: 'gray' }}>Never</span>;
        return new Date(value).toLocaleString();
      }
    },
    {
      key: 'isActive',
      label: 'Active',
      render: (value) => (
        <span style={{ color: value ? 'green' : 'red' }}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          startIcon={<FaEdit />}
          onClick={() => handleEdit(row)}
        >
          View/Edit
        </Button>
      )
    }
  ];

  return (
    <div>
      <PageHeader
        title="Truck Management"
        actions={
          user?.role === 'super_admin' || user?.role === 'regional_admin' ? (
            <Button
              variant="contained"
              startIcon={<FaPlus />}
              onClick={handleCreate}
            >
              Create Truck
            </Button>
          ) : null
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

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading trucks...</div>
        ) : (
          <DataTable
            rows={trucks}
            columns={columns}
            emptyMessage="No trucks found"
          />
        )}
      </Card>
    </div>
  );
};

export default TruckManagement;

