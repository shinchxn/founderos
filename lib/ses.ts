import { SESClient, SendEmailCommand, VerifyEmailIdentityCommand } from "@aws-sdk/client-ses";

let cachedClient: SESClient | null = null;

export function getSESClient(): SESClient {
  if (!cachedClient) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are required for SES");
    }
    cachedClient = new SESClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION || "us-east-1",
    });
  }
  return cachedClient;
}

const sesClient = new Proxy({} as SESClient, {
  get: (target, prop) => {
    return getSESClient()[prop as keyof SESClient];
  }
});

export async function sendInvestorUpdate(toEmail: string, subject: string, bodyText: string): Promise<string> {
  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL!,
    Destination: {
      ToAddresses: [toEmail],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Text: {
          Data: bodyText,
          Charset: "UTF-8",
        },
      },
    },
  });

  try {
    const response = await sesClient.send(command);
    return response.MessageId!;
  } catch (error: any) {
    throw new Error(`Failed to send email via SES: ${error.message}`);
  }
}

export async function verifyEmailAddress(email: string): Promise<void> {
  const command = new VerifyEmailIdentityCommand({
    EmailAddress: email,
  });
  
  await sesClient.send(command);
}
