import { alpha } from '@mui/material';
import { createTheme } from '@mui/material/styles';

const Theme = createTheme({
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    backgroundColor: alpha('#607c3c', 0.9),
                    '&:hover': {
                        backgroundColor: '#809c13',
                    },
                },
            },
        },
    },
});

export default Theme;
