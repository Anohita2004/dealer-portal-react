import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  TextField,
  Button,
  MenuItem,
  Grid,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import PageHeader from '../../components/PageHeader';
import { userAPI, roleAPI, geoAPI } from '../../services/api';
import { toast } from 'react-toastify';

const CreateDriver = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    roleId: '',
    regionId: '',
    areaId: '',
    territoryId: '',
    isActive: true,
  });

  useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    try {
      const [rolesRes, regionsRes] = await Promise.all([
        roleAPI.getRoles(),
        geoAPI.getRegions(),
      ]);

      // Filter roles to show only driver-related roles
      const driverRoles = rolesRes.filter(role => 
        role.name?.toLowerCase().includes('driver') || 
        role.name?.toLowerCase() === 'driver' ||
        role.name?.toLowerCase() === 'fleet_driver'
      );

      // If no driver role exists, show all roles (admin can select appropriate one)
      setRoles(driverRoles.length > 0 ? driverRoles : rolesRes);
      setRegions(Array.isArray(regionsRes) ? regionsRes : regionsRes?.regions || []);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast.error('Failed to load form data');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear dependent fields when parent changes
      ...(name === 'regionId' && { areaId: '', territoryId: '' }),
      ...(name === 'areaId' && { territoryId: '' }),
    }));
  };

  const generatePassword = () => {
    // Generate a secure random password
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setFormData(prev => ({ ...prev, password, confirmPassword: password }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      toast.error('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.password) {
      toast.error('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    if (!formData.roleId) {
      toast.error('Role is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        roleId: formData.roleId,
        regionId: formData.regionId || null,
        areaId: formData.areaId || null,
        territoryId: formData.territoryId || null,
        phoneNumber: formData.phoneNumber || null,
        isActive: formData.isActive,
      };

      const response = await userAPI.createUser(payload);
      
      toast.success(`Driver "${formData.username}" created successfully!`);
      
      // Show success message with credentials
      setTimeout(() => {
        alert(
          `Driver Created Successfully!\n\n` +
          `Username: ${formData.username}\n` +
          `Password: ${formData.password}\n\n` +
          `Please share these credentials with the driver.`
        );
        navigate('/fleet/drivers');
      }, 500);
    } catch (error) {
      console.error('Error creating driver:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          'Failed to create driver';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Create Driver"
        icon={<FaUserPlus />}
        actions={[
          <Button
            key="back"
            variant="outlined"
            onClick={() => navigate('/fleet/drivers')}
          >
            Back to Drivers
          </Button>,
        ]}
      />

      <Card sx={{ p: 3, mt: 2 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Driver Information
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="e.g., driver001"
                helperText="Driver will use this to login"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="driver@example.com"
                helperText="Required for OTP verification"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="+91 9876543210"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Role"
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                required
              >
                <MenuItem value="">
                  <em>Select Role</em>
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Password Setup
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Set a password for the driver. They will use this along with their username to login via the mobile app.
              </Alert>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Minimum 6 characters"
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                error={formData.password !== formData.confirmPassword && formData.confirmPassword !== ''}
                helperText={
                  formData.password !== formData.confirmPassword && formData.confirmPassword !== ''
                    ? 'Passwords do not match'
                    : ''
                }
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                onClick={generatePassword}
                sx={{ mb: 2 }}
              >
                Generate Secure Password
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Location Assignment (Optional)
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Region"
                name="regionId"
                value={formData.regionId}
                onChange={handleChange}
              >
                <MenuItem value="">
                  <em>Select Region (Optional)</em>
                </MenuItem>
                {regions.map((region) => (
                  <MenuItem key={region.id} value={region.id}>
                    {region.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Area"
                name="areaId"
                value={formData.areaId}
                onChange={handleChange}
                disabled={!formData.regionId}
              >
                <MenuItem value="">
                  <em>Select Area (Optional)</em>
                </MenuItem>
                {/* Areas would be loaded based on regionId */}
              </TextField>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                select
                label="Territory"
                name="territoryId"
                value={formData.territoryId}
                onChange={handleChange}
                disabled={!formData.areaId}
              >
                <MenuItem value="">
                  <em>Select Territory (Optional)</em>
                </MenuItem>
                {/* Territories would be loaded based on areaId */}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/fleet/drivers')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <FaUserPlus />}
                >
                  {loading ? 'Creating...' : 'Create Driver'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Card>
    </div>
  );
};

export default CreateDriver;

