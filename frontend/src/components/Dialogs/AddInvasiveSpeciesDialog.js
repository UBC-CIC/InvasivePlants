import React, { useState, useEffect } from "react";
import {
    Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
    Select, MenuItem, FormControl, InputLabel
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SnackbarOnSuccess from "../SnackbarComponent";
import CustomAlert from "../AlertComponent";
import CustomWarning from '../WarningComponent';
import handleGetRegions from "../../functions/RegionMap";

// Dialog for adding an invasive species
const AddInvasiveSpeciesDialog = ({ open, handleClose, handleAdd, data, alternativeSpeciesData }) => {
    const initialSpeciesData = {
        scientific_name: [],
        resource_links: [],
        species_description: "",
        alternative_species: [],
        region_id: []
    };
    const [alternativeSpeciesAutocompleteOpen, setAlternativeAutocompleteOpen] = useState(false);
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [speciesData, setSpeciesData] = useState(initialSpeciesData);
    const [regionMap, setRegionsMap] = useState({});

    // Fetches regions
    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const regions = await handleGetRegions();
                setRegionsMap(regions);
            } catch (error) {
                console.error('Error fetching region map from add invasive species dialog:', error);
            }
        };
        fetchRegionData();
    }, []);

    const handleInputChange = (field, value) => {
        if (field === "region_code_name") {
            setSpeciesData((prev) => ({ ...prev, region_id: value }));
        } else {
            setSpeciesData((prev) => ({ ...prev, [field]: value }));
        }
    };

    // Confirms all fields are present before adding, otherwise shows alerts
    const handleConfirmAddSpecies = () => {
        if (!speciesData.scientific_name || speciesData.scientific_name.length === 0 ||
            !speciesData.region_id || speciesData.region_id.length === 0) {
            setShowAlert(true);
            return;
        }

        const foundSpecies = data.some((item) =>
            Array.isArray(item.scientific_name)
                ? item.scientific_name.some(
                    (name) => speciesData.scientific_name.includes(name.toLowerCase())
                )
                : speciesData.scientific_name.includes(item.scientific_name.toLowerCase())
        );

        if (foundSpecies) {
            setShowWarning(true);
        } else {
            handleAddSpecies();
        }
    };

    // Call to add alternative species and ensure fields are properly formatted
    const handleAddSpecies = () => {
        setShowSnackbar(true);
        const splitByCommaWithSpaces = (value) => value.split(/,\s*|\s*,\s*/);

        // Get the ids of the alternative species to add
        const alternativeSpeciesArray = Array.isArray(speciesData.alternative_species) ?
            speciesData.alternative_species :
            splitByCommaWithSpaces(speciesData.alternative_species);

        const alternativeSpeciesIds = [];

        alternativeSpeciesArray.forEach(species => {
            alternativeSpeciesIds.push(species.species_id);
        });

        const modifiedSpeciesData = {
            ...speciesData,
            scientific_name: typeof speciesData.scientific_name === 'string' ? splitByCommaWithSpaces(speciesData.scientific_name) : [],
            resource_links: typeof speciesData.resource_links === 'string' ? splitByCommaWithSpaces(speciesData.resource_links) : [],
            alternative_species: alternativeSpeciesIds,
            region_id: speciesData.region_id
        };

        handleAdd(modifiedSpeciesData);
        handleCancel();
    };

    // Cancel addding an alternative species
    const handleCancel = () => {
        setShowWarning(false);
        setShowAlert(false);
        setSpeciesData(initialSpeciesData);
        handleClose();
    };

    const handleCloseSnackbar = () => {
        setShowSnackbar(false)
    }

    return (
        <div>
            <Dialog open={showAlert} onClose={() => setShowAlert(false)}>
                <CustomAlert text={"scientific name AND region"} onClose={() => setShowAlert(false)} />
            </Dialog>

            <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
                {speciesData.scientific_name && (
                    <div>
                        <CustomWarning
                            data={speciesData.scientific_name}
                            onClose={() => setShowWarning(false)}
                            handleAdd={() => handleAddSpecies()} />
                    </div>
                )}
            </Dialog>

            <Dialog open={open} onClose={handleCancel} fullWidth>
                <DialogTitle>Add a New Species</DialogTitle>
                <DialogContent>
                    <TextField
                        fullWidth
                        label="Scientific Name(s) (separate by commas)*"
                        value={speciesData.scientific_name}
                        onChange={(e) => handleInputChange("scientific_name", e.target.value)}
                        sx={{ width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        fullWidth
                        label="Description"
                        multiline
                        minRows={3}
                        value={speciesData.species_description}
                        onChange={(e) => handleInputChange("species_description", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: "1rem" }}>
                        <Autocomplete
                            multiple
                            id="alternative-species-autocomplete"
                            options={alternativeSpeciesData}
                            getOptionLabel={(option) =>
                                `${option.scientific_name} (${option.common_name ? option.common_name.join(', ') : ''})`
                            }
                            value={
                                Array.isArray(speciesData.alternative_species)
                                    ? speciesData.alternative_species
                                    : []
                            }
                            onChange={(event, values) =>
                                handleInputChange("alternative_species", values)
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
                    </Box>

                    <TextField
                        fullWidth
                        label="Resource links (separate by commas)"
                        value={speciesData.resource_links}
                        onChange={(e) => handleInputChange("resource_links", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <FormControl fullWidth sx={{ marginBottom: "1rem" }}>
                        <InputLabel id="region-label">Region(s) (multiselect)*</InputLabel>
                        <Select
                            labelId="region-label"
                            multiple
                            value={speciesData.region_id}
                            onChange={(e) => handleInputChange("region_code_name", e.target.value)}
                            label="Region (multiselect)"
                            renderValue={(selected) => {
                                const selectedNames = selected.map(id => regionMap[id]);
                                return selectedNames.join(", ");
                            }}
                        >
                            {Object.entries(regionMap).map(([region_id, region_code_name]) => (
                                <MenuItem key={region_id} value={region_id}>
                                    {region_code_name}
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

            <SnackbarOnSuccess open={showSnackbar} onClose={handleCloseSnackbar} text={"Added successfully!"} />

        </div >
    );
};

export default AddInvasiveSpeciesDialog;