import { webscrapeWikipedia } from "./webscrapeWiki.js";
import { isInvasive } from "./pipeline.js";
import { getAlternativePlants } from "./alternativePlants.js";


const speciesDataToJSON = async (commonName, scientificName, speciesScore, userLocation) => {
    const isInvasiveRes = await isInvasive(scientificName, userLocation);
    let alternative_plants = null;

    if (isInvasiveRes) {
        alternative_plants = await getAlternativePlants(commonName, scientificName, userLocation);
    }

    const speciesInfo = {
        commonName: commonName,
        scientificName: scientificName,
        speciesScore: speciesScore,
        isInvasive: isInvasiveRes,
        wikiInfo: await webscrapeWikipedia(scientificName),
        alternative_plants: alternative_plants
    };

    return speciesInfo;
};

export { speciesDataToJSON };