// Global Provider Approval System
// Singleton pattern for globally approved providers with mode mixing capabilities

import { providers as baseProviders, ProviderConfig, ProviderName } from "./providers";

export type Mode = "fast" | "smart" | "creative" | "analytical" | "balanced" | "precise";
export type ModelCapability = 
  | "text-generation"
  | "code-generation"
  | "reasoning"
  | "vision"
  | "audio"
  | "embedding"
  | "chat";

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderName;
  capabilities: ModelCapability[];
  modes: Mode[];
  maxTokens: number;
  contextWindow: number;
  temperature: {
    min: number;
    max: number;
    default: number;
  };
  cost?: {
    input: number;
    output: number;
  };
  isApproved: boolean;
  approvalDate?: string;
  priority: number;
  weight: number;
}

export interface ProviderApproval {
  provider: ProviderName;
  isApproved: boolean;
  approvedAt: string;
  approvedBy: string;
  approvalReason: string;
  models: string[];
  modes: Mode[];
  restrictions: string[];
}

export interface MixingStrategy {
  type: "round-robin" | "priority" | "weighted" | "smart-switch" | "fallback";
  description: string;
}

// Model Registry with available models and their configurations
export const modelRegistry: Record<string, ModelConfig> = {
  // Grok Models
  "grok-2": {
    id: "grok-2",
    name: "Grok-2",
    provider: "grok",
    capabilities: ["text-generation", "reasoning", "chat", "code-generation"],
    modes: ["smart", "analytical", "balanced"],
    maxTokens: 4096,
    contextWindow: 128000,
    temperature: { min: 0, max: 1.5, default: 0.7 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 1,
    weight: 0.9,
  },
  "grok-2-mini": {
    id: "grok-2-mini",
    name: "Grok-2 Mini",
    provider: "grok",
    capabilities: ["text-generation", "chat", "code-generation"],
    modes: ["fast", "balanced"],
    maxTokens: 4096,
    contextWindow: 128000,
    temperature: { min: 0, max: 1.5, default: 0.7 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 2,
    weight: 0.8,
  },

  // Anthropic Models
  "claude-3-5-sonnet": {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "anthropic",
    capabilities: ["text-generation", "reasoning", "code-generation", "chat", "vision"],
    modes: ["smart", "analytical", "creative", "balanced"],
    maxTokens: 8192,
    contextWindow: 200000,
    temperature: { min: 0, max: 1, default: 0.5 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 1,
    weight: 0.95,
  },
  "claude-3-5-haiku": {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    provider: "anthropic",
    capabilities: ["text-generation", "chat", "code-generation"],
    modes: ["fast", "balanced", "precise"],
    maxTokens: 8192,
    contextWindow: 200000,
    temperature: { min: 0, max: 1, default: 0.5 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 2,
    weight: 0.85,
  },

  // Google AI Models
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "googleAI",
    capabilities: ["text-generation", "chat", "vision", "audio", "reasoning"],
    modes: ["fast", "balanced", "smart"],
    maxTokens: 8192,
    contextWindow: 1048576,
    temperature: { min: 0, max: 2, default: 0.4 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 1,
    weight: 0.9,
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    provider: "googleAI",
    capabilities: ["text-generation", "reasoning", "chat", "vision", "code-generation"],
    modes: ["analytical", "smart", "balanced", "creative"],
    maxTokens: 8192,
    contextWindow: 2097152,
    temperature: { min: 0, max: 2, default: 0.5 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 2,
    weight: 0.85,
  },

  // Kimi Models
  "moonshot-v1-128k": {
    id: "moonshot-v1-128k",
    name: "Moonshot V1 128K",
    provider: "kimi",
    capabilities: ["text-generation", "chat", "code-generation", "reasoning"],
    modes: ["balanced", "smart", "analytical"],
    maxTokens: 8192,
    contextWindow: 131072,
    temperature: { min: 0, max: 1.5, default: 0.5 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 2,
    weight: 0.8,
  },

  // bybi Models
  "bybi-chat": {
    id: "bybi-chat",
    name: "bybi Chat Model",
    provider: "bybi",
    capabilities: ["text-generation", "chat", "code-generation"],
    modes: ["fast", "balanced", "smart"],
    maxTokens: 4096,
    contextWindow: 32000,
    temperature: { min: 0, max: 1, default: 0.7 },
    isApproved: true,
    approvalDate: "2026-05-03",
    priority: 3,
    weight: 0.7,
  },
};

// Global Provider Approval Registry
export class ProviderApprovalRegistry {
  private static instance: ProviderApprovalRegistry;
  private approvals: Map<ProviderName, ProviderApproval>;
  private globalApproved: boolean;
  private approvedAt: string | null;

  private constructor() {
    this.approvals = new Map();
    this.globalApproved = false;
    this.approvedAt = null;
    this.initializeApprovals();
  }

  static getInstance(): ProviderApprovalRegistry {
    if (!ProviderApprovalRegistry.instance) {
      ProviderApprovalRegistry.instance = new ProviderApprovalRegistry();
    }
    return ProviderApprovalRegistry.instance;
  }

  private initializeApprovals() {
    Object.keys(baseProviders).forEach((key) => {
      const providerName = key as ProviderName;
      const provider = baseProviders[providerName];
      const providerModels = Object.values(modelRegistry).filter(
        (m) => m.provider === providerName
      );

      this.approvals.set(providerName, {
        provider: providerName,
        isApproved: provider.isConfigured,
        approvedAt: new Date().toISOString(),
        approvedBy: "system",
        approvalReason: "Auto-approved on configuration",
        models: providerModels.map((m) => m.id),
        modes: this.extractModesFromModels(providerModels),
        restrictions: [],
      });
    });
  }

  private extractModesFromModels(models: ModelConfig[]): Mode[] {
    const modeSet = new Set<Mode>();
    models.forEach((model) => {
      model.modes.forEach((mode) => modeSet.add(mode));
    });
    return Array.from(modeSet);
  }

  globalApprove(reason: string = "Global approval granted"): void {
    this.globalApproved = true;
    this.approvedAt = new Date().toISOString();
    
    this.approvals.forEach((approval) => {
      approval.isApproved = true;
      approval.approvalReason = reason;
    });
  }

  isGloballyApproved(): boolean {
    return this.globalApproved;
  }

  getApproval(provider: ProviderName): ProviderApproval | undefined {
    return this.approvals.get(provider);
  }

  getAllApprovals(): ProviderApproval[] {
    return Array.from(this.approvals.values());
  }

  getApprovedProviders(): ProviderName[] {
    return Array.from(this.approvals.entries())
      .filter(([, approval]) => approval.isApproved)
      .map(([name]) => name);
  }

  getModelsForProvider(provider: ProviderName): ModelConfig[] {
    return Object.values(modelRegistry).filter(
      (model) => model.provider === provider
    );
  }

  getApprovedModels(): ModelConfig[] {
    return Object.values(modelRegistry).filter((model) => model.isApproved);
  }

  getModelsByMode(mode: Mode): ModelConfig[] {
    return Object.values(modelRegistry).filter((model) =>
      model.modes.includes(mode)
    );
  }

  getModelsByCapability(capability: ModelCapability): ModelConfig[] {
    return Object.values(modelRegistry).filter((model) =>
      model.capabilities.includes(capability)
    );
  }
}

// Mode Mixing Strategies
export class ModeMixer {
  private strategy: MixingStrategy;
  private modelIndex: Map<string, number> = new Map();

  constructor(strategy: MixingStrategy["type"] = "smart-switch") {
    this.strategy = {
      type: strategy,
      description: this.getStrategyDescription(strategy),
    };
  }

  private getStrategyDescription(type: MixingStrategy["type"]): string {
    const descriptions: Record<MixingStrategy["type"], string> = {
      "round-robin": "Cycles through available models evenly",
      "priority": "Uses highest priority models first",
      "weighted": "Selects models based on assigned weights",
      "smart-switch": "Intelligently switches based on context and mode",
      "fallback": "Uses primary model, falls back to others on failure",
    };
    return descriptions[type];
  }

  selectModel(
    mode: Mode,
    capability?: ModelCapability,
    registry = ProviderApprovalRegistry.getInstance()
  ): ModelConfig | null {
    const approvedModels = registry.getApprovedModels();
    let candidates = approvedModels.filter((model) =>
      model.modes.includes(mode)
    );

    if (capability) {
      candidates = candidates.filter((model) =>
        model.capabilities.includes(capability)
      );
    }

    if (candidates.length === 0) {
      return null;
    }

    switch (this.strategy.type) {
      case "round-robin":
        return this.roundRobin(candidates, mode);
      case "priority":
        return this.prioritySelect(candidates);
      case "weighted":
        return this.weightedSelect(candidates);
      case "smart-switch":
        return this.smartSwitch(candidates, mode, capability);
      case "fallback":
        return this.fallbackSelect(candidates);
      default:
        return this.smartSwitch(candidates, mode, capability);
    }
  }

  private roundRobin(candidates: ModelConfig[], mode: Mode): ModelConfig {
    const key = `${mode}-${candidates.map((c) => c.id).join("-")}`;
    const currentIndex = this.modelIndex.get(key) || 0;
    const selected = candidates[currentIndex % candidates.length];
    this.modelIndex.set(key, currentIndex + 1);
    return selected;
  }

  private prioritySelect(candidates: ModelConfig[]): ModelConfig {
    return candidates.sort((a, b) => a.priority - b.priority)[0];
  }

  private weightedSelect(candidates: ModelConfig[]): ModelConfig {
    const totalWeight = candidates.reduce((sum, model) => sum + model.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const model of candidates) {
      random -= model.weight;
      if (random <= 0) {
        return model;
      }
    }
    
    return candidates[0];
  }

  private smartSwitch(
    candidates: ModelConfig[],
    mode: Mode,
    capability?: ModelCapability
  ): ModelConfig {
    // Smart selection based on mode and capability
    const scored = candidates.map((model) => {
      let score = model.weight;

      // Boost for mode match
      if (model.modes.includes(mode)) {
        score *= 1.5;
      }

      // Boost for capability match
      if (capability && model.capabilities.includes(capability)) {
        score *= 1.3;
      }

      // Boost for higher priority
      score *= (2 - model.priority / 10);

      return { model, score };
    });

    return scored.sort((a, b) => b.score - a.score)[0].model;
  }

  private fallbackSelect(candidates: ModelConfig[]): ModelConfig {
    return candidates.sort((a, b) => a.priority - b.priority)[0];
  }

  selectModelStack(
    mode: Mode,
    count: number = 3,
    capability?: ModelCapability
  ): ModelConfig[] {
    const registry = ProviderApprovalRegistry.getInstance();
    const approvedModels = registry.getApprovedModels();
    
    let candidates = approvedModels.filter((model) =>
      model.modes.includes(mode)
    );

    if (capability) {
      candidates = candidates.filter((model) =>
        model.capabilities.includes(capability)
      );
    }

    // Sort by priority and weight
    candidates.sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return b.weight - a.weight;
    });

    return candidates.slice(0, count);
  }

  getMixingStrategy(): MixingStrategy {
    return this.strategy;
  }

  setStrategy(strategy: MixingStrategy["type"]): void {
    this.strategy = {
      type: strategy,
      description: this.getStrategyDescription(strategy),
    };
  }
}

// Provider Factory for Global Access
export class ProviderFactory {
  private static instance: ProviderFactory;
  private registry: ProviderApprovalRegistry;
  private modeMixer: ModeMixer;

  private constructor() {
    this.registry = ProviderApprovalRegistry.getInstance();
    this.modeMixer = new ModeMixer("smart-switch");
  }

  static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  getProvider(provider: ProviderName): ProviderConfig | undefined {
    return baseProviders[provider];
  }

  getApprovedProvider(provider: ProviderName): ProviderConfig | null {
    const approval = this.registry.getApproval(provider);
    if (approval?.isApproved) {
      return baseProviders[provider];
    }
    return null;
  }

  getAllProviders(): Record<ProviderName, ProviderConfig> {
    return baseProviders;
  }

  getApprovedProviders(): Record<ProviderName, ProviderConfig> {
    const approved: Record<ProviderName, ProviderConfig> = {} as any;
    this.registry.getApprovedProviders().forEach((name) => {
      approved[name] = baseProviders[name];
    });
    return approved;
  }

  getModel(modelId: string): ModelConfig | undefined {
    return modelRegistry[modelId];
  }

  getModelsForMode(mode: Mode): ModelConfig[] {
    return this.registry.getModelsByMode(mode);
  }

  getOptimalModel(
    mode: Mode,
    capability?: ModelCapability
  ): ModelConfig | null {
    return this.modeMixer.selectModel(mode, capability);
  }

  getModelStack(
    mode: Mode,
    count: number = 3,
    capability?: ModelCapability
  ): ModelConfig[] {
    return this.modeMixer.selectModelStack(mode, count, capability);
  }

  globalApprove(reason: string = "Global approval granted via factory"): void {
    this.registry.globalApprove(reason);
  }

  isGloballyApproved(): boolean {
    return this.registry.isGloballyApproved();
  }

  setMixingStrategy(strategy: MixingStrategy["type"]): void {
    this.modeMixer.setStrategy(strategy);
  }

  getMixingStrategy(): MixingStrategy {
    return this.modeMixer.getMixingStrategy();
  }

  getSystemStatus() {
    const registry = ProviderApprovalRegistry.getInstance();
    return {
      globallyApproved: this.isGloballyApproved(),
      approvedProviders: this.registry.getApprovedProviders().length,
      totalProviders: Object.keys(baseProviders).length,
      approvedModels: registry.getApprovedModels().length,
      totalModels: Object.keys(modelRegistry).length,
      mixingStrategy: this.modeMixer.getMixingStrategy(),
      providers: registry.getAllApprovals(),
    };
  }
}

// Initialize global approval on import
const factory = ProviderFactory.getInstance();
factory.globalApprove("System initialization - all configured providers approved");

export {
  ProviderApprovalRegistry,
  ModeMixer,
  ProviderFactory,
  modelRegistry,
};