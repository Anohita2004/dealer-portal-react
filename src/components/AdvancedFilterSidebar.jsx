import React, { useState } from 'react';
import {
    Drawer,
    Box,
    Typography,
    IconButton,
    Button,
    Divider,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    Stack,
    alpha,
    useTheme
} from '@mui/material';
import { X, ChevronDown, Filter, RotateCcw } from 'lucide-react';

/**
 * config: [
 *   {
 *     category: string,
 *     fields: [
 *       { id: string, label: string, type: 'text' | 'select' | 'multi-select' | 'date' | 'number', options?: [] }
 *     ]
 *   }
 * ]
 */
const AdvancedFilterSidebar = ({
    open,
    onClose,
    filters,
    onChange,
    onClear,
    onApply,
    config = []
}) => {
    const theme = useTheme();

    const handleFieldChange = (id, value) => {
        onChange?.({ ...filters, [id]: value });
    };

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: { xs: '100%', sm: 400 }, borderLeft: 'none' }
            }}
        >
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Header */}
                <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Filter size={20} color={theme.palette.primary.main} />
                        <Typography variant="h6" fontWeight="bold">Filters</Typography>
                    </Stack>
                    <IconButton onClick={onClose} size="small">
                        <X size={20} />
                    </IconButton>
                </Box>

                <Divider />

                {/* Filter Content */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1 }}>
                    {config.map((section, idx) => (
                        <Accordion
                            key={idx}
                            defaultExpanded
                            disableGutters
                            elevation={0}
                            sx={{
                                '&:before': { display: 'none' },
                                borderBottom: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                                <Typography variant="subtitle2" fontWeight="600" color="text.secondary">
                                    {section.category}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ pt: 0, pb: 3, px: 2 }}>
                                <Stack spacing={2.5}>
                                    {section.fields.map((field) => (
                                        <Box key={field.id}>
                                            {field.type === 'text' && (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    label={field.label}
                                                    value={filters[field.id] || ''}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                />
                                            )}

                                            {field.type === 'select' && (
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>{field.label}</InputLabel>
                                                    <Select
                                                        label={field.label}
                                                        value={filters[field.id] || ''}
                                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    >
                                                        <MenuItem value=""><em>None</em></MenuItem>
                                                        {field.options?.map((opt) => (
                                                            <MenuItem key={opt.value} value={opt.value}>
                                                                {opt.label}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}

                                            {field.type === 'multi-select' && (
                                                <FormControl fullWidth size="small">
                                                    <InputLabel>{field.label}</InputLabel>
                                                    <Select
                                                        multiple
                                                        label={field.label}
                                                        value={filters[field.id] || []}
                                                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                        input={<OutlinedInput label={field.label} />}
                                                        renderValue={(selected) => {
                                                            if (!selected || selected.length === 0) return <em>All</em>;
                                                            return field.options
                                                                ?.filter(opt => selected.includes(opt.value))
                                                                .map(opt => opt.label)
                                                                .join(', ');
                                                        }}
                                                    >
                                                        {field.options?.map((opt) => (
                                                            <MenuItem key={opt.value} value={opt.value}>
                                                                <Checkbox checked={(filters[field.id] || []).indexOf(opt.value) > -1} size="small" />
                                                                <ListItemText primary={opt.label} primaryTypographyProps={{ variant: 'body2' }} />
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}

                                            {(field.type === 'date' || field.type === 'number') && (
                                                <TextField
                                                    fullWidth
                                                    size="small"
                                                    type={field.type}
                                                    label={field.label}
                                                    value={filters[field.id] || ''}
                                                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                                    InputLabelProps={{ shrink: true }}
                                                />
                                            )}
                                        </Box>
                                    ))}
                                </Stack>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>

                {/* Footer Actions */}
                <Divider />
                <Box sx={{ p: 3, bgcolor: alpha(theme.palette.background.default, 0.5) }}>
                    <Stack direction="row" spacing={2}>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="inherit"
                            startIcon={<RotateCcw size={16} />}
                            onClick={onClear}
                            sx={{ borderColor: theme.palette.divider }}
                        >
                            Reset
                        </Button>
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={() => {
                                onApply?.();
                                onClose?.();
                            }}
                        >
                            Apply Filters
                        </Button>
                    </Stack>
                </Box>
            </Box>
        </Drawer>
    );
};

export default AdvancedFilterSidebar;
