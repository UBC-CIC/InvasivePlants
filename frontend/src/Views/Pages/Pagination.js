import React, { useState, useEffect } from 'react';
import axios from 'axios';
import data from '../../test_data/invasiveSpeciesData';

function handleGetInvasiveSpecies(input) {
    const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

    // request to GET invasive species
    axios
        .get(`${API_ENDPOINT}invasiveSpecies`, {
            params: {
                last_species_id: input
            }
        })
        .then((response) => {
            console.log("Invasive species retrieved successfully", response.data);
        })
        .catch((error) => {
            console.error("Error retrieving invasive species", error);
        });
}

function PaginationTest() {
    useEffect(() => {
        console.log("lenght: ", data.length)
        // handleGetInvasiveSpecies("68468efe-95cd-4798-8e0e-233f228c2c83"); // Executes on component mount
    }, []);

    // return (
    // < div >
    // {/* Component JSX */ }
    // </div >
    // );
}

export { PaginationTest };
