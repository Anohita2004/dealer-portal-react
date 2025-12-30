import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Button,
  TextField,
  InputAdornment,
  Chip,
} from '@mui/material';
import { FaUserPlus, FaSearch, FaEdit, FaTrash, FaTruck } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import { userAPI } from '../../services/api';
import { toast } from 'react-toastify';

const DriverManagement = () => {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getAll({ 
        role: 'driver,fleet_driver',
        isActive: true 
      });
      
      const driversList = response.users || response.data || response || [];
      setDrivers(Array.isArray(driversList) ? driversList : []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (driverId) => {
    if (!window.confirm('Are you sure you want to delete this driver?')) {
      return;
    }

    try {
      await userAPI.deleteUser(driverId);
      toast.success('Driver deleted successfully');
      fetchDrivers();
    } catch (error) {
      console.error('Error deleting driver:', error);
      toast.error(error.response?.data?.error || 'Failed to delete driver');
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phoneNumber?.includes(searchTerm)
  );

  const columns = [
    {
      key: 'username',
      label: 'Username',
      render: (row) => (
        <div>
          <div style={{ fontWeight: '600' }}>{row.username}</div>
          {row.email && (
            <div style={{ fontSize: '12px', color: '#666' }}>{row.email}</div>
          )}
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      label: 'Phone',
      render: (row) => row.phoneNumber || 'N/A',
    },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <Chip
          label={row.role?.name || row.role || 'Driver'}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      key: 'region',
      label: 'Region',
      render: (row) => row.region?.name || 'N/A',
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <Chip
          label={row.isActive ? 'Active' : 'Inactive'}
          size="small"
          color={row.isActive ? 'success' : 'default'}
        />
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<FaEdit />}
            onClick={() => navigate(`/fleet/drivers/${row.id}/edit`)}
          >
            Edit
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<FaTrash />}
            onClick={() => handleDelete(row.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Driver Management"
        icon={<FaTruck />}
        actions={[
          <Button
            key="create"
            variant="contained"
            startIcon={<FaUserPlus />}
            onClick={() => navigate('/fleet/drivers/create')}
          >
            Create Driver
          </Button>,
        ]}
      />

      <Card sx={{ mt: 2, p: 2 }}>
        <TextField
          fullWidth
          placeholder="Search drivers by username, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <DataTable
          data={filteredDrivers}
          columns={columns}
          loading={loading}
          emptyMessage="No drivers found. Create your first driver to get started."
        />
      </Card>
    </div>
  );
};

export default DriverManagement;

