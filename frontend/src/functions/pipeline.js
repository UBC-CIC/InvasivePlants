import { webscrapeBCInvasive, webscrapeONInvasive } from "./webscrape";
import axios from 'axios';
import { mapInvasiveToAlternativeON } from "./alternativePlants"

const webscrapeInvasiveSpecies = async () => {
    const region = [];
    const res = await Promise.all([webscrapeBCInvasive(), webscrapeONInvasive()]);

    res.forEach((result) => {
        if (result.BCInvasiveSpeciesPlants) {
            region.push({
                regionCode: "BC",
                regionName: "British Columbia",
                demographic: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Canada_British_Columbia_Density_2016.png/900px-Canada_British_Columbia_Density_2016.png",
                invasiveSpeciesList: result.BCInvasiveSpeciesPlants
            });
        } else if (result.ONInvasiveSpeciesPlants) {
            region.push({
                regionCode: "ON",
                regionName: "Ontario",
                demographic: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Canada_Ontario_Density_2016.png/800px-Canada_Ontario_Density_2016.png",
                invasiveSpeciesList: result.ONInvasiveSpeciesPlants
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
        if(!species.scientificName || species.scientificName === "" || !species.commonName || species.commonName === "")
            speciesFlagged.push(species);
    });

    return speciesFlagged
};

const flagedSpeciesToPlanetAPI = async (speciesList) => {
    const speciesFlagged = [];

    const speciesXregion = await webscrapeInvasiveSpecies();

    // Make request to Pl@ntNet API for list of species
    const url = "https://my-api.plantnet.org/v2/species" + `?api-key=2b1006HUEA8IFmECZopWtUh73e`;                           /////////// HARD CODED!!!
    await axios.get(url)
        .then((response) => {
            speciesXregion.map((region) => {
                region.invasiveSpeciesList.map((species) => {
                    // Split string into multiple strings
                    const scienceN = species.scientificName ? species.scientificName.split('&') : [];

                    if(species.scientificName){
                        scienceN.map((sci) => {
                            // Check based on scientific name and also common name
                            if(!response.data.find(s => s.scientificNameWithoutAuthor.toLowerCase().includes(sci.toLowerCase()))
                                || response.data.find(s => s.commonNames.some(str => str.toLowerCase().includes(sci.toLowerCase()))))
                                speciesFlagged.push(species);
                        });
                    } else {
                        speciesFlagged.push(species);
                    }
                }
                );
            });

            // Handle success, e.g., show a success message to the user.
            console.log('Species list: ', response.data);
        })
        .catch((error) => {
            console.error('Error requesting species list:', error);
            // Handle error, e.g., show an error message to the user.
        });

    console.log("speciesFlagged:", speciesFlagged);
    return speciesFlagged
}


export {
    webscrapeInvasiveSpecies, flagedSpeciesToPlanetAPI,
    getInvasiveSpeciesScientificNamesBC,
    getInvasiveSpeciesScientificNamesON,
    isInvasive
};