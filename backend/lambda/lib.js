const postgres = require("postgres");
const AWS = require("aws-sdk");

// Gather AWS services
const secretsManager = new AWS.SecretsManager();

async function initializeConnection(SM_DB_CREDENTIALS, RDS_PROXY_ENDPOINT) {
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
	// sql = postgres(connectionConfig);

	console.log("Database connection initialized");
    return postgres(connectionConfig);
}

module.exports = { initializeConnection };