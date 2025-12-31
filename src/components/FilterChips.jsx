import React from 'react';
import { Box, Chip, Typography, Stack, alpha, useTheme, Button } from '@mui/material';
import { X, FilterX } from 'lucide-react';

const FilterChips = ({ filters, config, onRemove, onClearAll }) => {
    const theme = useTheme();

    // Helper to find label for a value in config options
    const getOptionLabel = (fieldId, value) => {
        for (const section of config) {
            const field = section.fields.find(f => f.id === fieldId);
            if (field && field.options) {
                const option = field.options.find(o => o.value === value);
                return option ? option.label : value;
            }
            if (field) return value; // No options, just return value (date, text, etc.)
        }
        return value;
    };

    // Helper to find field label
    const getFieldLabel = (fieldId) => {
        for (const section of config) {
            const field = section.fields.find(f => f.id === fieldId);
            if (field) return field.label;
        }
        return fieldId;
    };

    const activeFilters = Object.entries(filters).filter(([key, value]) => {
        if (value === null || value === undefined || value === '') return false;
        if (Array.isArray(value) && value.length === 0) return false;
        return true;
    });

    if (activeFilters.length === 0) return null;

    return (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mr: 1, textTransform: 'uppercase' }}>
                Active Filters:
            </Typography>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {activeFilters.map(([key, value]) => {
                    const fieldLabel = getFieldLabel(key);

                    if (Array.isArray(value)) {
                        return value.map((val, idx) => (
                            <Chip
                                key={`${key}-${idx}`}
                                label={`${fieldLabel}: ${getOptionLabel(key, val)}`}
                                onDelete={() => onRemove(key, val)}
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{
                                    borderRadius: '6px',
                                    bgcolor: alpha(theme.palette.primary.main, 0.05),
                                    fontWeight: 500
                                }}
                            />
                        ));
                    }

                    return (
                        <Chip
                            key={key}
                            label={`${fieldLabel}: ${getOptionLabel(key, value)}`}
                            onDelete={() => onRemove(key)}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{
                                borderRadius: '6px',
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                fontWeight: 500
                            }}
                        />
                    );
                })}

                <Button
                    size="small"
                    variant="text"
                    color="error"
                    startIcon={<FilterX size={14} />}
                    onClick={onClearAll}
                    sx={{ fontSize: '0.75rem', ml: 1 }}
                >
                    Clear All
                </Button>
            </Stack>
        </Box>
    );
};

export default FilterChips;
