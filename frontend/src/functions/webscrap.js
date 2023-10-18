import * as cheerio from 'cheerio';
import axios from 'axios';
import {jsonrepair} from 'jsonrepair';

// List of website to links to invasive species website
const BC_INVASIVE_URL = 'https://bcinvasives.ca/take-action/identify/';
const ON_INVASIVE_URL = 'https://www.ontarioinvasiveplants.ca/invasive-plants/species/';


/**
 * 
 * This function only webscrap on the https://bcinvasives.ca/ and collect the following:
 *  - List of invasive species
 *  - Each species about section
 *  - How to identrify section
 */
const webscrapBCInvasive = async () => {
    // Get the list of invasive species
    const speciesList = await getListOfSpeciesFromBCInvasive(BC_INVASIVE_URL);

    // Go to each subpage and webscrape the about section and how to identify section
    // .invansive-about
    // .invasive-identify > .font-base
    Promise.all(speciesList.BCInvasiveSpeciesPlants.map(async (specie, index) => {
        axios.get(specie.link).then(async (response) => {
            const $ = await cheerio.load(response.data);
            
            // Get About section of the species
            let aboutSection = "";
            await $('div.invansive-about >p').each((i, ele) => {
                aboutSection += $(ele).text() + '\n';
            });
    
            // Get How to identify section of the species
            let howToIdentifySection = "";
            await $('div.invasive-identify div.font-base > p').each((i, ele) => {
                howToIdentifySection += $(ele).text() + '\n';
            });
            
            speciesList.BCInvasiveSpeciesPlants[index].aboutSection = aboutSection;
            speciesList.BCInvasiveSpeciesPlants[index].howToIdentifySection = howToIdentifySection;
        }).catch((err) => {
            console.log(err);
        });
    }));

    console.log(speciesList);

    return speciesList;
};

// Helper Function to get a list of invasive species
const getListOfSpeciesFromBCInvasive = async (url) => {
    const output = {
        BCInvasiveSpeciesPlants: [],
        BCInvasiveSpeciesAnimals: []    
    }

    /** 
     * 
     * This is only for development purpose. The request will go through a third party proxy, corsProxyUrl.
     * This need to be changed when working with production.
     */
    const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';

    // Scraping list of all species
    await axios.get(url).then(async (response) => {
        const $ = await cheerio.load(response.data);

        // Get species links
        const speciesLinks = {};
        await $('header.invasive-header > a').each((i, ele) => {
            const link = $(ele).attr('href');
            const scienceName = $(ele).children('div').text();

            speciesLinks[scienceName] = link;
        });

        // Get species data summary
        const regex = /window\.__invasivesList\.push\(JSON\.parse\(\'(.*?)\'\)\);/;
        await $('script:contains("window.__invasivesList.push")').each((i, ele) => {
            const stringFormat = $(ele).text();
            const match = stringFormat.match(regex);
            
            if(match && match[1]){            
                try {
                    // Repaire JSON formate before parse it.
                    const repairedJSON = jsonrepair(match[1]);
                    const paredJSON = JSON.parse(repairedJSON);

                    // Add link to species
                    paredJSON.link = speciesLinks[paredJSON.species];

                    if(paredJSON.animal_type === ""){
                        output.BCInvasiveSpeciesPlants.push(paredJSON);
                    } else {
                        output.BCInvasiveSpeciesAnimals.push(paredJSON);
                    }
                } catch (error) {
                    console.log(error);
                    return ;
                }
            }
        });
    }).catch(err => {
        console.log(err);
    })

    return output;
};


/**
 * 
 * This function only webscrap on the https://www.ontarioinvasiveplants.ca/ and collect the following:
 *  - List of invasive species
 *  - Each species about section
 *  - Link to PDFs ...
 */
const webscrapONInvasive = async () => {
    // Get the list of invasive species
    const speciesList = await getListOfSpeciesFromONInvasive(ON_INVASIVE_URL);

    Promise.all(speciesList.ONInvasiveSpeciesPlants.map(async (specie, index) => {
        // Go to each subpage and webscrape the about section and references on the species
        axios.get(specie.link).then(async (response) => {
            const $ = await cheerio.load(response.data);
            
            // Get about section of the species and related documents
            let aboutSection = "";
            const relatedDocuments = [];

            await $('div.entry-content').contents().each((i, ele) => {
                if($(ele).is('p')){
                    // Potential about section
                    const pString = $(ele).text();

                    if(!pString.includes("For more information") && !pString.includes("download")){
                        aboutSection += $(ele).text();
                    }
                } else if($(ele).is('ul')){
                    // Potential block for list of related about section
                    $(ele).children('li').each((i, ele) => {
                        aboutSection += "\n* " + $(ele).text();
                    });
                } else if($(ele).is('div')){
                    // Potential block for PDF
                    $(ele).children('a').each((i, ele) => {
                        if(!$(ele).text().includes('Download')){
                            relatedDocuments.push({
                                title: $(ele).text(),
                                link: $(ele).attr('href')
                            });
                        }
                    });
                }
            });

            speciesList.ONInvasiveSpeciesPlants[index].aboutSection = aboutSection;
            if(relatedDocuments)
                speciesList.ONInvasiveSpeciesPlants[index].relatedDocuments = relatedDocuments;
        }).catch((err) => {
            console.log(err);
        });
    }));

    console.log(speciesList);
};

// Helper Function to get a list of invasive species
const getListOfSpeciesFromONInvasive = async (url) => {
    const output = {
        ONInvasiveSpeciesPlants: []    
    }

    /** 
     * 
     * This is only for development purpose. The request will go through a third party proxy, corsProxyUrl.
     * This need to be changed when working with production.
     */
    const corsProxyUrl = 'https://cors-anywhere.herokuapp.com/';

    // Scraping list of all species
    await axios.get(url).then(async (response) => {
        const $ = await cheerio.load(response.data);

        // Get species links
        await $('div.entry-content li > a').each((i, ele) => {
            const link = $(ele).attr('href');
            const commonName = $(ele).text();
            output.ONInvasiveSpeciesPlants.push({
                name: commonName, 
                link:link
            });
        });

    }).catch(err => {
        console.log(err);
    })

    return output;
};

export {webscrapBCInvasive, webscrapONInvasive};