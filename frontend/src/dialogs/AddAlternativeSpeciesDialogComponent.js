import React, { useState } from "react";
import { alpha, Snackbar, Alert, AlertTitle, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { makeStyles } from '@material-ui/core/styles';

// Define the styles
const useStyles = makeStyles((theme) => ({
  uploadButton: {
    display: 'inline-block',
    padding: '7px 15px',
    backgroundColor: alpha('#699cb8', 0.9),
    '&:hover': {
      backgroundColor: '#5e8da6',
    },
    color: 'white',
    cursor: 'pointer',
    borderRadius: '5px',
  },
}));

const AddAlternativeSpeciesDialog = ({ open, handleClose, data, handleAdd }) => {

  const initialSpeciesData = {
    alternativeScientificName: "",
    alternativeCommonName: [],
    description: "",
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
    const foundSpecies = data.find((item) => item.alternativeScientificName.toLowerCase() === speciesData.alternativeScientificName.toLowerCase());
    if (speciesData.alternativeScientificName.trim() === "") {
      setShowAlert(true);
      return;
    }
    if (foundSpecies) {
      setShowWarning(true);
    } else {
      handleAddAlternativeSpecies();
    }
  };

  const handleAddAlternativeSpecies = () => {
    setShowOpen(true)
    const modifiedSpeciesData = {
      ...speciesData,
      alternativeCommonName: typeof speciesData.alternativeCommonName === 'string' ? speciesData.alternativeCommonName.split(",") : [],
      image_links: typeof speciesData.image_links === 'string' ? speciesData.image_links.split(",") : [],
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

  return (
    <div>
      <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
        <Alert severity="error">
          <AlertTitle>Empty Field!</AlertTitle>
          Please enter a <strong>valid scientific name.</strong>
          <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
            <Button
              onClick={() => setShowAlert(false)}
              sx={{
                color: "#241c1a",
                "&:hover": {
                  backgroundColor: "#d9b1a7"
                }
              }}
            >OK</Button>
          </Box>
        </Alert>
      </Dialog>

      <Dialog open={showWarning} onClose={() => setShowWarning(false)}>
        {speciesData.alternativeScientificName && (
          <div>
            <Alert severity="warning">
              <AlertTitle><strong>{speciesData.alternativeScientificName}</strong> already exists!</AlertTitle>
              Do you want to <strong>add anyways?</strong>
              <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowWarning(false)}
                  sx={{
                    color: "#362502",
                    "&:hover": {
                      backgroundColor: "#dbc8a0"
                    }
                  }}>Cancel</Button>
                <Button onClick={handleAddAlternativeSpecies}
                  sx={{
                    color: "#362502",
                    "&:hover": {
                      backgroundColor: "#dbc8a0"
                    }
                  }} autoFocus>
                  Add
                </Button>
              </Box>
            </Alert>
          </div>
        )}
      </Dialog> 

    < Dialog open={open} onClose={handleClose} >
        <DialogTitle>Add an Alternative Species</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Scientific Name"
            value={speciesData.alternativeScientificName}
            onChange={(e) => handleInputChange("alternativeScientificName", e.target.value)}
          sx={{ width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}
        />
        <TextField
          fullWidth
          label="Common Name (separate with commas)"
            value={speciesData.alternativeCommonName}
            onChange={(e) => handleInputChange("alternativeCommonName", e.target.value)}
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
        <TextField
          fullWidth
            label="Resource links (separate with commas)"
            value={speciesData.resource_links}
            onChange={(e) => handleInputChange("resource_links", e.target.value)}
            sx={{ width: "100%", marginBottom: "1rem" }}
          />
          <input
            type="file"
            multiple
            onChange={handleImageUpload}
            sx={{ width: '100%', marginBottom: '1rem' }}
          />

      </DialogContent>
      <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleConfirmAddAlternativeSpecies}>Submit</Button>
      </DialogActions>
      </Dialog >

      <Snackbar open={showOpen} autoHideDuration={5000} onClose={() => setShowOpen(false)}>
        <Alert onClose={() => setShowOpen(false)} severity="success" sx={{ width: '100%' }}>
          Added successfully!
        </Alert>
      </Snackbar>

    </div >
  );
};

export default AddAlternativeSpeciesDialog;
