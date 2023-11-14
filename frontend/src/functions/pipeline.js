import { webscrapeBCInvasive, webscrapeONInvasive } from "./webscrape";
import axios from 'axios';
import { mapInvasiveToAlternativeBC, mapInvasiveToAlternativeON, getAlternativePlantsForDB } from "./alternativePlants"

const webscrapeInvasiveSpecies = async () => {
    const region = [];
    const res = await Promise.all([webscrapeBCInvasive(), webscrapeONInvasive()]);

    res.forEach((result) => {
        if (result.BCInvasiveSpeciesPlants) {
            region.push({
                region_code_name: "BC",
                region_fullname: "british_columbia",
                country_fullname: "canada",
                geographic_coordinate: "(53.726669, -127.647621)",
                invasive_species_list: result.BCInvasiveSpeciesPlants
            });
        } else if (result.ONInvasiveSpeciesPlants) {
            region.push({
                region_code_name: "ON",
                region_fullname: "ontario",
                country_fullname: "canada",
                geographic_coordinate: "(50.000000, -85.000000)",
                invasive_species_list: result.ONInvasiveSpeciesPlants
            });
        }
    });

    // Map the alternative species in
    await mapInvasiveToAlternative(region);

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
    let res = await getInvasiveSpeciesScientificNames(region[1]);
    let moreONInvasive = await mapInvasiveToAlternativeON();

    const moreONKeys = Object.keys(moreONInvasive);

    for (const key of moreONKeys) {
        if (!res.includes(key)) {
            res.push(key);
        }
    }

    return res;
};

// helper function to get scientific names of invasive species
const getInvasiveSpeciesScientificNames = async (region) => {
    const scientific_names = [];

    for (const species of region.invasiveSpeciesList) {
        if (species && species.scientificName) {
            const formattedName = species.scientificName.toLowerCase().replace(/ /g, '_');
            scientific_names.push(formattedName);
        } else {
            console.log("Scientific name not found for:", species);
        }
    }
    return scientific_names;
};

// helper function to get list of alternative species
const getListOfAlternativeSpecies = (speciesDataXRegion)=>{
    const listAlternativeSpecies = new Set();
    speciesDataXRegion.forEach((region)=>{
        region.invasive_species_list.forEach((species)=>{
            if(species.alternative_species.length > 0) 
                species.alternative_species.forEach(speciesItem => {
                    listAlternativeSpecies.add(speciesItem);
                });              
        });
    });

    return Array.from(listAlternativeSpecies);
}

// checks if species is invasive given location
const isInvasive = async (scientificName, location) => {
    scientificName = scientificName.toLowerCase().replace(/ /g, '_');
    console.log("isInvasive: ", scientificName);

    if (location === "BC") {
        let invasiveListBC = await getInvasiveSpeciesScientificNamesBC();
        console.log("BC invasive list: ", invasiveListBC);
        return invasiveListBC.includes(scientificName);
    } else if (location === "ON") {
        let invasiveListON = await getInvasiveSpeciesScientificNamesON();
        console.log("ON invasive list: ", invasiveListON);
        return invasiveListON.includes(scientificName);
    }
};

/**
 * 
 * @param speciesList - list of species to check against PlantNet API require to follow Invasive Species data structure
 * @returns - list of species that are invalid and species that could not detect by PlantNet API asynchronously
 */
