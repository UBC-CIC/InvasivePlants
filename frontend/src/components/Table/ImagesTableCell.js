import { TableCell } from "@mui/material";

// Table cell for images
export const ImagesTableCell = ({ row }) => {
    const S3_BASE_URL = process.env.REACT_APP_S3_BASE_URL;

    return (
        <TableCell sx={{ whiteSpace: 'normal', wordWrap: 'break-word', textAlign: 'left', verticalAlign: 'top' }}>
            {row.image_links.map((link, index) => (
                <span key={index}>
                    <img
                        src={link}
                        alt={`${link}`}
                        style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                    />
                    {row.s3_keys && row.s3_keys[index] && (
                        <span>
                            <img
                                src={`${S3_BASE_URL}${row.s3_keys[index]}`}
                                alt={`${row.s3_keys[index]}`}
                                style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto' }}
                            />
                        </span>
                    )}
                    <br />
                </span>
            ))}
        </TableCell>
    )
}