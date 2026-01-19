import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { warehouseAPI, geoAPI } from '../../services/api';
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
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [fetchingRegions, setFetchingRegions] = useState(false);
  const [fetchingAreas, setFetchingAreas] = useState(false);
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

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (filters.regionId) {
      fetchAreas(filters.regionId);
    } else {
      setAreas([]);
      if (filters.areaId) {
        setFilters(prev => ({ ...prev, areaId: '', page: 1 }));
      }
    }
  }, [filters.regionId]);

  const fetchRegions = async () => {
    try {
      setFetchingRegions(true);
      const data = await geoAPI.getRegions();
      setRegions(Array.isArray(data) ? data : data.regions || data.data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    } finally {
      setFetchingRegions(false);
    }
  };

  const fetchAreas = async (regionId) => {
    try {
      setFetchingAreas(true);
      const data = await geoAPI.getAreas({ regionId });
      setAreas(Array.isArray(data) ? data : data.areas || data.data || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setFetchingAreas(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const response = await warehouseAPI.getAll(filters);
      setWarehouses(response.warehouses || []);
      setTotal(response.total || 0);
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

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleLimitChange = (newLimit) => {
    setFilters(prev => ({ ...prev, limit: newLimit, page: 1 }));
  };

  const columns = [
    { key: 'warehouseCode', label: 'Code' },
    { key: 'name', label: 'Name' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'contactPerson', label: 'Contact Person' },
    { key: 'phoneNumber', label: 'Phone' },
    {
      key: 'region',
      label: 'Region',
      render: (_, row) => row.region?.name || row.region?.regionName || '—'
    },
    {
      key: 'area',
      label: 'Area',
      render: (_, row) => row.area?.name || row.area?.areaName || '—'
    },
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
            <MenuItem value="">All Status</MenuItem>
          </TextField>

          <TextField
            label="Region"
            select
            size="small"
            value={filters.regionId}
            onChange={(e) => setFilters({ ...filters, regionId: e.target.value, areaId: '', page: 1 })}
            style={{ minWidth: '180px' }}
            disabled={fetchingRegions}
          >
            <MenuItem value="">All Regions</MenuItem>
            {regions.map(r => (
              <MenuItem key={r.id} value={r.id}>{r.name || r.regionName}</MenuItem>
            ))}
          </TextField>

          <TextField
            label="Area"
            select
            size="small"
            value={filters.areaId}
            onChange={(e) => setFilters({ ...filters, areaId: e.target.value, page: 1 })}
            style={{ minWidth: '180px' }}
            disabled={!filters.regionId || fetchingAreas}
          >
            <MenuItem value="">All Areas</MenuItem>
            {areas.map(a => (
              <MenuItem key={a.id} value={a.id}>{a.name || a.areaName}</MenuItem>
            ))}
          </TextField>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading warehouses...</div>
        ) : (
          <DataTable
            rows={warehouses}
            columns={columns}
            emptyMessage="No warehouses found"
            pagination={{
              page: filters.page,
              limit: filters.limit,
              total: total,
              onPageChange: handlePageChange,
              onLimitChange: handleLimitChange
            }}
          />
        )}
      </Card>

    </div>
  );
};

export default WarehouseManagement;

