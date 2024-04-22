import { Tooltip, IconButton } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';

// Edit button
export const EditButton = ({ handleEditRow, row }) => (
    <Tooltip title="Edit"
        onClick={() => handleEditRow(row)}>
        <IconButton><EditIcon /></IconButton>
    </Tooltip>
);