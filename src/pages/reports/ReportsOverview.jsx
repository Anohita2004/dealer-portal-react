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
    AlertTitle,
    useTheme,
    alpha,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    DollarSign,
    Package,
    Truck,
    Settings,
    FileText,
    BarChart3,
    ExternalLink,
    Clock,
    ChevronRight,
    Search,
    TrendingUp,
    ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const ReportsOverview = () => {
    const { user } = useContext(AuthContext);
    const theme = useTheme();
    const navigate = useNavigate();
    const role = user?.role || 'dealer';

    const isMonthEnd = useMemo(() => {
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return today.getDate() > (lastDayOfMonth - 3);
    }, []);

    const reportCategories = [
        {
            title: "Finance Reports",
            icon: <DollarSign />,
            color: theme.palette.primary.main,
            gradient: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            description: "Financial tracking and ledger records",
            roles: ['super_admin', 'regional_admin', 'finance_admin', 'accounts_user', 'dealer_admin'],
            reports: [
                { id: 'le-register', label: 'Le Register (A/C Statement)', path: '/reports?type=le-register', hideOnMonthEnd: true },
                { id: 'fi-daywise', label: 'FI Daywise Report', path: '/reports?type=fi-daywise' },
                { id: 'drcr-note', label: 'DR/CR Note Register', path: '/reports?type=drcr-note' },
                { id: 'sales-register', label: 'Sales Register', path: '/reports?type=sales-register', hideOnMonthEnd: true },
                { id: 'collection', label: 'Collection Report', path: '/reports?type=collection' },
                { id: 'ageing', label: 'Ageing Report', path: 'https://sap-external.example.com/ageing', isExternal: true },
            ]
        },
        {
            title: "Inventory & Stock",
            icon: <Package />,
            color: theme.palette.success.main,
            gradient: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
            description: "Manage depot stocks and compliance",
            roles: ['super_admin', 'regional_admin', 'inventory_user', 'dealer_admin'],
            reports: [
                { id: 'stock-overview', label: 'Stock Overview', path: '/reports?type=stock-overview' },
                { id: 'comparative', label: 'Comparative (Plant vs Depot)', path: '/reports?type=comparative' },
                { id: 'compliance', label: 'Compliance / Expiry', path: '/reports?type=compliance' },
                { id: 'rr-summary', label: 'RR Summary Report', path: '/reports?type=rr-summary' },
            ]
        },
        {
            title: "Rake & Logistics",
            icon: <Truck />,
            color: theme.palette.warning.main,
            gradient: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`,
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
            icon: <Settings />,
            color: theme.palette.secondary.main,
            gradient: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
            description: "System data and diversion tracking",
            roles: ['super_admin', 'technical_admin'],
            reports: [
                { id: 'diversion', label: 'Diversion Report', path: '/reports?type=diversion' },
                { id: 'dms-request', label: 'DMS Order Request Log', path: '/reports?type=dms-request' },
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.05)}, transparent 40%), radial-gradient(circle at bottom left, ${alpha(theme.palette.secondary.main, 0.05)}, transparent 40%)` }}>
            <Box component={motion.div} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} sx={{ mb: 6 }}>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.main', color: 'white', display: 'flex' }}>
                        <BarChart3 size={24} />
                    </Box>
                    <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: -1, background: `linear-gradient(45deg, ${theme.palette.text.primary} 30%, ${theme.palette.text.secondary} 90%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Analytics Central
                    </Typography>
                </Stack>
                <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, fontWeight: 400 }}>
                    Experience real-time intelligence with our curated collection of business reports and logistics tracking tools.
                </Typography>
            </Box>

            {isMonthEnd && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Alert
                        severity="info"
                        icon={<Clock />}
                        sx={{
                            mb: 6,
                            borderRadius: 4,
                            border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
                            bgcolor: alpha(theme.palette.info.main, 0.02),
                            '& .MuiAlert-icon': { color: theme.palette.info.main }
                        }}
                    >
                        <AlertTitle sx={{ fontWeight: 700 }}>Month-End Closing Protocol</AlertTitle>
                        Certain financial registers are temporarily locked to ensure data integrity during reconciliation (Final 3 days).
                    </Alert>
                </motion.div>
            )}

            <Grid container spacing={4} component={motion.div} variants={containerVariants} initial="hidden" animate="visible">
                {filteredCategories.map((cat, idx) => (
                    <Grid item xs={12} key={idx}>
                        <Box sx={{ mb: 2, px: 1 }}>
                            <Typography variant="h5" fontWeight="800" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box sx={{ width: 4, height: 24, borderRadius: 4, bgcolor: cat.color }} />
                                {cat.title}
                            </Typography>
                        </Box>
                        <Grid container spacing={3}>
                            {cat.reports.map((report) => (
                                <Grid item xs={12} sm={6} md={4} key={report.id} component={motion.div} variants={itemVariants}>
                                    <Card
                                        elevation={0}
                                        sx={{
                                            height: '100%',
                                            borderRadius: 4,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            '&:hover': {
                                                transform: 'translateY(-8px)',
                                                boxShadow: `0 20px 40px -20px ${alpha(cat.color, 0.3)}`,
                                                borderColor: alpha(cat.color, 0.5),
                                            }
                                        }}
                                    >
                                        <CardActionArea onClick={() => handleReportClick(report)} sx={{ height: '100%', p: 3 }}>
                                            <Stack spacing={2}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <Box sx={{
                                                        p: 1.5,
                                                        borderRadius: 3,
                                                        background: cat.gradient,
                                                        color: 'white',
                                                        display: 'flex',
                                                        boxShadow: `0 8px 16px -4px ${alpha(cat.color, 0.4)}`
                                                    }}>
                                                        {report.isExternal ? <ExternalLink size={20} /> : <FileText size={20} />}
                                                    </Box>
                                                    {report.hideOnMonthEnd && (
                                                        <Tooltip title="Subject to month-end locking">
                                                            <Chip icon={<ShieldCheck size={14} />} label="Protected" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }} />
                                                        </Tooltip>
                                                    )}
                                                </Box>
                                                <Box>
                                                    <Typography variant="h6" fontWeight="800" sx={{ mb: 0.5 }}>{report.label}</Typography>
                                                    <Typography variant="body2" color="text.secondary">View and export detailed records for {report.id.replace(/-/g, ' ')}</Typography>
                                                </Box>
                                                <Stack direction="row" spacing={1} alignItems="center" sx={{ pt: 1, color: cat.color }}>
                                                    <Typography variant="button" sx={{ fontWeight: 800, fontSize: '0.75rem' }}>Open Explorer</Typography>
                                                    <ChevronRight size={16} strokeWidth={3} />
                                                </Stack>
                                            </Stack>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <Divider sx={{ mt: 6, mb: 4, opacity: 0.5 }} />
                    </Grid>
                ))}
            </Grid>
        </Box>
    );
};

export default ReportsOverview;
