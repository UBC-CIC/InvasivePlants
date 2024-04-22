
import { EditButton } from "./EditButton";
import { DeleteButton } from "./DeleteButton";
import { TableCell } from "@mui/material";

// Edit and Delete buttons
export const ActionButtons = ({ editRow, deleteRow, row }) => (
    <TableCell>
        <EditButton
            handleEditRow={editRow}
            row={row}
        />

        <DeleteButton
            handleDeleteRow={deleteRow}
            row={row}
        />
    </TableCell>
);
