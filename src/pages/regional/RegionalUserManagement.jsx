import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Grid,
  Tooltip,
  Pagination,
  Stack,
  Divider,
} from "@mui/material";
import {
  UserPlus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Mail,
  Shield,
  MapPin,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { userAPI, roleAPI, geoAPI, dealerAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function RegionalUserManagement() {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  // Filters & Search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Form state
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    regionId: "",
    areaId: "",
    territoryId: "",
    dealerId: "",
    managerId: "",
    isActive: true,
  });

  // Fetch data
  const fetchData = async (requestedPage = page) => {
    try {
      setLoading(true);
      const params = {
        page: requestedPage,
        pageSize,
        search: searchTerm || undefined,
        role: filterRole !== "all" ? filterRole : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      };
      
      // Get current user's region to scope the request
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.regionId) {
        params.regionId = user.regionId;
      }
      
      try {
        const data = await userAPI.getUsers(params);
        setUsers(data.data || data.users || []);
        setTotal(data.total || data.data?.length || 0);
        setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
      } catch (error) {
        // Handle 403 Forbidden - regional admin doesn't have access to /api/admin/users
        if (error.response?.status === 403) {
          console.warn("Regional admin doesn't have access to user management endpoint");
          toast.warning("User management is only available to super administrators");
          setUsers([]);
          setTotal(0);
          setTotalPages(1);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      if (error.response?.status !== 403) {
        toast.error("Failed to load users");
      }
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Load dropdowns
  useEffect(() => {
    loadDropdowns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, pageSize, searchTerm, filterRole, filterStatus]);

  const loadDropdowns = async () => {
    try {
      // Get current user's region first
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      // Use Promise.allSettled to handle individual failures gracefully
      const [rolesResult, regionsResult, areasResult, territoriesResult, dealersResult] = await Promise.allSettled([
        roleAPI.getRoles().catch(() => ({ data: [] })),
        geoAPI.getRegions().catch(() => ({ data: [] })),
        geoAPI.getAreas().catch(() => ({ data: [] })),
        geoAPI.getTerritories().catch(() => ({ data: [] })),
        dealerAPI.getDealers().catch(() => ({ data: [] })),
      ]);

      setRoles(
        rolesResult.status === 'fulfilled' 
          ? (rolesResult.value?.data || rolesResult.value || [])
          : []
      );
      
      // If regions endpoint succeeds, normalise to a safe array
      // Backend may return: { data: [...] }, { regions: [...] }, or a raw array
      if (regionsResult.status === 'fulfilled' && regionsResult.value) {
        const rawRegions =
          regionsResult.value?.data ||
          regionsResult.value?.regions ||
          regionsResult.value;
        setRegions(Array.isArray(rawRegions) ? rawRegions : []);
      } else if (user.regionId) {
        // If regions endpoint doesn't exist, create a placeholder from user's region
        setRegions([{ id: user.regionId, name: user.region?.name || 'Current Region' }]);
      } else {
        setRegions([]);
      }
      
      // Ensure areas is always an array
      const areasData = areasResult.status === 'fulfilled'
        ? (areasResult.value?.data || areasResult.value || [])
        : [];
      setAreas(Array.isArray(areasData) ? areasData : []);
      
      // Ensure territories is always an array
      const territoriesData = territoriesResult.status === 'fulfilled'
        ? (territoriesResult.value?.data || territoriesResult.value || [])
        : [];
      setTerritories(Array.isArray(territoriesData) ? territoriesData : []);
      
      // Ensure dealers is always an array
      const dealersData = dealersResult.status === 'fulfilled'
        ? (dealersResult.value?.dealers ||
           dealersResult.value?.data ||
           dealersResult.value ||
           [])
        : [];
      setDealers(Array.isArray(dealersData) ? dealersData : []);

      // Set current user's region
      if (user.regionId) {
        setForm((prev) => ({ ...prev, regionId: user.regionId }));
      }
    } catch (error) {
      console.error("Failed to load dropdowns:", error);
      // Set empty arrays on complete failure
      setRoles([]);
      setRegions([]);
      setAreas([]);
      setTerritories([]);
      setDealers([]);
    }
  };

  const loadManagers = async () => {
    try {
      // Resolve current role so we can determine the correct manager role(s)
      const selectedRole =
        roles.find((r) => r.id === form.roleId || r.name === form.roleId) || null;
      const roleName = selectedRole?.name || "";

      let managerRoles = [];

      if (roleName === "dealer_staff") {
        // Dealer Staff should report to a Dealer Admin
        managerRoles = ["dealer_admin"];
      } else if (roleName === "dealer_admin") {
        // Dealer Admin reports upward to manager hierarchy
        managerRoles = ["area_manager", "territory_manager", "regional_manager"];
      } else if (roleName === "area_manager") {
        managerRoles = ["territory_manager", "regional_manager", "regional_admin"];
      } else if (roleName === "territory_manager") {
        managerRoles = ["area_manager", "regional_manager"];
      } else if (roleName === "regional_manager") {
        managerRoles = ["regional_admin"];
      } else {
        // No manager concept for this role in this screen
        setManagers([]);
        return;
      }

      const params = {
        role: managerRoles.join(","),
        regionId: form.regionId || undefined,
        areaId: form.areaId || undefined,
        territoryId: form.territoryId || undefined,
        dealerId: form.dealerId || undefined,
      };

      const data = await userAPI.getUsers(params);
      let mgrs = data.data || data.users || [];

      // For dealer_staff, make sure managers are tied to the same dealer when possible
      if (roleName === "dealer_staff" && form.dealerId) {
        mgrs = mgrs.filter((m) => m.dealerId === form.dealerId);
      }

      setManagers(mgrs);
    } catch (error) {
      console.error("Failed to load managers:", error);
    }
  };

  useEffect(() => {
    if (form.roleId) {
      loadManagers();
    } else {
      setManagers([]);
    }
    // Re-evaluate manager options when hierarchy fields change
  }, [form.roleId, form.regionId, form.areaId, form.territoryId, form.dealerId]);

  const handleCreateUser = () => {
    setIsEdit(false);
    setForm({
      username: "",
      email: "",
      password: "",
      roleId: "",
      regionId: JSON.parse(localStorage.getItem("user") || "{}").regionId || "",
      areaId: "",
      territoryId: "",
      dealerId: "",
      managerId: "",
      isActive: true,
    });
    setFormDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setIsEdit(true);
    setForm({
      username: user.username || "",
      email: user.email || "",
      password: "",
      roleId: user.roleId || user.role?.id || "",
      regionId: user.regionId || "",
      areaId: user.areaId || "",
      territoryId: user.territoryId || "",
      dealerId: user.dealerId || "",
      managerId: user.managerId || "",
      isActive: user.isActive !== false,
    });
    setSelectedUser(user);
    setFormDialogOpen(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await userAPI.deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      fetchData();
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      // Ensure we always send a numeric roleId from the roles list
      const selectedRole =
        roles.find((r) => r.id === form.roleId || r.name === form.roleId) || null;
      const roleName = selectedRole?.name || "";

      if (!selectedRole) {
        toast.error("Please select a valid role");
        return;
      }

      // For dealer roles, backend requires the user to be attached to a dealer (dealerId)
      if ((roleName === "dealer_admin" || roleName === "dealer_staff") && !form.dealerId) {
        toast.error("Select which dealer this user belongs to (required for dealer admin / staff).");
        return;
      }

      const payload = {
        ...form,
        // Force roleId to the numeric id expected by the backend
        roleId: selectedRole.id,
      };
      if (!payload.password) delete payload.password;

      if (isEdit) {
        await userAPI.updateUser(selectedUser.id, payload);
        toast.success("User updated successfully");
      } else {
        await userAPI.createUser(payload);
        toast.success("User created successfully");
      }
      setFormDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error(error.response?.data?.error || "Failed to save user");
    }
  };

  const getRoleName = (roleId) => {
    const role = roles.find((r) => r.id === roleId || r.name === roleId);
    return role?.name || roleId || "Unknown";
  };

  const getStatusChip = (user) => {
    if (user.isBlocked) {
      return <Chip label="Blocked" color="error" size="small" />;
    }
    if (user.isActive === false) {
      return <Chip label="Inactive" color="warning" size="small" />;
    }
    return <Chip label="Active" color="success" size="small" />;
  };

  // Ensure arrays are always arrays to prevent filter errors
  const safeAreas = Array.isArray(areas) ? areas : [];
  const safeTerritories = Array.isArray(territories) ? territories : [];
  const safeDealers = Array.isArray(dealers) ? dealers : [];
  
  const filteredAreas = safeAreas.filter((a) => !form.regionId || a.regionId === form.regionId);
  const filteredTerritories = safeTerritories.filter((t) => !form.areaId || t.areaId === form.areaId);
  const filteredDealers = safeDealers.filter((d) => {
    // If a territory is selected, prefer matching by territory
    if (form.territoryId) {
      return d.territoryId === form.territoryId;
    }
    // Otherwise, if a region is selected and dealer has a regionId, match on region
    if (form.regionId && d.regionId) {
      return d.regionId === form.regionId;
    }
    // Fallback: show all dealers returned by the backend for this role
    return true;
  });

  // Resolve selected role name (slug) from numeric roleId
  const selectedRoleForForm =
    roles.find((r) => r.id === form.roleId || r.name === form.roleId) || null;
  const selectedRoleName = selectedRoleForForm?.name || "";

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Regional User Management"
        subtitle="Create and manage users within your region"
      />

      {/* Actions Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} />
                  </InputAdornment>
                ),
              }}
              sx={{ flexGrow: 1, minWidth: 200 }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={filterRole}
                label="Role"
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                label="Status"
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="blocked">Blocked</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<UserPlus />}
              onClick={handleCreateUser}
            >
              Create User
            </Button>

            <IconButton onClick={() => fetchData()}>
              <RefreshCw size={18} />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Region</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Territory</TableCell>
                  <TableCell>Dealer</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleName(user.roleId || user.role?.id)}</TableCell>
                      <TableCell>{user.region?.name || "N/A"}</TableCell>
                      <TableCell>{user.area?.name || "N/A"}</TableCell>
                      <TableCell>{user.territory?.name || "N/A"}</TableCell>
                      <TableCell>{user.dealer?.businessName || "N/A"}</TableCell>
                      <TableCell>{getStatusChip(user)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => handleEditUser(user)}>
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit User Dialog */}
      <Dialog open={formDialogOpen} onClose={() => setFormDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleSaveUser}>
          <DialogTitle>{isEdit ? "Edit User" : "Create User"}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!isEdit}
                  helperText={isEdit ? "Leave blank to keep current password" : ""}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={form.roleId}
                    label="Role"
                    onChange={(e) => {
                      const newForm = { ...form, roleId: e.target.value };
                      // Clear dependent fields when role changes
                      if (e.target.value !== form.roleId) {
                        newForm.areaId = "";
                        newForm.territoryId = "";
                        newForm.dealerId = "";
                        newForm.managerId = "";
                      }
                      setForm(newForm);
                    }}
                  >
                    {roles
                      .filter(
                        (r) =>
                          r.name !== "super_admin" &&
                          r.name !== "technical_admin" &&
                          r.name !== "finance_admin"
                      )
                      .map((role) => (
                        <MenuItem key={role.id} value={role.id}>
                          {role.name}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Region</InputLabel>
                  <Select
                    value={form.regionId}
                    label="Region"
                    onChange={(e) => {
                      setForm({
                        ...form,
                        regionId: e.target.value,
                        areaId: "",
                        territoryId: "",
                        dealerId: "",
                      });
                    }}
                    required
                  >
                    {regions.map((region) => (
                      <MenuItem key={region.id} value={region.id}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {(selectedRoleName === "area_manager" ||
                selectedRoleName === "territory_manager" ||
                selectedRoleName === "dealer_staff") && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Area</InputLabel>
                    <Select
                      value={form.areaId}
                      label="Area"
                      onChange={(e) => {
                        setForm({
                          ...form,
                          areaId: e.target.value,
                          territoryId: "",
                          dealerId: "",
                        });
                      }}
                    >
                      {filteredAreas.map((area) => (
                        <MenuItem key={area.id} value={area.id}>
                          {area.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {(selectedRoleName === "territory_manager" ||
                selectedRoleName === "dealer_staff") && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Territory</InputLabel>
                    <Select
                      value={form.territoryId}
                      label="Territory"
                      onChange={(e) => {
                        setForm({ ...form, territoryId: e.target.value, dealerId: "" });
                      }}
                    >
                      {filteredTerritories.map((territory) => (
                        <MenuItem key={territory.id} value={territory.id}>
                          {territory.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              {(selectedRoleName === "dealer_admin" ||
                selectedRoleName === "dealer_staff") && (
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Dealer</InputLabel>
                    <Select
                      value={form.dealerId}
                      label="Dealer"
                      onChange={(e) => setForm({ ...form, dealerId: e.target.value })}
                    >
                      {filteredDealers.map((dealer) => (
                        <MenuItem key={dealer.id} value={dealer.id}>
                          {dealer.businessName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Manager</InputLabel>
                  <Select
                    value={form.managerId}
                    label="Manager"
                    onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                  >
                    <MenuItem value="">None</MenuItem>
                    {managers.map((manager) => (
                      <MenuItem key={manager.id} value={manager.id}>
                        {manager.username} ({getRoleName(manager.roleId || manager.role?.id)})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {isEdit ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Alert severity="warning">
            Are you sure you want to delete user <strong>{selectedUser?.username}</strong>? This
            action cannot be undone.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

