import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@mui/material';
// Material UI imports
import Container from '@mui/material/Container';

// icons
import * as Icons from '@mui/icons-material';


// Component imports
import LoginPage from '../components/loginPage';
import MainPage from '../components/mainPage';
import AddSpeciesForm from '../components/addSpeciesInputs';
import { SpeciesTable } from '../components/speciesTable';

export default function Dashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // UI transition state functions
    const [viewSpeciesTable, setViewSpeciesTable] = useState(false);
    const [viewSpeciesForm, setViewAddSpeciesForm] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    return(
        <Container >
            {/* {isLoggedIn ? ( */}
        <React.Fragment>
            <Container fixed>
                
            {/* Main page */} 
            {/* This is the default view. */} 
            {/* It displays the main page. */} 
            {/* It can be changed to view the species table or the species form. */} 
            {/* The species form can be viewed by clicking the "Add Invasive species" button. */} 
            {/* The species table can be viewed by clicking the "View / Edit species table" button. */} 
            {!viewSpeciesTable && !viewSpeciesForm && 
                <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', height: '100vh', position: 'relative' }}>
                    <Button variant="contained" onClick={handleLogout} style={{ position: 'absolute', top: 20, right: 20 }}>
                        Logout
                    </Button>
                    <MainPage 
                        setViewSpeciesTable={setViewSpeciesTable}
                        setViewAddSpeciesForm={setViewAddSpeciesForm}
                    />
                 </Container>
            }

            {/* View table/list of existing species on the server. */}
            {viewSpeciesTable && !viewSpeciesForm &&
                        <div style={{ width: '100%' }}>
                            <Button onClick={() => setViewSpeciesTable(false)}>
                        <Icons.ArrowBack />
                                Back
                            </Button>

                            <SpeciesTable />
                        </div>
            }
            
            {/* Add a new species to the server. */}
            {viewSpeciesForm && !viewSpeciesTable &&
                    <div>
                        <Button onClick={() => setViewAddSpeciesForm(false)}>
                        <Icons.ArrowBack />
                        Back
                        </Button>
                        <AddSpeciesForm
                            setViewAddSpeciesForm={setViewAddSpeciesForm}
                />
                    </div>
            }
            </Container>
        </React.Fragment>
            {/* ) : (
             <LoginPage handleLogin={handleLogin} />
            )}  */}
    </Container>
    );
}