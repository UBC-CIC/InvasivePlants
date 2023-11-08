import React, { useState, useEffect } from 'react';
import { Button, Tooltip } from '@mui/material';
import Container from '@mui/material/Container';

// icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LogoutIcon from '@mui/icons-material/Logout';

// Component imports
import MainPage from '../admin_pages/MainPage';
import SpeciesPage from '../admin_pages/SpeciesPage';
import RegionsPage from '../admin_pages/RegionsPage';
// import LoginPage from '../admin_pages/LoginPage'; 
import Login from "../Components/Authentication/Login_material"
// import Error404 from "../Components/error404"


export default function Dashboard() {
    // const [isLoggedIn, setIsLoggedIn] = useState(false); // State for managing login status

    // UI transition state functions
    const [viewSpecies, setViewSpecies] = useState(false);
    const [viewRegions, setViewRegions] = useState(false);

    // const handleLogin = () => {
    //     setIsLoggedIn(true);
    // };

    // const handleLogout = () => {
    //     setIsLoggedIn(false);
    // };

    return (
        <Container>
            {/* {isLoggedIn ? ( */}
            <div>
                {/* Dashboard */}
                {!viewSpecies && !viewRegions && (
                    <div>
                        {/* <Login logo={"custom"} type={"image"} themeColor={"standard"} animateTitle={true}
                            title={"Welcome to Syllabus App"} darkMode={true}
                            disableSignUp={true}
                        /> */}
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
                        <SpeciesPage />
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
            {/* ) : (
                <LoginPage handleLogin={handleLogin} />
            )} */}
        </Container>
    );
}
