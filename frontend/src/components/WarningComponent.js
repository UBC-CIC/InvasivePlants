import React from 'react';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

// Warning alert when user tries to add a species/region with existing scientific name / region full name
const CustomWarning = ({ data, onClose, handleAdd }) => {
    return (
        <Alert severity="warning">
            <AlertTitle><strong>{data}</strong> already exists!</AlertTitle>
            Do you want to <strong>add anyways?</strong>
            <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
                <Button onClick={onClose}
                    sx={{
                        color: "#362502",
                        "&:hover": {
                            backgroundColor: "#dbc8a0"
                        }
                    }}>Cancel</Button>
                <Button onClick={handleAdd}
                    sx={{
                        color: "#362502",
                        "&:hover": {
                            backgroundColor: "#dbc8a0"
                        }
                    }}
                    autoFocus>
                    Add
                </Button>
            </Box>
        </Alert>
    );
};

export default CustomWarning;
