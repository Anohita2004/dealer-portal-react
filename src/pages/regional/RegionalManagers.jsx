import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Stack,
} from "@mui/material";
import { Search, RefreshCw, Mail, Phone, MapPin, Building2 } from "lucide-react";
import { userAPI, geoAPI } from "../../services/api";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

export default function RegionalManagers() {
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const params = {
        page,
        pageSize,
        search: searchTerm || undefined,
        role: filterRole !== "all" ? filterRole : undefined,
        regionId: user.regionId,
        roles: ["area_manager", "territory_manager"].join(","),
      };

      const data = await userAPI.getUsers(params);
      const managersList = data.data || data.users || data || [];
      setManagers(Array.isArray(managersList) ? managersList : []);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / pageSize));
    } catch (error) {
      console.error("Failed to fetch managers:", error);
      toast.error("Failed to load managers");
      setManagers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagers();
  }, [page, searchTerm, filterRole]);

  useEffect(() => {
    const loadGeoData = async () => {
      try {
        const [areasResult, territoriesResult] = await Promise.allSettled([
          geoAPI.getAreas(),
          geoAPI.getTerritories(),
        ]);

        // Safely extract areas array
        let areasArray = [];
        if (areasResult.status === 'fulfilled') {
          const areasData = areasResult.value;
          if (Array.isArray(areasData)) {
            areasArray = areasData;
          } else if (Array.isArray(areasData?.data)) {
            areasArray = areasData.data;
          } else if (areasData?.data && Array.isArray(areasData.data)) {
            areasArray = areasData.data;
          }
        }
        setAreas(areasArray);

        // Safely extract territories array
        let territoriesArray = [];
        if (territoriesResult.status === 'fulfilled') {
          const territoriesData = territoriesResult.value;
          if (Array.isArray(territoriesData)) {
            territoriesArray = territoriesData;
          } else if (Array.isArray(territoriesData?.data)) {
            territoriesArray = territoriesData.data;
          } else if (territoriesData?.data && Array.isArray(territoriesData.data)) {
            territoriesArray = territoriesData.data;
          }
        }
        setTerritories(territoriesArray);
      } catch (error) {
        console.error("Failed to load geo data:", error);
        setAreas([]);
        setTerritories([]);
      }
    };
    loadGeoData();
  }, []);

  const getRoleName = (roleId) => {
    const roleMap = {
      area_manager: "Area Manager",
      territory_manager: "Territory Manager",
    };
    return roleMap[roleId] || roleId || "Unknown";
  };

  const getAreaName = (areaId) => {
    if (!areaId || !Array.isArray(areas) || areas.length === 0) return "N/A";
    const area = areas.find((a) => a.id === areaId);
    return area?.name || "N/A";
  };

  const getTerritoryName = (territoryId) => {
    if (!territoryId || !Array.isArray(territories) || territories.length === 0) return "N/A";
    const territory = territories.find((t) => t.id === territoryId);
    return territory?.name || "N/A";
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Managers"
        subtitle="Manage area and territory managers in your region"
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              size="small"
              placeholder="Search managers..."
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
                <MenuItem value="area_manager">Area Manager</MenuItem>
                <MenuItem value="territory_manager">Territory Manager</MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={() => fetchManagers()}>
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
                  <TableCell>Role</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Territory</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : managers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No managers found
                    </TableCell>
                  </TableRow>
                ) : (
                  managers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell>{manager.username}</TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Mail size={14} />
                          <span>{manager.email}</span>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleName(manager.roleId || manager.role?.id)}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{getAreaName(manager.areaId)}</TableCell>
                      <TableCell>{getTerritoryName(manager.territoryId)}</TableCell>
                      <TableCell>
                        <Chip
                          label={manager.isActive !== false ? "Active" : "Inactive"}
                          size="small"
                          color={manager.isActive !== false ? "success" : "default"}
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

