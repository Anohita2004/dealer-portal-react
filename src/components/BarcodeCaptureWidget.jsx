import React, { useState } from 'react';
import {
    Box,
    Fab,
    Drawer,
    Typography,
    IconButton,
    TextField,
    Button,
    List,
    ListItem,
    ListItemText,
    Divider,
    Paper,
    Tooltip,
    Badge
} from '@mui/material';
import {
    ScanBarcode,
    X,
    History,
    Plus,
    Camera,
    Keyboard
} from 'lucide-react';
import BarcodeScanner from './BarcodeScanner';
import { barcodeAPI } from '../services/api';
import { toast } from 'react-toastify';

const BarcodeCaptureWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState('manual'); // 'manual' or 'camera'
    const [manualCode, setManualCode] = useState('');
    const [scannedLogs, setScannedLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    const toggleWidget = () => setIsOpen(!isOpen);

    const handleManualSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!manualCode.trim()) return;

        await processBarcode(manualCode.trim());
        setManualCode('');
    };

    const onScanSuccess = async (decodedText) => {
        // To avoid multiple scans of the same code quickly
        if (scannedLogs.length > 0 && scannedLogs[0].code === decodedText) {
            return;
        }
        await processBarcode(decodedText);
    };

    const processBarcode = async (code) => {
        setLoading(true);
        try {
            const response = await barcodeAPI.scan(code);
            const newLog = {
                id: Date.now(),
                code,
                timestamp: new Date().toLocaleTimeString(),
                status: 'success'
            };
            setScannedLogs(prev => [newLog, ...prev].slice(0, 10));
            toast.success(`Barcode ${code} captured!`);
        } catch (err) {
            console.error(err);
            toast.error(`Failed to store barcode ${code}`);
            const errorLog = {
                id: Date.now(),
                code,
                timestamp: new Date().toLocaleTimeString(),
                status: 'error'
            };
            setScannedLogs(prev => [errorLog, ...prev].slice(0, 10));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Tooltip title="Barcode Scanner" placement="left">
                <Fab
                    color="primary"
                    aria-label="scan"
                    onClick={toggleWidget}
                    sx={{
                        position: 'fixed',
                        bottom: 24,
                        right: 24,
                        zIndex: 1201,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}
                >
                    <Badge badgeContent={scannedLogs.length} color="error" overlap="circular">
                        <ScanBarcode size={24} />
                    </Badge>
                </Fab>
            </Tooltip>

            <Drawer
                anchor="right"
                open={isOpen}
                onClose={toggleWidget}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 400 }, p: 0 }
                }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', h: '100%', height: '100vh' }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScanBarcode size={20} />
                            <Typography variant="h6">Barcode Capture</Typography>
                        </Box>
                        <IconButton onClick={toggleWidget} sx={{ color: 'white' }}>
                            <X size={20} />
                        </IconButton>
                    </Box>

                    <Box sx={{ p: 2, display: 'flex', gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Button
                            variant={mode === 'manual' ? 'contained' : 'outlined'}
                            fullWidth
                            size="small"
                            onClick={() => setMode('manual')}
                            startIcon={<Keyboard size={16} />}
                        >
                            Manual
                        </Button>
                        <Button
                            variant={mode === 'camera' ? 'contained' : 'outlined'}
                            fullWidth
                            size="small"
                            onClick={() => setMode('camera')}
                            startIcon={<Camera size={16} />}
                        >
                            Camera
                        </Button>
                    </Box>

                    <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                        {mode === 'manual' ? (
                            <Box component="form" onSubmit={handleManualSubmit}>
                                <Typography variant="subtitle2" gutterBottom>Manual Entry</Typography>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        placeholder="Enter barcode..."
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value)}
                                        autoFocus
                                    />
                                    <IconButton color="primary" type="submit" disabled={!manualCode.trim() || loading}>
                                        <Plus size={20} />
                                    </IconButton>
                                </Box>
                            </Box>
                        ) : (
                            <Box>
                                <Typography variant="subtitle2" gutterBottom>Camera Scanner</Typography>
                                <Paper variant="outlined" sx={{ overflow: 'hidden', mb: 2 }}>
                                    <BarcodeScanner onScanSuccess={onScanSuccess} />
                                </Paper>
                            </Box>
                        )}

                        <Divider sx={{ my: 3 }} />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <History size={16} className="text-muted" />
                            <Typography variant="subtitle2">Recent Scans</Typography>
                        </Box>

                        <List dense>
                            {scannedLogs.length > 0 ? (
                                scannedLogs.map((log) => (
                                    <ListItem key={log.id} sx={{
                                        borderBottom: '1px solid #f0f0f0',
                                        bgcolor: log.status === 'error' ? 'rgba(211, 47, 47, 0.05)' : 'transparent'
                                    }}>
                                        <ListItemText
                                            primary={log.code}
                                            secondary={log.timestamp}
                                        />
                                        <Typography
                                            variant="caption"
                                            color={log.status === 'error' ? 'error' : 'success.main'}
                                        >
                                            {log.status === 'error' ? 'Failed' : 'Captured'}
                                        </Typography>
                                    </ListItem>
                                ))
                            ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', mt: 2 }}>
                                    No recent scans
                                </Typography>
                            )}
                        </List>
                    </Box>

                    <Box sx={{ p: 2, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider' }}>
                        <Button variant="outlined" fullWidth onClick={() => setScannedLogs([])}>
                            Clear History
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </>
    );
};

export default BarcodeCaptureWidget;
