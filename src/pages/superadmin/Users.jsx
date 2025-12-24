import React, { useEffect, useState, useRef } from "react";
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
  Pagination,
  Stack,
  Divider,
  Skeleton,
  useTheme,
  alpha
} from "@mui/material";
import {
  UserPlus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  UserCheck,
  UserX,
  Mail,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { userAPI, roleAPI } from "../../services/api";
import { toast } from "react-toastify";

export default function Users() {
  const navigate = useNavigate();
  const theme = useTheme();

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
        // Send common variations to ensure backend compatibility
        search: searchTerm || undefined,
        q: searchTerm || undefined,

        role: filterRole !== "all" ? filterRole : undefined,
        roleId: filterRole !== "all" ? filterRole : undefined,

        status: filterStatus !== "all" ? filterStatus : undefined,

        region: filterRegion !== "all" ? filterRegion : undefined,
        regionId: filterRegion !== "all" ? filterRegion : undefined,

        sort: sortBy,
        sortBy: sortBy,

        order: sortOrder,
        sortOrder: sortOrder,
        direction: sortOrder,
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

  // 1. Page Change Effect: Triggers fetch whenever page changes
  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 2. Search Effect (Debounced): Resets to page 1
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Don't trigger on initial mount if empty
    if (searchTerm === "" && page === 1 && users.length === 0) return;

    debounceRef.current = setTimeout(() => {
      if (page === 1) {
        fetchData(1); // Force fetch if already on page 1
      } else {
        setPage(1); // This triggers the page effect
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // 3. Filters & Sort Effect (Immediate): Resets to page 1
  useEffect(() => {
    // Avoid double fetch on mount
    if (users.length === 0 && page === 1) return;

    if (page === 1) {
      fetchData(1);
    } else {
      setPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterRole, filterStatus, filterRegion, sortBy, sortOrder, pageSize]);

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
          color="error"
          sx={{ fontWeight: 500 }}
        />
      );
    }
    if (user.isActive) {
      return (
        <Chip
          icon={<CheckCircle size={14} />}
          label="Active"
          size="small"
          color="success"
          sx={{ fontWeight: 500 }}
        />
      );
    }
    return (
      <Chip
        icon={<AlertCircle size={14} />}
        label="Inactive"
        size="small"
        color="warning"
        variant="outlined"
        sx={{ fontWeight: 500 }}
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
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, color: "text.primary" }}>
            User Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage users, roles, and access permissions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={handleExport}
            disabled={users.length === 0}
            size="small"
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<UserPlus size={18} />}
            onClick={() => navigate("/superadmin/users/new")}
            size="small"
          >
            Create User
          </Button>
        </Stack>
      </Box>

      {/* Stats - Using Outlined Paper to distinguish from main background */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              TOTAL USERS
            </Typography>
            <Typography variant="h4" color="primary.main" fontWeight={700} sx={{ mt: 1 }}>
              {loading ? <Skeleton width="60%" /> : total}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              ACTIVE
            </Typography>
            <Typography variant="h4" color="success.main" fontWeight={700} sx={{ mt: 1 }}>
              {loading ? <Skeleton width="60%" /> : users.filter((u) => u.isActive && !u.isBlocked).length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              INACTIVE
            </Typography>
            <Typography variant="h4" color="warning.main" fontWeight={700} sx={{ mt: 1 }}>
              {loading ? <Skeleton width="60%" /> : users.filter((u) => !u.isActive).length}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              BLOCKED
            </Typography>
            <Typography variant="h4" color="error.main" fontWeight={700} sx={{ mt: 1 }}>
              {loading ? <Skeleton width="60%" /> : users.filter((u) => u.isBlocked).length}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ mb: 4 }} />

      {/* Filters & Controls */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
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
              <InputLabel>Rows</InputLabel>
              <Select value={pageSize} label="Rows" onChange={(e) => setPageSize(e.target.value)}>
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
              variant="outlined"
              startIcon={<RefreshCw size={18} />}
              onClick={() => fetchData(page)}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </Grid>
        </Grid>

        {selectedUsers.length > 0 && (
          <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "center", p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2, border: '1px dashed', borderColor: 'primary.main' }}>
            <Typography variant="body2" color="primary" fontWeight={600}>
              {selectedUsers.length} selected
            </Typography>
            <Button
              size="small"
              variant="contained"
              disableElevation
              onClick={() => setBulkActionDialogOpen(true)}
            >
              Bulk Actions
            </Button>
            <Button size="small" onClick={() => setSelectedUsers([])}>
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {/* Table - Remove Card wrapper, just use TableContainer with border */}
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: "60vh", borderRadius: 2, border: `1px solid ${theme.palette.divider}` }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ bgcolor: "background.paper" }}>
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
              <TableCell sx={{ cursor: "pointer", bgcolor: "background.paper", fontWeight: 600 }} onClick={() => toggleSort("username")}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  Username <SortIcon column="username" />
                </Box>
              </TableCell>
              <TableCell sx={{ cursor: "pointer", bgcolor: "background.paper", fontWeight: 600 }} onClick={() => toggleSort("email")}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  Email <SortIcon column="email" />
                </Box>
              </TableCell>
              <TableCell sx={{ bgcolor: "background.paper", fontWeight: 600 }}>Role</TableCell>
              <TableCell sx={{ bgcolor: "background.paper", fontWeight: 600 }}>Location</TableCell>
              <TableCell sx={{ bgcolor: "background.paper", fontWeight: 600 }}>Dealer</TableCell>
              <TableCell sx={{ bgcolor: "background.paper", fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ cursor: "pointer", bgcolor: "background.paper", fontWeight: 600 }} onClick={() => toggleSort("createdAt")}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  Created <SortIcon column="createdAt" />
                </Box>
              </TableCell>
              <TableCell align="right" sx={{ bgcolor: "background.paper" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Skeleton Rows
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
                  <TableCell><Box display="flex" gap={1} alignItems="center"><Skeleton variant="circular" width={28} height={28} /><Skeleton width={100} /></Box></TableCell>
                  <TableCell><Skeleton width={150} /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={100} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell><Skeleton width={70} /></TableCell>
                  <TableCell><Skeleton width={90} /></TableCell>
                  <TableCell align="right"><Skeleton variant="circular" width={24} height={24} /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                  <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
                    <UserX size={40} color={theme.palette.text.disabled} />
                    <Typography variant="body2" color="text.secondary">No users found</Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter((id) => id !== user.id));
                        }
                      }}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Box sx={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "primary.light",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "primary.main",
                        fontWeight: 700,
                        fontSize: "0.75rem"
                      }}>
                        {user.username.charAt(0).toUpperCase()}
                      </Box>
                      <Typography variant="body2" fontWeight={600}>
                        {user.username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Mail size={14} color={theme.palette.text.secondary} />
                      <Typography variant="body2">{user.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.roleDetails?.name || user.role || "—"}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: "divider", fontSize: "0.75rem", height: 24 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontSize: "0.80rem" }}>{user.region?.name || user.area?.name || "—"}</Typography>
                    {user.territory?.name && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {user.territory?.name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.dealer?.businessName ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Building2 size={12} color={theme.palette.text.secondary} />
                        <Typography variant="body2" sx={{ fontSize: "0.80rem" }}>{user.dealer.businessName}</Typography>
                      </Box>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{getStatusChip(user)}</TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.80rem" }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => handleMenuOpen(e, user)}>
                      <MoreVertical size={16} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
          showFirstButton
          showLastButton
          size="small"
        />
      </Box>

      {/* Action Menu - kept as is */}
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

      {/* Dialogs kept as is */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Confirm User Deletion
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action is permanent and cannot be undone.
          </Alert>
          <Typography>
            Are you sure you want to delete user <strong>{selectedUser?.username}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete Permanently
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Bulk Action Confirmation
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select value={bulkAction} label="Action" onChange={(e) => setBulkAction(e.target.value)}>
              <MenuItem value="activate">Activate Users</MenuItem>
              <MenuItem value="deactivate">Deactivate Users</MenuItem>
              <MenuItem value="delete">Delete Users</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            You have selected {selectedUsers.length} users.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkAction}
            variant="contained"
            disabled={!bulkAction}
            color={bulkAction === "delete" ? "error" : "primary"}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