const flagedSpeciesToPlanetAPI = async (speciesList) => {
    const speciesFlagged = [];

    // Make request to Pl@ntNet API for list of species
    const url = `https://my-api.plantnet.org/v2/species?api-key=${process.env.REACT_APP_PLANTNET_API_KEY}`;
    await axios.get(url)
        .then((response) => {
            speciesList.map((species) => {
                if(species.scientific_name.length > 0){

                    // Check scientific name against Pl@ntNet API
                    for(let i = 0; i < species.scientific_name.length; i++){
                        if(!response.data.find(s => s.scientificNameWithoutAuthor.toLowerCase().includes(species.scientific_name[i].replace(/_/g, ' ').trim()))){
                            speciesFlagged.push(species);
                            break;
                        }
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

    return speciesFlagged;
}

// Populate invasive species with its alternatives
const mapInvasiveToAlternative = async (speciesDataXRegion)=>{
    // Get list of alternative  speices
    const alternativeSpeciesList = await Promise.all([mapInvasiveToAlternativeBC(), mapInvasiveToAlternativeON()]);
    speciesDataXRegion.forEach((region)=>{
        const alternativeSpeciesList_ = (region.region_code_name === "BC") ? alternativeSpeciesList[0] : alternativeSpeciesList[1];
        region.invasive_species_list.forEach((species)=>{
            for(let i = 0; i < species.scientific_name.length; i++){
                const modifiedSciName = species.scientific_name[i].toLowerCase().replace(/\s+/g, '_').trim();
                const alternative = alternativeSpeciesList_[modifiedSciName];

                if(alternative){
                    species.alternative_species = alternative;
                    break;
                }
            }
        });
    });
}

// Full integration of flagging species
const fullIntegrationOfFlaggingSpecies = async (speciesData)=>{
    const flaggedSpecies = [];
    // const speciesData = await webscrapeInvasiveSpecies();

    const flaggedRegions = [];
    speciesData.forEach((region)=>{
        flaggedRegions.push(flagedSpeciesToPlanetAPI(region.invasive_species_list));
    });

    const flagged = await Promise.all(flaggedRegions);
    flagged.forEach((data) => {
        flaggedSpecies.push(...data);
    });

    console.log("Flagged species:", flaggedSpecies);

    return flaggedSpecies;
}

// Return an array of records for alternative species
const getAllAlternativePlantsForDB = async (speciesDataXRegion) => {
    try {
        const listAlternativeSpecies = await getListOfAlternativeSpecies(speciesDataXRegion);
        const requestCalls = [];

        listAlternativeSpecies.forEach(async (alternativeSpecies) => {
            requestCalls.push(getAlternativePlantsForDB(alternativeSpecies));
        });

        const listAlternativeSpeciesForDB = await Promise.all(requestCalls);

        return listAlternativeSpeciesForDB;
    } catch (error) {
        console.log(error);
    }

    return [];
}

const dataPipelineForDB = async () => {
    const regions_tb = [];
    const invasive_species_tb = [];
    const alternative_species_tb = [];

    // Get all data across region
    const speciesDataXRegion = await webscrapeInvasiveSpecies();
    const flaggedSpecies = await fullIntegrationOfFlaggingSpecies(speciesDataXRegion);

    // The flagged species should not be added, they need to be fixed first.
    console.log("Flagged species: ", flaggedSpecies);

    speciesDataXRegion.forEach((region) => {
        const scienceName = region.invasive_species_list.map((species)=> species.scientific_name[0]);

        regions_tb.push({
            region_code_name: region.region_code_name,
            region_fullname: region.region_fullname,
            country_fullname: region.country_fullname,
            geographic_coordinate: region.geographic_coordinate,
            invasive_species_list: scienceName
        });

        invasive_species_tb.push(...region.invasive_species_list);
    });

    // Get all alternative species
    const listAlternativeSpeciesForDB = await getAllAlternativePlantsForDB(speciesDataXRegion);
    alternative_species_tb.push(...listAlternativeSpeciesForDB);

    console.log("regions_tb: ", regions_tb);
    console.log("invasive_species_tb: ", invasive_species_tb);
    console.log("alternative_species_tb: ", alternative_species_tb);

    return {regions_tb, invasive_species_tb, alternative_species_tb};
}

export {
    webscrapeInvasiveSpecies, flagedSpeciesToPlanetAPI,
    getInvasiveSpeciesScientificNamesBC,
    getInvasiveSpeciesScientificNamesON,
    isInvasive,
    fullIntegrationOfFlaggingSpecies,
    dataPipelineForDB
};