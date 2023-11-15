import React, { useState } from "react";
import { Snackbar, Box, Alert, AlertTitle, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import RegionsTestData from "../test_data/regionsTestData";
import SnackbarOnSuccess from "../components/SnackbarComponent";
import CustomAlert from "../components/AlertComponent";
import CustomWarning from "../components/WarningComponent";

const AddRegionDialog = ({ open, handleClose, handleAdd, data }) => {
    const initialRegionData = {
        region_fullname: "",
        region_code_name: "",
        country_fullname: "",
        geographic_coordinate: ""
    };

    const [showOpen, setShowOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [regionData, setRegionData] = useState(initialRegionData);
    const [selectedCountry, setSelectedCountry] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleInputChange = (field, value) => {
        // checks that coordinates are of valid format (numbers)
        if (field === "geographic_latitude" || field === "geographic_longitude") {
            if (value === "" || !isNaN(value) || (value[0] === '-' && !isNaN(value.slice(1))) || !isNaN(value.replace(".", ""))) {
                setRegionData((prev) => ({
                    ...prev,
                    geographic_coordinate: [
                        field === "geographic_latitude" ? value : regionData.geographic_coordinate.split(', ')[0],
                        field === "geographic_longitude" ? value : regionData.geographic_coordinate.split(', ')[1],
                    ].join(', '), 
                }));
                setErrorMessage("");
            } else {
                setErrorMessage("Please enter a valid number.");
            }
        } else {
            setRegionData((prev) => ({ ...prev, [field]: value }));
            if (field === "country_fullname") {
                setSelectedCountry(value);
            }
        }
    };


    const handleConfirmAddRegion = () => {
        const foundRegion = data.find((item) => item.region_fullname.toLowerCase() === regionData.region_fullname.toLowerCase());

        if (regionData.region_fullname.trim() === "" || regionData.country_fullname.trim() === "" || regionData.region_code_name.trim() === "") {
            setShowAlert(true);
            return;
        }
        if (foundRegion) {
            setShowWarning(true);
        } else {
            handleAddRegion();
        }
    };

    const handleAddRegion = () => {
        setShowOpen(true);
        handleAdd(regionData);
        handleCancel();
    };

    const handleCloseSnackbar = () => {
        setShowOpen(false)
    }

    const handleCancel = () => {
        setShowWarning(false);
        setShowAlert(false);
        setRegionData(initialRegionData);
        setSelectedCountry("");
        handleClose();
    };



    return (
        <div>
            <Dialog open={showAlert} onClose={() => setShowAlert(false)}>
                <CustomAlert text={"region, region code, and country"} onClose={() => setShowAlert(false)} />
            </Dialog>

            <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
                {regionData.region_fullname && (
                    <div>
                        <CustomWarning
                            data={regionData.region_fullname}
                            onClose={() => setShowWarning(false)}
                            handleAdd={() => handleAddRegion()} />
                    </div>
                )}
            </Dialog>

            <Dialog open={open} onClose={handleCancel}>
                <DialogTitle>Add a New Region</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Region*"
                        value={regionData.region_fullname}
                        onChange={(e) => handleInputChange("region_fullname", e.target.value)}
                        sx={{ width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}
                    />
                    <TextField
                        fullWidth
                        label="Region Code*"
                        value={regionData.region_code_name}
                        onChange={(e) => handleInputChange("region_code_name", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />
                    <FormControl fullWidth sx={{ marginBottom: "1rem" }}>
                        <InputLabel id="country-label">Country*</InputLabel>
                        <Select
                            labelId="country-label"
                            value={selectedCountry}
                            onChange={(e) => handleInputChange("country_fullname", e.target.value)}
                            label="Country*"
                        >
                            {Array.from(new Set(RegionsTestData.map((data) => data.country_fullname))).map((country_fullname, index) => (
                                <MenuItem key={index} value={country_fullname}>
                                    {country_fullname}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                        <TextField
                            fullWidth
                            label="Latitude"
                            value={regionData.geographic_coordinate.split(', ')[0]}
                            onChange={(e) => handleInputChange("geographic_latitude", e.target.value)}
                            sx={{ width: "100%", marginRight: "4px" }}
                        />

                        <TextField
                            fullWidth
                            label="Longitude"
                            value={regionData.geographic_coordinate.split(', ')[1]}
                            onChange={(e) => handleInputChange("geographic_longitude", e.target.value)}
                            sx={{ width: "100%", marginLeft: "4px" }}
                        />
                    </Box>
                    {errorMessage && (
                        <Box sx={{ color: "red", fontSize: "0.8rem" }}>
                            {errorMessage}
                        </Box>
                    )}

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleConfirmAddRegion}>Submit</Button>
                </DialogActions>
            </Dialog >

            <SnackbarOnSuccess open={showOpen} onClose={handleCloseSnackbar} text={"Added successfully!"} />

        </div>
    );
};

export default AddRegionDialog;
