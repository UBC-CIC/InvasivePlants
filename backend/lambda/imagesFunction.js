const { initializeConnection } = require("./lib.js");
const AWS = require("aws-sdk");

// Setting up evironments
let { SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT, AWS_REGION, BUCKET_NAME } = process.env;

// Setup aws
AWS.config.update({ region: AWS_REGION });

const s3 = new AWS.S3();
let sql; // Global variable to hold the database connection

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
		sql = await initializeConnection(SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT); 
	}
	
	let data;
	try {
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
					if (bd.species_id && (bd.image_url || bd.s3_key)) {

						// Optional parameters
						const s3_key = (bd.s3_key) ? bd.s3_key : "";
                        const image_url = (bd.image_url) ? bd.image_url : "";
                        const description = (bd.description) ? bd.description : "";
                        const license = (bd.license) ? bd.license : ""; 

						await sql`
							INSERT INTO images (species_id, s3_key, image_url, description, license)
							VALUES (${bd.species_id}, ${s3_key}, ${image_url}, ${description}, ${license})
							RETURNING image_id;
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
                    	const imageData = await sql`SELECT s3_key FROM images WHERE image_id = ${bd.image_id};`;

                    	if(imageData[0] && imageData[0].s3_key !== null && imageData[0].s3_key !== ""){
                    		// Delete object on S3 bucket based on object key.
                    		var s3Params = {
							  Bucket: BUCKET_NAME, 
							  Key: imageData[0].s3_key
							};
							
							const result = await s3.deleteObject(s3Params).promise();
                    	}
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
