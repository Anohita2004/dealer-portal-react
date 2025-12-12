import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
} from "@mui/material";
import { Plus, Edit, Trash2 } from "lucide-react";
import { dealerAPI } from "../services/api";
import { toast } from "react-toastify";
import PageHeader from "../components/PageHeader";

export default function StaffManagement() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "dealer_staff",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await dealerAPI.getDealerStaff();
      setStaff(Array.isArray(data) ? data : data.staff || []);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      toast.error("Failed to load staff members");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (member = null) => {
    if (member) {
      setEditingStaff(member);
      setFormData({
        username: member.username || "",
        email: member.email || "",
        password: "",
        role: member.role || "dealer_staff",
      });
    } else {
      setEditingStaff(null);
      setFormData({
        username: "",
        email: "",
        password: "",
        role: "dealer_staff",
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingStaff) {
        await dealerAPI.updateStaff(editingStaff.id, formData);
        toast.success("Staff member updated");
      } else {
        await dealerAPI.createStaff(formData);
        toast.success("Staff member created");
      }
      setDialogOpen(false);
      fetchStaff();
    } catch (error) {
      console.error("Failed to save staff:", error);
      toast.error(error.response?.data?.error || "Failed to save staff member");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;

    try {
      await dealerAPI.deleteStaff(id);
      toast.success("Staff member deleted");
      fetchStaff();
    } catch (error) {
      console.error("Failed to delete staff:", error);
      toast.error("Failed to delete staff member");
    }
  };

  if (loading) {
    return <Typography>Loading staff...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Staff Management"
        subtitle="Manage dealer staff members"
        action={
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => handleOpenDialog()}
          >
            Add Staff
          </Button>
        }
      />

      <TableContainer component={Paper} sx={{ mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="text.secondary">No staff members found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>{member.email || "N/A"}</TableCell>
                  <TableCell>
                    <Chip label={member.role || "dealer_staff"} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={member.isActive !== false ? "Active" : "Inactive"}
                      color={member.isActive !== false ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenDialog(member)}>
                      <Edit size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(member.id)}
                      color="error"
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStaff ? "Edit Staff Member" : "Create Staff Member"}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingStaff}
              fullWidth
              helperText={editingStaff ? "Leave blank to keep current password" : ""}
            />
            <TextField
              label="Role"
              select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              fullWidth
            >
              <MenuItem value="dealer_staff">Dealer Staff</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingStaff ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

