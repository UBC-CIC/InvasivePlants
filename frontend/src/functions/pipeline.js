import { webscrapeBCInvasive, webscrapeONInvasive } from "./webscrape";
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
    return await getInvasiveSpeciesScientificNames(region[1]);
};

// helper function to get scientific names of invasive species
const getInvasiveSpeciesScientificNames = async (region) => {
    const scientific_names = [];

    for (const species of region.invasiveSpeciesList) {
        if (species && species.scientificName) {
            scientific_names.push(species.scientificName);
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

export {
    webscrapeInvasiveSpecies,
    getInvasiveSpeciesScientificNamesBC,
    getInvasiveSpeciesScientificNamesON,
    isInvasive
};