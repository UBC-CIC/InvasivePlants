import { useState, useEffect } from 'react';
import { Alert, Snackbar, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';

const EditRegionsDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    return (
        <div>
            <Dialog open={open} onClose={handleFinishEditingRow}>
                <DialogTitle style={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h5" component="div">
                        {tempData.regionFullName}
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <TextField
                        label="Common Name"
                        value={tempData.regionCode}
                        onChange={(e) => handleSearchInputChange("regionCode", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Country"
                        value={tempData.country}
                        onChange={(e) => handleSearchInputChange("country", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button
                        onClick={() => {
                            handleSave();
                            setShowSaveConfirmation(true);
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={showSaveConfirmation} autoHideDuration={4000} onClose={handleClose}>
                <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
                    Saved successfully!
                </Alert>
            </Snackbar>
        </div>
    );
};

export default EditRegionsDialog;
