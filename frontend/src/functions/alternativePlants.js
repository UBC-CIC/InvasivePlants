import * as cheerio from "cheerio";
import axios from "axios";

const BC_ALTERNATIVE_PLANTS_URL = "https://bcinvasives.ca/play-your-part/plantwise/grow-me-instead/";
const ON_ALTERNATIVE_PLANTS_URL = "https://www.ontarioinvasiveplants.ca/wp-content/uploads/2020/04/Southern-Grow-Me-Instead-1.pdf";

// maps invasive plant to a list of non-invasive alternative plants (all common name)
const mapInvasiveToAlternativeBC = async () => {
    let alternative_plants_BC = {};
    try {
        const response = await axios.get(BC_ALTERNATIVE_PLANTS_URL);
        const $ = cheerio.load(response.data);

        $('h3.gmi-guide-invasive-title.font-lg.tt-none.has-orange-color').each((i, ele) => {
            const invasivePlantName = $(ele).text().replace("Invasive Species:", "").trim().toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s/g, '_');
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

const mapInvasiveToAlternativeON = async () => {
    return
}

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