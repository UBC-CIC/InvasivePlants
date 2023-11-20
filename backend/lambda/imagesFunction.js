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
		body: ""
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
			case "GET /plantsImages":
				data = await sql`SELECT * FROM images`;
				response.body = JSON.stringify(data);
				break;
			case "POST /plantsImages":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if( bd.species_id && (bd.image_url || bd.s3_key)){
						
						// Optional parameters
						const s3_key = (bd.s3_key) ? bd.s3_key : "";
                        const image_url = (bd.image_url) ? bd.image_url : "";
                        const description = (bd.description) ? bd.description : "";
                        const license = (bd.license) ? bd.license : ""; 

						await sql`
							INSERT INTO images (species_id, s3_key, image_url, description, license)
							VALUES (${bd.species_id}, ${s3_key}, ${image_url}, ${description}, ${license});
						`;
						
						response.body = "Added data to plants images";
					} else {
						response.statusCode = 400;
						response.body = "Invalid value";
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";	
				}
				break;
            case "DELETE /plantsImages/{image_id}":
                if(event.pathParameters != null){
                    const bd = event.pathParameters;
                    
                    // Check if required parameters are passed
                    if(bd.image_id){
                        data = await sql`DELETE FROM images WHERE image_id = ${bd.image_id};`;
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
