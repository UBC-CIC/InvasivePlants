import React from 'react';
import { Button, Box, Container, Typography, createTheme, ThemeProvider } from '@mui/material';

import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import YardIcon from '@mui/icons-material/Yard';


const MainPage = ({ setViewSpecies, setViewRegions }) => {
    return (
        <Container>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', marginBottom: '40px' }}>
                <Typography variant="h4" sx={{ textAlign: 'center' }}>
                    Invasive Species Management System
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Button variant="contained" color="primary" sx={{
                    width: '300px',
                    height: '300px'
                }}
                    onClick={() => { setViewSpecies(true); }}
                    startIcon={<YardIcon />}>
                    Species
                </Button>
                <Button variant="contained" color="primary" sx={{
                    width: '300px',
                    height: '300px'
                }}
                    onClick={() => { setViewRegions(true); }}
                    startIcon={<TravelExploreIcon />}>
                    Regions
                </Button>
            </Box>
        </Container>
    );
}

export default MainPage;
