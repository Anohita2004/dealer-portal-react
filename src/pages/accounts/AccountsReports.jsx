import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, Alert, CircularProgress } from "@mui/material";
import api, { reportAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { isAccountsUser } from "../../utils/accountsPermissions";
import { Info, FileText } from "lucide-react";
import PageHeader from "../../components/PageHeader";

export default function AccountsReports() {
  const { user } = useAuth();
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try accounts-specific reports endpoint
      const res = await api.get("/accounts/dealer-reports");
      setReport(res.data.dealers || res.data || []);
    } catch (err) {
      // 403 = not permitted, 404 = doesn't exist
      if (err?.response?.status === 403 || err?.response?.status === 404) {
        setError("Reports are not available for your role or the endpoint is not configured.");
        setReport([]);
      } else {
        console.error("Failed to load reports:", err);
        setError("Failed to load reports");
        setReport([]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Financial Reports"
        subtitle="View financial reports available to Accounts users"
      />

      {/* Accounts User Context */}
      {isAccountsUser(user) && (
        <Alert severity="info" icon={<Info size={20} />} sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
            Accounts Reports Access
          </Typography>
          <Typography variant="body2">
            You have access to financial reports that support payment verification and reconciliation. Reports are read-only and reflect data within your scope.
          </Typography>
        </Alert>
      )}

      {loading ? (
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent>
            <Alert severity="warning" icon={<FileText size={20} />}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Reports Not Available
              </Typography>
              <Typography variant="body2">
                {error}
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      ) : report.length === 0 ? (
        <Card>
          <CardContent>
            <Typography variant="body1" color="text.secondary" align="center" sx={{ py: 4 }}>
              No reports available
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Dealer Financial Summary
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {report.length} dealer(s) in scope
            </Typography>
            {/* Reports data would be displayed here if available */}
            <Alert severity="info">
              Report data visualization will be displayed here when available.
            </Alert>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
