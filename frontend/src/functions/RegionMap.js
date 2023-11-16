import axios from "axios";

const API_ENDPOINT = "https://jfz3gup42l.execute-api.ca-central-1.amazonaws.com/prod/";

const handleGetRegions = () => {
    return new Promise((resolve, reject) => {
        axios
            .get(`${API_ENDPOINT}region`)
            .then((response) => {
                const regionsData = response.data;
                const regionIdToCodeName = {};

                // map region_id to region_code_name
                regionsData.forEach(region => {
                    regionIdToCodeName[region.region_id] = region.region_code_name;
                });

                resolve(regionIdToCodeName);
            })
            .catch((error) => {
                reject(error);
            });
    });
};

export default handleGetRegions;
