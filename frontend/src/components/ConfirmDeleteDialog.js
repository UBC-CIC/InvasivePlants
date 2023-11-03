import { Dialog, DialogActions, DialogTitle, DialogContent, DialogContentText, Button } from "@mui/material";

const DeleteDialog = ({ open, handleClose, handleDelete }) => (
    <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
            <DialogContentText>
                Are you sure you want to delete this item?
            </DialogContentText>
        </DialogContent>
        <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button onClick={handleDelete}>Delete</Button>
        </DialogActions>
    </Dialog>
);

export default DeleteDialog;