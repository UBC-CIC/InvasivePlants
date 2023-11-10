import { useState, useEffect } from 'react';
import {
    Select, AlertTitle, MenuItem, FormControl, InputLabel, Tooltip, Box, alpha, Autocomplete, Alert
    , Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography
} from '@mui/material';
import AlternativeSpeciesTestData from "../test_data/alternativeSpeciesTestData";
import SearchIcon from '@mui/icons-material/Search';
import AddAlternativeSpeciesDialog from './AddAlternativeSpeciesDialog';
import RegionsTestData from "../test_data/regionsTestData";
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';

const EditInvasiveSpeciesDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [alternativeDialog, setOpenAddAlternativeDialog] = useState(false);
    const [alternativeSpeciesAutocompleteOpen, setAlternativeAutocompleteOpen] = useState(false);
    const [alternativeSpeciesTestData, setAlternativeSpeciesTestData] = useState(AlternativeSpeciesTestData);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
        setOpenAddAlternativeDialog(false);
    };

    const handleAddAlternativeSpecies = (newAlternativeSpeciesData) => {
        // Generate a unique AltSpeciesId for the new alternative species
        const newAltSpeciesId = alternativeSpeciesTestData.length + 1;

        // Create a new region object with the generated newAltSpeciesId
        const newAlternativeSpecies = {
            regionId: newAltSpeciesId,
            ...newAlternativeSpeciesData,
        };

        setAlternativeSpeciesTestData([...alternativeSpeciesTestData, newAlternativeSpecies]);
        setOpenAddAlternativeDialog(false);

        // TODO: update the database with the new entry
    }


    const [showAlert, setShowAlert] = useState(false);
    const handleConfirmAddAlternativeSpecies = () => {
        console.log(typeof tempData.scientific_name)
        console.log(tempData.scientific_name)

        if (!tempData.scientific_name || tempData.scientific_name.length === 0) {
            setShowAlert(true);
            return false;
        }
        setShowSaveConfirmation(true);
        return true
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
                    {/* <TextField
                        label="Common Name(s) (separate by commas)"
                        value={
                            Array.isArray(tempData.commonName)
                                ? tempData.commonName.join(", ")
                                : tempData.commonName
                        }
                        onChange={(e) => handleSearchInputChange("commonName", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    /> */}

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
                            options={alternativeSpeciesTestData}
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
                                    width: "100%"
                                }}
                            >
                                Add alternative
                            </Button>
                        </Tooltip>
                    </Box>

                    <TextField
                        label="Resource links (separate by commas)"
                        value={tempData.resource_links?.join(", ")}
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
                            renderValue={(selected) => selected.join(", ")}
                        >
                            {RegionsTestData.map((item) => (
                                <MenuItem key={item.region_code_name} value={item.region_code_name}>
                                    {item.region_code_name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button
                        onClick={() => {
                            // handleConfirmAddAlternativeSpecies();
                            handleSave(handleConfirmAddAlternativeSpecies());
                            // setShowSaveConfirmation(true);
                        }}
                    >Save</Button>
                </DialogActions>
            </Dialog >


            <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                <CustomAlert text={"scientific name"} onClose={() => setShowAlert(false)} />
            </Dialog>

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />

            <AddAlternativeSpeciesDialog
                open={alternativeDialog}
                handleClose={handleClose}
                data={alternativeSpeciesTestData}
                handleAdd={handleAddAlternativeSpecies}
            />
        </div >
    );
};

export default EditInvasiveSpeciesDialog;
