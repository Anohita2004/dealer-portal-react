import React, { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Search, Clear } from '@mui/icons-material';

const DriverFilter = ({ onFilterChange, currentPhone = null }) => {
  const [phoneNumber, setPhoneNumber] = useState(currentPhone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onFilterChange(phoneNumber || null);
  };

  const handleClear = () => {
    setPhoneNumber('');
    onFilterChange(null);
  };

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1, boxShadow: 1, mb: 2 }}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            type="tel"
            label="Filter by driver phone number"
            placeholder="Enter phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            sx={{ flex: 1, minWidth: '250px' }}
            size="small"
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={<Search />}
            sx={{ minWidth: '120px' }}
          >
            Filter
          </Button>
          {phoneNumber && (
            <Button
              type="button"
              onClick={handleClear}
              variant="outlined"
              startIcon={<Clear />}
            >
              Clear
            </Button>
          )}
        </Box>
      </form>
      {currentPhone && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Showing locations for: <strong>{currentPhone}</strong>
        </Typography>
      )}
    </Box>
  );
};

export default DriverFilter;

