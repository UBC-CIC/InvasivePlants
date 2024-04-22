import { TableHeaderLabel } from "./TableHeaderLabel";
import { TableHead, TableRow } from "@mui/material";

// Table header for Alternative Species Page
export const AlternativePageTableHeader = () => {
    return (
        <TableHead>
            <TableRow>
                <TableHeaderLabel width_percentage={"8%"} label={"Scientific Name(s)"} />
                <TableHeaderLabel width_percentage={"10%"} label={"Common Name(s)"} />
                <TableHeaderLabel width_percentage={"35%"} label={"Description"} />
                <TableHeaderLabel width_percentage={"12%"} label={"Resource Links"} />
                <TableHeaderLabel width_percentage={"10%"} label={"Images"} />
                <TableHeaderLabel width_percentage={"5%"} label={"Actions"} />
            </TableRow>
        </TableHead>
    );
}