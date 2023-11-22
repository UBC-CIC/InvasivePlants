import { useState, useEffect } from 'react';
import {
    Select, MenuItem, FormControl, InputLabel, Box, Autocomplete,
    Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';
import handleGetRegions from '../functions/RegionMap';
import axios from "axios";

const EditInvasiveSpeciesDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

    const [showAlert, setShowAlert] = useState(false);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [alternativeSpeciesAutocompleteOpen, setAlternativeAutocompleteOpen] = useState(false);
    const [alternativeSpeciesData, setAlternativeSpeciesData] = useState([]);
    const [regionMap, setRegionsMap] = useState({});

    const handleGetAlternativeSpecies = () => {
        const capitalizeWordsSplitUnderscore = (str) => {
            return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        const capitalizeWordsSplitSpace = (str) => {
            return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        };

        // get alternative
        axios
            .get(`${API_ENDPOINT}alternativeSpecies`)
            .then((response) => {

                // Capitalize each scientific_name 
                const formattedData = response.data.map(item => {
                    const capitalizedScientificNames = item.scientific_name.map(name => capitalizeWordsSplitUnderscore(name));
                    const capitalizedCommonNames = item.common_name.map(name => capitalizeWordsSplitSpace(name));
                    return {
                        ...item,
                        scientific_name: capitalizedScientificNames,
                        common_name: capitalizedCommonNames
                    };
                });
                console.log("alternative species data from invasive species: ", formattedData);
                setAlternativeSpeciesData(formattedData);
            })
            .catch((error) => {
                console.error("Error retrieving alternative species", error);
            });
    };
    useEffect(() => {
        handleGetAlternativeSpecies();
    }, []);

    useEffect(() => {
        const fetchRegionData = async () => {
            try {
                const regionMap = await handleGetRegions();
                setRegionsMap(regionMap);
            } catch (error) {
                console.error('Error fetching region map 1:', error);
            }
        };
        fetchRegionData();
    }, []);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    return (
        <div>
            <Dialog open={open} onClose={handleFinishEditingRow} maxWidth="sm" fullWidth>
                {/* scientific name as title */}
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
                        label="Scientific Name"
                        value={
                            Array.isArray(tempData.scientific_name)
                                ? tempData.scientific_name.join(", ")
                                : tempData.scientific_name
                        } onChange={(e) => handleSearchInputChange("scientific_name", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Description"
                        multiline
                        rows={6}
                        value={tempData.species_description}
                        onChange={(e) => handleSearchInputChange("species_description", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: "1rem", width: "100%" }}>
                        <Autocomplete
                            multiple
                            id="alternative-species-autocomplete"
                            options={alternativeSpeciesData}
                            getOptionLabel={(option) =>
                                `${option.scientific_name} (${option.common_name ? option.common_name.join(', ') : ''})`
                            }
                            value={
                                Array.isArray(tempData.alternative_species)
                                    ? tempData.alternative_species
                                    : []
                            }
                            onChange={(event, values) =>
                                handleSearchInputChange("alternative_species", values)
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
                            handleSearchInputChange("resource_links", e.target.value.split(", "))
                        }
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <FormControl fullWidth sx={{ marginBottom: "1rem" }}>
                        <InputLabel id="region-label">Region (multiselect)</InputLabel>
                        <Select
                            labelId="region-label"
                            multiple
                            value={tempData.region_id}
                            onChange={(e) => handleSearchInputChange("region_code_name", e.target.value)}
                            label="Region (multiselect)"
                            renderValue={(selected) => {
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
                            handleSave(true);
                        }}
                    >Save</Button>
                </DialogActions>
            </Dialog >


            <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                <CustomAlert text={"scientific name"} onClose={() => setShowAlert(false)} />
            </Dialog>

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />
        </div >
    );
};

export default EditInvasiveSpeciesDialog;
