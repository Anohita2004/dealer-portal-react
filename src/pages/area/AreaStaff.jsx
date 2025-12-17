import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Pagination,
  Stack,
} from "@mui/material";
import { Search, RefreshCw } from "lucide-react";
import { userAPI, dealerAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function AreaStaff() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [dealers, setDealers] = useState([]);

  useEffect(() => {
    const loadDealers = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const data = await dealerAPI.getDealers({ areaId: user.areaId });
        setDealers(data.data || data.dealers || data || []);
      } catch (error) {
        console.error("Failed to load dealers:", error);
      }
    };
    loadDealers();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const dealerIds = dealers.map(d => d.id).join(",");
      
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        role: "dealer_staff",
        areaId: user.areaId,
        dealerIds: dealerIds || undefined,
      };

      const data = await userAPI.getUsers(params);
      const staffList = data.data || data.users || data || [];
      setStaff(Array.isArray(staffList) ? staffList : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      toast.error("Failed to load staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dealers.length > 0) {
      fetchStaff();
    }
  }, [page, searchTerm, dealers.length]);

  const getDealerName = (dealerId) => {
    if (!dealerId || !Array.isArray(dealers) || dealers.length === 0) return "N/A";
    const dealer = dealers.find((d) => d.id === dealerId);
    return dealer?.businessName || "N/A";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Area Staff"
        subtitle="View staff members from dealers in your area"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search staff..."
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

            <IconButton onClick={() => fetchStaff()}>
              <RefreshCw size={18} />
            </IconButton>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Dealer</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No staff found
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.username || "N/A"}</TableCell>
                      <TableCell>{member.email || "N/A"}</TableCell>
                      <TableCell>{getDealerName(member.dealerId)}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.isActive !== false ? "Active" : "Inactive"}
                          size="small"
                          color={member.isActive !== false ? "success" : "default"}
                        />
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
    </Box>
  );
}

