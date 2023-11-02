import { Dialog, DialogContent, TextField, Button, DialogActions, DialogTitle, Typography } from '@mui/material';

// modal where admin can edit species 
const EditSpeciesDialog = ({ open, tempData, handleSearchInputChange, handleFinishEditingRow, handleSave }) => {
    return (
        <div>
            < Dialog open={open} onClose={handleFinishEditingRow} >
                {/* scientific name as title */}
                < DialogTitle style={{ display: "flex", alignItems: "center" }
                }>
                    <Typography
                        variant="h5"
                        component="div"
                        style={{ fontStyle: "italic" }}
                    >
                        {tempData.scientificName}
                    </Typography>
                </DialogTitle >

                <DialogContent>
                    <TextField
                        label="Common Name (separate by commas)"
                        value={
                            Array.isArray(tempData.commonName)
                                ? tempData.commonName.join(", ")
                                : tempData.commonName
                        }
                        onChange={(e) => handleSearchInputChange("commonName", e.target.value)}
                        sx={{ width: "100%", marginTop: "1rem", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Description"
                        multiline
                        rows={6}
                        value={tempData.description}
                        onChange={(e) => handleSearchInputChange("description", e.target.value)}
                        sx={{ width: "100%", height: "200px" }}
                    />

                    <TextField
                        label="Alternative Species (separate by commas)"
                        value={
                            Array.isArray(tempData.alternatives)
                                ? tempData.alternatives.join(", ")
                                : tempData.alternatives
                        }
                        onChange={(e) =>
                            handleSearchInputChange("alternatives", e.target.value.split(", "))
                        }
                        sx={{ width: "100%", marginBottom: "1rem" }}
                    />

                    <TextField
                        label="Links (separate by commas)"
                        value={tempData.links?.join(", ")}
                        onChange={(e) =>
                            handleSearchInputChange("links", e.target.value.split(", "))
                        }
                        sx={{ width: "100%", marginBottom: "1rem" }}
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

export default EditSpeciesDialog;
