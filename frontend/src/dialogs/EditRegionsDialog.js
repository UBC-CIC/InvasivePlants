import { useState, useEffect } from 'react';
import { Box, Alert, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';

const EditRegionsDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    const [showAlert, setShowAlert] = useState(false);
    const handleConfirmRegion = () => {
        if (!tempData.regionFullName || tempData.regionFullName.trim() === "") {
            setShowAlert(true);
            return false;
        }
        setShowSaveConfirmation(true);
        return true;
    };

    return (
        <div>
            <Dialog open={open} onClose={handleFinishEditingRow}>
                <DialogTitle style={{ display: "flex", alignItems: "center", backgroundColor: "#c8dbe6", height: "60px" }}>
                    <Typography variant="h5" component="div">
                        {tempData.regionFullName}
                    </Typography>
                </DialogTitle>

                <DialogContent>

                    <TextField
                        label="Region"
                        value={tempData.regionFullName}
                        onChange={(e) => handleSearchInputChange("regionFullName", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Region Code"
                        value={tempData.regionCode}
                        onChange={(e) => handleSearchInputChange("regionCode", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Country"
                        value={tempData.country}
                        onChange={(e) => handleSearchInputChange("country", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />
                    {tempData.geographic_coordinates && (
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                value={tempData.geographic_coordinates[0]}
                                onChange={(e) => handleSearchInputChange("geographic_latitude", e.target.value)}
                                sx={{ width: "100%", marginRight: "4px" }}
                            />

                            <TextField
                                fullWidth
                                label="Longitude"
                                value={tempData.geographic_coordinates[1]}
                                onChange={(e) => handleSearchInputChange("geographic_longitude", e.target.value)}
                                sx={{ width: "100%", marginLeft: "4px" }}
                            />
                        </Box>
                    )}
                </DialogContent>

                <DialogActions >
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button
                        onClick={() => {
                            // handleSave();
                            // setShowSaveConfirmation(true);
                            handleSave(handleConfirmRegion());

                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                <CustomAlert onClose={() => setShowAlert(false)} />
            </Dialog>

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />

        </div>
    );
};

export default EditRegionsDialog;
