import * as cheerio from "cheerio";
import axios from "axios";
import { jsonrepair } from "jsonrepair";
import { getDocument } from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry"; // Attach pdfJsworker to window

// List of website to links to invasive species website
const BC_INVASIVE_URL = "https://bcinvasives.ca/take-action/identify/";
const ON_INVASIVE_URL = "https://www.ontarioinvasiveplants.ca/invasive-plants/species/";
const ON_INVASIVE_URL_AQUATIC_PLANTS = "https://www.invadingspecies.com/invaders/aquatic-plants/";
const ON_INVASIVE_URL_TERRESTRIAL_PLANTS = "https://www.invadingspecies.com/invaders/terrestrial-plants/";
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/index.php?search=";

/**
 *
 * This function only webscrape on the https://bcinvasives.ca/ and collect the following:
 *  - List of invasive species
 *  - Each species about section
 *  - How to identrify section
 */
const webscrapeBCInvasive = async () => {
  // Get the list of invasive species
  const speciesList = await getListOfSpeciesFromBCInvasive(BC_INVASIVE_URL);

  // Go to each subpage and webscrapee the about section and how to identify section
  // .invansive-about
  // .invasive-identify > .font-base
  Promise.all(
    speciesList.BCInvasiveSpeciesPlants.map(async (species, index) => {
      axios
        .get(species.link)
        .then(async (response) => {
          const $ = await cheerio.load(response.data);

          // Get About section of the species
          let aboutSection = "";
          await $("div.invansive-about >p").each((i, ele) => {
            aboutSection += $(ele).text() + "\n";
          });

          // Get How to identify section of the species
          let howToIdentifySection = "";
          await $("div.invasive-identify div.font-base > p").each((i, ele) => {
            howToIdentifySection += $(ele).text() + "\n";
          });

          speciesList.BCInvasiveSpeciesPlants[index].aboutSection =
            aboutSection;
          speciesList.BCInvasiveSpeciesPlants[index].howToIdentifySection =
            howToIdentifySection;
        })
        .catch((err) => {
          console.log(err);
        });
    })
  );

  console.log(speciesList);

  return speciesList;
};

