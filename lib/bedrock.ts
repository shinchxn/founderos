import AnthropicBedrock from "@anthropic-ai/bedrock-sdk";
import { APIError } from "@anthropic-ai/sdk";

let cachedClient: AnthropicBedrock | null = null;

function getBedrockClient(): AnthropicBedrock {
  if (!cachedClient) {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials are required for Bedrock");
    }
    cachedClient = new AnthropicBedrock({
      awsAccessKey: process.env.AWS_ACCESS_KEY_ID,
      awsSecretKey: process.env.AWS_SECRET_ACCESS_KEY,
      awsRegion: process.env.AWS_BEDROCK_REGION || "us-east-1",
      maxRetries: 2,
    });
  }
  return cachedClient;
}

export async function invokeClaudeSonnet(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  try {
    const message = await getBedrockClient().messages.create({
      model: "anthropic.claude-sonnet-4-5-20250929-v1:0",
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  } catch (error) {
    if (error instanceof APIError) {
      throw new Error(`Sonnet invoke failed (status ${error.status}): ${error.message}`);
    }
    throw error;
  }
}

export async function invokeClaudeHaiku(
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  try {
    const message = await getBedrockClient().messages.create({
      model: "anthropic.claude-3-haiku-20240307-v1:0",
      max_tokens: maxTokens,
      messages: [{ role: "user", content: [{ type: "text", text: userPrompt }] }],
    });
    const block = message.content[0];
    return block.type === "text" ? block.text : "";
  } catch (haikuError) {
    console.warn(`Haiku failed, falling back to Sonnet: ${(haikuError as Error).message}`);
    try {
      return await invokeClaudeSonnet("", userPrompt, maxTokens);
    } catch (sonnetError) {
      throw new Error(
        `Both models failed. Haiku: ${(haikuError as Error).message}. Sonnet: ${(sonnetError as Error).message}`
      );
    }
  }
}