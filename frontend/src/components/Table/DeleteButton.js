import { Tooltip, IconButton } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';

// Delete button
export const DeleteButton = ({ handleDeleteRow, row }) => (
    <Tooltip
        title="Delete"
        onClick={() => {
            if (row.hasOwnProperty('species_id')) {
                handleDeleteRow(row.species_id, row);
            } else if (row.hasOwnProperty('region_id')) {
                handleDeleteRow(row.region_id, row);
            }
        }}
    >
        <IconButton> <DeleteIcon /></IconButton>
    </Tooltip>
);