import React, { useState } from "react";
import { Autocomplete, Tooltip, alpha, Snackbar, Alert, AlertTitle, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import RegionsTestData from "../test_data/regionsTestData";
import AddAlternativeSpeciesDialog from "./AddAlternativeSpeciesDialogComponent";
import AlternativeSpeciesTestData from "../test_data/alternativeSpeciesTestData";
import SearchIcon from '@mui/icons-material/Search';
import SavedSnackbar from "./SaveSnackBar";

const AddSpeciesDialog = ({ open, handleClose, handleAdd, data }) => {
    const initialSpeciesData = {
        scientificName: "",
        commonName: [],
        links: [],
        description: "",
        alternatives: [],
        location: []
    };
    const [alternativeSpeciesAutocompleteOpen, setAlternativeAutocompleteOpen] = useState(false);
    const [showOpen, setShowOpen] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [speciesData, setSpeciesData] = useState(initialSpeciesData);
    const [alternativeDialog, setOpenAddAlternativeDialog] = useState(false);
    const [alternativeSpeciesTestData, setAlternativeSpeciesTestData] = useState(AlternativeSpeciesTestData);

    const handleInputChange = (field, value) => {
        if (field === "regionCode") {
            setSpeciesData((prev) => ({ ...prev, location: value }));
        } else {
            setSpeciesData((prev) => ({ ...prev, [field]: value }));
        }
    };

    const handleConfirmAddSpecies = () => {
        const foundSpecies = data.find((item) => item.scientificName.toLowerCase() === speciesData.scientificName.toLowerCase());

        if (speciesData.scientificName.trim() === "") {
            setShowAlert(true);
            return;
        }
        if (foundSpecies) {
            setShowWarning(true);
        } else {
            handleAddSpecies();
        }
    };

    const handleAddSpecies = () => {
        setOpenAddAlternativeDialog(false);
        setShowOpen(true);
        const modifiedSpeciesData = {
            ...speciesData,
            commonName: speciesData.commonName,
            links: speciesData.links,
            alternatives: speciesData.alternatives,
            location: speciesData.location
        };
        handleAdd(modifiedSpeciesData);
        handleCancel();
    };

    const handleCancel = () => {
        setShowWarning(false);
        setShowAlert(false);
        setSpeciesData(initialSpeciesData);
        handleClose();
    };


    const handleAddAlternativeSpecies = (newAlternativeSpeciesData) => {
        // Generate a unique regionId for the new alternative species
        const newAltSpeciesId = alternativeSpeciesTestData.length + 1;

        // Create a new region object with the generated regionId
        const newAlternativeSpecies = {
            regionId: newAltSpeciesId,
            ...newAlternativeSpeciesData,
        };

        setAlternativeSpeciesTestData([...alternativeSpeciesTestData, newAlternativeSpecies]);
        setOpenAddAlternativeDialog(false);

    // TODO: update the alternative table database with the new entry
    }

    const handleCloseAlt = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpenAddAlternativeDialog(false);
    };

    return (
        <div>
            <Dialog open={showAlert} onClose={() => setShowAlert(false)}>
                <Alert severity="error">
                    <AlertTitle>Empty Field!</AlertTitle>
                    Please enter a <strong>valid scientific name.</strong>
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
                {speciesData.scientificName && (
                    <div>
                        <Alert severity="warning">
                            <AlertTitle><strong>{speciesData.scientificName}</strong> already exists!</AlertTitle>
                            Do you want to <strong>add anyways?</strong>
                            <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
                                <Button onClick={() => setShowWarning(false)}
                                    sx={{
                                        color: "#362502",
                                        "&:hover": {
                                            backgroundColor: "#dbc8a0"
                                        }
                                    }}>Cancel</Button>

                                <Button
                                    onClick={() => {
                                        handleAddSpecies();
                                    }}
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
                <DialogTitle>Add a New Species</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Scientific Name"
                        value={speciesData.scientificName}
                        onChange={(e) => handleInputChange("scientificName", e.target.value)}
                        sx={{ width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}
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
                        label="Description"
                        multiline
                        minRows={3}
                        value={speciesData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    {/* TODO: need button to add alternative species and dropdown to select from alternative*/}
                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: "1rem" }}>                
                        <Autocomplete
                            multiple
                            id="alternative-species-autocomplete"
                            options={alternativeSpeciesTestData}
                            getOptionLabel={(option) =>
                                `${option.alternativeScientificName} (${option.alternativeCommonName ? option.alternativeCommonName.join(', ') : ''})`
                            }
                            value={
                                Array.isArray(speciesData.alternatives)
                                    ? speciesData.alternatives
                                    : []
                            }
                            onChange={(event, values) =>
                                handleInputChange("alternatives", values)
                            }
                            open={alternativeSpeciesAutocompleteOpen}
                            onFocus={() => setAlternativeAutocompleteOpen(true)}
                            onBlur={() => setAlternativeAutocompleteOpen(false)}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label={<div style={{ display: 'flex', alignItems: 'center' }}>
                                        <SearchIcon sx={{ marginRight: '0.5rem' }} />
                                        Alternative Species (multiselect)
                                    </div>
                                    }
                                    multiline
                                    sx={{ width: "100%", marginBottom: "1rem" }}
                                />
                            )}
                            sx={{ flex: 5, marginRight: '1rem', height: '100%', width: "100%" }}
                        />
                        <Tooltip title="Alternative species not in list?" placement="top">
                        <Button
                            variant="contained"
                            onClick={() => setOpenAddAlternativeDialog(true)}
                            sx={{
                                flex: 1, fontSize: "0.8rem",
                                backgroundColor: alpha('#699cb8', 0.9),
                                '&:hover': {
                                    backgroundColor: '#5e8da6',
                                },
                            }}
                        >
                            Add alternative
                        </Button>
                        </Tooltip>

                    </Box>

                    <TextField
                        fullWidth
                        label="Resource links (separate with commas)"
                        value={speciesData.links}
                        onChange={(e) => handleInputChange("links", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />
                    
                    <FormControl fullWidth sx={{ marginBottom: "1rem" }}>
                        <InputLabel id="region-label">Region (multiselect)</InputLabel>
                        <Select
                            labelId="region-label"
                            multiple
                            value={speciesData.location}
                            onChange={(e) => handleInputChange("regionCode", e.target.value)}
                            label="Region (multiselect)"
                            renderValue={(selected) => selected.join(", ")}
                        >
                            {RegionsTestData.map((item) => (
                                <MenuItem key={item.regionCode} value={item.regionCode}>
                                    {item.regionCode}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancel}>Cancel</Button>
                    <Button onClick={handleConfirmAddSpecies}>Submit</Button>
                </DialogActions>
            </Dialog>

            <AddAlternativeSpeciesDialog
                open={alternativeDialog}
                handleClose={handleCloseAlt}
                data={alternativeSpeciesTestData}
                handleAdd={handleAddAlternativeSpecies}
            />


            <SavedSnackbar open={showOpen} onClose={setShowOpen(false)} text={"Added successfully!"} />


        </div >
    );
};                  

export default AddSpeciesDialog;