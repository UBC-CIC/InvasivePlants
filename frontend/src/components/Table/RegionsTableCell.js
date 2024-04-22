import { TableCell } from "@mui/material";

// Table cell for descriptions
export const RegionsTableCell = ({ row }) => {
    return (
        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
            {Array.isArray(row.region_code_names)
                ? row.region_code_names.join(", ")
                : row.region_code_names}
        </TableCell>
    )
}