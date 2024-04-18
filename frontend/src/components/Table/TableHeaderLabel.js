import { TableCell, Typography } from "@mui/material"

// Table header labels
export const TableHeaderLabel = ({ width_percentage, label }) => {
    return (
        <TableCell style={{ width: width_percentage }}>
            <Typography variant="subtitle1" fontWeight="bold">
                {label}
            </Typography>
        </TableCell>
    )
}