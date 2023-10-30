import React, { useState, useEffect, useRef } from 'react';

// Material UI imports
import Container from '@mui/material/Container';

// Component imports
import MainPage from '../components/mainPageView';
import SpeciesTable from '../components/speciesTable';
import SpeciesForm from '../components/addSpeciesInputs';

// Helper functions imports
import {webscrapeInvasiveSpecies} from '../functions/pipeline';

export default function Dashboard() {
    // UI transition state functions
    const [viewSpeciesTable, setViewSpeciesTable] = useState(false);
    const [viewSpeciesForm, setViewSpeciesForm] = useState(false);

    // Data state functions
    const [webscrapedData, setWebscrapedData] = useState(null);

    useEffect(()=>{
        const asyncFunction = async ()=>{
            // Call webscraping function
            const webscraping = await webscrapeInvasiveSpecies();
            setWebscrapedData(webscraping);
    
            console.log("webscrapedData: ", webscraping);
        };

        asyncFunction();

    },[]);

    return(
        <React.Fragment>
            <Container fixed>
            {/* Main page */} 
            {/* This is the default view. */} 
            {/* It displays the main page. */} 
            {/* It can be changed to view the species table or the species form. */} 
            {/* The species table can be viewed by clicking the "View species table" button. */} 
            {/* The species form can be viewed by clicking the "Add species" button. */} 
            {/* The species table can be viewed by clicking the "View species table" button.  */}
            {!viewSpeciesTable && !viewSpeciesForm && 
                <MainPage 
                setViewSpeciesTable = {setViewSpeciesTable}
                setViewSpeciesForm = {setViewSpeciesForm}
                />
            }

            {/* View list of existing species on the server. */}
            {viewSpeciesTable && !viewSpeciesForm &&
                <SpeciesTable 
                data = {webscrapedData}
                setData = {setWebscrapedData}
                />
            }
            
            {/* Add a new species to the server. */}
            {viewSpeciesForm && !viewSpeciesTable &&
                <SpeciesForm 
                setViewSpeciesForm = {setViewSpeciesForm}
                />
            }

            </Container>
        </React.Fragment>
    );
}