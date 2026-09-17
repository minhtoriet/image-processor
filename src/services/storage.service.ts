import 'dotenv/config';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3 = new S3Client({
   region: 'auto',
   endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
   credentials:{
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
   } 
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function uploadFile(key: string, body: Buffer, contentType: string){
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
    }));
    return key; // store this key in Postgres, not a full URL
}
// Keys (jobs/abc123/result.png) are stable forever; 
// URLs (especially signed ones) expire or change 
// if you switch bucket setups later. Generate the actual URL on read, 
// not on write.
export async function getSignedDownloadUrl(key: string, expiresInSeconds: number = 3600){
    const command = new GetObjectCommand({Bucket: BUCKET,Key: key});
    return getSignedUrl(s3, command, {expiresIn: expiresInSeconds});
}