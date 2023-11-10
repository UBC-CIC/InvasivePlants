import React, { useState } from "react";
import { Autocomplete, Tooltip, alpha, Snackbar, Alert, AlertTitle, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import RegionsTestData from "../test_data/regionsTestData";
import AddAlternativeSpeciesDialog from "./AddAlternativeSpeciesDialog";
import AlternativeSpeciesTestData from "../test_data/alternativeSpeciesTestData";
import SearchIcon from '@mui/icons-material/Search';
import SnackbarOnSuccess from "../components/SnackbarComponent";
import CustomAlert from "../components/AlertComponent";
import CustomWarning from '../components/WarningComponent';


const AddInvasiveSpeciesDialog = ({ open, handleClose, handleAdd, data }) => {
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


    const handleCloseSnackbar = () => {
        setShowOpen(false)
    }
    return (
        <div>
            <Dialog open={showAlert} onClose={() => setShowAlert(false)}>
                <CustomAlert onClose={() => setShowAlert(false)} />
            </Dialog>

            <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
                {speciesData.scientificName && (
                    <div>
                        <CustomWarning
                            data={speciesData.scientificName}
                            onClose={() => setShowWarning(false)}
                            handleAdd={() => handleAddSpecies()} />
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

            {/* <Snackbar open={showOpen} autoHideDuration={4000} onClose={() => setShowOpen(false)}>
                <Alert onClose={() => setShowOpen(false)} severity="success" sx={{ width: '100%' }}>
                    Added successfully!
                </Alert>
            </Snackbar> */}
            <SnackbarOnSuccess open={showOpen} onClose={handleCloseSnackbar} text={"Added successfully!"} />

            {/* <SavedSnackbar open={showOpen} onClose={setShowOpen(false)} text={"Added successfully!"} /> */}


        </div >
    );
};

export default AddInvasiveSpeciesDialog;