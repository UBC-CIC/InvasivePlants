import { useState, useEffect } from 'react';
import {
    Select, MenuItem, FormControl, InputLabel, Tooltip, Box, alpha, Autocomplete,
    Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
// import AddAlternativeSpeciesDialog from './AddAlternativeSpeciesDialog';
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';
import handleGetRegions from '../functions/RegionMap';
import axios from "axios";

const EditInvasiveSpeciesDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [alternativeDialog, setOpenAddAlternativeDialog] = useState(false);
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
                console.log("data: ", formattedData);
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
        setOpenAddAlternativeDialog(false);
    };

    // const handleAddAlternativeSpecies = (newAlternativeSpeciesData) => {
    //     // Generate a unique AltSpeciesId for the new alternative species
    //     const newAltSpeciesId = alternativeSpeciesData.length + 1;

    //     // Create a new region object with the generated newAltSpeciesId
    //     const newAlternativeSpecies = {
    //         regionId: newAltSpeciesId,
    //         ...newAlternativeSpeciesData,
    //     };

    //     setAlternativeSpeciesData([...alternativeSpeciesData, newAlternativeSpecies]);
    //     setOpenAddAlternativeDialog(false);

    //     // TODO: update the database with the new entry
    // }


    const [showAlert, setShowAlert] = useState(false);
    // const handleConfirmAddAlternativeSpecies = () => {
    //     console.log(typeof tempData.scientific_name)
    //     console.log(tempData.scientific_name)

    //     if (!tempData.scientific_name || tempData.scientific_name.length === 0) {
    //         setShowAlert(true);
    //         return false;
    //     }
    //     setShowSaveConfirmation(true);
    //     return true
    // };


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
                        {/* <Tooltip title="Alternative species not in list?" placement="top">
                            <Button
                                variant="contained"
                                onClick={() => setOpenAddAlternativeDialog(true)}
                                sx={{
                                    flex: 1, fontSize: "0.8rem",
                                    backgroundColor: alpha('#699cb8', 0.9),
                                    '&:hover': {
                                        backgroundColor: '#5e8da6',
                                    },
                                    width: "100%"
                                }}
                            >
                                Add alternative
                            </Button>
                        </Tooltip> */}
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
                            // value={[regionMap[tempData.region_id]]}

                            onChange={(e) => handleSearchInputChange("region_code_name", e.target.value)}
                            label="Region (multiselect)"
                            renderValue={(selected) => selected.join(", ")}
                        >
                            {Object.entries(regionMap).map(([region_id, region_code_name]) => (
                                <MenuItem key={region_id} value={region_id}>
                                    {`${region_code_name}: ${region_id}`}
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
                            // handleSave(handleConfirmAddAlternativeSpecies());
                        }}
                    >Save</Button>
                </DialogActions>
            </Dialog >


            <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                <CustomAlert text={"scientific name"} onClose={() => setShowAlert(false)} />
            </Dialog>

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />

            {/* <AddAlternativeSpeciesDialog
                open={alternativeDialog}
                handleClose={handleClose}
                data={alternativeSpeciesData}
                handleAdd={handleAddAlternativeSpecies}
            /> */}
        </div >
    );
};

export default EditInvasiveSpeciesDialog;
