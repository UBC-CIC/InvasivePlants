import React, { useState } from "react";
import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SnackbarOnSuccess from "../SnackbarComponent";
import CustomAlert from "../AlertComponent";
import CustomWarning from '../WarningComponent';
import { uploadImageFile } from "../../functions/uploadImageFile";
import { updateDropdown } from "../../functions/searchUtils";

// Dialog for adding an invasive species
const AddInvasiveSpeciesDialog = ({ open, handleClose, handleAdd, data, credentials }) => {
    const initialSpeciesData = {
        scientific_name: [],
        common_name: [],
        resource_links: [],
        species_description: "",
        alternative_species: [],
        region_id: [],
        image_links: [],
        s3_keys: []
    };
    const [searchAlternativeDropdownOptions, setSearchAlternativeDropdownOptions] = useState([]); // dropdown options for search bar (scientific names)
    const [searchRegionsDropdownOptions, setSearchRegionsDropdownOptions] = useState([]); // dropdown options for regions search
    const [showSnackbar, setShowSnackbar] = useState(false); // success snackbar
    const [showAlert, setShowAlert] = useState(false); // severe alert 
    const [showWarning, setShowWarning] = useState(false); // warning alert
    const [speciesData, setSpeciesData] = useState(initialSpeciesData); // new species with empty fields

    // Updates the species data when input changes
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
            !speciesData.all_regions || speciesData.all_regions === 0) {
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
            common_name: typeof speciesData.common_name === 'string' ? splitByCommaWithSpaces(speciesData.common_name) : [],
            resource_links: typeof speciesData.resource_links === 'string' ? splitByCommaWithSpaces(speciesData.resource_links) : [],
            alternative_species: alternativeSpeciesIds,
            region_id: speciesData.region_id,
            image_links: typeof speciesData.image_links === 'string' ? splitByCommaWithSpaces(speciesData.image_links) : speciesData.image_links,
            s3_keys: typeof speciesData.s3_keys === 'string' ? splitByCommaWithSpaces(speciesData.s3_keys) : speciesData.s3_keys,
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
                        label="Common Name (separate with commas)"
                        value={speciesData.common_name}
                        onChange={(e) => handleInputChange("common_name", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
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
                            options={searchAlternativeDropdownOptions}
                            getOptionLabel={(option) =>
                                `${option.scientific_name} (${option.common_name ? option.common_name.join(', ') : ''})`
                            }
                            onInputChange={(e, input) => {
                                updateDropdown(input, credentials, "alternativeSpecies", setSearchAlternativeDropdownOptions);
                            }}
                            onChange={(e, input) =>
                                handleInputChange("alternative_species", input)
                            }
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

                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: "1rem", width: "100%" }}>
                        <Autocomplete
                            multiple
                            id="regions-autocomplete"
                            options={searchRegionsDropdownOptions}
                            getOptionLabel={(option) => `${option.region_fullname} (${option.region_code_name})`}
                            onInputChange={(e, input) => {
                                updateDropdown(input, credentials, "region", setSearchRegionsDropdownOptions);
                            }}
                            onChange={(e, input) => {
                                handleInputChange("all_regions", input)
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="standard"
                                    label={<div style={{ display: 'flex', alignItems: 'center' }}>
                                        <SearchIcon sx={{ marginRight: '0.5rem' }} />
                                        Region(s)* (multiselect)
                                    </div>
                                    }
                                    multiline
                                    sx={{ width: "100%", marginBottom: "1rem" }}
                                />
                            )}
                            sx={{ flex: 5, marginRight: '1rem', height: '100%', width: "100%" }}
                        />
                    </Box>

                    <Box>
                        <TextField
                            fullWidth
                            label="Image links (separate with commas)"
                            value={speciesData.image_links}
                            onChange={(e) => handleInputChange("image_links", e.target.value)}
                            sx={{ width: "100%", marginBottom: "1rem" }}
                        />
                        <Typography variant="body1" sx={{ marginBottom: "3px" }}>
                            Upload Images:
                        </Typography>
                        <input
                            type="file"
                            multiple
                            onChange={(e) => uploadImageFile(e, handleInputChange)}
                            sx={{ width: '100%', marginBottom: '1rem' }}
                        />
                    </Box>
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