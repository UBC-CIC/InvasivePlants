import { webscrapeWikipedia } from "./webscrapeWiki.js";
import { isInvasive } from "./pipeline.js";
import { getAlternativePlants } from "./alternativePlants.js";
import RegionMap from "./RegionMap.js";

// Returns species in proper json format
const speciesDataToJSON = async (commonName, scientificName, speciesScore, userLocation) => {
    const isInvasiveRes = await isInvasive(scientificName, userLocation);
    let alternative_plants = null;

    if (isInvasiveRes) {
        alternative_plants = await getAlternativePlants(scientificName, userLocation);
    }

    scientificName = scientificName.toLowerCase().replace(/\s+/g, '_').trim();
    let speciesInfo = {}

    // webscrape wiki if non invasive
    if (!isInvasiveRes) {
        speciesInfo = {
            commonName: commonName,
            scientificName: scientificName,
            speciesScore: speciesScore,
            isInvasive: isInvasiveRes,
            wikiInfo: await webscrapeWikipedia(scientificName),
            alternative_plants: alternative_plants,
            location: RegionMap[userLocation.toLowerCase()]
        };
    } else {
        // TODO: get from database if invasive
        speciesInfo = {
            commonName: commonName,
            scientificName: scientificName,
            speciesScore: speciesScore,
            isInvasive: isInvasiveRes,
            wikiInfo: await webscrapeWikipedia(scientificName),
            alternative_plants: alternative_plants,
            location: RegionMap[userLocation.toLowerCase()]
        };
    }

    return speciesInfo;
};

export { speciesDataToJSON };