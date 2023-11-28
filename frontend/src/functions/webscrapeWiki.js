import axios from "axios";
import cheerio from "cheerio";

const MEDIAWIKI_API_ENDPOINT = "https://en.wikipedia.org/w/api.php";

// webscraping function that gets overview, description, images, and wiki URL for a species from Wikipedia using the MediaWiki API
const webscrapeWikipedia = async (scientificName) => {
	try {
		const params = {
			action: "query", 
			format: "json",
			titles: scientificName,
			prop: "extracts|images",
			redirects: true,
			exintro: true, // Return only content before the first section (overview)
			explaintext: true, // extracts as plain text
			imlimit: 15,
		};

		const response = await axios.get(MEDIAWIKI_API_ENDPOINT, { params });
		const pages = response.data.query.pages;

		// handles redirected pages
		let redirectedPageTitleName = scientificName;
		if (response.data.query.redirects && response.data.query.redirects.length > 0) {
			redirectedPageTitleName = response.data.query.redirects[0].to;
		}

		if (!pages || Object.keys(pages).length === 0) {
			throw new Error("Species not found on Wikipedia.");
		}

		const pageId = Object.keys(pages)[0];
		const page = pages[pageId];

		// find the Description section
		const sections = await fetchSections(page.pageid);
		const descriptionSection = sections.find(section => section.line === "Description");
		const descriptionContent = descriptionSection ? await fetchSectionContent(page.pageid, descriptionSection.index) : null;

		// get images
		const imageInfo = (page.images && Array.isArray(page.images)) ? await fetchImageUrls(page.images, scientificName, redirectedPageTitleName) : [];

		// gets overview, description, images, and the link of Wiki page
		const wikiInfo = {
			speciesOverview: cleanUpString(page.extract),
			speciesDescription: descriptionContent,
			speciesImages: imageInfo,
			wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(scientificName)}`,
		};

		// console.log("From Wikipedia: ", scientificName, JSON.stringify(wikiInfo, null, 2));
		return wikiInfo;
	} catch (error) {
		console.error("Error while fetching Wikipedia data:", error.message);
		return null;
	}
};

// gets the sections of a Wikipedia page using the MediaWiki API
async function fetchSections(pageId) {
	const sectionsParams = {
		action: "parse",
		format: "json",
		pageid: pageId,
		prop: "sections"
	};

	const sectionsResponse = await axios.get(MEDIAWIKI_API_ENDPOINT, { params: sectionsParams });
	return sectionsResponse.data.parse.sections || [];
}

// gets the content of a section from Wikipedia using the MediaWiki API
async function fetchSectionContent(pageId, sectionIndex) {
	const sectionParams = {
		action: "parse",
		format: "json",
		pageid: pageId,
		prop: "text",
		section: sectionIndex,
	};

	const sectionResponse = await axios.get(MEDIAWIKI_API_ENDPOINT, { params: sectionParams });
	const content = sectionResponse.data.parse.text["*"];

	const $ = cheerio.load(content);

	// Extract text content from the paragraphs
	const speciesDescription = [];
	$("p").each(function () {
		// Exclude content within <style> tags with the specified class
		if (!$(this).find("style[data-mw-deduplicate='TemplateStyles:r1154941027']").length) {
			speciesDescription.push($(this).text());
		}
	});

	return cleanUpString(speciesDescription.join("\n"));
}


// gets 5 image URLs from Wikipedia using the MediaWiki API
async function fetchImageUrls(images, prevTitle, pageTitle) {
	const imageUrls = [];
	const matchNameRedirectedTitle = pageTitle.split(' ').map(word => encodeURIComponent(word.toLowerCase()));
	const matchNameOrginalTitle = prevTitle.split(' ').map(word => encodeURIComponent(word.toLowerCase()));
	let numImage = 0; 

	for (const image of images) {
		if (numImage >= 5) {
			break; 
		}

		const imageParams = {
			action: "query",
			format: "json",
			titles: image.title,
			prop: "imageinfo",
			iiprop: "url",
		};

		const response = await axios.get(MEDIAWIKI_API_ENDPOINT, { params: imageParams });
		const pages = response.data.query.pages;
		const page = pages[Object.keys(pages)[0]];

		if (
			page.imageinfo &&
			page.imageinfo[0]?.url &&
			(matchNameRedirectedTitle.some(name => decodeURIComponent(page.imageinfo[0].url).toLowerCase().includes(name)) ||
				matchNameOrginalTitle.some(name => decodeURIComponent(page.imageinfo[0].url).toLowerCase().includes(name)))
		) {
			imageUrls.push(page.imageinfo[0].url);
			numImage++;
		}
	}
	return imageUrls;
}


// helper function to clean up data
const cleanUpString = (input) => {
	if (typeof input !== "string") {
		input = input.toString();
	}

	// remove brackets []
	input = input.replace(/\[[^\]]*\]/g, "");

	// remove parentheses ()
	input = input.replace(/[()]/g, "");

	// remove commas preceded by a line break and divide with a new line
	input = input.replace(/(\r\n|[\r\n])\s*,/g, "$1\n");

	return input.trim();
};

export { webscrapeWikipedia };
