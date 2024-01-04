const { initializeConnection } = require("./lib.js");

// Setting up evironments
let { SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT } = process.env;

// SQL conneciton from global variable at lib.js
let sqlConnection = global.sqlConnection;

exports.handler = async (event) => {
	const response = {
		statusCode: 200,
		headers: {
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
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

	// Function to format scientific names (lowercase and spaces replaced with "_")
	const formatScientificName = (name) => {
		return name.toLowerCase().replace(/\s+/g, '_');
	};

	let data;
	try {
		const pathData = event.httpMethod + " " + event.resource;
		switch (pathData) {
			case "GET /invasiveSpecies":
				let curr_offset = (event.queryStringParameters != null && event.queryStringParameters.curr_offset) ? event.queryStringParameters.curr_offset : 0;
				let rows_per_page = (event.queryStringParameters != null && event.queryStringParameters.rows_per_page) ? event.queryStringParameters.rows_per_page : 20;

				if (event.queryStringParameters != null && event.queryStringParameters.scientific_name && event.queryStringParameters.region_id) {
					data = await sqlConnection`SELECT 
                                i.*, 
                                ARRAY_AGG(r.region_code_name) AS region_code_names
                            FROM 
                                invasive_species i
                            JOIN 
                                regions r ON r.region_id = ANY(i.region_id)
                            WHERE 
                                EXISTS (
                                    SELECT 1
                                    FROM unnest(i.scientific_name) AS name
                                    WHERE name ILIKE '%' || ${event.queryStringParameters.scientific_name} || '%'
                                ) 
                                AND ${event.queryStringParameters.region_id} = ANY(i.region_id)
                            GROUP BY 
                                i.species_id
                            ORDER BY 
                                i.scientific_name[1], i.species_id
                            LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.scientific_name) {
					data = await sqlConnection`SELECT 
                                    i.*,
                                    ARRAY_AGG(r.region_code_name) OVER (PARTITION BY i.species_id) AS region_code_names,
                                    ARRAY_AGG(
						                json_build_object(
						                    'region_id', r.region_id,
						                    'region_code_name', r.region_code_name,
						                    'region_fullname', r.region_fullname,
						                    'country_fullname', r.country_fullname,
						                    'geographic_coordinate', r.geographic_coordinate
						                )
						            ) AS all_regions
                                FROM 
                                    invasive_species i
                                JOIN 
                                    regions r ON r.region_id = ANY(i.region_id)
                                WHERE 
                                    EXISTS (
                                        SELECT 1
                                        FROM unnest(i.scientific_name) AS name
                                        WHERE name ILIKE '%' || ${event.queryStringParameters.scientific_name} || '%'
                                    )
                                ORDER BY 
                                    i.scientific_name[1], i.species_id 
                                LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.region_id) {
					data = await sqlConnection`SELECT 
                                    i.*, 
                                    ARRAY_AGG(r.region_code_name) AS region_code_names,
                                    ARRAY_AGG(
						                json_build_object(
						                    'region_id', r.region_id,
						                    'region_code_name', r.region_code_name,
						                    'region_fullname', r.region_fullname,
						                    'country_fullname', r.country_fullname,
						                    'geographic_coordinate', r.geographic_coordinate
						                )
						            ) AS all_regions
                                FROM 
                                    invasive_species i
                                JOIN 
                                    regions r ON r.region_id = ANY(i.region_id)
                                WHERE 
                                    ${event.queryStringParameters.region_id} = ANY(i.region_id)
                                GROUP BY 
                                    i.species_id
                                ORDER BY 
                                    i.species_id
                                LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.all) {
					data = await sqlConnection`SELECT 
                                    i.*, 
                                    ARRAY_AGG(r.region_code_name) AS region_code_names,
                                    ARRAY_AGG(
						                json_build_object(
						                    'region_id', r.region_id,
						                    'region_code_name', r.region_code_name,
						                    'region_fullname', r.region_fullname,
						                    'country_fullname', r.country_fullname,
						                    'geographic_coordinate', r.geographic_coordinate
						                )
						            ) AS all_regions
                                FROM 
                                    invasive_species i
                                JOIN 
                                    regions r ON r.region_id = ANY(i.region_id)
                                ORDER BY 
                                    i.scientific_name[1], i.species_id
                                LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				} else {
					data = await sqlConnection`SELECT 
                                    i.*, 
                                    ARRAY_AGG(r.region_code_name) AS region_code_names,
                                    ARRAY_AGG(
						                json_build_object(
						                    'region_id', r.region_id,
						                    'region_code_name', r.region_code_name,
						                    'region_fullname', r.region_fullname,
						                    'country_fullname', r.country_fullname,
						                    'geographic_coordinate', r.geographic_coordinate
						                )
						            ) AS all_regions
                                FROM 
                                    invasive_species i
                                JOIN 
                                    regions r ON r.region_id = ANY(i.region_id)
                                GROUP BY 
                                    i.species_id
                                ORDER BY 
                                    i.scientific_name[1], i.species_id
                                LIMIT ${rows_per_page} OFFSET ${curr_offset};`;
				}


				for (let d in data) {
					// Get alternative species and images
					data[d].alternative_species = await sqlConnection`SELECT * FROM alternative_species WHERE species_id = ANY(${data[d].alternative_species});`;

					// Get images for each species
					for (let d_alt in data[d].alternative_species) {
						data[d].alternative_species[d_alt].images = await sqlConnection`SELECT * FROM images WHERE species_id = ${data[d].alternative_species[d_alt].species_id};`;
					}
				}

				let totalCount = await sqlConnection` SELECT COUNT(*) FROM invasive_species;`;
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
					"species": data,
					"count": totalCount
				};

				response.body = JSON.stringify(res);
				break;
			case "POST /invasiveSpecies":
				if (event.body != null) {
					const bd = JSON.parse(event.body);

					// Check if required parameters are passed
					if (bd.scientific_name) {
						// Ensure that scientific names are formatted correctly
						const formattedScientificNames = Array.isArray(bd.scientific_name)
							? bd.scientific_name.map(formatScientificName)
							: [formatScientificName(bd.scientific_name)];

						// Optional parameters
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";
						const region_id = (bd.region_id) ? bd.region_id : [];
						const alternative_species = (bd.alternative_species) ? bd.alternative_species : [];

						data = await sqlConnection`
							INSERT INTO invasive_species (scientific_name, resource_links, species_description, region_id, alternative_species)
							VALUES (${formattedScientificNames}, ${resource_links}, ${species_description}, ${region_id}, ${alternative_species})
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
				if (event.pathParameters != null) {
					const bd = event.pathParameters;

					// Check if required parameters are passed
					if (bd.species_id) {
						data = await sqlConnection`SELECT * FROM invasive_species WHERE species_id = ${bd.species_id};`;

						// Get alternative species and images
						data[0].alternative_species = await sqlConnection`SELECT * FROM alternative_species WHERE species_id = ANY(${data[0].alternative_species});`;

						// Get images for each species
						for (let i in data[0].alternative_species) {
							data[0].alternative_species[i].images = await sqlConnection`SELECT * FROM images WHERE species_id = ${data[0].alternative_species[i].species_id};`;
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
				if (event.body != null && event.pathParameters != null) {
					const bd = JSON.parse(event.body);

					// Check if required parameters are passed
					if (event.pathParameters.species_id && bd.scientific_name) {
						// Ensure that scientific names are formatted correctly
						const formattedScientificNames = Array.isArray(bd.scientific_name)
							? bd.scientific_name.map(formatScientificName)
							: [formatScientificName(bd.scientific_name)];

						// Optional parameters
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";
						const region_id = (bd.region_id) ? bd.region_id : [];
						const alternative_species = (bd.alternative_species) ? bd.alternative_species : [];

						data = await sqlConnection`
							UPDATE invasive_species
							SET scientific_name = ${formattedScientificNames}, 
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
				if (event.pathParameters != null) {
					const bd = event.pathParameters;

					// Check if required parameters are passed
					if (bd.species_id) {
						data = await sqlConnection`DELETE FROM invasive_species WHERE species_id = ${bd.species_id};`;
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
