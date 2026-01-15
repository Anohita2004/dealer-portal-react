import React, { useContext, useMemo } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Divider,
    Alert,
    AlertTitle
} from '@mui/material';
import {
    DollarSign,
    Package,
    Truck,
    Settings,
    FileText,
    BarChart3,
    ExternalLink,
    Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ReportsOverview = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const role = user?.role || 'dealer';

    // Month-end closing logic: Last 3 days of the month
    const isMonthEnd = useMemo(() => {
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return today.getDate() > (lastDayOfMonth - 3);
    }, []);

    const reportCategories = [
        {
            title: "Finance Reports",
            icon: <DollarSign className="text-primary" />,
            description: "Financial tracking and ledger records",
            roles: ['super_admin', 'regional_admin', 'finance_admin', 'accounts_user', 'dealer_admin'],
            reports: [
                { id: 'le-register', label: 'Le Register', path: '/reports?type=le-register', hideOnMonthEnd: true },
                { id: 'fi-daywise', label: 'FI Daywise Report', path: '/reports?type=fi-daywise' },
                { id: 'drcr-note', label: 'DR/CR Note Register', path: '/reports?type=drcr-note' },
                { id: 'sales-register', label: 'Sales Register', path: '/reports?type=sales-register', hideOnMonthEnd: true },
                { id: 'collection', label: 'Collection Report', path: '/reports?type=collection' },
                { id: 'ageing', label: 'Ageing Report', path: 'https://sap-external.example.com/ageing', isExternal: true },
            ]
        },
        {
            title: "Inventory & Stock",
            icon: <Package className="text-success" />,
            description: "Manage depot stocks and compliance",
            roles: ['super_admin', 'regional_admin', 'inventory_user', 'dealer_admin'],
            reports: [
                { id: 'stock-overview', label: 'Stock Overview', path: '/reports?type=stock-overview' },
                { id: 'comparative', label: 'Comparative Report', path: '/reports?type=comparative' },
                { id: 'compliance', label: 'Compliance Report', path: '/reports?type=compliance' },
                { id: 'rr-summary', label: 'RR Summary Report', path: '/reports?type=rr-summary' },
            ]
        },
        {
            title: "Rake & Logistics",
            icon: <Truck className="text-warning" />,
            description: "Track rail shipments and damage",
            roles: ['super_admin', 'regional_manager', 'regional_head', 'cfa'],
            reports: [
                { id: 'rake-arrival', label: 'Rake Arrival Report', path: '/reports?type=rake-arrival' },
                { id: 'rake-data', label: 'Rake Arrival Data', path: '/reports?type=rake-data' },
                { id: 'rake-exception', label: 'Consolidated Exception', path: '/reports?type=rake-exception' },
                { id: 'rake-approval', label: 'Rake Report Approval', path: '/reports?type=rake-approval' },
            ]
        },
        {
            title: "Technical & Data",
            icon: <Settings className="text-secondary" />,
            description: "System data and diversion tracking",
            roles: ['super_admin', 'technical_admin'],
            reports: [
                { id: 'diversion', label: 'Diversion Report', path: '/reports?type=diversion' },
                { id: 'dms-request', label: 'DMS Order Request', path: '/reports?type=dms-request' },
            ]
        }
    ];

    const filteredCategories = reportCategories
        .map(cat => ({
            ...cat,
            reports: cat.reports.filter(r => {
                const hasRole = cat.roles.includes(role);
                const monthEndHidden = r.hideOnMonthEnd && isMonthEnd;
                return hasRole && !monthEndHidden;
            })
        }))
        .filter(cat => cat.reports.length > 0);

    const handleReportClick = (report) => {
        if (report.isExternal) {
            window.open(report.path, '_blank');
        } else {
            navigate(report.path);
        }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom>Reports Dashboard</Typography>
                <Typography variant="body1" color="text.secondary">
                    Select a report category to view detailed analytics and logs.
                </Typography>
            </Box>

            {isMonthEnd && (
                <Alert severity="info" sx={{ mb: 4 }} icon={<Clock />}>
                    <AlertTitle>Month-End Closing Logic Active</AlertTitle>
                    Certain financial registers (Le Register, Sales Register) are temporarily hidden for the final 3 days of the month.
                </Alert>
            )}

            <Grid container spacing={3}>
                {filteredCategories.map((cat, idx) => (
                    <Grid item xs={12} md={6} key={idx}>
                        <Card variant="outlined" sx={{ height: '100%', borderRadius: 3 }}>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                    <Box sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        bgcolor: 'action.hover',
                                        display: 'flex'
                                    }}>
                                        {cat.icon}
                                    </Box>
                                    <Box>
                                        <Typography variant="h6" fontWeight="bold">{cat.title}</Typography>
                                        <Typography variant="caption" color="text.secondary">{cat.description}</Typography>
                                    </Box>
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={1}>
                                    {cat.reports.map((report) => (
                                        <Grid item xs={12} sm={6} key={report.id}>
                                            <Card variant="soft" sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                                                <CardActionArea onClick={() => handleReportClick(report)} sx={{ p: 1.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" fontWeight="500">
                                                            {report.label}
                                                        </Typography>
                                                        {report.isExternal ? <ExternalLink size={14} /> : <BarChart3 size={14} />}
                                                    </Box>
                                                </CardActionArea>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ReportsOverview;
