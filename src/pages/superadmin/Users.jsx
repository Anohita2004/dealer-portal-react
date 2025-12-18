import React, { useEffect, useState, useRef, useMemo } from "react";
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
  Checkbox,
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
import { userAPI, roleAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function Users() {
  const navigate = useNavigate();

  // State
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");

  // Filters & Search
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const debounceRef = useRef();

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
        regionId: filterRegion !== "all" ? filterRegion : undefined,
        sort: sortBy,
        order: sortOrder,
      };

      const [usersRes, rolesRes] = await Promise.all([
        userAPI.getUsers(params),
        roleAPI.getRoles(),
      ]);

      const list = usersRes?.users || usersRes?.data || [];
      setUsers(list);
      setTotal(usersRes?.total || list.length);
      setTotalPages(usersRes?.totalPages || Math.ceil(list.length / pageSize));

      setRoles(Array.isArray(rolesRes) ? rolesRes : rolesRes?.roles || rolesRes?.data || []);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(page);
  }, [page]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, filterRole, filterStatus, filterRegion, sortBy, sortOrder, pageSize]);

  // Actions
  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleEdit = (user) => {
    navigate(`/superadmin/users/${user.id}`);
    handleMenuClose();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await userAPI.deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      fetchData(page);
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete user");
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0) {
      toast.warning("Please select users");
      return;
    }

    try {
      if (bulkAction === "activate") {
        await Promise.all(selectedUsers.map((id) => userAPI.activateUser(id)));
        toast.success(`${selectedUsers.length} users activated`);
      } else if (bulkAction === "deactivate") {
        await Promise.all(selectedUsers.map((id) => userAPI.deactivateUser(id)));
        toast.success(`${selectedUsers.length} users deactivated`);
      } else if (bulkAction === "delete") {
        await Promise.all(selectedUsers.map((id) => userAPI.deleteUser(id)));
        toast.success(`${selectedUsers.length} users deleted`);
      }
      setSelectedUsers([]);
      setBulkActionDialogOpen(false);
      fetchData(page);
    } catch (err) {
      toast.error("Failed to perform bulk action");
    }
  };

  const handleExport = () => {
    const csv = [
      ["Username", "Email", "Role", "Region", "Area", "Territory", "Dealer", "Status", "Created", "Last Login"].join(","),
      ...users.map((u) =>
        [
          u.username,
          u.email,
          u.roleDetails?.name || "",
          u.region?.name || "",
          u.area?.name || "",
          u.territory?.name || "",
          u.dealer?.businessName || "",
          u.isActive ? "Active" : "Inactive",
          new Date(u.createdAt).toLocaleDateString(),
          u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    toast.success("Users exported successfully");
  };

  const getStatusChip = (user) => {
    if (user.isBlocked) {
      return (
        <Chip 
          icon={<XCircle size={14} />} 
          label="Blocked" 
          size="small"
          sx={{ 
            backgroundColor: "#ef4444", 
            color: "white",
            fontWeight: 500,
            "& .MuiChip-icon": { color: "white" },
            "& .MuiChip-label": { px: 1.5 }
          }} 
        />
      );
    }
    if (user.isActive) {
      return (
        <Chip 
          icon={<CheckCircle size={14} />} 
          label="Active" 
          size="small"
          sx={{ 
            backgroundColor: "#22c55e", 
            color: "white",
            fontWeight: 500,
            "& .MuiChip-icon": { color: "white" },
            "& .MuiChip-label": { px: 1.5 }
          }} 
        />
      );
    }
    return (
      <Chip 
        icon={<AlertCircle size={14} />} 
        label="Inactive" 
        size="small"
        sx={{ 
          backgroundColor: "#f97316", 
          color: "white",
          fontWeight: 500,
          "& .MuiChip-icon": { color: "white" },
          "& .MuiChip-label": { px: 1.5 }
        }} 
      />
    );
  };

  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? "↑" : "↓";
  };

  return (
    <Box sx={{ p: 3, width: "100%", maxWidth: 1400, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: "#f97316", fontSize: "1.75rem" }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
            Create, manage, and monitor all users in the system
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleExport}
            disabled={users.length === 0}
            sx={{ color: "#f97316", borderColor: "#f97316", "&:hover": { borderColor: "#fb923c", backgroundColor: "rgba(249, 115, 22, 0.1)" } }}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<UserPlus size={18} />}
            onClick={() => navigate("/superadmin/users/new")}
            sx={{ backgroundColor: "#f97316", "&:hover": { backgroundColor: "#fb923c" } }}
          >
            Create User
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontSize: "0.875rem" }}>
                Total Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#f97316" }}>
                {total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontSize: "0.875rem" }}>
                Active Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#22c55e" }}>
                {users.filter((u) => u.isActive && !u.isBlocked).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontSize: "0.875rem" }}>
                Inactive Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#f97316" }}>
                {users.filter((u) => !u.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <CardContent>
              <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontSize: "0.875rem" }}>
                Blocked Users
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: "#ef4444" }}>
                {users.filter((u) => u.isBlocked).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, borderRadius: 2, boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search username, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Role</InputLabel>
                <Select value={filterRole} label="Role" onChange={(e) => setFilterRole(e.target.value)}>
                  <MenuItem value="all">All Roles</MenuItem>
                  {roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Page Size</InputLabel>
                <Select value={pageSize} label="Page Size" onChange={(e) => setPageSize(e.target.value)}>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={25}>25</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<RefreshCw size={18} />}
                onClick={() => fetchData(page)}
                disabled={loading}
                sx={{ backgroundColor: "#f97316", "&:hover": { backgroundColor: "#fb923c" } }}
              >
                Refresh
              </Button>
            </Grid>
          </Grid>

          {selectedUsers.length > 0 && (
            <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
              <Typography variant="body2" color="primary">
                {selectedUsers.length} selected
              </Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  setBulkActionDialogOpen(true);
                }}
              >
                Bulk Actions
              </Button>
              <Button size="small" variant="text" onClick={() => setSelectedUsers([])}>
                Clear Selection
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card
        sx={{
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <TableContainer
          sx={{
            width: "100%",
            maxWidth: "100%",
            overflowX: "auto",
            maxHeight: "60vh",
            overflowY: "auto",
          }}
        >
          <Table sx={{ width: "100%", tableLayout: "auto" }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#fef3c7" }}>
                <TableCell padding="checkbox" sx={{ fontWeight: 600, fontSize: "0.875rem", width: "5%" }}>
                  <Checkbox
                    checked={selectedUsers.length === users.length && users.length > 0}
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(users.map((u) => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "10%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }} onClick={() => toggleSort("username")}>
                    Username <SortIcon column="username" />
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "12%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }} onClick={() => toggleSort("email")}>
                    Email <SortIcon column="email" />
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "8%" }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "8%" }}>Region</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "8%" }}>Area</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "8%" }}>Territory</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "12%" }}>Dealer</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "8%" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "10%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, cursor: "pointer" }} onClick={() => toggleSort("createdAt")}>
                    Created <SortIcon column="createdAt" />
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: "0.875rem", width: "12%" }}>Last Login</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.875rem", width: "8%" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <Typography>Loading...</Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover sx={{ "&:hover": { backgroundColor: "rgba(0,0,0,0.02)" } }}>
                    <TableCell padding="checkbox" sx={{ py: 1.5 }}>
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUsers([...selectedUsers, user.id]);
                          } else {
                            setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Shield size={16} color="#6b7280" />
                        <Typography variant="body2" fontWeight="medium" sx={{ fontSize: "0.875rem" }}>
                          {user.username}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Mail size={14} color="#6b7280" />
                        <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.roleDetails?.name || user.role || "—"} 
                        size="small" 
                        sx={{ 
                          backgroundColor: "#f97316", 
                          color: "white",
                          fontWeight: 500,
                          "& .MuiChip-label": { px: 1.5 }
                        }} 
                      />
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: "0.875rem" }}>{user.region?.name || "—"}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: "0.875rem" }}>{user.area?.name || "—"}</TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: "0.875rem" }}>{user.territory?.name || "—"}</TableCell>
                    <TableCell sx={{ py: 1.5, maxWidth: "180px", overflow: "hidden" }}>
                      {user.dealer?.businessName ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                          <Building2 size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {user.dealer.businessName}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ py: 1.5, maxWidth: "100px" }}>{getStatusChip(user)}</TableCell>
                    <TableCell sx={{ py: 1.5, maxWidth: "120px", overflow: "hidden" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                        <Calendar size={14} color="#6b7280" style={{ flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontSize: "0.875rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 1.5, fontSize: "0.875rem", maxWidth: "150px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.5, width: "60px" }}>
                      <Tooltip title="More options">
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                          <MoreVertical size={18} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Showing {users.length} of {total} users
          </Typography>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(e, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </Card>

      {/* Action Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={() => handleEdit(selectedUser)}>
          <Edit size={16} style={{ marginRight: 8 }} />
          Edit User
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedUser?.isActive) {
              userAPI.deactivateUser(selectedUser.id).then(() => {
                toast.success("User deactivated");
                fetchData(page);
                handleMenuClose();
              });
            } else {
              userAPI.activateUser(selectedUser.id).then(() => {
                toast.success("User activated");
                fetchData(page);
                handleMenuClose();
              });
            }
          }}
        >
          {selectedUser?.isActive ? (
            <>
              <UserX size={16} style={{ marginRight: 8 }} />
              Deactivate
            </>
          ) : (
            <>
              <UserCheck size={16} style={{ marginRight: 8 }} />
              Activate
            </>
          )}
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
          sx={{ color: "error.main" }}
        >
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AlertCircle size={20} color="#ef4444" />
            Delete User - Impact Warning
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
              This action is permanent and cannot be undone.
            </Typography>
            <Typography variant="body2">
              Deleting user <strong>{selectedUser?.username}</strong> will:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li><Typography variant="body2">Remove all access immediately</Typography></li>
              <li><Typography variant="body2">Affect any pending approvals assigned to this user</Typography></li>
              <li><Typography variant="body2">Be logged in audit trail as a Super Admin override</Typography></li>
            </Box>
          </Alert>
          {selectedUser && (
            <Box sx={{ mt: 2, p: 1.5, background: "#f3f4f6", borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                User Details:
              </Typography>
              <Typography variant="body2"><strong>Role:</strong> {selectedUser.roleDetails?.name || selectedUser.role || "N/A"}</Typography>
              <Typography variant="body2"><strong>Region:</strong> {selectedUser.region?.name || "N/A"}</Typography>
              <Typography variant="body2"><strong>Status:</strong> {selectedUser.isActive ? "Active" : "Inactive"}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AlertCircle size={20} color={bulkAction === "delete" ? "#ef4444" : "#f59e0b"} />
            Bulk Action - Impact Warning
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select value={bulkAction} label="Action" onChange={(e) => setBulkAction(e.target.value)}>
              <MenuItem value="activate">Activate Users</MenuItem>
              <MenuItem value="deactivate">Deactivate Users</MenuItem>
              <MenuItem value="delete">Delete Users</MenuItem>
            </Select>
          </FormControl>
          {bulkAction && (
            <Alert 
              severity={bulkAction === "delete" ? "error" : "warning"} 
              sx={{ mt: 2 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Impact: This will affect {selectedUsers.length} user(s)
              </Typography>
              {bulkAction === "delete" && (
                <Typography variant="body2">
                  <strong>Warning:</strong> Bulk deletion is permanent and cannot be undone. All affected users will lose access immediately.
                </Typography>
              )}
              {bulkAction === "deactivate" && (
                <Typography variant="body2">
                  Users will lose access but can be reactivated later. Pending approvals may be affected.
                </Typography>
              )}
              {bulkAction === "activate" && (
                <Typography variant="body2">
                  Users will regain access immediately. Ensure proper role assignments are in place.
                </Typography>
              )}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkAction} 
            variant="contained" 
            disabled={!bulkAction}
            color={bulkAction === "delete" ? "error" : "primary"}
          >
            Confirm {bulkAction === "delete" ? "Permanent Deletion" : "Action"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
