import React, { useState } from 'react';
import { Button } from '@mui/material';
import Container from '@mui/material/Container';

// icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Component imports
import MainPage from './MainPage';
import InvasiveSpeciesPage from './InvasiveSpeciesPage';
import RegionsPage from './RegionsPage';

export default function Dashboard() {
    console.log("got to dashboard");

    // UI transition state functions
    const [viewSpecies, setViewSpecies] = useState(false);
    const [viewRegions, setViewRegions] = useState(false);

    return (
        <Container>
            <div>
                {/* Dashboard */}
                {!viewSpecies && !viewRegions && (
                    <div>
                        <MainPage
                            setViewSpecies={setViewSpecies}
                            setViewRegions={setViewRegions}
                        />
                        {/* <Tooltip title="Logout" arrow>
                            <Button style={{ position: 'absolute', top: 10, right: 10, color: '#5e8da6' }} onClick={handleLogout}>
                                <LogoutIcon />
                            </Button>
                        </Tooltip> */}
                    </div>
                )}

                {/* View existing species */}
                {viewSpecies && !viewRegions && (
                    <div>
                        <Button onClick={() => setViewSpecies(false)} startIcon={<ArrowBackIcon />} sx={{ color: '#5e8da6' }}>
                            Back
                        </Button>
                        <InvasiveSpeciesPage />
                    </div>
                )}

                {/* View existing regions */}
                {viewRegions && !viewSpecies && (
                    <div>
                        <Button onClick={() => setViewRegions(false)} startIcon={<ArrowBackIcon />} sx={{ color: '#5e8da6' }}>
                            Back
                        </Button>
                        <RegionsPage />
                    </div>
                )}
            </div>
        </Container>
    );
}
