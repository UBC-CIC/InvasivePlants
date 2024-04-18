import { Tooltip, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

// Delete button
export const DeleteButton = ({ handleDeleteRow, row }) => (
    <Tooltip
        title="Delete"
        onClick={() => handleDeleteRow(row.species_id, row)}>
        <IconButton> <DeleteIcon /></IconButton>
    </Tooltip>
);