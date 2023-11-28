const postgres = require("postgres");
const AWS = require("aws-sdk");

// const PAGE_LIMIT = 20;

// Gather AWS services
const secretsManager = new AWS.SecretsManager();

// Setting up evironments
let { SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT } = process.env;

let sql; // Global variable to hold the database connection

async function initializeConnection() {
	// Retrieve the secret from AWS Secrets Manager
	const secret = await secretsManager
	.getSecretValue({ SecretId: SM_DB_CREDENTIALS })
	.promise();

	const credentials = JSON.parse(secret.SecretString);

	const connectionConfig = {
		host: RDS_PROXY_ENDPOINT, // using the proxy endpoint instead of db host
		port: credentials.port,
		username: credentials.username,
		password: credentials.password,
		database: credentials.dbname,
		ssl: true,
	};

	// Create the PostgreSQL connection
	sql = postgres(connectionConfig);

	console.log("Database connection initialized");

}

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
		await initializeConnection(); 
	}
	
	let data;
	try {
		const pathData = event.httpMethod + " " + event.resource;
		switch(pathData) {
			case "GET /invasiveSpecies":
				let species_id_pagination = (event.queryStringParameters != null && event.queryStringParameters.last_species_id) ? event.queryStringParameters.last_species_id : "00000000-0000-0000-0000-000000000000";
				let rows_per_page = (event.queryStringParameters != null && event.queryStringParameters.rows_per_page) ? event.queryStringParameters.rows_per_page : 20;

				if(event.queryStringParameters != null && event.queryStringParameters.scientific_name){
					data = await sql`	SELECT * FROM invasive_species 
										WHERE ${event.queryStringParameters.scientific_name} = ANY(scientific_name) and species_id > ${species_id_pagination}
										ORDER BY species_id 
										LIMIT ${rows_per_page};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.region_id) {
					data = await sql`	SELECT * FROM invasive_species 
										WHERE ${event.queryStringParameters.region_id} = ANY(region_id) and species_id > ${species_id_pagination}
										ORDER BY species_id 
										LIMIT ${rows_per_page};`;
				} else if (event.queryStringParameters != null && event.queryStringParameters.all) {
					data = await sql`	SELECT * FROM invasive_species 
										ORDER BY species_id;`;
				} else {
					data = await sql`	SELECT * FROM invasive_species 
										WHERE species_id > ${species_id_pagination}
										ORDER BY species_id 
										LIMIT ${rows_per_page};`;
				}
				for(let d in data){
					// Get alternative species and images
					data[d].alternative_species = await sql`SELECT * FROM alternative_species WHERE species_id = ANY(${data[d].alternative_species});`;
					
					// Get images for each species
					for(let d_alt in data[d].alternative_species){
						data[d].alternative_species[d_alt].images = await sql`SELECT * FROM images WHERE species_id = ${data[d].alternative_species[d_alt].species_id};`;
					}
				}
				response.body = JSON.stringify(data);
				break;
			case "POST /invasiveSpecies":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if( bd.scientific_name ){
						
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
					if(bd.species_id){
						data = await sql`SELECT * FROM invasive_species WHERE species_id = ${bd.species_id};`;
						
						// Get alternative species and images
						data[0].alternative_species = await sql`SELECT * FROM alternative_species WHERE species_id = ANY(${data[0].alternative_species});`;
						
						// Get images for each species
						for(let i in data[0].alternative_species){
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
					if( event.pathParameters.species_id && bd.scientific_name ){
						
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
					if(bd.species_id){
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
