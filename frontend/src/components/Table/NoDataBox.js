import { Box } from "@mui/material";

// Message box when there is no data to display
export const NoDataBox = ({ data }) => { // Destructure data directly here
    return (
        <Box style={{ margin: 'auto', textAlign: 'center' }}>
            No {data} found
        </Box>
    )
}