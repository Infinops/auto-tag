import { EC2 } from "@aws-sdk/client-ec2";
import { S3 } from "@aws-sdk/client-s3";

export const ec2Client = new EC2({});
export const s3Client = new S3({});