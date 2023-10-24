import { webscrapeBCInvasive, webscrapeONInvasive } from "./webscrape";

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

export {webscrapeInvasiveSpecies};