import { capitalizeFirstWord, capitalizeEachWord } from "./textFormattingUtils";

// Formats region data
export const formatRegionData = (data) => {
    return data.regions.map(item => (formatRegionFields(item)));
}

// Formats region fields
export const formatRegionFields = (data) => {
    return {
        ...data,
        region_fullname: capitalizeEachWord(data.region_fullname),
        region_code_name: data.region_code_name.toUpperCase(),
        country_fullname: capitalizeEachWord(data.country_fullname)
    }
}

// Formats invasive and alternative species data
export const formatSpeciesData = (data) => {
    return data.species.map(item => {
        const formattedItem = {
            ...item,
            scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name, "_")),
            common_name: item.common_name.map(name => capitalizeEachWord(name)),
            image_links: item.images.map(img => img.image_url),
            s3_keys: item.images.map(img => img.s3_key)
        };

        // Alternative species field only exists in invasive species data
        if (item.alternative_species) {
            formattedItem.alternative_species = formatAlternativeSpeciesField(item);
        }

        return formattedItem;
    });
}

// Formats the alternative species field of invasive species
export const formatAlternativeSpeciesField = (item) => {
    return item.alternative_species.map(item => ({
        ...item,
        scientific_name: item.scientific_name.map(name => capitalizeFirstWord(name, "_")),
        common_name: item.common_name.map(name => capitalizeEachWord(name)),
    }));
}