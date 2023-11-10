import { useState, useEffect } from 'react';
import { Box, AlertTitle, TableCell, Alert, Snackbar, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';

const EditAlternativeSpeciesDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
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

    const handleImageDelete = (index) => {
        const updatedImageLinks = tempData.image_links.filter(
            (image, i) => i !== index
        );
        handleSearchInputChange("image_links", updatedImageLinks);
    };

    const [showAlert, setShowAlert] = useState(false);
    const handleConfirmAddAlternativeSpecies = () => {
        if (!tempData.alternativeScientificName || tempData.alternativeScientificName.trim() === "") {
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
                        {tempData.alternativeScientificName}
                    </Typography>
                </DialogTitle >

                <DialogContent style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <TextField
                        label="Scientific Name"
                        value={tempData.alternativeScientificName}
                        onChange={(e) => handleSearchInputChange("alternativeScientificName", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Common Name(s) (separate by commas)"
                        value={
                            Array.isArray(tempData.alternativeCommonName)
                                ? tempData.alternativeCommonName.join(", ")
                                : tempData.alternativeCommonName
                        }
                        onChange={(e) => handleSearchInputChange("alternativeCommonName", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Description"
                        multiline
                        rows={6}
                        value={tempData.description}
                        onChange={(e) => handleSearchInputChange("description", e.target.value)}
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Resource links (separate by commas)"
                        value={tempData.resource_links?.join(", ")}
                        onChange={(e) =>
                            handleSearchInputChange("resource_links", e.target.value.split(", "))
                        }
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />


                    <div sx={{ marginBottom: "2rem" }}>
                        <Typography variant="body1" sx={{ marginBottom: "3px", justifyContent: "left" }}>
                            Upload Images:
                        </Typography>
                        <input
                            type="file"
                            multiple
                            onChange={handleImageUpload}
                            sx={{ marginBottom: "2rem", textAlign: "left" }}
                        />
                    </div>
                    <div sx={{ marginTop: "2rem" }}>
                        {Array.isArray(tempData.image_links) &&
                            tempData.image_links.map((imageName, index) => (
                                <div key={index}>
                                    <p>{imageName}</p>
                                    <img src={imageName} alt={`image-${index}`} />
                                    <button onClick={() => handleImageDelete(index)}>Delete</button>
                                </div>
                            ))}
                    </div>


                </DialogContent>


                <Dialog open={showAlert} onClose={() => setShowAlert(false)}   >
                    <CustomAlert onClose={() => setShowAlert(false)} />
                </Dialog>


                <DialogActions>
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button
                        onClick={() => {
                            // handleSave();
                            // setShowSaveConfirmation(true);
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
