import { createTheme, alpha } from '@mui/material';

const Theme = createTheme({
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    backgroundColor: alpha('#699cb8', 0.9),
                    '&:hover': {
                        backgroundColor: '#5e8da6',
                    },
                },
            },
        },
    },
});

export default Theme;
