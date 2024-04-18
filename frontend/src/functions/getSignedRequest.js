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

  return response;
}