import * as cheerio from "cheerio";
import axios from "axios";
import {webscrapeWikipedia} from "./webscrapeWiki";

const BC_ALTERNATIVE_PLANTS_URL = "https://bcinvasives.ca/play-your-part/plantwise/grow-me-instead/";


// maps invasive plant to a list of non-invasive alternative plants (scientific name)
const mapInvasiveToAlternativeBC = async () => {
    let alternative_plants_BC = {};
    try {
        const response = await axios.get(BC_ALTERNATIVE_PLANTS_URL);
        const $ = cheerio.load(response.data);

        const promises = $('h3.gmi-guide-invasive-title.font-lg.tt-none.has-orange-color').map(async (i, ele) => {
            try {
                const link = $(ele).children('a').attr('href');
                const linkedResponse = await axios.get(link);
                const linkedData = cheerio.load(linkedResponse.data);
                // gets the scientific name of invasive plant
                let invasivePlantName = linkedData('.invasive-species.italic').text();
                invasivePlantName = invasivePlantName.toLowerCase().replace(/\s+/g, '_').trim();

                // gets the scientific name of alternative plants
                const alternativesPromises = $(ele)
                    .nextUntil('h3', 'ul.gmi-guide-alternatives-list')
                    .find('li')
                    .map(async (j, listItem) => {
                        const alternativeLink = $(listItem).children('a').attr('href');
                        const alternativeLinkedResponse = await axios.get(alternativeLink);
                        const alternativeLinkedData = cheerio.load(alternativeLinkedResponse.data);
                        let alternativePlantName = alternativeLinkedData('.gmi-species.italic').text();
                        alternativePlantName = alternativePlantName.toLowerCase().replace(/\s+/g, '_').trim();
                        return alternativePlantName;
                    }).get();

                const alternatives = await Promise.all(alternativesPromises);
                alternative_plants_BC[invasivePlantName] = alternatives;
            } catch (error) {
                console.error('Error fetching linked page:', error);
            }
        }).get();

        await Promise.all(promises);
        return alternative_plants_BC;
    } catch (err) {
        console.error("Error:", err);
        return {};
    }
};


// maps Ontario invasive plant to a list of non-invasive alternative plants (all common name)
const mapInvasiveToAlternativeON = async () => {
    let alternative_plants_ON = {};
    alternative_plants_ON["vinca_minor"] = ["geranium_maculatum"];
    alternative_plants_ON["convallaria_majalis"] = ["maianthemum_stellatum"];
    alternative_plants_ON["aegopodium_podagraria"] = ["eurybia_macrophylla"];
    alternative_plants_ON["lamiastrum_galeobdolon"] = ["solidago_flexicaulis"];
    alternative_plants_ON["euonymus_fortunei"] = ["tiarella_cordifolia", "euonymus_obovatus", "hydrophyllum_virginianum"];
    alternative_plants_ON["hedera_helix"] = ["fragaria_virginiana"];
    alternative_plants_ON["ajuga_reptans"] = ["asarum_canadense"];
    alternative_plants_ON["lysimachia_nummularia"] = ["anemone_canadensis", "sanguinaria_canadensis", "podophyllum_peltatum"];
    alternative_plants_ON["hemerocallis_fulva"] = ["lilium_michiganense", "echinacea_pallida", "rudbeckia_hirta"];
    alternative_plants_ON["miscanthus_sinensis"] = ["andropogon_gerardii", "schizachyrium_scoparium", "elymus_hystrix",
        "panicum_virgatum", "sorghastrum_nutans", "carex_pensylvanica", "carex_eburnea"];
    alternative_plants_ON["miscanthus_sacchariflorus"] = ["andropogon_gerardii", "schizachyrium_scoparium", "elymus_hystrix",
        "panicum_virgatum", "sorghastrum_nutans", "carex_pensylvanica", "carex_eburnea"];
    alternative_plants_ON["acer_platanoides"] = ["acer_saccharum", "acer_saccharinum", "acer_x_freemanii"];
    alternative_plants_ON["acer_ginnala"] = ["gleditsia_triacanthos"];
    alternative_plants_ON["euonymus_alatus"] = ["amelanchier_arborea", "amelanchier_laevis", "amelanchier_canadensis",
        "lindera_benzoin", "rhus_aromatica"];
    alternative_plants_ON["elaeagnus_angustifolia"] = ["hamamelis_virginiana", "elaeagnus_commutata", "cornus_sericea"];
    alternative_plants_ON["elaeagnus_umbellata"] = ["hamamelis_virginiana", "elaeagnus_commutata", "cornus_sericea"];
    alternative_plants_ON["berberis_thunbergii"] = ["viburnum_lentago", "viburnum_lantanoides"];
    alternative_plants_ON["lonicera_tatarica"] = ["diervilla_lonicera"];
    alternative_plants_ON["lonicera_maackii"] = ["diervilla_lonicera"];
    alternative_plants_ON["lonicera_morrowii"] = ["diervilla_lonicera"];
    alternative_plants_ON["lonicera_x_bella"] = ["diervilla_lonicera"];
    alternative_plants_ON["lonicera_xylosteum"] = ["diervilla_lonicera"];
    alternative_plants_ON["rosa_multiflora"] = ["rosa_carolina", "rosa_virginiana", "ribes_americanum", "cephalanthus_occidentalis"];
    alternative_plants_ON["hippophae_rhamnoides"] = ["hippophae_rhamnoides", "aronia_melanocarpa", "morella_pensylvanica", "prunus_virginiana",
        "sambucus_canadensis", "physocarpus_opulifolius", "cornus_alternifolia"];
    alternative_plants_ON["lonicera_japonica"] = ["parthenocissus_quinquefolia", "hydrangea_petiolaris", "lonicera_x_heckrotti"];
    alternative_plants_ON["celastrus_orbiculatus"] = ["clematis_x_jackmanii", "aristolochia_macrophylla", "clematis_virginiana"];
    alternative_plants_ON["iris_pseudacorus"] = ["lobelia_cardinalis", "iris_versicolor", "acorus_calamus"];
    alternative_plants_ON["butomus_umbellatus"] = ["verbena_hastata", "chelone_glabra", "eupatorium_maculatum", "hibiscus_moscheutos",
        "asclepias_incarnata", "eupatorium_perfoliatum", "caltha_palustris"];
    alternative_plants_ON["pistia_stratiotes"] = ["pontederia_cordata"];
    alternative_plants_ON["stratiotes_aloides"] = ["hippuris_vulgaris"];
    alternative_plants_ON["hydrocharis_morsus-ranae"] = ["sagittaria_latifolia"];
    alternative_plants_ON["nymphoides_peltata"] = ["nymphaea_odorata"];
    alternative_plants_ON["cabomba_caroliniana"] = ["ceratophyllum_demersum"];
    alternative_plants_ON["hydrilla_verticillata"] = ["vallisneria_americana"];

    console.log("ON alternative plants: ", alternative_plants_ON);
    return alternative_plants_ON;
};

