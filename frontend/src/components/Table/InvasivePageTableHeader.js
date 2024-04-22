import { TableHeaderLabel } from "./TableHeaderLabel";
import { TableHead, TableRow } from "@mui/material";

// Table header for Invasive Species Page
export const InvasivePageTableHeader = () => {
    return (
        <TableHead>
            <TableRow>
                <TableHeaderLabel width_percentage={"8%"} label={"Scientific Name(s)"} />
                <TableHeaderLabel width_percentage={"7%"} label={"Common Name(s)"} />
                <TableHeaderLabel width_percentage={"35%"} label={"Description"} />
                <TableHeaderLabel width_percentage={"10%"} label={"Alternative Species"} />
                <TableHeaderLabel width_percentage={"10%"} label={"Resource Links"} />
                <TableHeaderLabel width_percentage={"6%"} label={"Region(s)"} />
                <TableHeaderLabel width_percentage={"8%"} label={"Images"} />
                <TableHeaderLabel width_percentage={"3%"} label={"Actions"} />
            </TableRow>
        </TableHead>
    );
}