import { useState, useEffect } from 'react';
import {
    Select, MenuItem, FormControl, InputLabel, Box, Autocomplete,
    Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SnackbarOnSuccess from '../SnackbarComponent';
import CustomAlert from '../AlertComponent';
import handleGetRegions from '../../functions/RegionMap';
import axios from "axios";
import { capitalizeFirstWord, capitalizeEachWord } from '../../functions/helperFunctions';

// Dialog for editing an invasive species
const EditInvasiveSpeciesDialog = ({ open, tempData, handleInputChange, handleFinishEditingRow, handleSave }) => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    const [searchDropdownOptions, setSearchDropdownOptions] = useState([]); // dropdown options for search bar (scientific names)
    const [showAlert, setShowAlert] = useState(false); // alert for missing field
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false); // confirmation before saving
    const [alternativeSpeciesAutocompleteOpen, setAlternativeAutocompleteOpen] = useState(false);
    const [regionMap, setRegionsMap] = useState({});
    // const [resolvedRegionNames, setResolvedRegionNames] = useState([]);

    // Fetches regions
    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const regionMap = await handleGetRegions();
                setRegionsMap(regionMap);
            } catch (error) {
                console.error('Error fetching region map from edit invasive species dialog:', error);
            }
        };
        fetchRegionData();
    }, []);

    // Ensures all required fields are present before editing invasive species
    const handleConfirmEditInvasiveSpecies = () => {
        if (!tempData.scientific_name || tempData.scientific_name.length === 0 ||
            !tempData.region_id || tempData.region_id.length === 0) {
            setShowAlert(true);
            return false;
        }
        setShowSaveConfirmation(true);
        return true
    };

    // Closes save confirmation on clickaway
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

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

    return (
        <div>
            <Dialog open={open} onClose={handleFinishEditingRow} maxWidth="sm" fullWidth>
                {/* scientific name as the dialog title */}
                < DialogTitle style={{ display: "flex", alignItems: "center", backgroundColor: "#c8dbe6", height: "60px" }
                }>
                    <Typography
                        variant="h5"
                        component="div"
                        style={{ fontStyle: "italic" }}
                    >
                        {Array.isArray(tempData.scientific_name) ? tempData.scientific_name.join(', ') : tempData.scientific_name}
                    </Typography>
                </DialogTitle >

                <DialogContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

                    <TextField
                        label="Scientific Name(s) (separate by commas)*"
                        value={
                            Array.isArray(tempData.scientific_name)
                                ? tempData.scientific_name.join(", ")
                                : tempData.scientific_name
                        } onChange={(e) => handleInputChange("scientific_name", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Description"
                        multiline
                        rows={6}
                        value={tempData.species_description}
                        onChange={(e) => handleInputChange("species_description", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />


                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: "1rem", width: "100%" }}>
                        <Autocomplete
                            multiple
                            id="alternative-species-autocomplete"
                            options={searchDropdownOptions}
                            getOptionLabel={(option) =>
                                `${option.scientific_name} (${option.common_name ? option.common_name.join(', ') : ''})`
                            }
                            value={
                                Array.isArray(tempData.alternative_species)
                                    ? tempData.alternative_species
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
                        label="Resource links (separate by commas)"
                        value={Array.isArray(tempData.resource_links) ? tempData.resource_links.join(", ") : tempData.resource_links}
                        multiline
                        rows={3}
                        onChange={(e) =>
                            handleInputChange("resource_links", e.target.value.split(", "))
                        }
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <FormControl fullWidth sx={{ marginBottom: "1rem" }}>
                        <InputLabel id="region-label">Region(s) (multiselect)*</InputLabel>
                        <Select
                            labelId="region-label"
                            multiple
                            value={tempData.region_id}
                            onChange={(e) => handleInputChange("region_code_name", e.target.value)}
                            label="Region(s) (multiselect)*"
                            renderValue={(selected) => {
                                // const selectedRegionCodes = selected.map((region_id) =>
                                //     axios
                                //         .get(`${API_BASE_URL}region/${region_id}`, {
                                //             headers: {
                                //                 'x-api-key': process.env.REACT_APP_X_API_KEY
                                //             }
                                //         })
                                //         .then((response) => {
                                //             return response.data[0].region_code_name;
                                //         })
                                //         .catch((error) => {
                                //             console.error("Error getting region", error);
                                //         }))

                                // //  Wait for all promises to resolve
                                // Promise.all(selectedRegionCodes)
                                //     .then((codes) => {
                                //         setResolvedRegionNames(codes);
                                //     })
                                //     .catch((error) => {
                                //         console.error("Error fetching all region codes", error);
                                //     });

                                // return resolvedRegionNames.join(", ");
                                const selectedNames = selected.map(id => regionMap[id]);
                                return selectedNames.join(", ");
                            }}                        >
                            {Object.entries(regionMap).map(([region_id, region_code_name]) => (
                                <MenuItem key={region_id} value={region_id}>
                                    {region_code_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button
                        onClick={() => {
                            handleSave(handleConfirmEditInvasiveSpecies());
                        }}
                    >Save</Button>
                </DialogActions>
            </Dialog >

            <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                <CustomAlert text={"scientific name AND region"} onClose={() => setShowAlert(false)} />
            </Dialog>

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />
        </div >
    );
};

export default EditInvasiveSpeciesDialog;
