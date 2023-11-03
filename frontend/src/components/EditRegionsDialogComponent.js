import { Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';

// modal where admin can edit species 
const EditRegionsDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    return (
        <div>
            < Dialog open={open} onClose={handleFinishEditingRow} >
                < DialogTitle style={{ display: "flex", alignItems: "center" }
                }>
                    <Typography
                        variant="h5"
                        component="div">
                        {tempData.regionFullName}
                    </Typography>
                </DialogTitle >

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
                    <Button onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog >
        </div >
    );
};

export default EditRegionsDialog;
