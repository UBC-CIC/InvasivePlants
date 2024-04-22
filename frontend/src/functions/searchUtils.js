import { getSignedRequest } from "./getSignedRequest";
import { formatRegionData, formatSpeciesData } from "./dataFormattingUtils";

// Updates dropdown with formatted data
export const updateDropdownOptions = async (credentials, path, queryParams = {}, setSearchDropdownOptions, setRegionId = null) => {
    try {
        const response = await getSignedRequest(path, queryParams, credentials);
        let formattedData;

        if (response.responseData.regions) {
            formattedData = formatRegionData(response.responseData);

            if (formattedData.length === 0 && setRegionId) {
                setRegionId("");
            } else if (setRegionId) {
                setRegionId(formattedData[0].region_id);
            }
        } else if (response.responseData.species) {
            formattedData = formatSpeciesData(response.responseData);
        }

        // console.log(formattedData);
        setSearchDropdownOptions(formattedData);
    } catch (error) {
        console.error('Unexpected error:', error);
    }
};

// Call to set dropdowns
export const updateDropdown = async (searchInput, credentials, path, setSearchDropdown) => {
    if (searchInput === "") {
        setSearchDropdown([]);
    } else {
        if (path.includes("invasiveSpecies") || path.includes("alternativeSpecies")) {
            await updateDropdownOptions(credentials, path, { search_input: searchInput }, setSearchDropdown)
        } else if (path.includes("region")) {
            await updateDropdownOptions(credentials, path, { region_fullname: searchInput }, setSearchDropdown)
        }
    }
};
