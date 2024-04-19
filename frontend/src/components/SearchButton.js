import Theme from "../Views/Pages/Theme";
import { Button, ThemeProvider } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';

export const SearchButton = ({ getDataAfterSearch }) => {
    return (
        <ThemeProvider theme={Theme}>
            <Button variant="contained" onClick={() => getDataAfterSearch()} style={{ marginLeft: "20px", marginTop: "27px", width: "10%", height: "53px", alignItems: "center" }}>
                <SearchIcon sx={{ marginRight: '0.8rem' }} />Search
            </Button>
        </ThemeProvider>
    )
}