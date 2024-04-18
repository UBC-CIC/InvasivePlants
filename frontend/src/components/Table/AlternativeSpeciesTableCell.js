import { TableCell } from "@mui/material";

// Table cell for descriptions
export const AlternativeSpeciesTableCell = ({ row }) => {
    return (
        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
            {Array.isArray(row.alternative_species)
                ? row.alternative_species.map((item) => item.scientific_name).join(", ")
                : row.alternative_species}
        </TableCell>
    )
}