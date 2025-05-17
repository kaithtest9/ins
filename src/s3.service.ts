import { S3Client, PutObjectCommand, PutObjectCommandOutput } from "@aws-sdk/client-s3";
// getSignedUrl不再需要，除非有其他地方用到
// import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from 'uuid';
import config from "./config";

const s3Client = new S3Client({
    region: config.OBJECT_STORAGE_REGION,
    credentials: {
        accessKeyId: config.OBJECT_STORAGE_ACCESS_KEY_ID,
        secretAccessKey: config.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    },
    endpoint: "https://objstorage.leapcell.io", // Optional: If using a custom S3 endpoint
});

// PresignedUrlResponse 和 generatePresignedUploadUrl 不再需要，可以移除或注释掉
/*
const PRESIGNED_URL_EXPIRES_IN = 300;
export interface PresignedUrlResponse {
    uploadUrl: string;
    objectKey: string;
}
export const generatePresignedUploadUrl = async (...): Promise<PresignedUrlResponse> => { ... };
*/

interface UploadBase64Response {
    s3ObjectKey: string;
    s3ObjectUrl: string; // The full public URL
    s3Response: PutObjectCommandOutput; // Raw S3 response
}

/**
 * Decodes a base64 string and uploads the resulting buffer to S3.
 * @param base64Data The base64 encoded image string (without 'data:image/jpeg;base64,' prefix).
 * @param fileType The MIME type of the image (e.g., 'image/jpeg', 'image/png').
 * @param customKey Optional: A specific key to use for the S3 object. If not provided, a UUID-based key is generated.
 * @returns Promise<UploadBase64Response>
 */
export const uploadBase64ToS3 = async (
    base64Data: string,
    fileType: string,
    customKey?: string
): Promise<UploadBase64Response> => {
    console.log("Uploading base64 data to S3...");
    if (!config.OBJECT_STORAGE_BUCKET_NAME) {
        throw new Error("S3_BUCKET_NAME is not configured.");
    }
    console.log("S3_BUCKET_NAME:", config.OBJECT_STORAGE_BUCKET_NAME);
    if (!fileType.startsWith('image/')) {
        throw new Error("Invalid fileType. Must be an image MIME type (e.g., image/jpeg, image/png).");
    }

    // Decode Base64 string to Buffer
    const buffer = Buffer.from(base64Data, 'base64');
    console.log("Buffer length:", buffer.length);

    // Determine file extension from MIME type
    const extension = fileType.split('/')[1] || 'tmp';
    const objectKey = customKey || `uploads/images/${uuidv4()}.${extension}`;

    console.log("Generated S3 object key:", objectKey);
    const command = new PutObjectCommand({
        Bucket: config.OBJECT_STORAGE_BUCKET_NAME,
        Key: objectKey,
        Body: buffer,
        ContentType: fileType,
    });

    try {
        console.log("Sending S3 upload command...");
        const s3Response = await s3Client.send(command);

        const s3ObjectUrl = getPublicS3Url(objectKey); // Use existing helper

        console.log("S3 upload result:", s3Response);

        return {
            s3ObjectKey: objectKey,
            s3ObjectUrl: s3ObjectUrl,
            s3Response: s3Response,
        };
    } catch (error) {
        console.error("Error uploading base64 data to S3:", error);
        throw new Error("Could not upload image to S3.");
    }
};

export const getPublicS3Url = (objectKey: string): string => {
    if (!config.OBJECT_STORAGE_BUCKET_NAME || !config.OBJECT_STORAGE_REGION) {
        console.warn("Object Storage bucket name or region not configured for public URL construction.");
        return objectKey;
    }
    return `https://1xg7ah.leapcellobj.com/myobj-74ft-tzmo-yj2gugcj/${objectKey}`;
};