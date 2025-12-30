import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { truckAPI, geoAPI } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaTruck, FaArrowLeft, FaSave } from 'react-icons/fa';
import {
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Box,
  Typography,
  Divider
} from '@mui/material';

const CreateTruck = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    truckName: '',
    licenseNumber: '',
    truckType: 'medium',
    capacity: '',
    regionId: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    fetchRegions();
  }, []);

  const fetchRegions = async () => {
    try {
      const response = await geoAPI.getRegions();
      setRegions(response.regions || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.truckName || formData.truckName.trim() === '') {
      newErrors.truckName = 'Truck name is required';
    }

    if (!formData.licenseNumber || formData.licenseNumber.trim() === '') {
      newErrors.licenseNumber = 'License number is required';
    }

    if (!formData.truckType) {
      newErrors.truckType = 'Truck type is required';
    }

    if (!formData.capacity || isNaN(parseFloat(formData.capacity))) {
      newErrors.capacity = 'Valid capacity is required';
    } else {
      const capacity = parseFloat(formData.capacity);
      if (capacity <= 0) {
        newErrors.capacity = 'Capacity must be greater than 0';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        capacity: parseFloat(formData.capacity),
        regionId: formData.regionId || undefined
      };

      await truckAPI.create(payload);
      toast.success('Truck created successfully');
      navigate('/fleet/trucks');
    } catch (error) {
      console.error('Error creating truck:', error);
      toast.error(error.response?.data?.error || 'Failed to create truck');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Truck"
        actions={
          <Button
            variant="outlined"
            startIcon={<FaArrowLeft />}
            onClick={() => navigate('/fleet/trucks')}
          >
            Back to Trucks
          </Button>
        }
      />

      <Card>
        <form onSubmit={handleSubmit}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Truck Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Truck Name"
                  required
                  fullWidth
                  value={formData.truckName}
                  onChange={handleChange('truckName')}
                  error={!!errors.truckName}
                  helperText={errors.truckName || 'e.g., Truck-001'}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="License Number"
                  required
                  fullWidth
                  value={formData.licenseNumber}
                  onChange={handleChange('licenseNumber')}
                  error={!!errors.licenseNumber}
                  helperText={errors.licenseNumber || 'e.g., MH-01-AB-1234'}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.truckType}>
                  <InputLabel>Truck Type</InputLabel>
                  <Select
                    value={formData.truckType}
                    onChange={handleChange('truckType')}
                    label="Truck Type"
                  >
                    <MenuItem value="small">Small</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="large">Large</MenuItem>
                  </Select>
                  {errors.truckType && (
                    <FormHelperText>{errors.truckType}</FormHelperText>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Capacity (tons)"
                  type="number"
                  required
                  fullWidth
                  value={formData.capacity}
                  onChange={handleChange('capacity')}
                  error={!!errors.capacity}
                  helperText={errors.capacity || 'Enter capacity in tons (e.g., 5.5)'}
                  inputProps={{ step: '0.1', min: '0' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Region (Optional)</InputLabel>
                  <Select
                    value={formData.regionId}
                    onChange={handleChange('regionId')}
                    label="Region (Optional)"
                  >
                    <MenuItem value="">Select Region</MenuItem>
                    {regions.map(region => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText>Optional - Assign truck to a specific region</FormHelperText>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={formData.isActive}
                    onChange={handleChange('isActive')}
                    label="Status"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/fleet/trucks')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<FaSave />}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Truck'}
              </Button>
            </Box>
          </Box>
        </form>
      </Card>
    </div>
  );
};

export default CreateTruck;

