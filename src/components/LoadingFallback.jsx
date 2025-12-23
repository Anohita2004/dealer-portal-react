import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { motion } from "framer-motion";

export default function LoadingFallback() {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100vh",
                width: "100%",
                bgcolor: "background.default",
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
            >
                <CircularProgress size={60} thickness={4} color="primary" />
            </motion.div>
            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mt: 2, fontWeight: 500 }}
            >
                Loading Portal...
            </Typography>
        </Box>
    );
}
