import React from 'react';
import { Button, Box, Container, Typography } from '@mui/material';
import { ThemeProvider } from '@mui/system';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import YardIcon from '@mui/icons-material/Yard';
import Theme from './Theme';

const MainPage = ({ setViewSpecies, setViewRegions }) => {
    return (
        <ThemeProvider theme={Theme}>
            <Container>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', marginBottom: '40px' }}>
                    <Typography variant="h4" sx={{ textAlign: 'center' }}>
                        Invasive Species Management System
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Button variant="contained" color="primary" sx={{
                        width: '300px',
                        height: '300px',
                    }}
                        onClick={() => { setViewSpecies(true); }}
                        startIcon={<YardIcon />}>
                        Species
                    </Button>
                    <Button variant="contained" color="primary" sx={{
                        width: '300px',
                        height: '300px',
                    }}
                        onClick={() => { setViewRegions(true); }}
                        startIcon={<TravelExploreIcon />}>
                        Regions
                    </Button>
                </Box>
            </Container>
        </ThemeProvider>
    );
}

export default MainPage;
