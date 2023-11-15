import * as cheerio from "cheerio";
import axios from "axios";

// List of website to links to invasive species website
const WIKIPEDIA_SEARCH_URL = "https://en.wikipedia.org/wiki/";

/**
 *
 * This function only webscrapes from wikipedia given the species name and collects the following:
 *  - species overview
 *  - species description
 *  - gallery of images
 *  - wiki url
 */

// TODO: fix this function!!!
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

		// following two lines for testing: format so it's easier to see in console
		const jsonResult = JSON.stringify(wiki_info, null, 2);
		// console.log("from wiki: ", jsonResult);
		return wiki_info;
	} catch (error) {
		console.error("Error while scraping wikipedia site:", error.message);
	}
};

const extractSpeciesOverview = ($) => {
	let speciesParagraphs = "";
	const paragraphs = $("div.mw-content-ltr.mw-parser-output p");

	// Iterate over each paragraph
	paragraphs.each(function () {
		// Check if the paragraph is within a table
		const isInTable = $(this).closest('table').length > 0;

		// Check if the paragraph is after an h2
		const isAfterH2 = $(this).prevAll('h2').length > 0;

		if (!isInTable) {
			if (isAfterH2) {
				return false; // Break out of the loop
			}
			const paragraphText = $(this).text();
			speciesParagraphs += cleanUpString(paragraphText);
		}
	});

	return speciesParagraphs;
};


// get species description
const extractSpeciesDescription = ($) => {
	let speciesDescription = [];
	let found = false;

	// Update selector to target the h2 with the specified span and ID
	$("h2 span.mw-headline#Description")
		.parent()
		.nextAll()
		.each(function () {
			// Break the loop when the next h2 is found
			if ($(this).is("h2")) {
				found = true;
				return false;
			}

			// Exclude content within <style> tags with the specified class
			if (!found && $(this).is("p")) {
				// Exclude content within <style> tags
				let $pClone = $(this).clone();
				$pClone.find("style[data-mw-deduplicate='TemplateStyles:r1154941027']").remove();
				speciesDescription.push($pClone.text());
			}
		});

	return cleanUpString(speciesDescription);
};


// get species images
const extractSpeciesImages = ($) => {
	const speciesImages = [];

	// Update selector to target the table with class "infobox biota"
	$("table.infobox.biota img").each((index, element) => {
		let src = $(element).attr("src");

		// Exclude specific images based on the src attribute
		if (
			src &&
			src.startsWith("//") &&
			src !== "//upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Status_iucn3.1_LC.svg/220px-Status_iucn3.1_LC.svg.png" &&
			src !== "//upload.wikimedia.org/wikipedia/commons/thumb/8/8a/OOjs_UI_icon_edit-ltr.svg/15px-OOjs_UI_icon_edit-ltr.svg.png"
		) {
			src = "https:" + src;
			speciesImages.push(src);
		}
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
