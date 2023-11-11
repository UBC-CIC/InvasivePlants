const postgres = require("postgres");
const AWS = require("aws-sdk");

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
			case "GET /alternativeSpecies":
			  if(event.queryStringParameters != null && event.queryStringParameters.scientific_name){
			    data = await sql`SELECT * FROM alternative_species WHERE ${event.queryStringParameters.scientific_name} = ANY(scientific_name)`;
			  } else {
				  data = await sql`SELECT * FROM alternative_species`;
			  }
				response.body = JSON.stringify(data);
				break;
			case "POST /alternativeSpecies":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if( bd.scientific_name ){
						
						// Optional parameters
						const common_name = (bd.common_name) ? bd.common_name : [];
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const image_links = (bd.image_links) ? bd.image_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";
						
						await sql`
							INSERT INTO alternative_species (scientific_name, common_name, resource_links, image_links, species_description)
							VALUES (${bd.scientific_name}, ${common_name}, ${resource_links}, ${image_links}, ${species_description});
						`;
						
						response.body = "Added data to alternative species";
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
					if(bd.species_id){
						data = await sql`SELECT * FROM alternative_species WHERE species_id = ${bd.species_id};`;
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
					if( bd.species_id && bd.scientific_name ){
						
						// Optional parameters
						const common_name = (bd.common_name) ? bd.common_name : [];
						const resource_links = (bd.resource_links) ? bd.resource_links : [];
						const image_links = (bd.image_links) ? bd.image_links : [];
						const species_description = (bd.species_description) ? bd.species_description : "";
						
						await sql`
							UPDATE alternative_species
							SET scientific_name = ${bd.scientific_name}, 
							  common_name = ${common_name},
								resource_links = ${resource_links}, 
								image_links = ${image_links},
								species_description = ${species_description},
							WHERE species_id = ${event.pathParameters.species_id};
						`;
						
						response.body = "Updated the data to the alternative species";
					} else {
						response.statusCode = 400;
						response.body = "Invalid value";
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";	
				}
				break;
			case "DELETE /alternativeSpecies/{species_id}":
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if(bd.species_id){
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