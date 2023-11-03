import { useState, useEffect } from 'react';
import { Box, Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

const EditRegionsDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    const [savedMessage, setSavedMessage] = useState(false);

    useEffect(() => {
        if (savedMessage) {
            const timer = setTimeout(() => {
                setSavedMessage(false);
            }, 1700);
            return () => clearTimeout(timer);
        }
    }, [savedMessage]);

    return (
        <div>
            <Dialog open={open} onClose={handleFinishEditingRow}>
                <DialogTitle style={{ display: "flex", alignItems: "center" }}>
                    <Typography variant="h5" component="div">
                        {tempData.regionFullName}
                    </Typography>
                </DialogTitle>

                <DialogContent>
                    <TextField
                        label="Common Name"
                        value={tempData.regionCode}
                        onChange={(e) => handleSearchInputChange("regionCode", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Country"
                        value={tempData.country}
                        onChange={(e) => handleSearchInputChange("country", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleFinishEditingRow}>Cancel</Button>
                    <Button
                        onClick={() => {
                            handleSave();
                            setSavedMessage(true);
                        }}
                    >
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {savedMessage && (
                <Box style={{ position: 'absolute', top: '15px', right: '15px' }}>
                    <span style={{ position: 'relative', top: '-5px', marginRight: '5px' }}>Saved!</span>
                    <CheckCircleOutlineIcon />
                </Box>
            )}

        </div>
    );
};

export default EditRegionsDialog;
