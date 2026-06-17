import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import pRetry from "p-retry";

let cachedClient: BedrockRuntimeClient | null = null;

export function getBedrockClient(): BedrockRuntimeClient {
  if (!cachedClient) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are required for Bedrock");
    }
    cachedClient = new BedrockRuntimeClient({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_BEDROCK_REGION || "us-east-1",
    });
  }
  return cachedClient;
}

export const bedrockClient = new Proxy({} as BedrockRuntimeClient, {
  get: (target, prop) => {
    return getBedrockClient()[prop as keyof BedrockRuntimeClient];
  }
});

export async function invokeClaudeSonnet(systemPrompt: string, userPrompt: string, maxTokens: number): Promise<string> {
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-sonnet-4-5-20250929-v1:0",

    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userPrompt }],
        },
      ],
    }),
  });

  return pRetry(async () => {
    try {
      const response = await bedrockClient.send(command);
      const decodedBody = new TextDecoder().decode(response.body);
      const parsedStats = JSON.parse(decodedBody);
      return parsedStats.content[0].text;
    } catch (error: any) {
      throw new Error(`Failed to invoke Bedrock model Claude Sonnet: ${error.message}`);
    }
  }, { retries: 2 });
}

export async function invokeClaudeHaiku(userPrompt: string, maxTokens: number): Promise<string> {
  const command = new InvokeModelCommand({
    modelId: "anthropic.claude-3-haiku-20240307-v1:0",
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: userPrompt }],
        },
      ],
    }),
  });

  return pRetry(async () => {
    try {
      const response = await bedrockClient.send(command);
      const decodedBody = new TextDecoder().decode(response.body);
      const parsedStats = JSON.parse(decodedBody);
      return parsedStats.content[0].text;
    } catch (error: any) {
      console.warn(`Haiku failed, falling back to Sonnet. Error: ${error.message}`);
      try {
        return await invokeClaudeSonnet("", userPrompt, maxTokens);
      } catch (fallbackError: any) {
        throw new Error(`Failed to invoke Bedrock model Claude Haiku and Sonnet fallback: ${error.message}`);
      }
    }
  }, { retries: 1, minTimeout: 500 });
}
