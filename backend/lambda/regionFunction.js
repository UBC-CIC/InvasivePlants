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
		body: "Hello World, Region!",
	};

	// Initialize the database connection if not already initialized
	if (!sql) {
		await initializeConnection(); 
	}
	
	let data;
	try {
		console.log("Event: ", event);
		const pathData = event.httpMethod + " " + event.resource;
		switch(pathData) {
			case "GET /region":
				data = await sql`SELECT * FROM regions`;
				response.body = JSON.stringify(data);
				break;
			case "POST /region":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if( bd.region_code_name && 
						bd.region_fullname && 
						bd.country_fullname){
						
						// Optional parameters
						const geographic_coordinate = (bd.geographic_coordinate) ? bd.geographic_coordinate : "";
						await sql`
							INSERT INTO regions (region_code_name, region_fullname, country_fullname, geographic_coordinate)
							VALUES (${bd.region_code_name}, ${bd.region_fullname}, ${bd.country_fullname}, ${geographic_coordinate});
						`;
						
						response.body = "Added data to region";
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
					if(bd.region_id){
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
					if( bd.region_code_name && 
						bd.region_fullname && 
						bd.country_fullname &&
						bd.geographic_coordinate &&
						event.pathParameters.region_id){
						
						await sql`
							UPDATE regions
							SET region_code_name = ${bd.region_code_name}, 
								region_fullname = ${bd.region_fullname}, 
								country_fullname = ${bd.country_fullname},
								geographic_coordinate = ${bd.geographic_coordinate}
							WHERE region_id = ${event.pathParameters.region_id};
						`;
						
						response.body = "Updated the data to the region";
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
					if(bd.region_id){
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