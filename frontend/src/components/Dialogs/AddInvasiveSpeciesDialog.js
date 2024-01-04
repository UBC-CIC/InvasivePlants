import React, { useState, useEffect } from "react";
import {
    Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import SnackbarOnSuccess from "../SnackbarComponent";
import CustomAlert from "../AlertComponent";
import CustomWarning from '../WarningComponent';
import { capitalizeFirstWord, capitalizeEachWord } from '../../functions/helperFunctions';
import axios from "axios";

// Dialog for adding an invasive species
const AddInvasiveSpeciesDialog = ({ open, handleClose, handleAdd, data }) => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const initialSpeciesData = {
        scientific_name: [],
        resource_links: [],
        species_description: "",
        alternative_species: [],
        region_id: []
    };
    const [searchDropdownOptions, setSearchDropdownOptions] = useState([]); // dropdown options for search bar (scientific names)
    const [alternativeSpeciesAutocompleteOpen, setAlternativeAutocompleteOpen] = useState(false);
    const [searchRegionsDropdownOptions, setSearchRegionsDropdownOptions] = useState([]); // dropdown options for regions search
    const [regionsAutocompleteOpen, setRegionsAutocompleteOpen] = useState(false);
    const [typedValues, setTypedValues] = useState("");
    const [showSnackbar, setShowSnackbar] = useState(false);
    const [showAlert, setShowAlert] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [speciesData, setSpeciesData] = useState(initialSpeciesData);

    const handleInputChange = (field, value) => {
        if (field === "region_code_name") {
            setSpeciesData((prev) => ({ ...prev, region_id: value }));
        } else {
            setSpeciesData((prev) => ({ ...prev, [field]: value }));
        }
    };

    // Confirms all fields are present before adding, otherwise shows alerts
    const handleConfirmAddSpecies = () => {
        console.log("speceis: ", speciesData);

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

    // Updates search dropdown
    const handleSearch = (searchInput) => {
        if (searchInput === "") {
            setSearchDropdownOptions([]);
        } else {
            axios
                .get(`${API_BASE_URL}alternativeSpecies`, {
                    params: {
                        scientific_name: searchInput,
                    },
                    headers: {
                        'x-api-key': process.env.REACT_APP_X_API_KEY
                    }
                })
                .then((response) => {
                    const formattedData = response.data.species.map(item => {
                        const capitalizedScientificNames = item.scientific_name.map(name => capitalizeFirstWord(name, "_"));
                        const capitalizedCommonNames = item.common_name.map(name => capitalizeEachWord(name));

                        return {
                            ...item,
                            scientific_name: capitalizedScientificNames,
                            common_name: capitalizedCommonNames,
                        };
                    });

                    console.log("formattedData:", formattedData);
                    setSearchDropdownOptions(formattedData);
                })
                .catch((error) => {
                    console.error("Error searching up alternative species", error);
                })
        }
    };

    // Updates search dropdown
    const handleSearchRegion = () => {
        axios
            .get(`${API_BASE_URL}region`, {
                params: {
                    region_fullname: typedValues
                },
                headers: {
                    'x-api-key': process.env.REACT_APP_X_API_KEY
                }
            })
            .then((response) => {
                const regionData = response.data.regions.map(item => {
                    return {
                        ...item,
                        region_fullname: capitalizeEachWord(item.region_fullname),
                        region_code_name: item.region_code_name.toUpperCase(),
                        country_fullname: capitalizeEachWord(item.country_fullname)
                    };
                });
                console.log("formattedData from region search:", regionData);
                setSearchRegionsDropdownOptions(regionData);
            })
            .catch((error) => {
                console.error("Error searching up region", error);
            })
    };

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
                            options={searchDropdownOptions}
                            getOptionLabel={(option) =>
                                `${option.scientific_name} (${option.common_name ? option.common_name.join(', ') : ''})`
                            }
                            value={
                                Array.isArray(speciesData.alternative_species)
                                    ? speciesData.alternative_species
                                    : []
                            }
                            onInputChange={(e, input) => {
                                handleSearch(input);
                            }}
                            onChange={(e, input) =>
                                handleInputChange("alternative_species", input)
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

                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: "1rem", width: "100%" }}>
                        <Autocomplete
                            multiple
                            id="regions-autocomplete"
                            options={searchRegionsDropdownOptions}
                            getOptionLabel={(option) =>
                                `${option.region_fullname} (${option.region_code_name})`
                            }
                            value={
                                Array.isArray(speciesData.all_regions) ?
                                    speciesData.all_regions.map(region => ({
                                        ...region,
                                        region_fullname: capitalizeEachWord(region.region_fullname),
                                    }))
                                    : []
                            }
                            onInputChange={(e, input) => {
                                setTypedValues((prev) => prev + input);
                                handleSearchRegion();
                            }}
                            onChange={(e, input) => {
                                handleInputChange("all_regions", input)
                                setTypedValues("");
                            }}
                            open={regionsAutocompleteOpen}
                            onFocus={() => {
                                setRegionsAutocompleteOpen(true)
                                handleSearchRegion();
                            }}
                            onBlur={() => {
                                setRegionsAutocompleteOpen(false)
                                setTypedValues("")
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