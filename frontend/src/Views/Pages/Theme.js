import { alpha } from '@mui/material';
import { createTheme } from '@mui/material/styles';

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
