import React from 'react';
import { Paper, Typography, Button, Box, useTheme, Zoom, Stack, alpha } from '@mui/material';
import { Check, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BulkActionBar = ({ count, onApprove, onReject, loading }) => {
    const theme = useTheme();

    return (
        <AnimatePresence>
            {count > 0 && (
                <Box
                    component={motion.div}
                    initial={{ y: 100, opacity: 0, x: '-50%' }}
                    animate={{ y: 0, opacity: 1, x: '-50%' }}
                    exit={{ y: 100, opacity: 0, x: '-50%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        left: '50%',
                        zIndex: 1100,
                        width: 'auto',
                        minWidth: 400,
                    }}
                >
                    <Paper
                        elevation={10}
                        sx={{
                            p: 1.5,
                            pl: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderRadius: '100px',
                            backgroundColor: alpha(theme.palette.background.paper, 0.95),
                            backdropFilter: 'blur(8px)',
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                            boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.2)}`,
                        }}
                    >
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: 36,
                                    height: 36,
                                    borderRadius: '50%',
                                    backgroundColor: theme.palette.primary.main,
                                    color: 'white',
                                }}
                            >
                                <Typography variant="body2" fontWeight="bold">
                                    {count}
                                </Typography>
                            </Box>
                            <Typography variant="body1" fontWeight="600" color="text.primary">
                                {count === 1 ? 'Item selected' : 'Items selected'}
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={1.5} sx={{ ml: 4 }}>
                            <Button
                                variant="contained"
                                color="success"
                                disabled={loading}
                                onClick={onApprove}
                                startIcon={<Check size={18} />}
                                sx={{
                                    borderRadius: '100px',
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: theme.shadows[4],
                                        backgroundColor: theme.palette.success.dark,
                                    },
                                }}
                            >
                                Approve All
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                disabled={loading}
                                onClick={onReject}
                                startIcon={<X size={18} />}
                                sx={{
                                    borderRadius: '100px',
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    boxShadow: 'none',
                                    '&:hover': {
                                        boxShadow: theme.shadows[4],
                                        backgroundColor: theme.palette.error.dark,
                                    },
                                }}
                            >
                                Reject All
                            </Button>
                        </Stack>
                    </Paper>
                </Box>
            )}
        </AnimatePresence>
    );
};

export default BulkActionBar;
