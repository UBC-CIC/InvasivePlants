import axios from "axios";

// Maps species id to plant image type
export const mapSpeciesToImage = ({ speciesId, data, keyName }) => {
    if (data && data.length > 0) {
        return data.map(item => ({
            species_id: speciesId,
            [keyName]: item
        }));
    }
    return [];
};

// Maps species id to plant data with image links
export const getPlantsWithImageLinks = ({ response, newSpeciesData }) => {
    return mapSpeciesToImage({
        speciesId: response.data[0].species_id,
        data: newSpeciesData.image_links,
        keyName: 'image_url'
    });
};

// Maps species id to plant data with image files
export const getPlantsWithImageFiles = ({ response, newSpeciesData }) => {
    return mapSpeciesToImage({
        speciesId: response.data[0].species_id,
        data: newSpeciesData.s3_keys,
        keyName: 's3_key'
    });
};

export function formatImages(formattedData) {
    // Maps species_id to image_url if links exist and is not empty
    const plantImages = (formattedData.image_links && formattedData.image_links.length > 0) ?
        formattedData.image_links.map(link => ({ species_id: formattedData.species_id, image_url: link })) : [];

    // Maps species_id to image s3_key if keys exist and is not empty
    const imageS3Keys = (formattedData.s3_keys && formattedData.s3_keys.length > 0) ?
        formattedData.s3_keys.map(key => ({ species_id: formattedData.species_id, s3_key: key })) : [];

    // Add new image links only
    const imagesToAdd = (plantImages && plantImages.length > 0) ?
        plantImages.filter(img => !formattedData.images.some(existingImg => existingImg.image_url === img.image_url)) : [];

    // Add new s3 keys only
    const s3KeysToAdd = (imageS3Keys && imageS3Keys.length > 0) ?
        imageS3Keys.filter(key => !formattedData.images.some(existingImg => existingImg.s3_key === key.s3_key)) : [];

    return [
        ...imagesToAdd,
        ...s3KeysToAdd
    ];
}

// POST new images to the database
export function postImages(images, jwtToken) {
    if (images && images.length > 0) {
        images.forEach(img => {
            axios
                .post(process.env.REACT_APP_API_BASE_URL + "plantsImages", img, {
                    headers: {
                        'Authorization': `${jwtToken}`
                    }
                })
                .catch(error => {
                    console.error("Error adding images", error);
                });
        });
    }
}