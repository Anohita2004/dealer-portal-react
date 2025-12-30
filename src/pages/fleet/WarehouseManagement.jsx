import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { warehouseAPI } from '../../services/api';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaWarehouse, FaPlus, FaEdit, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { Button, TextField, MenuItem } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { RequireRole } from '../../components/ProtectedRoute';

const WarehouseManagement = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    regionId: '',
    areaId: '',
    isActive: true
  });

  useEffect(() => {
    fetchWarehouses();
  }, [filters]);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseAPI.getAll(filters);
      setWarehouses(response.warehouses || []);
    } catch (error) {
      console.error('Error fetching warehouses:', error);
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/fleet/warehouses/create');
  };

  const handleEdit = (warehouse) => {
    navigate(`/fleet/warehouses/${warehouse.id}`);
  };

  const columns = [
    { key: 'warehouseCode', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'phoneNumber', label: 'Phone' },
    {
      key: 'isActive',
      label: 'Status',
      render: (value) => (
        <span style={{ color: value ? 'green' : 'red' }}>
          {value ? 'Active' : 'Inactive'}
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
        title="Warehouse Management"
        actions={
          user?.role === 'super_admin' ? (
            <Button
              variant="contained"
              startIcon={<FaPlus />}
              onClick={handleCreate}
            >
              Create Warehouse
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
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading warehouses...</div>
        ) : (
          <DataTable
            rows={warehouses}
            columns={columns}
            emptyMessage="No warehouses found"
          />
        )}
      </Card>

    </div>
  );
};

export default WarehouseManagement;

