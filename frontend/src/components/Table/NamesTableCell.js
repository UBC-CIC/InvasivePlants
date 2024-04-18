import { TableCell } from "@mui/material";

// Table cell for names (scientific name or common name)
export const NamesTableCell = ({ name }) => {
    return (
        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
            {Array.isArray(name) ? name.join(", ") : name}
        </TableCell>
    )
}