import { TableHeaderLabel } from "./TableHeaderLabel";
import { TableHead, TableRow } from "@mui/material";

// Table header for Regions Page
export const RegionsPageTableHeader = () => {
    return (
        <TableHead>
            <TableRow>
                <TableHeaderLabel width_percentage={"10%"} label={"Region"} />
                <TableHeaderLabel width_percentage={"10%"} label={"Region Code"} />
                <TableHeaderLabel width_percentage={"10%"} label={"Country"} />
                <TableHeaderLabel width_percentage={"15%"} label={"Geographic Coordinates (latitude, longitude)"} />
                <TableHeaderLabel width_percentage={"5%"} label={"Actions"} />
            </TableRow>
        </TableHead>
    );
}