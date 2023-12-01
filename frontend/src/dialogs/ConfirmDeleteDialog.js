import { Alert, AlertTitle, Box, Dialog, Button } from "@mui/material";

// dialog that asks for user confirmation prior to deletion
const DeleteDialog = ({ open, handleClose, handleDelete }) => (
    <Dialog open={open} onClose={handleClose}>
        <Alert severity="warning">
            <AlertTitle>Confirm Delete</AlertTitle>
            Are you sure you want to <strong>delete this item?</strong>
            <Box sx={{ display: 'flex', marginTop: '5px', justifyContent: 'flex-end' }}>
                <Button onClick={handleClose}
                    sx={{
                        color: "#362502",
                        "&:hover": {
                            backgroundColor: "#dbc8a0"
                        }
                    }}>
                    Cancel
                </Button>
                <Button onClick={handleDelete} sx={{
                    color: "#362502",
                    "&:hover": {
                        backgroundColor: "#dbc8a0"
                    }
                }}>
                    Yes
                </Button>
            </Box>
        </Alert>
    </Dialog>

);

export default DeleteDialog;