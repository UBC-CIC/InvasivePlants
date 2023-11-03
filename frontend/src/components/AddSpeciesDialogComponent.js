import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";

const AddSpeciesDialog = ({ open, handleClose, handleAdd }) => {
    const [speciesData, setSpeciesData] = useState({
        scientificName: "",
        commonName: "",
        links: "",
        description: "",
        alternatives: "",
        location: "",
    });

    const handleInputChange = (field, value) => {
        setSpeciesData((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddSpecies = () => {
        handleAdd(speciesData);
        handleClose();
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Add a New Species</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Scientific Name"
                    value={speciesData.scientificName}
                    onChange={(e) => handleInputChange("scientificName", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
                <TextField
                    fullWidth
                    label="Common Name (separate with commas)"
                    value={speciesData.commonName}
                    onChange={(e) => handleInputChange("commonName", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
                <TextField
                    fullWidth
                    label="Links (separate with commas)"
                    value={speciesData.links}
                    onChange={(e) => handleInputChange("links", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
                <TextField
                    fullWidth
                    label="Description"
                    multiline
                    minRows={3}
                    value={speciesData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
                {/* TODO: need button to add alternative species */}
                <TextField
                    fullWidth
                    label="Alternatives"
                    value={speciesData.alternatives}
                    onChange={(e) => handleInputChange("alternatives", e.target.value)}
                    sx={{ width: "100%", marginBottom: "1rem" }}
                />
                {/* TODO: select by existing regions */}
                <TextField
                    fullWidth
                    label="Region"
                    value={speciesData.location}
                    onChange={(e) => handleInputChange("region", e.target.value)}
                    sx={{ width: "100%" }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button onClick={handleAddSpecies}>Submit</Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddSpeciesDialog;
