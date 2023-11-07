import React, { useState } from "react";
import { Snackbar, Box, Alert, AlertTitle, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import RegionsTestData from "../test_data/regionsTestData";

const AddRegionDialog = ({ open, handleClose, handleAdd, data }) => {
    const initialRegionData = {
        regionFullName: "",
        regionCode: "",
        country: "",
        geographic_coordinates: []
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
                    geographic_coordinates: [
                        field === "geographic_latitude" ? value : regionData.geographic_coordinates[0],
                        field === "geographic_longitude" ? value : regionData.geographic_coordinates[1],
                    ],
                }));
                setErrorMessage("");
            } else {
                setErrorMessage("Please enter a valid number.");
            }
        } else {
            setRegionData((prev) => ({ ...prev, [field]: value }));
            if (field === "country") {
                setSelectedCountry(value);
            }
        }
    };


    const handleConfirmAddRegion = () => {
        const foundRegion = data.find((item) => item.regionFullName.toLowerCase() === regionData.regionFullName.toLowerCase());

        if (regionData.regionFullName.trim() === "") {
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
                <Alert severity="error">
                    <AlertTitle>Empty Field!</AlertTitle>
                    Please enter a <strong>valid region name.</strong>
                    <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
                        <Button
                            onClick={() => setShowAlert(false)}
                            sx={{
                                color: "#241c1a",
                                "&:hover": {
                                    backgroundColor: "#d9b1a7"
                                }
                            }}
                        >OK</Button>
                    </Box>
                </Alert>

            </Dialog>

            <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
                {regionData.regionFullName && (
                    <div>
                        <Alert severity="warning">
                            <AlertTitle>Region already Exists!</AlertTitle>
                            Do you want to <strong>add anyways?</strong>
                            <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setShowWarning(false)}
                                    sx={{
                                        color: "#362502",
                                        "&:hover": {
                                            backgroundColor: "#dbc8a0"
                                        }
                                    }}>Cancel</Button>
                                <Button onClick={() => handleAddRegion()}
                                    sx={{
                                        color: "#362502",
                                        "&:hover": {
                                            backgroundColor: "#dbc8a0"
                                        }
                                    }} autoFocus>
                                    Add
                                </Button>
                            </Box>
                        </Alert>
                    </div>
                )}
            </Dialog>

            <Dialog open={open} onClose={handleCancel}>
                <DialogTitle>Add a New Region</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Region"
                        value={regionData.regionFullName}
                        onChange={(e) => handleInputChange("regionFullName", e.target.value)}
                        sx={{ width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}
                    />
                    <TextField
                        fullWidth
                        label="Region Code"
                        value={regionData.regionCode}
                        onChange={(e) => handleInputChange("regionCode", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />
                    <FormControl fullWidth sx={{ marginBottom: "1rem" }}>
                        <InputLabel id="country-label">Country</InputLabel>
                        <Select
                            labelId="country-label"
                            value={selectedCountry}
                            onChange={(e) => handleInputChange("country", e.target.value)}
                            label="Country"
                        >
                            {Array.from(new Set(RegionsTestData.map((data) => data.country))).map((country, index) => (
                                <MenuItem key={index} value={country}>
                                    {country}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Box sx={{ display: "flex", flexDirection: "row", justifyContent: "space-between" }}>
                        <TextField
                            fullWidth
                            label="Latitude"
                            value={regionData.geographic_coordinates[0]}
                            onChange={(e) => handleInputChange("geographic_latitude", e.target.value)}
                            sx={{ width: "100%", marginRight: "4px" }}
                        />

                        <TextField
                            fullWidth
                            label="Longitude"
                            value={regionData.geographic_coordinates[1]}
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

            <Snackbar open={showOpen} autoHideDuration={5000} onClose={() => setShowOpen(false)}>
                <Alert onClose={() => setShowOpen(false)} severity="success" sx={{ width: '100%' }}>
                    Added successfully!
                </Alert>
            </Snackbar>


        </div>
    );
};

export default AddRegionDialog;
