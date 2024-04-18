import { TableCell } from "@mui/material";

// Table cell for resource links
export const ResourceLinksCell = ({ row }) => {
    return (
        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
            {row.resource_links.map((link, index) => (
                <span key={index}>
                    <a href={link} target="_blank" rel="noopener noreferrer">
                        {link}
                    </a>
                    <br />
                    <br />
                </span>
            ))}
        </TableCell>
    )
}