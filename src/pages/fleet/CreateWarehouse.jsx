import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { warehouseAPI, geoAPI } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaWarehouse, FaArrowLeft, FaSave } from 'react-icons/fa';
import {
  Button,
  TextField,
  MenuItem,
  Grid,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Alert,
  Box,
  Typography,
  Divider
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';

const CreateWarehouse = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    warehouseCode: '',
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: '',
    lng: '',
    regionId: '',
    areaId: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [fetchingRegions, setFetchingRegions] = useState(false);
  const [fetchingAreas, setFetchingAreas] = useState(false);

  useEffect(() => {
    fetchRegions();
  }, []);

  useEffect(() => {
    if (formData.regionId) {
      fetchAreas(formData.regionId);
    } else {
      setAreas([]);
      setFormData(prev => ({ ...prev, areaId: '' }));
    }
  }, [formData.regionId]);

  const fetchRegions = async () => {
    try {
      setFetchingRegions(true);
      const res = await geoAPI.getRegions();
      const list = Array.isArray(res) ? res : res?.regions || res?.data || [];
      setRegions(list);
    } catch (error) {
      console.error('Error fetching regions:', error);
      toast.error('Failed to load regions');
      setRegions([]);
    } finally {
      setFetchingRegions(false);
    }
  };

  const fetchAreas = async (regionId) => {
    try {
      setFetchingAreas(true);
      const res = await geoAPI.getAreas({ regionId });
      const list = Array.isArray(res) ? res : res?.areas || res?.data || [];
      setAreas(list);
    } catch (error) {
      console.error('Error fetching areas:', error);
      setAreas([]);
    } finally {
      setFetchingAreas(false);
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.warehouseCode || formData.warehouseCode.trim() === '') {
      newErrors.warehouseCode = 'Warehouse code is required';
    }

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Warehouse name is required';
    }

    if (!formData.address || formData.address.trim() === '') {
      newErrors.address = 'Address is required';
    }

    if (!formData.city || formData.city.trim() === '') {
      newErrors.city = 'City is required';
    }

    if (!formData.state || formData.state.trim() === '') {
      newErrors.state = 'State is required';
    }

    if (!formData.pincode || formData.pincode.trim() === '') {
      newErrors.pincode = 'Pincode is required';
    }

    if (!formData.lat || isNaN(parseFloat(formData.lat))) {
      newErrors.lat = 'Valid latitude is required';
    } else {
      const lat = parseFloat(formData.lat);
      if (lat < -90 || lat > 90) {
        newErrors.lat = 'Latitude must be between -90 and 90';
      }
    }

    if (!formData.lng || isNaN(parseFloat(formData.lng))) {
      newErrors.lng = 'Valid longitude is required';
    } else {
      const lng = parseFloat(formData.lng);
      if (lng < -180 || lng > 180) {
        newErrors.lng = 'Longitude must be between -180 and 180';
      }
    }

    if (!formData.regionId) {
      newErrors.regionId = 'Region is required';
    }

    if (!formData.contactPerson || formData.contactPerson.trim() === '') {
      newErrors.contactPerson = 'Contact person is required';
    }

    if (!formData.phoneNumber || formData.phoneNumber.trim() === '') {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
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
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        phoneNumber: formData.phoneNumber.replace(/[\s-]/g, ''),
        areaId: formData.areaId || undefined
      };

      await warehouseAPI.create(payload);
      toast.success('Warehouse created successfully');
      navigate('/fleet/warehouses');
    } catch (error) {
      console.error('Error creating warehouse:', error);
      toast.error(error.response?.data?.error || 'Failed to create warehouse');
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
        title="Create Warehouse"
        icon={<FaWarehouse />}
        action={
          <Button
            variant="outlined"
            startIcon={<FaArrowLeft />}
            onClick={() => navigate('/fleet/warehouses')}
          >
            Back to Warehouses
          </Button>
        }
      />

      <Card>
        <form onSubmit={handleSubmit}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Warehouse Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Warehouse Code"
                  required
                  fullWidth
                  value={formData.warehouseCode}
                  onChange={handleChange('warehouseCode')}
                  error={!!errors.warehouseCode}
                  helperText={errors.warehouseCode}
                  placeholder="e.g., WH001"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Warehouse Name"
                  required
                  fullWidth
                  value={formData.name}
                  onChange={handleChange('name')}
                  error={!!errors.name}
                  helperText={errors.name}
                  placeholder="e.g., Mumbai Central Warehouse"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Address"
                  required
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleChange('address')}
                  error={!!errors.address}
                  helperText={errors.address}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="City"
                  required
                  fullWidth
                  value={formData.city}
                  onChange={handleChange('city')}
                  error={!!errors.city}
                  helperText={errors.city}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="State"
                  required
                  fullWidth
                  value={formData.state}
                  onChange={handleChange('state')}
                  error={!!errors.state}
                  helperText={errors.state}
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Pincode"
                  required
                  fullWidth
                  value={formData.pincode}
                  onChange={handleChange('pincode')}
                  error={!!errors.pincode}
                  helperText={errors.pincode}
                />
              </Grid>

              {/* Location Coordinates */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Location Coordinates
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Latitude"
                  required
                  fullWidth
                  type="number"
                  value={formData.lat}
                  onChange={handleChange('lat')}
                  error={!!errors.lat}
                  helperText={errors.lat || 'Enter latitude (e.g., 19.0760)'}
                  inputProps={{ step: 'any' }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Longitude"
                  required
                  fullWidth
                  type="number"
                  value={formData.lng}
                  onChange={handleChange('lng')}
                  error={!!errors.lng}
                  helperText={errors.lng || 'Enter longitude (e.g., 72.8777)'}
                  inputProps={{ step: 'any' }}
                />
              </Grid>

              {/* Region & Area */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Region & Area
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required error={!!errors.regionId}>
                  <InputLabel id="region-select-label">Region</InputLabel>
                  <Select
                    labelId="region-select-label"
                    value={regions.some(r => r.id === formData.regionId) ? formData.regionId : ""}
                    onChange={handleChange('regionId')}
                    label="Region"
                  >
                    <MenuItem value="" disabled>
                      {fetchingRegions ? 'Loading regions...' : 'Select Region'}
                    </MenuItem>
                    {regions.map(region => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name || region.regionName || region.code || 'Unknown'}
                      </MenuItem>
                    ))}
                    {!fetchingRegions && regions.length === 0 && (
                      <MenuItem disabled>No regions available</MenuItem>
                    )}
                  </Select>
                  {errors.regionId && <FormHelperText>{errors.regionId}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="area-select-label">Area (Optional)</InputLabel>
                  <Select
                    labelId="area-select-label"
                    value={areas.some(a => a.id === formData.areaId) ? formData.areaId : ""}
                    onChange={handleChange('areaId')}
                    label="Area (Optional)"
                    disabled={!formData.regionId || fetchingAreas}
                  >
                    <MenuItem value="" disabled>
                      {fetchingAreas ? 'Loading areas...' : 'Select Area'}
                    </MenuItem>
                    {areas.map(area => (
                      <MenuItem key={area.id} value={area.id}>
                        {area.name || area.areaName || area.code || 'Unknown'}
                      </MenuItem>
                    ))}
                    {formData.regionId && !fetchingAreas && areas.length === 0 && (
                      <MenuItem disabled>No areas in this region</MenuItem>
                    )}
                  </Select>
                  {!formData.regionId && <FormHelperText>Select a region first</FormHelperText>}
                </FormControl>
              </Grid>

              {/* Contact Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Contact Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Contact Person"
                  required
                  fullWidth
                  value={formData.contactPerson}
                  onChange={handleChange('contactPerson')}
                  error={!!errors.contactPerson}
                  helperText={errors.contactPerson}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone Number"
                  required
                  fullWidth
                  value={formData.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  error={!!errors.phoneNumber}
                  helperText={errors.phoneNumber || '10-digit phone number'}
                  placeholder="1234567890"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email || 'Optional'}
                />
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
                onClick={() => navigate('/fleet/warehouses')}
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
                {loading ? 'Creating...' : 'Create Warehouse'}
              </Button>
            </Box>
          </Box>
        </form>
      </Card>
    </div>
  );
};

export default CreateWarehouse;

