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
import {initialData, SpeciesTable} from '../components/speciesTable';


// Helper functions imports
// import {webscrapeInvasiveSpecies} from '../functions/pipeline';

export default function Dashboard() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // UI transition state functions
    const [viewSpeciesTable, setViewSpeciesTable] = useState(false);
    const [viewSpeciesForm, setViewAddSpeciesForm] = useState(false);
    // const [viewSpeciesEditForm, setViewSpeciesEditForm] = useState(false);

    // Data state functions
    // const [webscrapedData, setWebscrapedData] = useState(null);

    const handleLogin = () => {
        setIsLoggedIn(true);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
    };

    // useEffect(()=>{
    //     const asyncFunction = async ()=>{
    //         // Call webscraping function
    //         const webscraping = await webscrapeInvasiveSpecies();
    //         setWebscrapedData(webscraping);
    
    //         console.log("webscrapedData: ", webscraping);
    //     };

    //     asyncFunction();

    // },[]);

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
                    <div>
                        <Button onClick={() => setViewSpeciesTable(false)}>
                        <Icons.ArrowBack />
                        Back
                        </Button>

                <SpeciesTable 
                // data = {initialData()}
                // setData = {initialData()}
                />
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
        )} */}
    </Container>
    );
}