import { TableCell } from "@mui/material";
import { boldText } from "../../functions/textFormattingUtils";

// Table cell for descriptions
export const DescriptionTableCell = ({ row }) => {
    return (
        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
            {boldText(row.species_description)}
        </TableCell>
    )
}