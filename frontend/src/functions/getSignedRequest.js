import { formatSpeciesData, formatRegionData } from "./dataFormattingUtils";
import sigV4Client from "./sigV4Client";

// Generates a signed request for authenticating GET endpoints
export async function getSignedRequest(path, queryParams = {}, credentials) {
  const signedRequest = sigV4Client
    .newClient({
      accessKey: credentials.accessKeyId,
      secretKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      region: process.env.REACT_APP_REGION,
      endpoint: process.env.REACT_APP_API_BASE_URL
    })
    .signRequest({
      method: 'GET',
      path: path,
      headers: {},
      queryParams: queryParams
    });

  const response = await fetch(signedRequest.url, {
    headers: signedRequest.headers,
    method: 'GET'
  });

  if (response.ok) {
    const responseData = await response.json();
    let formattedData;

    if (path === "invasiveSpecies" || path === "alternativeSpecies") {
      formattedData = formatSpeciesData(responseData);
    } else if (path === "region") {
      formattedData = formatRegionData(responseData);
    }

    return { responseData, formattedData };
  } else {
    console.log('Failed to retrieve data:', response.statusText);
  }

}