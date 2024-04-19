import { useState, useContext } from 'react';
import { Box, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import SnackbarOnSuccess from '../SnackbarComponent';
import CustomAlert from '../AlertComponent';
import DeleteDialog from './ConfirmDeleteDialog';
import axios from "axios";
import { AuthContext } from '../../Views/PageContainer/PageContainer';
import { uploadImageFile } from '../../functions/uploadImageFile';

// Dialog for editing an alternative species
const EditAlternativeSpeciesDialog = ({ open, tempData, handleInputChange, handleFinishEditingRow, handleSave }) => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const S3_BASE_URL = process.env.REACT_APP_S3_BASE_URL;

    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false); // save confirmation message
    const [deleteImg, setDeleteImg] = useState(null); // sets image the delete
    const [showWarning, setShowWarning] = useState(false); // warning alert for duplicates
    const [showAlert, setShowAlert] = useState(false); // alert when a field is missing
    const { user } = useContext(AuthContext);

   
    // Closes save confirmation on clickaway
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    // Opens delete warning confirmation
    const handleImageDelete = (img, index) => {
        setShowWarning(true);
        setDeleteImg(img);
    };

    // Deletes image from database
    const handleConfirmDeleteImage = () => {
        setShowWarning(false)

        if (deleteImg) {
            const jwtToken = user.signInUserSession.accessToken.jwtToken;

            axios
                .delete(`${API_BASE_URL}plantsImages/${deleteImg.image_id}`, {
                    headers: {
                        'Authorization': `${jwtToken}`
                    }
                })
                .then((response) => {
                    // Filters out the deleted image from tempData.images
                    const updatedImages = tempData.images.filter(
                        (img) => img.image_id !== deleteImg.image_id
                    );

                    handleInputChange("images", updatedImages);
                    handleInputChange("image_links", updatedImages.map((image) => image.image_url));
                    handleInputChange("s3_keys", updatedImages.map((image) => image.s3_key));
                    setDeleteImg(null);
                    setShowWarning(false);
                })
                .catch((error) => {
                    console.error("Error deleting image", error);
                })
        } else {
            setShowWarning(false);
        }
    }

    // Ensures all required fields are present before editing alternative species
    const handleConfirmEditAlternativeSpecies = () => {
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
                {/* scientific name as the dialog title */}
                < DialogTitle style={{ display: "flex", backgroundColor: "#b7bf96", alignItems: "center", height: "60px" }}>
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
                        value={Array.isArray(tempData.scientific_name) ? tempData.scientific_name.join(', ') : tempData.scientific_name}
                        onChange={(e) => handleInputChange("scientific_name", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Common Name(s) (separate by commas)"
                        value={
                            Array.isArray(tempData.common_name)
                                ? tempData.common_name.join(", ")
                                : tempData.common_name
                        }
                        onChange={(e) => handleInputChange("common_name", e.target.value)}
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

                    <TextField
                        label="Resource links (separate by commas)"
                        value={
                            Array.isArray(tempData.resource_links)
                                ? tempData.resource_links.join(", ")
                                : tempData.resource_links
                        }
                        onChange={(e) =>
                            handleInputChange("resource_links", e.target.value.split(", "))
                        }
                        sx={{
                            width: "100%", marginBottom: "1rem"
                        }}
                    />

                    <TextField
                        multiline
                        label="Image links (separate by commas)"
                        onChange={(e) => {
                            handleInputChange("image_links", e.target.value.split(", "))
                        }
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
                            onChange={(e) => uploadImageFile(e, handleInputChange, tempData)}
                            sx={{ width: '100%' }}
                        />
                    </Box>

                    <Box sx={{ width: '100%', textAlign: 'left' }}>
                        {Array.isArray(tempData.images) &&
                            tempData.images.map((img, index) => (
                                <div key={img.image_id} sx={{ width: '90%', marginBottom: "2rem", textAlign: "left" }}>
                                    {/* Display image if image_url exists */}
                                    {img.image_url && (
                                        <img
                                            src={img.image_url}
                                            alt={`img.image_url${index}`}
                                            style={{ maxWidth: '60%', height: 'auto' }}
                                        />
                                    )}

                                    {/* Display image from S3 bucket if s3_key exists */}
                                    {img.s3_key && (
                                        <div>
                                            <img
                                                src={`${S3_BASE_URL}${img.s3_key}`}
                                                alt={`img.s3_key${index}`}
                                                style={{ maxWidth: '60%', height: 'auto' }}
                                            />
                                        </div>
                                    )}

                                    {/* Delete button for each image */}
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
                            handleSave(handleConfirmEditAlternativeSpecies());
                        }}
                    >Save</Button>
                </DialogActions>

            </Dialog >

            <SnackbarOnSuccess open={showSaveConfirmation} onClose={handleClose} text={"Saved successfully!"} />

        </div >
    );
};

export default EditAlternativeSpeciesDialog;
