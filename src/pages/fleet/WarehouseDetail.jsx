import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { warehouseAPI, geoAPI } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Card from '../../components/Card';
import { toast } from 'react-toastify';
import { FaWarehouse, FaArrowLeft, FaSave, FaEdit, FaTrash } from 'react-icons/fa';
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
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const WarehouseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [warehouse, setWarehouse] = useState(null);
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchWarehouse();
      fetchRegions();
    }
  }, [id]);

  useEffect(() => {
    if (formData.regionId) {
      fetchAreas(formData.regionId);
    } else {
      setAreas([]);
    }
  }, [formData.regionId]);

  const fetchWarehouse = async () => {
    try {
      setLoading(true);
      const response = await warehouseAPI.getById(id);
      setWarehouse(response);
      setFormData({
        warehouseCode: response.warehouseCode || '',
        name: response.name || '',
        address: response.address || '',
        city: response.city || '',
        state: response.state || '',
        pincode: response.pincode || '',
        lat: response.lat?.toString() || '',
        lng: response.lng?.toString() || '',
        regionId: response.regionId || '',
        areaId: response.areaId || '',
        contactPerson: response.contactPerson || '',
        phoneNumber: response.phoneNumber || '',
        email: response.email || '',
        isActive: response.isActive !== undefined ? response.isActive : true
      });
    } catch (error) {
      console.error('Error fetching warehouse:', error);
      toast.error('Failed to load warehouse details');
      navigate('/fleet/warehouses');
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

  const fetchAreas = async (regionId) => {
    try {
      const response = await geoAPI.getAreas({ regionId });
      setAreas(response.areas || []);
    } catch (error) {
      console.error('Error fetching areas:', error);
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

  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        phoneNumber: formData.phoneNumber.replace(/[\s-]/g, ''),
        areaId: formData.areaId || undefined
      };

      await warehouseAPI.update(id, payload);
      toast.success('Warehouse updated successfully');
      setEditing(false);
      fetchWarehouse();
    } catch (error) {
      console.error('Error updating warehouse:', error);
      toast.error(error.response?.data?.error || 'Failed to update warehouse');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await warehouseAPI.delete(id);
      toast.success('Warehouse deleted successfully');
      navigate('/fleet/warehouses');
    } catch (error) {
      console.error('Error deleting warehouse:', error);
      toast.error('Failed to delete warehouse');
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Warehouse Details" icon={<FaWarehouse />} />
        <Card>
          <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
        </Card>
      </div>
    );
  }

  if (!warehouse) {
    return null;
  }

  const mapCenter = warehouse.lat && warehouse.lng
    ? [warehouse.lat, warehouse.lng]
    : [19.0760, 72.8777];

  return (
    <div>
      <PageHeader
        title={`Warehouse: ${warehouse.name}`}
        icon={<FaWarehouse />}
        action={
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
                  onClick={() => navigate('/fleet/warehouses')}
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
                    fetchWarehouse();
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
        {/* Warehouse Information Card */}
        <Grid item xs={12} md={editing ? 12 : 6}>
          <Card>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Warehouse Information
              </Typography>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Warehouse Code"
                    required
                    fullWidth
                    value={formData.warehouseCode}
                    onChange={handleChange('warehouseCode')}
                    error={!!errors.warehouseCode}
                    helperText={errors.warehouseCode}
                    disabled={!editing}
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
                    disabled={!editing}
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
                    disabled={!editing}
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
                    disabled={!editing}
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
                    disabled={!editing}
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
                    disabled={!editing}
                  />
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
                    helperText={errors.lat}
                    disabled={!editing}
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
                    helperText={errors.lng}
                    disabled={!editing}
                    inputProps={{ step: 'any' }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required error={!!errors.regionId} disabled={!editing}>
                    <InputLabel>Region</InputLabel>
                    <Select
                      value={formData.regionId}
                      onChange={handleChange('regionId')}
                      label="Region"
                    >
                      <MenuItem value="">Select Region</MenuItem>
                      {regions.map(region => (
                        <MenuItem key={region.id} value={region.id}>
                          {region.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.regionId && (
                      <FormHelperText>{errors.regionId}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled={!editing || !formData.regionId}>
                    <InputLabel>Area (Optional)</InputLabel>
                    <Select
                      value={formData.areaId}
                      onChange={handleChange('areaId')}
                      label="Area (Optional)"
                    >
                      <MenuItem value="">Select Area</MenuItem>
                      {areas.map(area => (
                        <MenuItem key={area.id} value={area.id}>
                          {area.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                    disabled={!editing}
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
                    helperText={errors.phoneNumber}
                    disabled={!editing}
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
                    helperText={errors.email}
                    disabled={!editing}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
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
                  <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                      <Chip
                        label={warehouse.isActive ? 'Active' : 'Inactive'}
                        color={warehouse.isActive ? 'success' : 'default'}
                      />
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          </Card>
        </Grid>

        {/* Map Card */}
        {!editing && warehouse.lat && warehouse.lng && (
          <Grid item xs={12} md={6}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Location Map
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <div style={{ height: '400px', width: '100%' }}>
                  <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    />
                    <Marker position={mapCenter}>
                      <Popup>
                        <strong>{warehouse.name}</strong>
                        <br />
                        {warehouse.address}
                        <br />
                        {warehouse.city}, {warehouse.state}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </Box>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Warehouse</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete "{warehouse.name}"? This action cannot be undone.
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

export default WarehouseDetail;

