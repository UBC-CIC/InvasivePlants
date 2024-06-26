const { initializeConnection } = require("./lib.js");

// Setting up evironments
let { SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT } = process.env;

// SQL conneciton from global variable at lib.js
let sqlConnection = global.sqlConnection;

exports.handler = async (event) => {
	const response = {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "*"
		},
		body: "",
	};

	// Initialize the database connection if not already initialized
	if (!sqlConnection) {
		await initializeConnection(SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT);
		sqlConnection = global.sqlConnection;
	}

	// Function to format region full names (lowercase and spaces replaced with "_")
	const formatRegionName = (name) => {
		return name.toLowerCase().replace(/\s+/g, '_');
	};

	let data;
	try {
		const pathData = event.httpMethod + " " + event.resource;
		switch (pathData) {
			case "GET /region":
				let curr_offset = (event.queryStringParameters != null && event.queryStringParameters.curr_offset) ? event.queryStringParameters.curr_offset : 0;
				let rows_per_page = (event.queryStringParameters != null && event.queryStringParameters.rows_per_page) ? event.queryStringParameters.rows_per_page : 20;

				if (event.queryStringParameters != null && event.queryStringParameters.region_fullname) {
					data = await sqlConnection`	SELECT * FROM regions
										WHERE (region_fullname ILIKE '%' || ${event.queryStringParameters.region_fullname} || '%')
										OR (region_code_name ILIKE '%' ||  ${event.queryStringParameters.region_fullname} || '%')
										ORDER BY region_fullname, region_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.region_code_name) {
					const region_codeName = "%" + event.queryStringParameters.region_code_name + "%";
					data = await sqlConnection`	SELECT * FROM regions
										WHERE region_code_name ILIKE '%' || ${region_codeName} || '%' 
										ORDER BY region_fullname, region_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else {
					data = await sqlConnection`	SELECT * FROM regions
										ORDER BY region_fullname, region_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				}

				let totalCount = await sqlConnection` SELECT COUNT(*) FROM regions;`;
				let nextOffset = parseInt(curr_offset);

				// If the number of rows returned is less than the number of rows requested, 
				// nextOffset will be the current offset plus the number of rows returned.
				// Otherwise, set nextOffset to the current offset plus the number of rows requested. 
				if (data.length < rows_per_page) {
					nextOffset += data.length;
				} else {
					nextOffset += parseInt(rows_per_page);
				}

				let res = {
					"nextOffset": nextOffset,
					"regions": data,
					"count": totalCount
				};

				response.body = JSON.stringify(res);
				break;
			case "POST /region":
				if (event.body != null) {
					const bd = JSON.parse(event.body);

					// Check if required parameters are passed
					if (bd.region_code_name &&
						bd.region_fullname &&
						bd.country_fullname) {

						// Ensure that fields are formatted correctly
						const formattedRegionName = formatRegionName(bd.region_fullname);

						// Optional parameters
						const geographic_coordinate = (bd.geographic_coordinate === "," || bd.geographic_coordinate === null) ? "" : bd.geographic_coordinate;

						data = await sqlConnection`
							INSERT INTO regions (region_code_name, region_fullname, country_fullname, geographic_coordinate)
							VALUES (${bd.region_code_name.toUpperCase()}, ${formattedRegionName}, ${bd.country_fullname.toLowerCase()}, ${geographic_coordinate})
							RETURNING *;
						`;

						response.body = JSON.stringify(data);
					} else {
						response.statusCode = 400;
						response.body = "Invalid value";
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";
				}
				break;
			case "GET /region/{region_id}":
				if (event.pathParameters != null) {
					const bd = event.pathParameters;

					// Check if required parameters are passed
					if (bd.region_id) {
						data = await sqlConnection`SELECT * FROM regions WHERE region_id = ${bd.region_id};`;
						response.body = JSON.stringify(data);
					} else {
						response.statusCode = 400;
						response.body = "Invalid value";
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";
				}
				break;
			case "PUT /region/{region_id}":
				if (event.body != null && event.pathParameters != null) {
					const bd = JSON.parse(event.body);

					// Check if required parameters are passed
					if (bd.region_code_name &&
						bd.region_fullname &&
						bd.country_fullname) {

						// Ensure that fields are formatted correctly
						const formattedRegionName = formatRegionName(bd.region_fullname);

						// Optional parameters
						// const geographic_coordinate = (bd.geographic_coordinate) ? bd.geographic_coordinate : "";
						const geographic_coordinate = (bd.geographic_coordinate === "," || bd.geographic_coordinate === null) ? "" : bd.geographic_coordinate;

						data = await sqlConnection`
							UPDATE regions
							SET region_code_name = ${bd.region_code_name.toUpperCase()}, 
								region_fullname = ${formattedRegionName}, 
								country_fullname = ${bd.country_fullname.toLowerCase()},
								geographic_coordinate = ${geographic_coordinate}
							WHERE region_id = ${event.pathParameters.region_id}
							RETURNING *;
						`;
						response.body = JSON.stringify(data);
					} else {
						response.statusCode = 400;
						response.body = "Invalid value";
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";
				}
				break;
			case "DELETE /region/{region_id}":
				if (event.pathParameters != null) {
					const bd = event.pathParameters;

					// Check if required parameters are passed
					if (bd.region_id) {
						data = await sqlConnection`DELETE FROM regions WHERE region_id = ${bd.region_id};`;
						response.body = "Deleted a region";
					} else {
						response.statusCode = 400;
						response.body = "Invalid value";
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";
				}
				break;
			default:
				throw new Error(`Unsupported route: "${pathData}"`);
		}
	} catch (error) {
		response.statusCode = 400;
		response.body = JSON.stringify(error.message);
	}

	return response;
};