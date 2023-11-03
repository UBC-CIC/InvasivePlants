import LocationMap from "./locationMap";

export const SpeciesTestData = [
    {
        speciesId: "1",
        scientificName: "Hemerocallis fulva",
        commonName: ["Orange daylily", "Tiger Lillies", "Fulvous day-lily"],
        links: ["http://example.com"],
        description:
            "It is an herbaceous perennial plant growing from tuberous roots, with stems 40–150 centimetres (16–59 inches) tall. The leaves are linear, .mw-parser-output .frac{white-space:nowrap}.mw-parser-output .frac .num,.mw-parser-output .frac .den{font-size:80%;line-height:0;vertical-align:super}.mw-parser-output .frac .den{vertical-align:sub}.mw-parser-output .sr-only{border:0;clip:rect(0,0,0,0);clip-path:polygon(0px 0px,0px 0px,0px 0px);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}0.5–1.5 metres (1+1⁄2–5 feet) long and 1.5–3 cm (1⁄2–1+1⁄4 in) broad. The flowers are 5–12 cm (2–4+3⁄4 in) across, orange-red, with a pale central line on each tepal; they are produced from early summer through late autumn on scapes of ten through twenty flowers, with the individual flowers opening successively, each one lasting only one day. Its fruit is a three-valved capsule 2–2.5 cm (3⁄4–1 in) long and 1.2–1.5 cm (1⁄2–5⁄8 in) broad which splits open at maturity and releases seeds.\n\nBoth diploid and triploid forms occur in the wild, but most cultivated plants are triploids which rarely produce seeds and primarily reproduce vegetatively by stolons. At least four botanical varieties are recognized, including the typical triploid var. fulva, the diploid, long-flowered var. angustifolia (syn.: var. longituba), the triploid var. Flore Pleno, which has petaloid stamens, and the evergreen var. aurantiaca.",
        alternatives: [
            "lilium_michiganense",
            "echinacea_pallida",
            "rudbeckia_hirta",
        ],
        location: LocationMap["bc"]
    },
    {
        speciesId: "2",
        scientificName: "abc",
        commonName: "Rose",
        links: ["http://example.com"],
        description: "A type of flowering shrub.",
        alternatives: ["Hemerocallis fulva"],
        location: LocationMap["bc"]
    },
    {
        speciesId: "3",
        scientificName: "Gypsophila muralis",
        commonName: [
            "Annual Gypsophila",
            "Low Baby's-breath",
            "Cushion baby's-breath",
        ],
        description:
            "Psammophiliella muralis is an annual, with erect glabrous (non hairy) stems. It grows up to 30–40 cm (12–16 in) tall, with linear shaped leaves. It blooms between summer and fall, with pink or very occasionally white flowers, which are 3.5–6 cm (1.4–2.4 in) across. Later it has fruit capsules, which are ovoid or ellipsoid, inside are snail-shaped seeds.",
        alternatives: [],
        location: LocationMap["bc"]
    },
    {
        speciesId: "4",
        scientificName: "Gypsophila paniculata",
        commonName: [
            "Baby's-breath",
            "Old-fashioned Baby's-breath",
            "Tall baby's-breath",
        ],
        description:
            'Gypsophila paniculata, the baby\'s breath, common gypsophila or panicled baby\'s-breath, is a species of flowering plant in the family Caryophyllaceae, native to central and eastern Europe. It is an herbaceous perennial growing to 1.2 m (4 ft) tall and wide, with mounds of branching stems covered in clouds of tiny white flowers in summer (hence the common name "baby\'s breath"). Another possible source of this name is its scent, which has been described as sour milk, like a baby’s “spit-up”. Its natural habitat is on the Steppes in dry, sandy and stony places, often on calcareous soils (gypsophila = "chalk-loving"). Specimens of this plant were first sent to Linnaeus from St. Petersburg by the Swiss-Russian botanist Johann Amman.',
        alternative_plants: [
            "perovskia_atriplicifolia",
            "goniolimon_tataricum",
            "achillea_millefolium_hybrids",
            "anaphalis_margaritacea",
            "limonium_latifolium",
        ],
        location: LocationMap["on"]
    },
];