const getAlternativePlants = async (scientificName, userLocation) => {
    let map = {};

    if (userLocation === "BC") {
        map = await mapInvasiveToAlternativeBC()
    } else if (userLocation === "ON") {
        map = await mapInvasiveToAlternativeON()
    }

    console.log(userLocation, "map: ", map);

    scientificName = scientificName.toLowerCase().replace(/\s+/g, '_').trim();

    if (map.hasOwnProperty(scientificName)) {
        console.log(scientificName, "in map!", userLocation)
        return map[scientificName]
    } else {
        console.log("count not find", scientificName, "and its alternatives")
        return null;
    }
}

// Put to gether all alternative species for database population
const getAlternativePlantsForDB = async (scientificName) => {
    const alternativeRecord = {
        scientific_name: [scientificName],
        common_name: [],
        resource_links: [],
        image_links: [],
        species_description: ""
    }

    const MAX_NUMBER_IMAGE = 5;

    // Call wikipedia function to webscrape description, images links
    // Call GBIF api to get plant taxonomy mainly common name and full scientific name
    const GBIF_API = "https://api.gbif.org/v1/";
    const modSciName = scientificName.replace(/_/g, ' ').trim();

    const getCommonName = async (unmodifySciName) => {
        const commonName = [];
        let fullSciName = undefined;

        try {
            const url = GBIF_API + `species/search?q=${modSciName}`;
            const response = await axios.get(url);

			if (response.data && response.data.results.length > 0){
                // Order return by relevance
                for(let i = 0; i < response.data.results.length; i++){
                    if(response.data.results[i].canonicalName.trim().toLowerCase() === modSciName && response.data.results[i].vernacularNames.length > 0){
                        response.data.results[i].vernacularNames.forEach(element => {
                            if(element.language === "eng")
                                commonName.push(element.vernacularName)
                        });
                        if(commonName.length > 0)
                            break;
                    }
                }

                // Update scientific name
                const newSciName = response.data.results[0].canonicalName.toLowerCase().replace(/\s+/g, '_').trim();
                if(unmodifySciName !== newSciName)
                    fullSciName = newSciName;
            }
        } catch (error) {
            console.log(error);
        }

        return {commonName, fullSciName};
    };

    try {
        const promiseData = await Promise.all([webscrapeWikipedia(modSciName), getCommonName(scientificName)]);

        // Promise from wiki 
        alternativeRecord.species_description = promiseData[0].speciesDescription === undefined ? promiseData[0].speciesDescription: promiseData[0].speciesOverview;
        alternativeRecord.resource_links.push(promiseData[0].wikiUrl);
        
        for(let i = 0; i < Math.min(MAX_NUMBER_IMAGE, promiseData[0].speciesImages.length); i++){
            alternativeRecord.image_links.push(promiseData[0].speciesImages[i]);
        }

        // Promise from GBIF
        alternativeRecord.common_name = promiseData[1].commonName;
        if(promiseData[1].fullSciName)
            alternativeRecord.scientific_name.push(promiseData[1].fullSciName);

    } catch (error) {
        console.log(error);
    }

    return alternativeRecord;
}

export { mapInvasiveToAlternativeBC, mapInvasiveToAlternativeON, getAlternativePlants, getAlternativePlantsForDB}