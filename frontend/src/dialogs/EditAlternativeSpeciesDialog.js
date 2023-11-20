import { useState } from 'react';
import { Box, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';
import DeleteDialog from '../dialogs/ConfirmDeleteDialog';

import axios from "axios";

const EditAlternativeSpeciesDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    const handleImageUpload = (e) => {
        const files = e.target.files;
        if (files) {
            let imageLinks = tempData.image_links ? [...tempData.image_links] : [];
            for (let i = 0; i < files.length; i++) {
                imageLinks.push(files[i].name);
            }
            handleSearchInputChange("image_links", imageLinks);
        }
    };


    const [showWarning, setShowWarning] = useState(false);
    const [deleteImg, setDeleteImg] = useState(null);

    const handleImageDelete = (img, index) => {
        setShowWarning(true);
        setDeleteImg(img);

        // delete the plant images from the plant table
        console.log("got here", `${API_ENDPOINT}plantsImages/${img.image_id}`)
        console.log(img, index);

    };


    const handleConfirmDeleteImage = () => {
        console.log("img: ", deleteImg)
        setShowWarning(false)

        // remove the image from the display
        if (deleteImg) {
            axios
                .delete(`${API_ENDPOINT}plantsImages/${deleteImg.image_id}`)
                .then((response) => {
                    // Filter out the deleted image from tempData.images
                    const updatedImages = tempData.images.filter(
                        (img) => img.image_id !== deleteImg.image_id
                    );
                    console.log("updatedImages: ", updatedImages);
                    handleSearchInputChange("images", updatedImages);
                    console.log("images deleted successfully", response.data);
                })
                .catch((error) => {
                    console.error("Error deleting image", error);
                }).finally(() => {
                    // Reset states
                    setDeleteImg(null);
                    setShowWarning(false);
                });
        } else {
            setShowWarning(false);
        }
    }


    const [showAlert, setShowAlert] = useState(false);
    const handleConfirmAddAlternativeSpecies = () => {
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
                        label="Scientific Name(s) (separate by commas)"
                        value={Array.isArray(tempData.scientific_name) ? tempData.scientific_name.join(', ') : tempData.scientific_name}
                        onChange={(e) => handleSearchInputChange("scientific_name", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Common Name(s) (separate by commas)"
                        value={
                            Array.isArray(tempData.common_name)
                                ? tempData.common_name.join(", ")
                                : tempData.common_name
                        }
                        onChange={(e) => handleSearchInputChange("common_name", e.target.value)}
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

                    <TextField
                        label="Resource links (separate by commas)"
                        value={
                            Array.isArray(tempData.resource_links)
                                ? tempData.resource_links.join(", ")
                                : tempData.resource_links
                        } 
                        onChange={(e) =>
                            handleSearchInputChange("resource_links", e.target.value.split(", "))
                        }
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />


                    {/* TODO!!  images post new image*/}
                    <TextField
                        multiline
                        rows={4}
                        label="Image links (separate by commas)"
                        // value={
                        //     Array.isArray(tempData.image_links)
                        //         ? tempData.image_links.join(", ")
                        //         : tempData.image_links
                        // }
                        onChange={(e) =>
                            handleSearchInputChange("image_links", e.target.value.split(", "))
                        }
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <Box sx={{ width: '100%', textAlign: 'left', marginBottom: '2rem' }}>
                        <Typography variant="body1" sx={{ width: '100%' }}>
                            Upload Images:
                        </Typography> 
                        <input
                            type="file"
                            multiple
                            onChange={handleImageUpload}
                            sx={{ width: '100%' }}
                        />
                    </Box>

                    <Box sx={{ width: '100%', textAlign: 'left' }}>
                        {console.log("tempdata:", tempData)}
                        {Array.isArray(tempData.images) &&
                            tempData.images.map((img, index) => (
                                <div key={img.image_id} sx={{ width: '90%', marginBottom: "2rem", textAlign: "left" }}>
                                    <img src={img.image_url} alt={`image-${index}`} />
                                    <button onClick={() => handleImageDelete(img, index)}>Delete</button>
                                </div>
                            ))}
                    </Box>
                </DialogContent>

                <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                    <CustomAlert text={"scientific name"} onClose={() => setShowAlert(false)} />
                </Dialog>

                <DeleteDialog
                    open={showWarning}
                    handleClose={() => setShowWarning(false)}
                    handleDelete={handleConfirmDeleteImage}
                />

                <DialogActions>
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button
                        onClick={() => {
                            handleSave(handleConfirmAddAlternativeSpecies());
                        }}
                    >Save</Button>
                </DialogActions>
            </Dialog >

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />

        </div >
    );
};

export default EditAlternativeSpeciesDialog;
