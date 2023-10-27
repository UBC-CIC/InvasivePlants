import * as cheerio from "cheerio";
import axios from "axios";

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
    alternative_plants_ON["periwinkle"] = ["Wild Geranium"];
    alternative_plants_ON["lily-of-the-valley"] = ["Starry Solomon’s Seal"];
    alternative_plants_ON["goutweed"] = ["Large-leaved Aster"];
    alternative_plants_ON["yellow_archangel"] = ["Zigzag Goldenrod"];
    alternative_plants_ON["wintercreeper"] = ["Foamflower", "Running Euonymus", "Virginia Waterleaf"];
    alternative_plants_ON["english_ivy"] = ["Wild Strawberry"];
    alternative_plants_ON["bugleweed"] = ["Wild Ginger"];
    alternative_plants_ON["creeping_jenny"] = ["Canada Anemone", "Bloodroot", "Mayapple"];
    alternative_plants_ON["daylily"] = ["Michigan Lily", "Pale Purple Coneflower", "Black-eyed Susan"];
    alternative_plants_ON["miscanthus"] = ["Big Bluestem", "Little Bluestem", "Bottlebrush Grass",
        "Switchgrass", "Indian Grass", "Pennsylvania Sedge", "Ivory Sedge"];
    alternative_plants_ON["norway_maple"] = ["Sugar Maple", "Silver Maple", "Freeman Maple"];
    alternative_plants_ON["amur_maple"] = ["Ruby Lace Honeylocust"];
    alternative_plants_ON["winged_euonymus"] = ["Downy Serviceberry", "Smooth Serviceberry",
        "Canada Serviceberry", "Northern Spicebush", "Fragrant Sumac"];
    alternative_plants_ON["russian_olive"] = ["Witch Hazel", "Silverberry", "Red-osier Dogwood"];
    alternative_plants_ON["autumn_olive"] = ["Witch Hazel", "Silverberry", "Red-osier Dogwood"];
    alternative_plants_ON["japanese_barberry"] = ["Native Viburnums"];
    alternative_plants_ON["tartarian_honeysuckle"] = ["Native Bush Honeysuckle"];
    alternative_plants_ON["tartarian_honeysuckle"] = ["Native Bush Honeysuckle"];
    alternative_plants_ON["amur_honeysuckle"] = ["Native Bush Honeysuckle"];
    alternative_plants_ON["morrow_honeysuckle"] = ["Native Bush Honeysuckle"];
    alternative_plants_ON["bells_honeysuckle"] = ["Native Bush Honeysuckle"];
    alternative_plants_ON["european_fly_honeysuckle"] = ["Native Bush Honeysuckle"];
    alternative_plants_ON["multiflora_rose"] = ["Wild Rose", "Wild Black Currant", "Buttonbush"];
    alternative_plants_ON["sea_buckthorn"] = ["Nannyberry", "Chokeberry", "Bayberry", "Chokecherry",
        "Common Elderberry", "Ninebark", "Alternate-Leaf Dogwood"];
    alternative_plants_ON["japanese_honeysuckle_vine"] = ["Virginia Creeper", "Climbing Hydrangea", "Goldflame Honeysuckle"];
    alternative_plants_ON["oriental_bittersweet"] = ["Jackman Clematis", "Dutchman’s Pipe", "Virgin’s Bower"];
    alternative_plants_ON["yellow_iris"] = ["Cardinal Flower", "Northern Blueflag Iris", "Sweetflag Grass"];
    alternative_plants_ON["flowering_rush"] = ["Blue Vervain", "White Turtlehead", "Joe-pye Weed", "Swamp Rose-mallow",
        "Swamp Milkweed", "Boneset", "Marsh Marigold"];
    alternative_plants_ON["water_lettuce"] = ["Pickerelweed"];
    alternative_plants_ON["water_soldier"] = ["Common Mare’s Tail"];
    alternative_plants_ON["european_frog-bit"] = ["Broad-leaved Arrowhead"];
    alternative_plants_ON["yellow_floating_heart"] = ["Fragrant Water Lily"];
    alternative_plants_ON["fanwort"] = ["Coontail"];
    alternative_plants_ON["hydrilla"] = ["Tape grass"];

    console.log("ON alternative plants: ", alternative_plants_ON);
    return alternative_plants_ON;
};


const getAlternativePlants = async (commonName, scientificName, userLocation) => {
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
        console.log("count not find invasive species and its alternatives")
        return null;
    }
}

export { mapInvasiveToAlternativeBC, mapInvasiveToAlternativeON, getAlternativePlants }