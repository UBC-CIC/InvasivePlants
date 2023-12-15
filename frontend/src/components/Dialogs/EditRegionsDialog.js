import { useState } from 'react';
import { Box, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import SnackbarOnSuccess from '../SnackbarComponent';
import CustomAlert from '../AlertComponent';

// Dialog for editing a region
const EditRegionDialog = ({ open, tempData, handleInputChange, handleFinishEditingRow, handleSave }) => {
    const [showAlert, setShowAlert] = useState(false);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    // Closes save confirmation on clickaway
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    // Ensures all required fields are present before editing region
    const handleConfirmEditRegion = () => {
        if (tempData.region_fullname.trim() === "" ||
            tempData.region_code_name.trim() === "" ||
            tempData.country_fullname.trim() === "") {
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
                        {tempData.region_fullname}
                    </Typography>
                </DialogTitle>

                <DialogContent>

                    <TextField
                        label="Region*"
                        value={tempData.region_fullname}
                        onChange={(e) => handleInputChange("region_fullname", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Region Code*"
                        value={tempData.region_code_name}
                        onChange={(e) => handleInputChange("region_code_name", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Country*"
                        value={tempData.country_fullname}
                        onChange={(e) => handleInputChange("country_fullname", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    {/* conditional check if coordinates are null or not */}
                    {tempData.geographic_coordinate ? (
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                value={tempData.geographic_coordinate.split(',')[0]}
                                onChange={(e) => handleInputChange("geographic_latitude", e.target.value)}
                                sx={{ width: "100%", marginRight: "4px" }}
                            />
                            <TextField
                                fullWidth
                                label="Longitude"
                                value={tempData.geographic_coordinate.split(',')[1]}
                                onChange={(e) => handleInputChange("geographic_longitude", e.target.value)}
                                sx={{ width: "100%", marginLeft: "4px" }}
                            />
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                onChange={(e) => handleInputChange("geographic_latitude", e.target.value)}
                                sx={{ width: "100%", marginRight: "4px" }}
                            />
                            <TextField
                                fullWidth
                                label="Longitude"
                                onChange={(e) => handleInputChange("geographic_longitude", e.target.value)}
                                sx={{ width: "100%", marginLeft: "4px" }}
                            />
                        </Box>
                    )}
                </DialogContent>

                <DialogActions >
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button onClick={() => { handleSave(handleConfirmEditRegion()); }}>
                        Save
                    </Button>
                </DialogActions>

            </Dialog>

            <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                <CustomAlert text={"region, region code, and country"} onClose={() => setShowAlert(false)} />
            </Dialog>

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />

        </div>
    );
};

export default EditRegionDialog;
