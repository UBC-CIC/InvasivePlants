import * as cheerio from "cheerio";
import axios from "axios";

// List of website to links to invasive species website
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/w/index.php?search=";

/**
 *
 * This function only webscrapes from wikipedia given the species name and collects the following:
 *  - species overview
 *  - species description
 *  - gallery of images
 *  - wiki url
 */
const webscrapeWikipedia = async (scientificName) => {
	try {
		const wikiUrl = `${WIKIPEDIA_SEARCH_URL}${encodeURIComponent(
			scientificName
		)}`;
		const searchResponse = await axios.get(wikiUrl);
		const $ = cheerio.load(searchResponse.data);

		let wiki_info = {
			speciesOverview: extractSpeciesOverview($, scientificName),
			speciesDescription: extractSpeciesDescription($),
			speciesImages: extractSpeciesImages($),
			wikiUrl: wikiUrl
		}

		return wiki_info;
	} catch (error) {
		console.error("Error while scraping wikipedia site:", error.message);
	}
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

export { webscrapeWikipedia };