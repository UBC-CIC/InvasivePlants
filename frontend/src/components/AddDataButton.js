import Theme from "../Views/Pages/Theme";
import { Button, ThemeProvider } from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

export const AddDataButton = ({ setOpenDialog, text }) => {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <ThemeProvider theme={Theme}>
                <Button variant="contained" onClick={() => setOpenDialog(true)} startIcon={<AddCircleOutlineIcon />}>
                    {text}
                </Button>
            </ThemeProvider>
        </div>
    )
}