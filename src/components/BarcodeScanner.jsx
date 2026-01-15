import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Box, Typography } from '@mui/material';

const BarcodeScanner = ({ onScanSuccess, onScanError, fps = 10, qrbox = 250, aspectRatio = 1.0 }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const config = {
            fps,
            qrbox,
            aspectRatio,
            // You can add more configurations here
        };

        const scanner = new Html5QrcodeScanner(
            "qr-reader",
            config,
      /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanError);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [onScanSuccess, onScanError, fps, qrbox, aspectRatio]);

    return (
        <Box sx={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <div id="qr-reader" style={{ width: '100%' }}></div>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
                Align the barcode/QR code within the frame to scan
            </Typography>
        </Box>
    );
};

export default BarcodeScanner;
