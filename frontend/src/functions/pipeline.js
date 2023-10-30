import { webscrapeBCInvasive, webscrapeONInvasive } from "./webscrape";
import axios from 'axios';
import { mapInvasiveToAlternativeON } from "./alternativePlants"

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
    const url = `https://my-api.plantnet.org/v2/species?api-key=${process.env.REACT_APP_PLANTNET_API_KEY}`;
    await axios.get(url)
        .then((response) => {
            speciesList.map((species) => {
                if(species.scientific_name.length > 0){

                    // Check scientific name against Pl@ntNet API
                    for(let i = 0; i < species.scientific_name.length; i++){
                        if(!response.data.find(s => s.scientificNameWithoutAuthor.toLowerCase().includes(species.scientific_name[i].toLowerCase()))){
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

// Full integration of flagging species
const fullIntegrationOfFlaggingSpecies = async ()=>{
    const flaggedSpecies = [];
    const speciesData = await webscrapeInvasiveSpecies();

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

export {
    webscrapeInvasiveSpecies, flagedSpeciesToPlanetAPI,
    getInvasiveSpeciesScientificNamesBC,
    getInvasiveSpeciesScientificNamesON,
    isInvasive,
    fullIntegrationOfFlaggingSpecies
};