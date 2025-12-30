import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { truckAPI, geoAPI } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaTruck, FaArrowLeft, FaSave, FaEdit, FaTrash } from 'react-icons/fa';
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
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert
} from '@mui/material';

const TruckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [truck, setTruck] = useState(null);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTruck();
      fetchRegions();
    }
  }, [id]);

  const fetchTruck = async () => {
    try {
      setLoading(true);
      const response = await truckAPI.getById(id);
      setTruck(response);
      
      // Wait for regions to load before setting regionId
      const regionsResponse = await geoAPI.getRegions();
      const regionsList = Array.isArray(regionsResponse) ? regionsResponse : (regionsResponse?.regions || regionsResponse?.data || []);
      setRegions(regionsList);
      
      // Only set regionId if it exists in the regions list
      const validRegionId = response.regionId && regionsList.find(r => r.id === response.regionId) 
        ? response.regionId 
        : '';
      
      setFormData({
        truckName: response.truckName || '',
        licenseNumber: response.licenseNumber || '',
        truckType: response.truckType || 'medium',
        capacity: response.capacity?.toString() || '',
        regionId: validRegionId,
        isActive: response.isActive !== undefined ? response.isActive : true
      });
    } catch (error) {
      console.error('Error fetching truck:', error);
      toast.error('Failed to load truck details');
      navigate('/fleet/trucks');
    } finally {
      setLoading(false);
    }
  };

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

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        capacity: parseFloat(formData.capacity),
        regionId: formData.regionId || undefined
      };

      await truckAPI.update(id, payload);
      toast.success('Truck updated successfully');
      setEditing(false);
      fetchTruck();
    } catch (error) {
      console.error('Error updating truck:', error);
      toast.error(error.response?.data?.error || 'Failed to update truck');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await truckAPI.delete(id);
      toast.success('Truck deleted successfully');
      navigate('/fleet/trucks');
    } catch (error) {
      console.error('Error deleting truck:', error);
      toast.error('Failed to delete truck');
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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

  if (loading) {
    return (
      <div>
        <PageHeader title="Truck Details" />
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        </Card>
      </div>
    );
  }

  if (!truck) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={`Truck: ${truck.truckName}`}
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            {!editing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<FaEdit />}
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<FaTrash />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<FaArrowLeft />}
                  onClick={() => navigate('/fleet/trucks')}
                >
                  Back
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditing(false);
                    fetchTruck();
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FaSave />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </Box>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Truck Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Truck Name"
                    required
                    fullWidth
                    value={formData.truckName}
                    onChange={handleChange('truckName')}
                    error={!!errors.truckName}
                    helperText={errors.truckName}
                    disabled={!editing}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="License Number"
                    required
                    fullWidth
                    value={formData.licenseNumber}
                    onChange={handleChange('licenseNumber')}
                    error={!!errors.licenseNumber}
                    helperText={errors.licenseNumber}
                    disabled={!editing}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth required error={!!errors.truckType} disabled={!editing}>
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

                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    label="Capacity (tons)"
                    type="number"
                    required
                    fullWidth
                    value={formData.capacity}
                    onChange={handleChange('capacity')}
                    error={!!errors.capacity}
                    helperText={errors.capacity}
                    disabled={!editing}
                    inputProps={{ step: '0.1', min: '0' }}
                  />
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth disabled={!editing}>
                    <InputLabel>Region (Optional)</InputLabel>
                    <Select
                      value={formData.regionId && regions.find(r => r.id === formData.regionId) ? formData.regionId : ''}
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
                  </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <FormControl fullWidth disabled={!editing}>
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

                {!editing && (
                  <>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Current Status:
                        </Typography>
                        {truck.status && (
                          <Chip
                            label={truck.status.replace('_', ' ')}
                            color={getStatusColor(truck.status)}
                            size="small"
                          />
                        )}
                        <Chip
                          label={truck.isActive ? 'Active' : 'Inactive'}
                          color={truck.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Box>
                    </Grid>

                    {truck.currentLat && truck.currentLng && (
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Current Location:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {truck.currentLat.toFixed(4)}, {truck.currentLng.toFixed(4)}
                        </Typography>
                        {truck.lastLocationUpdate && (
                          <Typography variant="caption" color="text.secondary">
                            Last Update: {new Date(truck.lastLocationUpdate).toLocaleString()}
                          </Typography>
                        )}
                      </Grid>
                    )}
                  </>
                )}
              </Grid>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Truck</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete "{truck.truckName}"? This action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TruckDetail;

