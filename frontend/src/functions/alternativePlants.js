import * as cheerio from "cheerio";
import axios from "axios";
// import { getDocument } from "pdfjs-dist";
// import "pdfjs-dist/build/pdf.worker.entry";


const BC_ALTERNATIVE_PLANTS_URL = "https://bcinvasives.ca/play-your-part/plantwise/grow-me-instead/";
// const ON_ALTERNATIVE_PLANTS_URL = "https://www.ontarioinvasiveplants.ca/wp-content/uploads/2020/04/Southern-Grow-Me-Instead-1.pdf";

// maps invasive plant to a list of non-invasive alternative plants (all common name)
const mapInvasiveToAlternativeBC = async () => {
    let alternative_plants_BC = {};
    try {
        const response = await axios.get(BC_ALTERNATIVE_PLANTS_URL);
        const $ = cheerio.load(response.data);

        $('h3.gmi-guide-invasive-title.font-lg.tt-none.has-orange-color').each((i, ele) => {
            const invasivePlantName = $(ele).text().replace("Invasive Species:", "").trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s/g, '_');
            // common name
            const alternatives = $(ele)
                .nextUntil('h3', 'ul.gmi-guide-alternatives-list')
                .find('li')
                .map((j, listItem) => $(listItem).text().trim())
                .get();
            alternative_plants_BC[invasivePlantName] = alternatives;
        });

        console.log("BC alternative plants: ", alternative_plants_BC);
        return alternative_plants_BC;
    } catch (err) {
        console.error("Error:", err);
        return {};
    }
};

// extract text from the Ontario PDF
// const getTextFromPDF = async (url) => {
//     const unwantedWords = ['UNWANTED', 'INVASIVE', 'ALTERNATIVE', 'PROHIBITED'];
//     const loadingTask = getDocument(url);
//     const pdf = await loadingTask.promise;
//     const maxPages = pdf.numPages;
//     console.log("maxPages: ", maxPages);
//     let textContent = '';

//     for (let pageNum = 5; pageNum <= 27; pageNum++) {
//         const page = await pdf.getPage(pageNum);
//         const pageText = await page.getTextContent();
//         pageText.items.forEach((item, index) => {
//             const text = item.str;
//             const isAlphaCapsWithHyphenOrSpace = /^[A-Z]+(?:[ -][A-Z]+)*$/u.test(text);
//             const isUnwantedWord = unwantedWords.some((word) => text.includes(word));

//             if (isAlphaCapsWithHyphenOrSpace && !isUnwantedWord && index > 0) {
//                 textContent += '\n' + text;
//             }
//             // else {
//             //     textContent += text + ' ';
//             // }
//         });
//     }

//     return textContent;
// };

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


const getAlternativePlants = async (commonName, userLocation) => {
    let map = {};

    if (userLocation === "BC") {
        map = await mapInvasiveToAlternativeBC()
    } else if (userLocation === "ON") {
        map = await mapInvasiveToAlternativeON()
    }

    console.log("map: ", map)
    for (let name of commonName) {
        name = name.replace("-", "_").trim().toLowerCase().replace(/[^\w\s]/gi, '');
        console.log("name: ", name)
        if (name in map) {
            console.log("in map!")
            return map[name]
        }
    }

    console.log("count not find invasive species and its alternatives")
}

export { mapInvasiveToAlternativeBC, mapInvasiveToAlternativeON, getAlternativePlants }