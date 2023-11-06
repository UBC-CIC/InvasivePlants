import React, { useState } from 'react';
import { Button } from '@mui/material';
import Container from '@mui/material/Container';

// icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Component imports
import MainPage from '../admin_pages/MainPage';
import SpeciesPage from '../admin_pages/SpeciesPage';
import RegionsPage from '../admin_pages/RegionsPage';
// import SpeciesPageTest from '../admin_pages/SpeciesPageDataGridTest';


export default function Dashboard() {

    // UI transition state functions
    const [viewSpecies, setViewSpecies] = useState(false);
    const [viewRegions, setViewRegions] = useState(false);

    return(
        <Container  >
            {/* Dashboard */}
            {
                !viewSpecies && !viewRegions &&
                <div >
                    <MainPage 
                            setViewSpecies={setViewSpecies}
                            setViewRegions={setViewRegions}
                    />
                    </div>
            }

            {/* View existing species */}
            {
                viewSpecies && !viewRegions &&
                <div >
                        <Button onClick={() => setViewSpecies(false)} startIcon={<ArrowBackIcon />} sx={{ color: '#5e8da6' }}>
                            Back
                        </Button>
                        <SpeciesPage />
                    </div>
            }
            
            {/* View existing regions */}
            {
                viewRegions && !viewSpecies &&
                <div>
                        <Button onClick={() => setViewRegions(false)} startIcon={<ArrowBackIcon />} sx={{ color: '#5e8da6' }}>
                            Back
                        </Button>
                        <RegionsPage />
                    </div>
            }
    </Container>
    );
}