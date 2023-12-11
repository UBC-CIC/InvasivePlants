import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

// Error alert when there exists missing fields
const CustomAlert = ({ text, onClose }) => {
    return (
        <Alert severity="error">
            <AlertTitle>Empty Field!</AlertTitle>
            Please enter a <strong>valid {text}.</strong>
            <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
                <Button
                    onClick={onClose}
                    sx={{
                        color: "#241c1a",
                        "&:hover": {
                            backgroundColor: "#d9b1a7"
                        }
                    }}
                >
                    OK
                </Button>
            </Box>
        </Alert>
    );
};

export default CustomAlert;
