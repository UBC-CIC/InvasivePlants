import { useState } from 'react';
import { Box, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';

// dialog for editing a region
const EditRegionDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    const [showAlert, setShowAlert] = useState(false);
    const handleConfirmRegion = () => {
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
                        onChange={(e) => handleSearchInputChange("region_fullname", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Region Code*"
                        value={tempData.region_code_name}
                        onChange={(e) => handleSearchInputChange("region_code_name", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Country*"
                        value={tempData.country_fullname}
                        onChange={(e) => handleSearchInputChange("country_fullname", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    {/* conditional check if there are coordinates or not */}
                    {tempData.geographic_coordinate ? (
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                value={tempData.geographic_coordinate.split(',')[0]}
                                onChange={(e) => handleSearchInputChange("geographic_latitude", e.target.value)}
                                sx={{ width: "100%", marginRight: "4px" }}
                            />
                            <TextField
                                fullWidth
                                label="Longitude"
                                value={tempData.geographic_coordinate.split(',')[1]}
                                onChange={(e) => handleSearchInputChange("geographic_longitude", e.target.value)}
                                sx={{ width: "100%", marginLeft: "4px" }}
                            />
                        </Box>
                    ) : (
                        <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                            <TextField
                                fullWidth
                                label="Latitude"
                                onChange={(e) => handleSearchInputChange("geographic_latitude", e.target.value)}
                                sx={{ width: "100%", marginRight: "4px" }}
                            />
                            <TextField
                                fullWidth
                                label="Longitude"
                                onChange={(e) => handleSearchInputChange("geographic_longitude", e.target.value)}
                                sx={{ width: "100%", marginLeft: "4px" }}
                            />
                        </Box>
                    )}

                </DialogContent>

                <DialogActions >
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button onClick={() => { handleSave(handleConfirmRegion()); }}>
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
