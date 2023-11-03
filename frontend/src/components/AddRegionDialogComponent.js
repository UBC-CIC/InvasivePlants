import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

const AddRegionDialog = ({ open, handleClose, handleAdd }) => {
    const [regionData, setRegionData] = useState({
        regionFullName: "",
        regionCode: "",
        country: ""
    });

    const handleInputChange = (field, value) => {
        setRegionData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddRegion = () => {
        handleAdd(regionData);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Add a New Region</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Region"
                    value={regionData.regionFullName}
                    onChange={(e) => handleInputChange("regionFullName", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
                <TextField
                    fullWidth
                    label="Region Code"
                    value={regionData.regionCode}
                    onChange={(e) => handleInputChange("commonName", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
                <TextField
                    fullWidth
                    label="Country"
                    value={regionData.country}
                    onChange={(e) => handleInputChange("country", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleAddRegion}>Submit</Button>
            </DialogActions>
        </Dialog >
    );
};

export default AddRegionDialog;
