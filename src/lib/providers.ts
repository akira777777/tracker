// Provider configuration utilities
// This module handles connections to various AI and API providers

export interface ProviderConfig {
  name: string;
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  isConfigured: boolean;
}

export interface ProviderHealth {
  name: string;
  status: "connected" | "disconnected" | "error";
  lastCheck: string;
  error?: string;
}

// Provider configurations
export const providers = {
  grok: {
    name: "Grok",
    apiKey: process.env.GROK_API_KEY || "",
    baseUrl: "https://api.x.ai/v1",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROK_API_KEY || ""}`,
    },
    isConfigured: !!process.env.GROK_API_KEY,
  },
  anthropic: {
    name: "Anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    baseUrl: "https://api.anthropic.com",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY || "",
      "anthropic-version": "2023-06-01",
    },
    isConfigured: !!process.env.ANTHROPIC_API_KEY,
  },
  googleAI: {
    name: "Google AI",
    apiKey: process.env.GOOGLE_AI_API_KEY || "",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    headers: {},
    isConfigured: !!process.env.GOOGLE_AI_API_KEY,
  },
  kimi: {
    name: "Kimi",
    apiKey: process.env.KIMI_API_KEY || "",
    baseUrl: "https://api.moonshot.cn/v1",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.KIMI_API_KEY || ""}`,
    },
    isConfigured: !!process.env.KIMI_API_KEY,
  },
  bybi: {
    name: "bybi",
    apiKey: process.env.BYBI_API_KEY_1 || "",
    baseUrl: "https://api.bybi.com",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.BYBI_API_KEY_1 || ""}`,
    },
    isConfigured: !!(process.env.BYBI_API_KEY_1 || process.env.BYBI_API_KEY_2),
  },
  github: {
    name: "GitHub",
    apiKey: process.env.GITHUB_TOKEN || "",
    baseUrl: "https://api.github.com",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GITHUB_TOKEN || ""}`,
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Tracker-App",
    },
    isConfigured: !!process.env.GITHUB_TOKEN,
  },
  render: {
    name: "Render",
    apiKey: process.env.RENDER_TOKEN || "",
    baseUrl: "https://api.render.com",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.RENDER_TOKEN || ""}`,
    },
    isConfigured: !!process.env.RENDER_TOKEN,
  },
} as const;

export type ProviderName = keyof typeof providers;

// Health check function
export async function checkProviderHealth(providerName: ProviderName): Promise<ProviderHealth> {
  const provider = providers[providerName];
  
  if (!provider.isConfigured) {
    return {
      name: provider.name,
      status: "disconnected",
      lastCheck: new Date().toISOString(),
      error: "API key not configured",
    };
  }

  try {
    // Simple health check - try to fetch from provider
    const response = await fetch(`${provider.baseUrl}/models`, {
      method: "GET",
      headers: provider.headers,
    });

    if (response.ok) {
      return {
        name: provider.name,
        status: "connected",
        lastCheck: new Date().toISOString(),
      };
    } else {
      return {
        name: provider.name,
        status: "error",
        lastCheck: new Date().toISOString(),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
  } catch (error) {
    return {
      name: provider.name,
      status: "error",
      lastCheck: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Check all providers
export async function checkAllProviders(): Promise<ProviderHealth[]> {
  const results = await Promise.all(
    Object.keys(providers).map((key) => 
      checkProviderHealth(key as ProviderName)
    )
  );
  return results;
}