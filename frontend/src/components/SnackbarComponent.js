import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

// Snackbar indicating success
const SnackbarOnSuccess = ({ open, onClose, text }) => {
    return (
        <Snackbar open={open} autoHideDuration={5000} onClose={onClose}>
            <MuiAlert onClose={onClose} severity="success" sx={{ width: '100%' }}>
                {text}
            </MuiAlert>
        </Snackbar>
    );
};

export default SnackbarOnSuccess;
