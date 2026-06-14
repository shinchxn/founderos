import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

let cachedClient: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!cachedClient) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are required for S3");
    }
    cachedClient = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION || "us-east-1",
    });
  }
  return cachedClient;
}

const s3Client = new Proxy({} as S3Client, {
  get: (target, prop) => {
    return getS3Client()[prop as keyof S3Client];
  }
});

export async function uploadMeetingNotes(workspaceId: string, meetingId: string, text: string): Promise<string> {
  const key = `meetings/${workspaceId}/${meetingId}.txt`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    Body: text,
    ContentType: "text/plain; charset=utf-8",
  });

  await s3Client.send(command);
  return key;
}

export async function getMeetingNotes(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  });

  const response = await s3Client.send(command);
  if (!response.Body) {
    throw new Error(`Empty body for S3 key: ${key}`);
  }
  
  return response.Body.transformToString("utf-8");
}
