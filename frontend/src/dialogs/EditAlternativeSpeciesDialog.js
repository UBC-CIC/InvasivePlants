import { useState } from 'react';
import { Box, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import SnackbarOnSuccess from '../components/SnackbarComponent';
import CustomAlert from '../components/AlertComponent';
import DeleteDialog from '../dialogs/ConfirmDeleteDialog';
import { Auth } from "aws-amplify";
import axios from "axios";

// dialog for editing an alternative species
const EditAlternativeSpeciesDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

    const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
    const [user, setUser] = useState("");

    // gets current authorized user
    const retrieveUser = async () => {
        try {
            const returnedUser = await Auth.currentAuthenticatedUser();
            setUser(returnedUser);
            console.log("current user: ", returnedUser);
        } catch (e) {
            console.log("error getting user: ", e);
        }
    }

    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setShowSaveConfirmation(false);
    };

    // hanldes user uploaded image files
    const handleImageUpload = async (e) => {
        const files = e.target.files;
        let uploadResponse;

        if (files) {
            let s3Keys = tempData.s3_keys ? [...tempData.s3_keys] : [];

            try {
                for (let i = 0; i < files.length; i++) {
                    const signedURLResponse = await axios
                        .get(`${API_ENDPOINT}/getS3SignedURL`, {
                            params: {
                                contentType: files[i].type,
                                filename: files[i].name
                            },
                            headers: {
                                'x-api-key': process.env.REACT_APP_X_API_KEY
                            }
                        });

                    console.log("signed url response: ", signedURLResponse)

                    if (!signedURLResponse.data.uploadURL) {
                        continue;
                    }

                    const signedURLData = signedURLResponse.data;

                    console.log("signed url data: ", signedURLData)

                    // use the obtained signed URL to upload the image
                    uploadResponse = await axios.put(signedURLData.uploadURL, files[i], {
                        headers: {
                            'Content-Type': files[i].type
                        }
                    });

                    console.log("upload response: ", uploadResponse)

                    // Image uploaded successfully, add its s3 key to the list
                    if (signedURLData.key) {
                        s3Keys.push(signedURLData.key);
                    }
                }

                console.log("s3keys: ", s3Keys)

                // Update the state or handle the uploaded image s3 keys
                handleSearchInputChange('s3_keys', s3Keys);

            } catch (error) {
                console.error('Error uploading images:', error);
            }
        }
    };

    const [showWarning, setShowWarning] = useState(false);
    const [deleteImg, setDeleteImg] = useState(null);

    const handleImageDelete = (img, index) => {
        setShowWarning(true);
        setDeleteImg(img);
    };


    const handleConfirmDeleteImage = () => {
        console.log("img to delete: ", deleteImg)
        setShowWarning(false)

        // remove the image from the database
        if (deleteImg) {
            retrieveUser();
            const jwtToken = user.signInUserSession.accessToken.jwtToken;

            axios
                .delete(`${API_ENDPOINT}plantsImages/${deleteImg.image_id}`, {
                    headers: {
                        'Authorization': `${jwtToken}`
                    }
                })
                .then((response) => {
                    // Filter out the deleted image from tempData.images
                    const updatedImages = tempData.images.filter(
                        (img) => img.image_id !== deleteImg.image_id
                    );
                    console.log("updatedImages: ", updatedImages);
                    handleSearchInputChange("images", updatedImages);
                    handleSearchInputChange("image_links", updatedImages.map((image) => image.image_url));
                    handleSearchInputChange("s3_keys", updatedImages.map((image) => image.s3_key));
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
                        sx={{
                            width: "100%", marginBottom: "1rem"
                        }}
                    />


                    <TextField
                        multiline
                        label="Image links (separate by commas)"
                        // value={
                        //     Array.isArray(tempData.image_links)
                        //         ? tempData.image_links.join(", ")
                        //         : tempData.image_links
                        // }
                        onChange={(e) => {
                            handleSearchInputChange("image_links", e.target.value.split(", "))
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
                            onChange={handleImageUpload}
                            sx={{ width: '100%' }}
                        />
                    </Box>

                    <Box sx={{ width: '100%', textAlign: 'left' }}>
                        {/* {console.log("tempdata in images:", tempData)} */}
                        {Array.isArray(tempData.images) &&
                            tempData.images.map((img, index) => (
                                <div key={img.image_id} sx={{ width: '90%', marginBottom: "2rem", textAlign: "left" }}>
                                    {/* Display image if image_url exists */}
                                    {img.image_url && (
                                        <img
                                            src={img.image_url}
                                            alt={`image-${index}`}
                                            style={{ maxWidth: '60%', height: 'auto' }}
                                        />
                                    )}

                                    {/* Display image from S3 bucket if s3_key exists */}
                                    {img.s3_key && (
                                        <div>
                                            <img
                                                src={`https://d123pl6gvdlen1.cloudfront.net/${img.s3_key}`}
                                                alt={`image-${index}`}
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
