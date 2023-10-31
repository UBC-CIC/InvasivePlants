import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Box,
  Typography,
} from '@mui/material';


// Import components
import AddAlternativeSpecies from './addAlternativeSpecies';
import AlternativeSpeciesSelector from './alternativeSpeciesSelector';

export default function AddSpeciesForm({ setViewAddSpeciesForm }) {
    // UI transition state functions
    const [addAlternativePopUpOpen, setAddAlternativePopUpOpen] = useState(false);

  const [formData, setFormData] = useState({
    commonName: '',
    scientificName: '',
    links: '',
    description: '',
    alternativeSpecies: '',
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const parsedData = {
      ...formData,
      links: formData.links.split('\n').filter((link) => link.trim() !== ''),
    };

    console.log(parsedData);

    // Clear out all the input
    setFormData({
        commonName: '',
        scientificName: '',
        links: '',
        description: '',
        alternativeSpecies: '',
      });
  };

  const handleCancel = () => {
    setViewAddSpeciesForm(false);
    console.log('Cancel');
    setFormData({
      commonName: '',
      scientificName: '',
      links: '',
      description: '',
      alternativeSpecies: '',
    });
  };

  return (
    <Container>
      <Typography variant="h4" mb={2}>
        Species Form
      </Typography>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <TextField
          label="Common Name"
          variant="outlined"
          name="commonName"
          value={formData.commonName}
          onChange={handleInputChange}
          sx={{ width: '100%', mb: 2 }}
        />
        <TextField
          label="Scientific Name"
          variant="outlined"
          name="scientificName"
          value={formData.scientificName}
          onChange={handleInputChange}
          sx={{ width: '100%', mb: 2 }}
        />
        <TextField
          label="Links"
          variant="outlined"
          name="links"
          value={formData.links}
          onChange={handleInputChange}
          multiline
          rows={4}
          helperText="Enter each link on a new line."
          sx={{ width: '100%', mb: 2 }}
        />
        <TextField
          label="Description"
          variant="outlined"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          sx={{ width: '100%', mb: 2 }}
        />
        <TextField
          label="Alternative Species"
          variant="outlined"
          name="alternativeSpecies"
          value={formData.alternativeSpecies}
          onChange={handleInputChange}
          sx={{ width: '100%', mb: 2 }}
        />
        <AlternativeSpeciesSelector />

        <Button variant="contained" onClick={() => setAddAlternativePopUpOpen(true)}>Add Alternative Species</Button>
        <Box sx={{ mt: 3 }}>
          <Button variant="contained" color="primary" type="submit">
            Submit
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
        </Box>
      </Box>
      {/* Pop up for adding alternative species  */}
      <AddAlternativeSpecies 
      addAlternativePopUpOpen = {addAlternativePopUpOpen}
      setAddAlternativePopUpOpen = {setAddAlternativePopUpOpen}
      />
    </Container>
  );
};