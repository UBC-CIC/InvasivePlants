// import axios from "axios";
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Not being used
// Request to fetch all regions in the database -- unused in the admin page, only used in speciesToJSON.js
// const handleGetRegions = () => {
// return new Promise((resolve, reject) => {
//     axios
//         .get(`${API_BASE_URL}region`, {
//             headers: {
//                 // 'x-api-key': process.env.REACT_APP_X_API_KEY
//             }
//         })
//         .then((response) => {
//             const regionsData = response.data.regions;
//             const regionIdToCodeName = {};

//             // map region_id to region_code_name
//             regionsData.forEach(region => {
//                 regionIdToCodeName[region.region_id] = region.region_code_name;
//             });

//             resolve(regionIdToCodeName);
//         })
//         .catch((error) => {
//             reject(error);
//         });
// });
// };

// export default handleGetRegions;