// Helper Function to get a list of invasive species
const getListOfSpeciesFromBCInvasive = async (url) => {
  const output = {
    BCInvasiveSpeciesPlants: [],
    BCInvasiveSpeciesAnimals: [],
  };

  /**
   *
   * This is only for development purpose. The request will go through a third party proxy, corsProxyUrl.
   * This need to be changed when working with production.
   */
  const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";

  // Scraping list of all species
  await axios
    .get(url)
    .then(async (response) => {
      const $ = await cheerio.load(response.data);

      // Get species links
      const speciesLinks = {};
      await $("header.invasive-header > a").each((i, ele) => {
        const link = $(ele).attr("href");
        const scienceName = $(ele).children("div").text();

        speciesLinks[scienceName] = link;
      });

      // Get species data summary
      const regex =
        /window\.__invasivesList\.push\(JSON\.parse\(\'(.*?)\'\)\);/;
      await $('script:contains("window.__invasivesList.push")').each(
        (i, ele) => {
          const stringFormat = $(ele).text();
          const match = stringFormat.match(regex);

          if (match && match[1]) {
            try {
              // Repaire JSON formate before parse it.
              const repairedJSON = jsonrepair(match[1]);
              const paredJSON = JSON.parse(repairedJSON);

              // Add link to species
              paredJSON.link = speciesLinks[paredJSON.species];

              if (paredJSON.animal_type === "") {
                output.BCInvasiveSpeciesPlants.push(paredJSON);
              } else {
                output.BCInvasiveSpeciesAnimals.push(paredJSON);
              }
            } catch (error) {
              console.log(error);
              return;
            }
          }
        }
      );
    })
    .catch((err) => {
      console.log(err);
    });

  return output;
};

/**
 *
 * This function only webscrape on the https://www.ontarioinvasiveplants.ca/ and collect the following:
 *  - List of invasive species
 *  - Each species about section
 *  - Link to PDFs ...
 */
const webscrapeONInvasive_ONInvasivePlantCouncil = async () => {
  // Get the list of invasive species
  const speciesList = await getListOfSpeciesFromONInvasive(ON_INVASIVE_URL);

  // Configuration on web scraping
  const scientificName_FontSize = 14;
  const torlerance = 1;
  const stringIndicatorForDocument = "for more information";
  const documentNameToLook = "best management practices";

  await Promise.all(
    speciesList.ONInvasiveSpeciesPlants.map(async (specie, index) => {
      // Go to each subpage and webscrapee the about section and references on the species
      // Get about section of the species and related documents
      let aboutSection = "";
      const relatedDocuments = [];
      await axios
        .get(specie.link)
        .then(async (response) => {
          const $ = await cheerio.load(response.data);

          // web scraping data for about section and related documents
          await $("div.entry-content")
            .contents()
            .each((i, ele) => {
              if ($(ele).is("p")) {
                // Potential about section
                const pString = $(ele).text();

                // Regx for this format to get scientific name in the middle
                if (
                  !pString.toLowerCase().includes(stringIndicatorForDocument) &&
                  !pString.toLowerCase().includes("download")
                ) {
                  aboutSection += $(ele).text();
                }
              } else if ($(ele).is("ul")) {
                // Potential block for list of related about section
                $(ele)
                  .children("li")
                  .each((i, ele) => {
                    aboutSection += "\n* " + $(ele).text();
                  });
              } else if ($(ele).is("div")) {
                // Potential block for PDF
                $(ele)
                  .children("a")
                  .each((i, ele) => {
                    if (!$(ele).text().toLowerCase().includes("download")) {
                      relatedDocuments.push({
                        title: $(ele).text(),
                        link: $(ele).attr("href"),
                      });
                    }
                  });
              }
            });
        })
        .catch((err) => {
          console.log(err);
        });

      // web scraping data for scientific name and common name based on front size
      let scienceName = "";
      if (relatedDocuments.length !== 0) {
        // Select the right document
        let pdfURL = undefined;
        relatedDocuments.forEach((ele) => {
          if (ele.title.toLowerCase().includes(documentNameToLook)) {
            pdfURL = ele.link;
          }
        });

        // Just use the first one if no PDF is found.
        if (pdfURL === undefined) {
          pdfURL = relatedDocuments[0].link;
        }

        // Request PDF document
        await axios
          .get(pdfURL, { responseType: "arraybuffer" })
          .then(async (response) => {
            const pdf = await getDocument({ data: response.data }).promise;
            const firstPage = await pdf.getPage(1);
            const content = await firstPage.getTextContent();

            content.items.forEach((res, index) => {
              if (
                scientificName_FontSize - torlerance <= res.height &&
                res.height <= scientificName_FontSize + torlerance
              ) {
                // Assume species name uses the Binomial nomenclature which the common naming convention.
                const potentialScientificName = res.str
                  .trim()
                  .replace(/\(|\)/g, "");
                if (potentialScientificName.split(" ").length === 2) {
                  scienceName = potentialScientificName;
                }
              }
            });
          })
          .catch((err) => {
            console.log(err);
          });
      }

      // Assign data to global variables
      speciesList.ONInvasiveSpeciesPlants[index].aboutSection = aboutSection;
      if (relatedDocuments)
        speciesList.ONInvasiveSpeciesPlants[index].relatedDocuments =
          relatedDocuments;
      if (scienceName !== "") {
        const parsedScienceName = scienceName.trim().replace(/\(|\)/g, "");
        speciesList.ONInvasiveSpeciesPlants[index].species = parsedScienceName;
      }
    })
  );

  // Grabing other data
  // Library to get data from wiki: https://github.com/Requarks/wiki

  console.log(speciesList);
};

// Helper Function to get a list of invasive species
const getListOfSpeciesFromONInvasive_ONInvasivePlantCouncil = async (url) => {
  const output = {
    ONInvasiveSpeciesPlants: [],
  };

  /**
   *
   * This is only for development purpose. The request will go through a third party proxy, corsProxyUrl.
   * This need to be changed when working with production.
   */
  const corsProxyUrl = "https://cors-anywhere.herokuapp.com/";

  // Scraping list of all species
  await axios
    .get(url)
    .then(async (response) => {
      const $ = await cheerio.load(response.data);

      // Get species links
      await $("div.entry-content li > a").each((i, ele) => {
        const link = $(ele).attr("href");
        const commonName = $(ele).text();
        output.ONInvasiveSpeciesPlants.push({
          name: commonName,
          link: link,
        });
      });
    })
    .catch((err) => {
      console.log(err);
    });

  return output;
};

/**
 * 
 * This function only webscrap on the https://www.ontarioinvasiveplants.ca/ and collect the following:
 *  - List of invasive species
 *  - Each species about section
 *  - Link to PDFs ...
 */
const webscrapeONInvasive = async () => {
  const speciesList = {
      ONInvasiveSpeciesPlants: []    
  }
  await getListOfSpeciesFromONInvasive(speciesList, ON_INVASIVE_URL_AQUATIC_PLANTS);
  await getListOfSpeciesFromONInvasive(speciesList, ON_INVASIVE_URL_TERRESTRIAL_PLANTS);

  // Go to each subpage and webscrape the about section and how to identify section
  // .invansive-about
  // .invasive-identify > .font-base
  Promise.all(speciesList.ONInvasiveSpeciesPlants.map(async (specie, index) => {
      axios.get(specie.link).then(async (response) => {
          const $ = await cheerio.load(response.data);
          
          const scienceName = await $("div.header-content span").text();

          // Grab other sections
          const keywords = ["Background", "Impact of", "Identify", "What You Can Do"];
          
          // Load data into speciesList
          speciesList.ONInvasiveSpeciesPlants[index].scientificName = scienceName;
      }).catch((err) => {
          console.log(err);
      });
  }));

  console.log(speciesList);
};

const getListOfSpeciesFromONInvasive = async (output, url) => {
  // Scraping list of all species
  await axios.get(url).then(async (response) => {
      const $ = await cheerio.load(response.data);

      // Get species links
      await $('div[data-id="pt-cv-page-1"] > div').each((i, ele) => {
          // There are a list of child of div
          // Each child has div > div a h3

          const child = $(ele).children("div");

          const commonName = $(child).children("h3").text();
          const link = $(child).children("a").attr("href");
          output.ONInvasiveSpeciesPlants.push({
              name: commonName, 
              link:link
          });
      });

  }).catch(err => {
      console.log(err);
  })

};

/**
 *
 * This function only webscrapes from wikipedia given the species name and collects the following:
 *  - species overview
 *  - species description
 *  - gallery of images
 *  - wiki url
 */
const webscrapeWikipedia = async (speciesName, speciesScore) => {
  try {
    const searchUrl = `${WIKIPEDIA_SEARCH_URL}${encodeURIComponent(
      speciesName
    )}`;
    const searchResponse = await axios.get(searchUrl);
    const $ = cheerio.load(searchResponse.data);

    const speciesInfo = {
      speciesName: extractSpeciesName($),
      speciesScore: speciesScore,
      speciesOverview: extractSpeciesOverview($, speciesName),
      speciesDescription: extractSpeciesDescription($),
      speciesImages: extractSpeciesImages($),
      searchUrl: searchUrl,
    };
    console.log("info:", speciesInfo);
    return speciesInfo;
  } catch (error) {
    console.error("Error occur while scraping wikipedia site:", error.message);
  }
};

// get species name
const extractSpeciesName = ($) => {
  return $("h1.firstHeading").text();
};

// get species overview (first paragraph of wiki article)
const extractSpeciesOverview = ($, speciesName) => {
  let speciesOverview = "";
  $("div.mw-parser-output p").each(function () {
    // break the loop after finding the first paragraph
    if ($(this).text().startsWith(speciesName)) {
      speciesOverview = $(this).text();
      return false;
    }
  });
  return cleanUpString(speciesOverview);
};

// get species description
const extractSpeciesDescription = ($) => {
  let speciesDescription = [];
  let found = false;
  $("h2 span.mw-headline#Description")
    .parent()
    .nextAll()
    .each(function () {
      // break the loop when the next h2 is found
      if ($(this).is("h2")) {
        found = true;
        return false;
      }
      if (!found && $(this).is("p")) {
        speciesDescription.push($(this).text());
      }
    });
  return cleanUpString(speciesDescription);
};

// get species images
const extractSpeciesImages = ($) => {
  const speciesImages = [];
  $("ul.gallery img").each((index, element) => {
    let src = $(element).attr("src");
    if (src && src.startsWith("//")) {
      src = "https:" + src;
    }
    speciesImages.push(src);
  });
  return speciesImages;
};

// helper function to clean up data
const cleanUpString = (input) => {
  if (typeof input !== "string") {
    input = input.toString();
  }

  // remove brackets []
  input = input.replace(/\[[^\]]*\]/g, "");

  // remove commas preceded by a line break and divide with a new line
  input = input.replace(/(\r\n|[\r\n])\s*,/g, "$1\n");

  return input.trim();
};

export { webscrapeBCInvasive, webscrapeONInvasive, webscrapeWikipedia };