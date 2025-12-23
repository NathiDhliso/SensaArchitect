import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelWithResponseStreamCommand,
} from '@aws-sdk/client-bedrock-runtime';

export type BedrockConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
};

export type BedrockMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type BedrockTool = {
  type: string;
  name: string;
};

let clientInstance: BedrockRuntimeClient | null = null;
let currentRegion: string | null = null;

export function getBedrockClient(config: BedrockConfig): BedrockRuntimeClient {
  const configKey = JSON.stringify(config);
  
  if (!clientInstance || currentRegion !== configKey) {
    clientInstance = new BedrockRuntimeClient({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    currentRegion = configKey;
  }
  
  return clientInstance;
}

export async function invokeClaudeModel(
  client: BedrockRuntimeClient,
  messages: BedrockMessage[],
  systemPrompt: string,
  maxTokens: number = 4000,
  tools?: BedrockTool[],
  abortSignal?: AbortSignal
): Promise<string> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    ...(tools && { tools }),
  };

  const command = new InvokeModelCommand({
    modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  if (abortSignal?.aborted) {
    throw new Error('Generation cancelled by user');
  }

  const response = await client.send(command);
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  
  return extractTextFromBedrockResponse(responseBody);
}

export async function* invokeClaudeModelStream(
  client: BedrockRuntimeClient,
  messages: BedrockMessage[],
  systemPrompt: string,
  maxTokens: number = 64000,
  abortSignal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const payload = {
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  };

  const command = new InvokeModelWithResponseStreamCommand({
    modelId: 'us.anthropic.claude-sonnet-4-5-20250929-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify(payload),
  });

  if (abortSignal?.aborted) {
    throw new Error('Generation cancelled by user');
  }

  const response = await client.send(command);

  if (!response.body) {
    throw new Error('No response body from Bedrock');
  }

  for await (const event of response.body) {
    if (abortSignal?.aborted) {
      throw new Error('Generation cancelled by user');
    }
    if (event.chunk) {
      const chunk = JSON.parse(new TextDecoder().decode(event.chunk.bytes));
      
      if (chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}

function extractTextFromBedrockResponse(response: any): string {
  if (response.content && Array.isArray(response.content)) {
    return response.content
      .filter((block: any) => block.type === 'text')
      .map((block: any) => block.text)
      .join('\n');
  }
  return '';
}

export function parseJsonFromResponse<T>(text: string): T {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No JSON object found in response');
  }
  return JSON.parse(jsonMatch[0]) as T;
}
