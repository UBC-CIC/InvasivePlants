import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function AddAlternativeSpecies({addAlternativePopUpOpen, setAddAlternativePopUpOpen}) {
  const [formData, setFormData] = useState({
    commonName: '',
    scientificName: '',
    links: '',
    description: '',
    images: '',
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
      images: formData.images.split('\n').filter((img) => img.trim() !== ''),
    };

    console.log(parsedData);
    handleClose();
  };

  const handleClose = () => {
    setAddAlternativePopUpOpen(false);
    setFormData({
      commonName: '',
      scientificName: '',
      links: '',
      description: '',
      images: '',
    });
  };

  return (
    <div>
      <Dialog open={addAlternativePopUpOpen} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>
          Input Species Data
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            sx={{ position: 'absolute', right: '8px', top: '8px' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Common Name"
            variant="outlined"
            name="commonName"
            fullWidth
            value={formData.commonName}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Scientific Name"
            variant="outlined"
            name="scientificName"
            fullWidth
            value={formData.scientificName}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Links"
            variant="outlined"
            name="links"
            fullWidth
            value={formData.links}
            onChange={handleInputChange}
            multiline
            rows={4}
            helperText="Enter each link on a new line."
            sx={{ mb: 2 }}
          />
          <TextField
            label="Description"
            variant="outlined"
            name="description"
            fullWidth
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Images"
            variant="outlined"
            name="images"
            fullWidth
            value={formData.images}
            onChange={handleInputChange}
            multiline
            rows={4}
            helperText="Enter each image link on a new line."
            sx={{ mb: 2 }}
          />
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
