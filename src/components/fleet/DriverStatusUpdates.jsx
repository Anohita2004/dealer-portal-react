import React, { useState, useEffect } from 'react';
import { fleetAPI } from '../../services/api';
import { onTruckStatusChange, offTruckStatusChange } from '../../services/socket';
import Card from '../Card';
import DataTable from '../DataTable';
import { Chip, Box, Typography, Button } from '@mui/material';
import { RefreshCw, Truck } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const DriverStatusUpdates = () => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchStatusUpdates = async () => {
    try {
      setLoading(true);
      // Fetch recent assignments with status changes
      const response = await fleetAPI.getAssignments({
        limit: 20,
        sortBy: 'updatedAt',
        sortOrder: 'DESC'
      });
      
      const assignments = response.assignments || response.data || [];
      
      // Filter to show only assignments with recent status updates
      const recentUpdates = assignments
        .filter(assignment => 
          assignment.status && 
          (assignment.status === 'picked_up' || 
           assignment.status === 'in_transit' || 
           assignment.status === 'delayed' ||
           assignment.status === 'on_hold')
        )
        .slice(0, 10); // Show latest 10
      
      setUpdates(recentUpdates);
    } catch (error) {
      console.error('Error fetching driver status updates:', error);
      toast.error('Failed to load driver status updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusUpdates();

    // Listen to real-time status changes
    const handleStatusChange = (data) => {
      setUpdates(prev => {
        const existingIndex = prev.findIndex(u => u.id === data.assignmentId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            status: data.status,
            updatedAt: new Date().toISOString()
          };
          return updated;
        } else {
          // New update - refresh list
          fetchStatusUpdates();
          return prev;
        }
      });
    };

    onTruckStatusChange(handleStatusChange);

    // Refresh every 30 seconds
    const interval = setInterval(fetchStatusUpdates, 30000);

    return () => {
      clearInterval(interval);
      offTruckStatusChange();
    };
  }, []);

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'warning',
      picked_up: 'info',
      in_transit: 'primary',
      delivered: 'success',
      delayed: 'error',
      on_hold: 'default',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      key: 'order',
      label: 'Order',
      render: (_, row) => row.order?.orderNumber || row.orderId || 'N/A'
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
      key: 'driver',
      label: 'Driver',
      render: (_, row) => (
        <div>
          <div>{row.driverName || 'N/A'}</div>
          {row.driverPhone && (
            <div style={{ fontSize: '0.75rem', color: '#666' }}>
              {row.driverPhone}
            </div>
          )}
        </div>
      )
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
      key: 'updatedAt',
      label: 'Last Update',
      render: (value) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleString();
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <Button
          size="small"
          variant="outlined"
          onClick={() => navigate(`/fleet/assignments?id=${row.id}`)}
        >
          View
        </Button>
      )
    }
  ];

  if (loading && updates.length === 0) {
    return (
      <Card>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography>Loading driver status updates...</Typography>
        </Box>
      </Card>
    );
  }

  return (
    <Card>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Truck size={20} />
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Driver Status Updates
          </Typography>
        </Box>
        <Button
          size="small"
          startIcon={<RefreshCw size={16} />}
          onClick={fetchStatusUpdates}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {updates.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">
            No recent driver status updates
          </Typography>
        </Box>
      ) : (
        <DataTable
          rows={updates}
          columns={columns}
          emptyMessage="No status updates"
        />
      )}
    </Card>
  );
};

export default DriverStatusUpdates;

