import axios from "axios";
import cheerio from "cheerio";

const MEDIAWIKI_API_URL = "https://en.wikipedia.org/w/api.php";

const webscrapeWikipedia = async (scientificName) => {
	try {
		const params = {
			action: "query",
			format: "json",
			titles: scientificName,
			prop: "extracts|images",
			redirects: true,
			exintro: true,
			explaintext: true,
			imlimit: 15,
		};

		const response = await axios.get(MEDIAWIKI_API_URL, { params });
		const pages = response.data.query.pages;

		// handle redirected pages
		let redirectedTitle = scientificName;
		if (response.data.query.redirects && response.data.query.redirects.length > 0) {
			redirectedTitle = response.data.query.redirects[0].to;
		}

		if (!pages || Object.keys(pages).length === 0) {
			throw new Error("Species not found on Wikipedia.");
		}

		const pageId = Object.keys(pages)[0];
		const page = pages[pageId];

		// find Description section
		const sections = await fetchSections(page.pageid);
		const descriptionSection = sections.find(section => section.line === "Description");
		const descriptionContent = descriptionSection ? await fetchSectionContent(page.pageid, descriptionSection.index) : null;

		// get images
		const imageInfo = (page.images && Array.isArray(page.images)) ? await fetchImageUrls(page.images, scientificName, redirectedTitle) : [];

		const wikiInfo = {
			speciesOverview: cleanUpString(page.extract),
			speciesDescription: descriptionContent,
			speciesImages: imageInfo,
			wikiUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(scientificName)}`,
		};

		console.log("From Wikipedia: ", JSON.stringify(wikiInfo, null, 2));
		return wikiInfo;
	} catch (error) {
		console.error("Error while fetching Wikipedia data:", error.message);
		return null;
	}
};

async function fetchSections(pageId) {
	const sectionsParams = {
		action: "parse",
		format: "json",
		pageid: pageId,
		prop: "sections",
	};

	const sectionsResponse = await axios.get(MEDIAWIKI_API_URL, { params: sectionsParams });
	return sectionsResponse.data.parse.sections || [];
}

async function fetchSectionContent(pageId, sectionIndex) {
	const sectionParams = {
		action: "parse",
		format: "json",
		pageid: pageId,
		prop: "text",
		section: sectionIndex,
	};

	const sectionResponse = await axios.get(MEDIAWIKI_API_URL, { params: sectionParams });
	const htmlContent = sectionResponse.data.parse.text["*"];

	const $ = cheerio.load(htmlContent);

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


// get url of 5 images
async function fetchImageUrls(images, prevTitle, pageTitle) {
	const imageInfo = [];
	const matchNameRedirectedTitle = pageTitle.split(' ').map(word => encodeURIComponent(word.toLowerCase()));
	const matchNamePrevTitle = prevTitle.split(' ').map(word => encodeURIComponent(word.toLowerCase()));
	let imageCount = 0; 


	for (const image of images) {
		if (imageCount >= 5) {
			break; 
		}

		const imageParams = {
			action: "query",
			format: "json",
			titles: image.title,
			prop: "imageinfo",
			iiprop: "url",
		};

		const response = await axios.get(MEDIAWIKI_API_URL, { params: imageParams });
		const pages = response.data.query.pages;
		const page = pages[Object.keys(pages)[0]];

		if (
			page.imageinfo &&
			page.imageinfo[0]?.url &&
			(matchNameRedirectedTitle.some(word => decodeURIComponent(page.imageinfo[0].url).toLowerCase().includes(word)) ||
				matchNamePrevTitle.some(word => decodeURIComponent(page.imageinfo[0].url).toLowerCase().includes(word)))
		) {
			imageInfo.push(page.imageinfo[0].url);
			imageCount++;
		}
	}
	return imageInfo;
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
