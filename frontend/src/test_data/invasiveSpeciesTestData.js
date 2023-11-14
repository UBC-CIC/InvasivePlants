import AlternativeSpeciesTestData from "./alternativeSpeciesTestData";

const SpeciesTestData = [
    {
        speciesId: 1,
        scientific_name: ["Hemerocallis fulva", "abc"],
        resource_links: ["http://example.com"],
        species_description:
            "It is an herbaceous perennial plant growing from tuberous roots, with stems 40–150 centimetres (16–59 inches) tall. The leaves are linear, 0.5–1.5 metres (1+1⁄2–5 feet) long and 1.5–3 cm (1⁄2–1+1⁄4 in) broad. The flowers are 5–12 cm (2–4+3⁄4 in) across, orange-red, with a pale central line on each tepal; they are produced from early summer through late autumn on scapes of ten through twenty flowers, with the individual flowers opening successively, each one lasting only one day. Its fruit is a three-valved capsule 2–2.5 cm (3⁄4–1 in) long and 1.2–1.5 cm (1⁄2–5⁄8 in) broad which splits open at maturity and releases seeds.\n\nBoth diploid and triploid forms occur in the wild, but most cultivated plants are triploids which rarely produce seeds and primarily reproduce vegetatively by stolons. At least four botanical varieties are recognized, including the typical triploid var. fulva, the diploid, long-flowered var. angustifolia (syn.: var. longituba), the triploid var. Flore Pleno, which has petaloid stamens, and the evergreen var. aurantiaca.",
        alternative_species: [
            AlternativeSpeciesTestData[1],
            AlternativeSpeciesTestData[2],
            AlternativeSpeciesTestData[3]
        ],
        region_id: ["BC", "ON"]
    },
    {
        speciesId: 2,
        scientific_name: ["rosa"],
        resource_links: ["http://example.com", "abc.com", "basdfsdf"],
        species_description: "A type of flowering shrub.",
        alternative_species: [AlternativeSpeciesTestData[0]],
        region_id: ["BC"]
    },
    {
        speciesId: 3,
        scientific_name: ["Gypsophila muralis"],
        species_description:
            "Psammophiliella muralis is an annual, with erect glabrous (non hairy) stems. It grows up to 30–40 cm (12–16 in) tall, with linear shaped leaves. It blooms between summer and fall, with pink or very occasionally white flowers, which are 3.5–6 cm (1.4–2.4 in) across. Later it has fruit capsules, which are ovoid or ellipsoid, inside are snail-shaped seeds.",
        alternative_species: [],
        region_id: ["BC"]
    },
    {
        speciesId: 4,
        scientific_name: ["Gypsophila paniculata"],
        species_description:
            'Gypsophila paniculata, the baby\'s breath, common gypsophila or panicled baby\'s-breath, is a species of flowering plant in the family Caryophyllaceae, native to central and eastern Europe. It is an herbaceous perennial growing to 1.2 m (4 ft) tall and wide, with mounds of branching stems covered in clouds of tiny white flowers in summer (hence the common name "baby\'s breath"). Another possible source of this name is its scent, which has been described as sour milk, like a baby’s “spit-up”. Its natural habitat is on the Steppes in dry, sandy and stony places, often on calcareous soils (gypsophila = "chalk-loving"). Specimens of this plant were first sent to Linnaeus from St. Petersburg by the Swiss-Russian botanist Johann Amman.',
        alternative_species: [
            AlternativeSpeciesTestData[0],
            AlternativeSpeciesTestData[1],
            AlternativeSpeciesTestData[2],
            AlternativeSpeciesTestData[3],
            AlternativeSpeciesTestData[4]
        ],
        resource_links: ["http://example2.com"],
        region_id: ["ON", "test"]
    },
];

export default SpeciesTestData;