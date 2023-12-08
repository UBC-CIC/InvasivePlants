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
			case "GET /invasiveSpecies":
				let curr_offset = (event.queryStringParameters != null && event.queryStringParameters.curr_offset) ? event.queryStringParameters.curr_offset : 0;
				let rows_per_page = (event.queryStringParameters != null && event.queryStringParameters.rows_per_page) ? event.queryStringParameters.rows_per_page : 20;
				let nextOffset = parseInt(curr_offset) + parseInt(rows_per_page);

				if(event.queryStringParameters != null && event.queryStringParameters.scientific_name){
					data = await sql`	SELECT * FROM invasive_species 
										WHERE ${event.queryStringParameters.scientific_name} = ANY(scientific_name)
										ORDER BY scientific_name[1], species_id 
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.region_id) {
					data = await sql`	SELECT * FROM invasive_species 
										WHERE ${event.queryStringParameters.region_id} = ANY(region_id) 
										ORDER BY scientific_name[1], species_id 
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.all) {
					data = await sql`	SELECT * FROM invasive_species 
										ORDER BY scientific_name[1], species_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else {
					data = await sql`	SELECT * FROM invasive_species 
										ORDER BY scientific_name[1], species_id
										LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				}
				for (let d in data) {
					// Get alternative species and images
					data[d].alternative_species = await sql`SELECT * FROM alternative_species WHERE species_id = ANY(${data[d].alternative_species});`;

					// Get images for each species
					for (let d_alt in data[d].alternative_species) {
						data[d].alternative_species[d_alt].images = await sql`SELECT * FROM images WHERE species_id = ${data[d].alternative_species[d_alt].species_id};`;
					}
				}

				if (data.length < rows_per_page) {
					nextOffset = curr_offset;
				}

				let res = {
					"nextOffset": nextOffset,
					"species": data
				};

				response.body = JSON.stringify(res);
				break;
			case "POST /invasiveSpecies":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if (bd.scientific_name) {
						
						// Optional parameters
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";
						const region_id = (bd.region_id) ? bd.region_id : [];
						const alternative_species = (bd.alternative_species) ? bd.alternative_species : [];

						data = await sql`
							INSERT INTO invasive_species (scientific_name, resource_links, species_description, region_id, alternative_species)
							VALUES (${bd.scientific_name}, ${resource_links}, ${species_description}, ${region_id}, ${alternative_species})
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
			case "GET /invasiveSpecies/{species_id}":
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if (bd.species_id) {
						data = await sql`SELECT * FROM invasive_species WHERE species_id = ${bd.species_id};`;

						// Get alternative species and images
						data[0].alternative_species = await sql`SELECT * FROM alternative_species WHERE species_id = ANY(${data[0].alternative_species});`;

						// Get images for each species
						for (let i in data[0].alternative_species) {
							data[0].alternative_species[i].images = await sql`SELECT * FROM images WHERE species_id = ${data[0].alternative_species[i].species_id};`;
						}

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
			case "PUT /invasiveSpecies/{species_id}":
				if(event.body != null && event.pathParameters != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if (event.pathParameters.species_id && bd.scientific_name) {

						// Optional parameters
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";
						const region_id = (bd.region_id) ? bd.region_id : [];
						const alternative_species = (bd.alternative_species) ? bd.alternative_species : [];
						
						data = await sql`
							UPDATE invasive_species
							SET scientific_name = ${bd.scientific_name}, 
								resource_links = ${resource_links}, 
								species_description = ${species_description},
								region_id = ${region_id},
								alternative_species = ${alternative_species}
							WHERE species_id = ${event.pathParameters.species_id}
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
			case "DELETE /invasiveSpecies/{species_id}":
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if (bd.species_id) {
						data = await sql`DELETE FROM invasive_species WHERE species_id = ${bd.species_id};`;
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
