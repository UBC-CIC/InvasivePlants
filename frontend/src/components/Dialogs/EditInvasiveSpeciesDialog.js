import { useState, useEffect } from 'react';
import {
    Select, MenuItem, FormControl, InputLabel, Box, Autocomplete,
    Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import SnackbarOnSuccess from '../SnackbarComponent';
import CustomAlert from '../AlertComponent';
import handleGetRegions from '../../functions/RegionMap';

// Dialog for editing an invasive species
const EditInvasiveSpeciesDialog = ({ open, tempData, handleInputChange, handleFinishEditingRow, handleSave, alternativeSpeciesData }) => {
    const [showAlert, setShowAlert] = useState(false);
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [alternativeSpeciesAutocompleteOpen, setAlternativeAutocompleteOpen] = useState(false);
    const [regionMap, setRegionsMap] = useState({});

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
