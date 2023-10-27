import { webscrapeBCInvasive, webscrapeONInvasive } from "./webscrape";
import axios from 'axios';
import { mapInvasiveToAlternativeON } from "./alternativePlants"

// Only for testing
import testData from "../testAssets/webscrapedInvasive.json";

const webscrapeInvasiveSpecies = async () => {
    const region = [];
    const res = await Promise.all([webscrapeBCInvasive(), webscrapeONInvasive()]);

    res.forEach((result) => {
        if (result.BCInvasiveSpeciesPlants) {
            region.push({
                region_code_name: "BC",
                region_fullname: "British Columbia",
                country_fullname: "Canada",
                geographic_coordinate: "(53.726669, -127.647621)",
                invasive_species_list: result.BCInvasiveSpeciesPlants
            });
        } else if (result.ONInvasiveSpeciesPlants) {
            region.push({
                region_code_name: "ON",
                region_fullname: "Ontario",
                country_fullname: "Canada",
                geographic_coordinate: "(50.000000, -85.000000)",
                invasive_species_list: result.ONInvasiveSpeciesPlants
            });
        }
    });

    return region;
}

// returns list of scientific names of invasive BC species
const getInvasiveSpeciesScientificNamesBC = async () => {
    let region = await webscrapeInvasiveSpecies();
    return await getInvasiveSpeciesScientificNames(region[0]);
};

// returns list of scientific names of invasive ON species
const getInvasiveSpeciesScientificNamesON = async () => {
    let region = await webscrapeInvasiveSpecies();
    return await getInvasiveSpeciesScientificNames(region[1]);
};

// helper function to get scientific names of invasive species
const getInvasiveSpeciesScientificNames = async (region) => {
    const scientific_names = [];

    for (const species of region.invasiveSpeciesList) {
        if (species && species.scientific_name) {
            scientific_names.push(species.scientific_name);
        } else {
            console.log("Scientific name not found for:", species);
        }
    }
    return scientific_names;
};

// checks if species is invasive given location
const isInvasive = async (commonName, scientificName, location) => {
    if (location === "BC") {
        let invasiveListBC = await getInvasiveSpeciesScientificNamesBC();
        return invasiveListBC.includes(scientificName);
    } else if (location === "ON") {
        let invasiveListON = await getInvasiveSpeciesScientificNamesON();
        // console.log("ON invasive list: ", invasiveListON);
        let map = mapInvasiveToAlternativeON();
        for (let name of commonName) {
            const transformedName = name.replace("-", "_").trim().toLowerCase().replace(/[^\w\s]/gi, '');
            const nameParts = transformedName.split('_');

            for (let part of nameParts) {
                if (part in map) {
                    console.log("Match found in map!", part);
                    return true;
                }
            }
        }
        return invasiveListON.includes(scientificName);
    }
};

const flagedSpeciesBasicInfo = (speciesList) => {
    const speciesFlagged = [];
    speciesList.map((species) => {
        if(!species.scientific_name || species.scientific_name === "" || !species.common_name || species.common_name === "")
            speciesFlagged.push(species);
    });

    return speciesFlagged
};

/**
 * 
 * @param speciesList - list of species to check against PlantNet API require to follow Invasive Species data structure
 * @returns - list of species that are invalid and species that could not detect by PlantNet API asynchronously
 */
const flagedSpeciesToPlanetAPI = async (speciesList) => {
    const speciesFlagged = [];

    // Make request to Pl@ntNet API for list of species
    const url = "https://my-api.plantnet.org/v2/species" + `?api-key=2b1006HUEA8IFmECZopWtUh73e`;                           /////////// HARD CODED!!!
    await axios.get(url)
        .then((response) => {
            speciesList.map((species) => {
                if(species.scientific_name){
                    // Check based on scientific name and also common name
                    // Common name notation: || response.data.find(s => s.commonNames.some(str => str.toLowerCase().includes(sci.toLowerCase())))
                    if(!response.data.find(s => s.scientificNameWithoutAuthor.toLowerCase().includes(species.scientific_name.toLowerCase()))){
                        speciesFlagged.push(species);
                    }
                } else {
                    speciesFlagged.push(species);
                }
            });
        })
        .catch((error) => {
            console.error('Error requesting species list:', error);
            // Handle error, e.g., show an error message to the user.
        });

    return speciesFlagged
}

/**** TESTING FUCTION ****/
const testDataPipeline = async ()=>{
    console.log("testData:", testData);
    const flaggedSpecies = [];
    await testData.map(async (region)=>{
        // Call flagged function
        const flaggedSpecies_i = await flagedSpeciesToPlanetAPI(region.invasive_species_list);
        flaggedSpecies.push(...flaggedSpecies_i);
    });

    console.log("Flagged species:", flaggedSpecies);
}

export {
    webscrapeInvasiveSpecies, flagedSpeciesToPlanetAPI,
    getInvasiveSpeciesScientificNamesBC,
    getInvasiveSpeciesScientificNamesON,
    isInvasive,
    testDataPipeline
};