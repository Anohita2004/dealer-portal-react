import React, { useState, useEffect } from 'react';
import { Box, Container } from '@mui/material';
import TruckLocationMap from '../../components/fleet/TruckLocationMap';
import DriverFilter from '../../components/fleet/DriverFilter';
import NotificationBell from '../../components/NotificationBelll';
import PageHeader from '../../components/PageHeader';
import { connectSocket, disconnectSocket } from '../../services/socket';
import { useAuth } from '../../context/AuthContext';
import { FaMapMarkerAlt } from 'react-icons/fa';

const FleetTrackingDashboard = () => {
  const { user, token } = useAuth();
  const [selectedDriverPhone, setSelectedDriverPhone] = useState(null);

  useEffect(() => {
    // Connect to Socket.IO when component mounts
    if (token) {
      connectSocket();
    }

    return () => {
      // Note: Don't disconnect socket here as it might be used by other components
      // The socket will be disconnected on logout via AuthContext
    };
  }, [token]);

  return (
    <Container maxWidth={false} sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader
          title="Fleet Tracking Dashboard"
          icon={<FaMapMarkerAlt />}
        />
        <NotificationBell />
      </Box>

      {/* Filter Section */}
      <DriverFilter
        currentPhone={selectedDriverPhone}
        onFilterChange={setSelectedDriverPhone}
      />

      {/* Map Section */}
      <Box
        sx={{
          height: 'calc(100vh - 250px)',
          minHeight: '600px',
          width: '100%',
          borderRadius: 1,
          overflow: 'hidden',
          boxShadow: 2
        }}
      >
        <TruckLocationMap driverPhone={selectedDriverPhone} />
      </Box>
    </Container>
  );
};

export default FleetTrackingDashboard;

