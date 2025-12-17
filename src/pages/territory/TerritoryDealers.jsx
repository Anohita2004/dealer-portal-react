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
  Tabs,
  Tab,
} from "@mui/material";
import { Search, RefreshCw, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { dealerAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function TerritoryDealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [tabValue, setTabValue] = useState(0);

  const fetchDealers = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        territoryId: user.territoryId,
      };

      const data = await dealerAPI.getDealers(params);
      setDealers(data.data || data.dealers || data || []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch dealers:", error);
      toast.error("Failed to load dealers");
      setDealers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        territoryId: user.territoryId,
      };

      // Fetch staff from all dealers in territory
      const dealersData = await dealerAPI.getDealers({ territoryId: user.territoryId });
      const dealerIds = (dealersData.data || dealersData.dealers || []).map(d => d.id);
      
      // For now, we'll show dealers as staff can be accessed through dealer detail
      // In a real implementation, you'd have a separate staff API
      setStaff([]);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      toast.error("Failed to load dealer staff");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tabValue === 0) {
      fetchDealers();
    } else {
      fetchStaff();
    }
  }, [page, searchTerm, tabValue]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setPage(1);
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Territory Dealers"
        subtitle="View dealers and staff in your territory"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
            <Tab label="Dealers in Territory" />
            <Tab label="Dealer Staff" />
          </Tabs>

          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder={tabValue === 0 ? "Search dealers..." : "Search staff..."}
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

            <IconButton onClick={() => tabValue === 0 ? fetchDealers() : fetchStaff()}>
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
                  {tabValue === 0 ? (
                    <>
                      <TableCell>Dealer Code</TableCell>
                      <TableCell>Business Name</TableCell>
                      <TableCell>Contact Person</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>Staff Name</TableCell>
                      <TableCell>Dealer</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Phone</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell>Status</TableCell>
                    </>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={tabValue === 0 ? 7 : 6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (tabValue === 0 ? dealers : staff).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tabValue === 0 ? 7 : 6} align="center">
                      {tabValue === 0 ? "No dealers found" : "No staff found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  (tabValue === 0 ? dealers : staff).map((item) => (
                    <TableRow key={item.id}>
                      {tabValue === 0 ? (
                        <>
                          <TableCell>{item.dealerCode || "N/A"}</TableCell>
                          <TableCell>{item.businessName || "N/A"}</TableCell>
                          <TableCell>{item.contactPerson || "N/A"}</TableCell>
                          <TableCell>{item.email || "N/A"}</TableCell>
                          <TableCell>{item.phoneNumber || "N/A"}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.isActive !== false ? "Active" : "Inactive"}
                              size="small"
                              color={item.isActive !== false ? "success" : "default"}
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/dealers/${item.id}`)}
                            >
                              <Eye size={16} />
                            </IconButton>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell>{item.name || item.username || "N/A"}</TableCell>
                          <TableCell>{item.dealer?.businessName || "N/A"}</TableCell>
                          <TableCell>{item.email || "N/A"}</TableCell>
                          <TableCell>{item.phone || "N/A"}</TableCell>
                          <TableCell>{item.role || "N/A"}</TableCell>
                          <TableCell>
                            <Chip
                              label={item.isActive !== false ? "Active" : "Inactive"}
                              size="small"
                              color={item.isActive !== false ? "success" : "default"}
                            />
                          </TableCell>
                        </>
                      )}
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

