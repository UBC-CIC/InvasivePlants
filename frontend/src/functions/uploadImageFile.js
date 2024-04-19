import axios from "axios";

// Uploads image file to S3
export const uploadImageFile = async (e, handleInputChange, tempData = null) => {
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const files = e.target.files;

    if (files) {
        let s3Keys = [];

        if (tempData && tempData.s3_keys) {
            s3Keys = [...tempData.s3_keys];
        }

        try {
            for (let i = 0; i < files.length; i++) {
                // modified from https://raz-levy.medium.com/how-to-upload-files-to-aws-s3-from-the-client-side-using-react-js-and-node-js-660252e61e0
                const timestamp = new Date().getTime();
                const file = e.target.files[i];
                const filename = file.name.split('.')[0].replace(/[&/\\#,+()$~%'":*?<>{}]/g, '').toLowerCase() + `_${timestamp}`;
                const fileExtension = file.name.split('.').pop();

                // GET request to getS3SignedURL endpoint
                const signedURLResponse = await axios
                    .get(`${API_BASE_URL}/getS3SignedURL`, {
                        params: {
                            contentType: files[i].type,
                            filename: `${filename}.${fileExtension}`
                        }
                    });


                if (!signedURLResponse.data.uploadURL) {
                    continue;
                }

                const signedURLData = signedURLResponse.data;

                // Use the obtained signed URL to upload the image to S3 bucket
                await axios.put(signedURLData.uploadURL, files[i])

                // Image uploaded successfully, add its s3 key to the list
                if (signedURLData.key) {
                    s3Keys.push(signedURLData.key);
                }
            }

            handleInputChange('s3_keys', s3Keys);
        } catch (error) {
            console.error('Error uploading images:', error);
        }
    }
};