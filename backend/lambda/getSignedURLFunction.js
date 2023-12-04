const AWS = require("aws-sdk");

// Inspire by https://aws.amazon.com/blogs/compute/uploading-to-amazon-s3-directly-from-a-web-or-mobile-application/
// List of contentType: http://www.iana.org/assignments/media-types/media-types.xhtml

// Setting up evironments
let { AWS_REGION, BUCKET_NAME } = process.env;

// Setup
AWS.config.update({ region: AWS_REGION });
const URL_EXPIRATION_SECONDS = 300;
const s3 = new AWS.S3();

const getUploadURL = async function(event) {
  // Generate default value for parameters
  const randomID = parseInt(Math.random() * 10000000);
  let key = `userLoadedPhotos/${randomID}.jpg`;
  let contentType = 'image/jpeg';
  
  // Update changes of the default parameters
  // TODO make sure key user provided is loaded to userLoadedPhotos folder.
  if(event.queryStringParameters != null){
    key = (event.queryStringParameters.filename) ? event.queryStringParameters.filename : key;
    contentType = (event.queryStringParameters.contentType) ? event.queryStringParameters.contentType : contentType;
    // TODO: get alternative species id??
  }
  
  // Get signed URL from S3
  const s3Params = {
    Bucket: BUCKET_NAME,
    Key: key, // TODO
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: contentType
  };
  
  // Get Signed URL
  const uploadURL = await s3.getSignedUrlPromise('putObject', s3Params);
  
  return JSON.stringify({
    uploadURL: uploadURL,
    key
  });
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

	response.body = await getUploadURL(event);
	return response;
};