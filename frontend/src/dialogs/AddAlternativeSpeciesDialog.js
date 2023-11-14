import React, { useState } from "react";
import { Typography, Snackbar, Alert, AlertTitle, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import SnackbarOnSuccess from "../components/SnackbarComponent";
import CustomAlert from '../components/AlertComponent';
import CustomWarning from '../components/WarningComponent';

const AddAlternativeSpeciesDialog = ({ open, handleClose, data, handleAdd }) => {

  const initialSpeciesData = {
    scientific_name: [],
    common_name: [],
    species_description: "",
    resource_links: [],
    image_links: [],
  };

  const [showOpen, setShowOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [speciesData, setSpeciesData] = useState(initialSpeciesData);

  const handleInputChange = (field, value) => {
    setSpeciesData((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirmAddAlternativeSpecies = () => {
    if (speciesData.scientific_name.length === 0) {
      setShowAlert(true);
      return;
    }

    const foundSpecies = data.some((item) =>
      Array.isArray(item.scientific_name)
        ? item.scientific_name.some(
          (name) => speciesData.scientific_name === name.toLowerCase())
        : speciesData.scientific_name === item.scientific_name.toLowerCase()
    );

    if (foundSpecies) {
      setShowWarning(true);
    } else {
      handleAddAlternativeSpecies();
    }
  };



  const handleAddAlternativeSpecies = () => {
    setShowOpen(true);

    const splitByCommaWithSpaces = (value) => value.split(/,\s*|\s*,\s*/);

    const modifiedSpeciesData = {
      ...speciesData,
      scientific_name: typeof speciesData.scientific_name === 'string' ? splitByCommaWithSpaces(speciesData.scientific_name) : [],
      common_name: typeof speciesData.common_name === 'string' ? splitByCommaWithSpaces(speciesData.common_name) : [],
      resource_links: typeof speciesData.resource_links === 'string' ? splitByCommaWithSpaces(speciesData.resource_links) : [],
      image_links: typeof speciesData.image_links === 'string' ? splitByCommaWithSpaces(speciesData.image_links) : [],
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

  const handleImageUpload = (e) => {
    const files = e.target.files;
    if (files) {
      let imageLinks = speciesData.image_links ? speciesData.image_links : '';
      for (let i = 0; i < files.length; i++) {
        imageLinks += (i === 0 ? '' : ',') + files[i].name;
      }
      handleInputChange("image_links", imageLinks);
    }
  };

  const handleCloseSnackbar = () => {
    setShowOpen(false)
  }

  return (
    <div>
      <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
        <CustomAlert text={"scientific name"} onClose={() => setShowAlert(false)} />
      </Dialog>

      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        {speciesData.scientific_name && (
          <div>
            <CustomWarning
              data={speciesData.scientific_name}
              onClose={() => setShowWarning(false)}
              handleAdd={handleAddAlternativeSpecies} />
          </div>
        )}
      </Dialog>

      < Dialog open={open} onClose={handleClose} >
        <DialogTitle>Add an Alternative Species</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Scientific Name"
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
          <TextField
            fullWidth
            label="Resource links (separate with commas)"
            value={speciesData.resource_links}
            onChange={(e) => handleInputChange("resource_links", e.target.value)}
            sx={{ width: "100%", marginBottom: "1rem" }}
          />

          {/* add images  */}
          <Box>
            <Typography variant="body1" sx={{ marginBottom: "3px" }}>
              Upload Images:
            </Typography>
            <input
              type="file"
              multiple
              onChange={handleImageUpload}
              sx={{ width: '100%', marginBottom: '1rem' }}
            />
          </Box>

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirmAddAlternativeSpecies}>Submit</Button>
        </DialogActions>
      </Dialog >

      <SnackbarOnSuccess open={showOpen} onClose={handleCloseSnackbar} text={"Added successfully!"} />
    </div >
  );
};

export default AddAlternativeSpeciesDialog;
