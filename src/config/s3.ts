import { S3Client } from '@aws-sdk/client-s3';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || 'your-bucket-name';

export const s3Client = new S3Client({ region: REGION });
export const getS3Bucket = () => BUCKET;
