import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import WarehouseManagement from './WarehouseManagement';
import TruckManagement from './TruckManagement';
import FleetAssignments from './FleetAssignments';
import LiveTracking from './LiveTracking';
import PageHeader from '../../components/PageHeader';
import { FaTruck, FaWarehouse, FaClipboardList, FaMapMarkerAlt } from 'react-icons/fa';

const FleetDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <div>
      <PageHeader
        title="Fleet Management"
        icon={<FaTruck />}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', marginBottom: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="fleet management tabs">
          <Tab
            icon={<FaWarehouse />}
            label="Warehouses"
            iconPosition="start"
          />
          <Tab
            icon={<FaTruck />}
            label="Trucks"
            iconPosition="start"
          />
          <Tab
            icon={<FaClipboardList />}
            label="Assignments"
            iconPosition="start"
          />
          <Tab
            icon={<FaMapMarkerAlt />}
            label="Live Tracking"
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 0}>
        {activeTab === 0 && <WarehouseManagement />}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 1}>
        {activeTab === 1 && <TruckManagement />}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 2}>
        {activeTab === 2 && <FleetAssignments />}
      </Box>

      <Box role="tabpanel" hidden={activeTab !== 3}>
        {activeTab === 3 && <LiveTracking />}
      </Box>
    </div>
  );
};

export default FleetDashboard;

