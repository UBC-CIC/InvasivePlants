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
	
	const userId = event?.requestContext?.authorizer?.userId ?? null;

  if (userId == null || userId == undefined) {
    throw new Error("user id is not found.");
  }

	// Initialize the database connection if not already initialized
	if (!sql) {
		sql = await initializeConnection(SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT); 
	}
	
	let data;
	try {
		const pathData = event.httpMethod + " " + event.resource;
		switch(pathData) {
		  case "GET /saveList":
				data = await sql`SELECT * FROM save_lists WHERE user_uuid = ${userId}`;
				response.body = JSON.stringify(data);
				break;
			case "POST /saveList":
				if(event.body != null){
					const bd = JSON.parse(event.body);
					
					if (bd.list_name && bd.saved_species) {
            let list_id_returns = await sql`
							INSERT INTO save_lists (user_uuid, list_name, saved_species)
							VALUES (${userId}, ${bd.list_name}, ${bd.saved_species})
							RETURNING list_id;
						`;

            response.body = JSON.stringify(list_id_returns[0]);
          } else {
            response.statusCode = 400;
            response.body = "Invalid value";
          }
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";	
				}
				break;
			case "GET /saveList/{list_id}":
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if(bd.list_id){
						data =
              await sql`SELECT * FROM save_lists WHERE list_id = ${bd.list_id} AND user_uuid = ${userId};`;
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
			case "PUT /saveList/{list_id}":
				if(event.body != null && event.pathParameters != null){
					const bd = JSON.parse(event.body);
					
					// Check if required parameters are passed
					if( event.pathParameters.list_id && bd.list_name && bd.saved_species){
            await sql`
							UPDATE save_lists
							SET list_name = ${bd.list_name}, 
							  saved_species = ${bd.saved_species},
							WHERE list_id = ${event.pathParameters.list_id} AND user_uuid = ${userId};
						`;

            response.body = "Updated the data to the save list";
          } else {
						response.statusCode = 400;
						response.body = "Invalid value";
					}
				} else {
					response.statusCode = 400;
					response.body = "Invalid value";	
				}
				break;
			case "DELETE /saveList/{list_id}":
				if(event.pathParameters != null){
					const bd = event.pathParameters;
					
					// Check if required parameters are passed
					if(bd.list_id){
						data =
              await sql`DELETE FROM save_lists WHERE list_id = ${bd.list_id} AND user_uuid = ${userId};`;
						response.body = "Deleted a save list";
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