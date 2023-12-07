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
			case "GET /alternativeSpecies":
				let curr_offset = (event.queryStringParameters != null && event.queryStringParameters.curr_offset) ? event.queryStringParameters.curr_offset : 0;
				let rows_per_page = (event.queryStringParameters != null && event.queryStringParameters.rows_per_page) ? event.queryStringParameters.rows_per_page : 20;
				let nextOffset = parseInt(curr_offset) + parseInt(rows_per_page);

				if(event.queryStringParameters != null && event.queryStringParameters.scientific_name){
					data = await sql`	SELECT * FROM alternative_species 
										WHERE ${event.queryStringParameters.scientific_name} = ANY(scientific_name)
										ORDER BY scientific_name[1], species_id 
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else {
					data = await sql`	SELECT * FROM alternative_species 
										ORDER BY scientific_name[1], species_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				}
				
				for(let i in data){
					// Get list of images
					data[i].images = await sql`SELECT * FROM images WHERE species_id = ${data[i].species_id};`;
				}

				let res = {
					"nextOffset": nextOffset,
					"species": data
				};

				response.body = JSON.stringify(res);

				break;
			case "POST /alternativeSpecies":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if (bd.scientific_name) {
						
						// Optional parameters
						const common_name = (bd.common_name) ? bd.common_name : [];
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";

						data = await sql`
							INSERT INTO alternative_species (scientific_name, common_name, resource_links, species_description)
							VALUES (${bd.scientific_name}, ${common_name}, ${resource_links}, ${species_description})
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
			case "GET /alternativeSpecies/{species_id}":
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if (bd.species_id) {
						data = await sql`SELECT * FROM alternative_species WHERE species_id = ${bd.species_id};`;

						// Get list of images
						data[0].images = await sql`SELECT * FROM images WHERE species_id = ${data[0].species_id};`;

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
			case "PUT /alternativeSpecies/{species_id}":
				if(event.body != null && event.pathParameters != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if (event.pathParameters.species_id && bd.scientific_name) {

						// Optional parameters
						const common_name = (bd.common_name) ? bd.common_name : [];
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";
						
						data = await sql`
							UPDATE alternative_species
							SET scientific_name = ${bd.scientific_name}, 
								common_name = ${common_name},
								resource_links = ${resource_links}, 
								species_description = ${species_description}
							WHERE species_id = ${event.pathParameters.species_id}
							RETURNING *;
						`;
						
						response.body = JSON.stringify(data);
					} else {
						response.statusCode = 400;
						response.body = `Invalid value, required parameters are not provided`;
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value, body does not found";	
				}
				break;
			case "DELETE /alternativeSpecies/{species_id}":
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if (bd.species_id) {
						data = await sql`DELETE FROM alternative_species WHERE species_id = ${bd.species_id};`;
						response.body = "Deleted an alternative species";
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