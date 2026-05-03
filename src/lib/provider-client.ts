// Provider API Client with mode mixing and model stack support

import { ProviderFactory, Mode, ModelConfig } from "./global-providers";

export interface RequestOptions {
  mode?: Mode;
  model?: string;
  capability?: string;
  temperature?: number;
  maxTokens?: number;
  messages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  prompt?: string;
  useStack?: boolean;
  stackSize?: number;
}

export interface ProviderResponse {
  success: boolean;
  provider: string;
  model: string;
  mode: Mode;
  content?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class ProviderClient {
  private factory: ProviderFactory;
  private requestHistory: Array<{
    timestamp: string;
    provider: string;
    model: string;
    mode: Mode;
    success: boolean;
  }> = [];

  constructor() {
    this.factory = ProviderFactory.getInstance();
  }

  async generate(options: RequestOptions): Promise<ProviderResponse> {
    const {
      mode = "balanced",
      model,
      capability,
      temperature = 0.7,
      maxTokens = 2048,
      messages,
      prompt,
      useStack = false,
      stackSize = 3,
    } = options;

    try {
      let selectedModel: ModelConfig | null = null;

      // If specific model requested, use it
      if (model) {
        selectedModel = this.factory.getModel(model);
        if (!selectedModel) {
          return {
            success: false,
            provider: "unknown",
            model,
            mode,
            error: `Model ${model} not found`,
          };
        }
      } else if (useStack) {
        // Use model stack - get multiple models and combine results
        const models = this.factory.getModelStack(
          mode,
          stackSize,
          capability as any
        );
        
        if (models.length === 0) {
          return {
            success: false,
            provider: "unknown",
            model: "none",
            mode,
            error: "No models available for this mode",
          };
        }

        // Generate with multiple models and combine
        const results = await Promise.all(
          models.map((m) => this.generateWithModel(m, mode, {
            temperature,
            maxTokens,
            messages,
            prompt,
          }))
        );

        // Combine successful results
        const successful = results.filter((r) => r.success);
        if (successful.length === 0) {
          return {
            success: false,
            provider: "stack",
            model: "multiple",
            mode,
            error: "All models in stack failed",
          };
        }

        // For now, return the first successful result
        // Could implement more sophisticated combination logic
        return successful[0];
      } else {
        // Get optimal single model
        selectedModel = this.factory.getOptimalModel(
          mode,
          capability as any
        );
      }

      if (!selectedModel) {
        return {
          success: false,
          provider: "unknown",
          model: "none",
          mode,
          error: "No suitable model found",
        };
      }

      return await this.generateWithModel(selectedModel, mode, {
        temperature,
        maxTokens,
        messages,
        prompt,
      });
    } catch (error) {
      return {
        success: false,
        provider: "unknown",
        model: model || "unknown",
        mode,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  private async generateWithModel(
    model: ModelConfig,
    mode: Mode,
    options: {
      temperature?: number;
      maxTokens?: number;
      messages?: Array<{
        role: "system" | "user" | "assistant";
        content: string;
      }>;
      prompt?: string;
    }
  ): Promise<ProviderResponse> {
    const provider = this.factory.getProvider(model.provider);
    if (!provider) {
      return {
        success: false,
        provider: model.provider,
        model: model.id,
        mode,
        error: "Provider not found",
      };
    }

    const temperature = options.temperature ?? model.temperature.default;
    const maxTokens = options.maxTokens ?? Math.min(2048, model.maxTokens);

    try {
      let response: Response;
      let data: any;

      // Build request based on provider
      switch (model.provider) {
        case "grok":
          response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: "POST",
            headers: provider.headers,
            body: JSON.stringify({
              model: model.id,
              messages: options.messages || [
                { role: "user", content: options.prompt || "" },
              ],
              temperature,
              max_tokens: maxTokens,
            }),
          });
          data = await response.json();
          
          return {
            success: response.ok,
            provider: model.provider,
            model: model.id,
            mode,
            content: data.choices?.[0]?.message?.content,
            error: response.ok ? undefined : JSON.stringify(data),
            usage: data.usage ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            } : undefined,
          };

        case "anthropic":
          response = await fetch(`${provider.baseUrl}/v1/messages`, {
            method: "POST",
            headers: provider.headers,
            body: JSON.stringify({
              model: model.id,
              max_tokens: maxTokens,
              temperature,
              messages: options.messages || [
                { role: "user", content: options.prompt || "" },
              ],
            }),
          });
          data = await response.json();
          
          return {
            success: response.ok,
            provider: model.provider,
            model: model.id,
            mode,
            content: data.content?.[0]?.text,
            error: response.ok ? undefined : JSON.stringify(data),
            usage: data.usage ? {
              promptTokens: data.usage.input_tokens,
              completionTokens: data.usage.output_tokens,
              totalTokens: data.usage.input_tokens + data.usage.output_tokens,
            } : undefined,
          };

        case "googleAI":
          response = await fetch(
            `${provider.baseUrl}/models/${model.id}:generateContent?key=${provider.apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    role: "user",
                    parts: [{ text: options.prompt || "" }],
                  },
                ],
                generationConfig: {
                  temperature,
                  maxOutputTokens: maxTokens,
                },
              }),
            }
          );
          data = await response.json();
          
          return {
            success: response.ok,
            provider: model.provider,
            model: model.id,
            mode,
            content: data.candidates?.[0]?.content?.parts?.[0]?.text,
            error: response.ok ? undefined : JSON.stringify(data),
          };

        case "kimi":
          response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: "POST",
            headers: provider.headers,
            body: JSON.stringify({
              model: model.id,
              messages: options.messages || [
                { role: "user", content: options.prompt || "" },
              ],
              temperature,
              max_tokens: maxTokens,
            }),
          });
          data = await response.json();
          
          return {
            success: response.ok,
            provider: model.provider,
            model: model.id,
            mode,
            content: data.choices?.[0]?.message?.content,
            error: response.ok ? undefined : JSON.stringify(data),
            usage: data.usage ? {
              promptTokens: data.usage.prompt_tokens,
              completionTokens: data.usage.completion_tokens,
              totalTokens: data.usage.total_tokens,
            } : undefined,
          };

        case "bybi":
        case "github":
        case "render":
          // Generic API call for other providers
          response = await fetch(`${provider.baseUrl}`, {
            method: "GET",
            headers: provider.headers,
          });
          
          return {
            success: response.ok,
            provider: model.provider,
            model: model.id,
            mode,
            content: response.ok ? "Connection successful" : "Connection failed",
            error: response.ok ? undefined : `HTTP ${response.status}`,
          };

        default:
          return {
            success: false,
            provider: model.provider,
            model: model.id,
            mode,
            error: "Provider not implemented",
          };
      }
    } catch (error) {
      return {
        success: false,
        provider: model.provider,
        model: model.id,
        mode,
        error: error instanceof Error ? error.message : "Request failed",
      };
    } finally {
      this.requestHistory.push({
        timestamp: new Date().toISOString(),
        provider: model.provider,
        model: model.id,
        mode,
        success: true,
      });
    }
  }

  async batchGenerate(
    prompts: string[],
    options: Omit<RequestOptions, "prompt"> = {}
  ): Promise<ProviderResponse[]> {
    return Promise.all(
      prompts.map((prompt) =>
        this.generate({ ...options, prompt })
      )
    );
  }

  getHistory() {
    return this.requestHistory;
  }

  clearHistory() {
    this.requestHistory = [];
  }
}

// Singleton instance
let clientInstance: ProviderClient | null = null;

export function getProviderClient(): ProviderClient {
  if (!clientInstance) {
    clientInstance = new ProviderClient();
  }
  return clientInstance;
}