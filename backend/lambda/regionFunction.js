const { initializeConnection } = require("./lib.js");

// Setting up evironments
let { SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT } = process.env;

let sql; // Global variable to hold the database connection

exports.handler = async (event) => {
	const response = {
		statusCode: 200,
		headers: {
            "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*"
        },
		body: "",
	};

	// Initialize the database connection if not already initialized
	if (!sql) {
		sql = await initializeConnection(SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT); 
	}
	
	let data;
	try {
		const pathData = event.httpMethod + " " + event.resource;
		switch(pathData) {
			case "GET /region":
				let curr_offset = (event.queryStringParameters != null && event.queryStringParameters.curr_offset) ? event.queryStringParameters.curr_offset : 0;
				let rows_per_page = (event.queryStringParameters != null && event.queryStringParameters.rows_per_page) ? event.queryStringParameters.rows_per_page : 20;

				if (event.queryStringParameters != null && event.queryStringParameters.region_fullname) {
					const region_fullname = "%" + event.queryStringParameters.region_fullname + "%";
					data = await sql`	SELECT * FROM regions
										WHERE region_fullname ILIKE ${region_fullname} 
										ORDER BY region_fullname, region_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else {
					data = await sql`	SELECT * FROM regions
										ORDER BY region_fullname, region_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				}

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
					"regions": data
				};

				response.body = JSON.stringify(res);				
				break;
			case "POST /region":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if (bd.region_code_name &&
						bd.region_fullname &&
						bd.country_fullname) {
						
						// Optional parameters
						const geographic_coordinate = (bd.geographic_coordinate) ? bd.geographic_coordinate : "";
						data = await sql`
							INSERT INTO regions (region_code_name, region_fullname, country_fullname, geographic_coordinate)
							VALUES (${bd.region_code_name}, ${bd.region_fullname}, ${bd.country_fullname}, ${geographic_coordinate})
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
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if (bd.region_id) {
						data = await sql`SELECT * FROM regions WHERE region_id = ${bd.region_id};`;
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
				if(event.body != null && event.pathParameters != null){
					const bd = JSON.parse(event.body);

					// Check if required parameters are passed
					if (bd.region_code_name &&
						bd.region_fullname &&
						bd.country_fullname) {

						// Optional parameters
						const geographic_coordinate = (bd.geographic_coordinate) ? bd.geographic_coordinate : "";
						data = await sql`
							UPDATE regions
							SET region_code_name = ${bd.region_code_name}, 
								region_fullname = ${bd.region_fullname}, 
								country_fullname = ${bd.country_fullname},
								geographic_coordinate = ${bd.geographic_coordinate}
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
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if (bd.region_id) {
						data = await sql`DELETE FROM regions WHERE region_id = ${bd.region_id};`;
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