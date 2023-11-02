import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

export default function MainPage({ setViewSpeciesTable, setViewAddSpeciesForm }) {
    return (
        <Container maxWidth="md">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '100px', marginBottom: '40px' }}>
                <Typography variant="h4" sx={{ textAlign: 'center' }}>
                    Invasive Species Management System
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Button variant="contained" color="primary" sx={{ width: '300px', height: '300px' }} onClick={() => { setViewAddSpeciesForm(true); }}>
                    Add Species
                </Button>
                <Button variant="contained" color="primary" sx={{ width: '300px', height: '300px' }} onClick={() => { setViewSpeciesTable(true); }}>
                    View / Edit Species
                </Button>
            </Box>
        </Container>
    );
}
