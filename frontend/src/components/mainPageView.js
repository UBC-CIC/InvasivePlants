import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';

export default function MainPage({setViewSpeciesTable, setViewSpeciesForm}){

    return (
        <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Box sx={{display:'flex', flexDirection: 'column'}}>
            <Button variant="contained" color="primary" sx={{ m: 1 }}>
            Web Scrape
            </Button>
            <Button variant="contained" color="primary" sx={{ m: 1 }} onClick={()=>{setViewSpeciesForm(true);}}>
            Add Species
            </Button>
            <Button variant="contained" color="primary" sx={{ m: 1 }} onClick={()=>{setViewSpeciesTable(true);}}>
            View List
            </Button>
        </Box>
        </Container>
    );
}