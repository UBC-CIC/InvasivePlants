import React, { useState } from "react";
import { alpha, Snackbar, Alert, AlertTitle, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';


const AddAlternativeSpecies = ({ open, handleClose, handleAdd }) => {
  const initialSpeciesData = {
    scientificName: "",
    commonName: "",
    description: "",
    location: "",
  };
  // const [showOpen, setShowOpen] = useState(false);
  // const [showAlert, setShowAlert] = useState(false);
  // const [showWarning, setShowWarning] = useState(false);
  const [speciesData, setSpeciesData] = useState(initialSpeciesData);

  const handleInputChange = (field, value) => {
    setSpeciesData((prev) => ({ ...prev, [field]: value }));
  };

  // const handleConfirmAddSpecies = () => {
  //   // const foundSpecies = data.find((item) => item.scientificName.toLowerCase() === speciesData.scientificName.toLowerCase());

  //   if (speciesData.scientificName.trim() === "") {
  //     setShowAlert(true);
  //     return;
  //   }
  // if (foundSpecies) {
  //   setShowWarning(true);
  // } else {
  //   handleAddSpecies();
  // }
  // };

  // const handleAddSpecies = () => {
  //   setShowOpen(true)
  //   const modifiedSpeciesData = {
  //     ...speciesData,
  //     commonName: speciesData.commonName.split(","),
  //     links: speciesData.links.split(","),
  //     alternatives: speciesData.alternatives.split(","),
  //   };
  //   handleAdd(modifiedSpeciesData);
  //   handleCancel();
  // };

  // const handleCancel = () => {
  //   setShowWarning(false);
  //   setShowAlert(false);
  //   setSpeciesData(initialSpeciesData);
  //   handleClose();
  // };


  // <div>
  {/* <Dialog open={showAlert} onClose={() => setShowAlert(false)}>
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
        {speciesData.scientificName && (
          <div>
            <Alert severity="warning">
              <AlertTitle><strong>{speciesData.scientificName}</strong> already exists!</AlertTitle>
              Do you want to <strong>add anyways?</strong>
              <Box sx={{ display: 'flex', width: '100%', marginTop: '10px', justifyContent: 'flex-end' }}>
                <Button onClick={() => setShowWarning(false)}
                  sx={{
                    color: "#362502",
                    "&:hover": {
                      backgroundColor: "#dbc8a0"
                    }
                  }}>Cancel</Button>
                <Button
                  // onClick={() => setOpenAddAlternativeDialog(true)} startIcon={<AddCircleOutlineIcon />}
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
      </Dialog> */}

  return (
    < Dialog open={open} onClose={handleClose} >
      <DialogTitle>Add a Alternative Species</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          label="Scientific Name"
          value={speciesData.scientificName}
          onChange={(e) => handleInputChange("scientificName", e.target.value)}
          sx={{ width: "100%", marginTop: "0.5rem", marginBottom: "1rem" }}
        />
        <TextField
          fullWidth
          label="Common Name (separate with commas)"
          value={speciesData.commonName}
          onChange={(e) => handleInputChange("commonName", e.target.value)}
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
          label="Links (separate with commas)"
          value={speciesData.links}
          onChange={(e) => handleInputChange("links", e.target.value)}
          sx={{ width: "100%", marginBottom: "1rem" }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button>Submit</Button>
      </DialogActions>
    </Dialog >
  );
};

{/* <Snackbar open={showOpen} autoHideDuration={4000} onClose={() => setShowOpen(false)}>
        <Alert onClose={() => setShowOpen(false)} severity="success" sx={{ width: '100%' }}>
          Added successfully!
        </Alert>
      </Snackbar> */}

// </div >


export default AddAlternativeSpecies;
