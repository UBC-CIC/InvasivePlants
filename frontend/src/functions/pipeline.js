import { webscrapeBCInvasive, webscrapeONInvasive } from "./webscrape";
import axios from 'axios';

const webscrapeInvasiveSpecies = async () => {
    const region = [];
    await Promise.all([webscrapeBCInvasive(), webscrapeONInvasive()]).then((res) => {
        res.map((res) => {
            if(res.BCInvasiveSpeciesPlants)
                region.push({
                    regionCode: "BC",
                    regionName: "British Columbia",
                    demographic: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Canada_British_Columbia_Density_2016.png/900px-Canada_British_Columbia_Density_2016.png",
                    invasiveSpeciesList: res.BCInvasiveSpeciesPlants
                });
            else if(res.ONInvasiveSpeciesPlants)
                region.push({
                    regionCode: "ON",
                    regionName: "Ontario",
                    demographic: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Canada_Ontario_Density_2016.png/800px-Canada_Ontario_Density_2016.png",
                    invasiveSpeciesList: res.ONInvasiveSpeciesPlants
                });
        });
    });

    console.log("Region: ", region);
    return region;
}

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


export {webscrapeInvasiveSpecies, flagedSpeciesToPlanetAPI};