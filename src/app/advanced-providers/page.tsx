import { ProviderFactory, Mode, ModelConfig, ProviderApprovalRegistry } from "./global-providers";
import { getProviderClient, ProviderResponse } from "./provider-client";
import { useState, useEffect } from "react";

export default function AdvancedProvidersPage() {
  const factory = ProviderFactory.getInstance();
  const registry = ProviderApprovalRegistry.getInstance();
  const client = getProviderClient();

  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [selectedMode, setSelectedMode] = useState<Mode>("balanced");
  const [selectedCapability, setSelectedCapability] = useState<string>("");
  const [testPrompt, setTestPrompt] = useState<string>(
    "Hello, introduce yourself!"
  );
  const [testResults, setTestResults] = useState<ProviderResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [useStack, setUseStack] = useState(false);
  const [stackSize, setStackSize] = useState<number>(3);

  useEffect(() => {
    setSystemStatus(factory.getSystemStatus());
  }, []);

  const modes: Mode[] = [
    "fast",
    "smart",
    "creative",
    "analytical",
    "balanced",
    "precise",
  ];

  const capabilities = [
    "text-generation",
    "code-generation",
    "reasoning",
    "vision",
    "audio",
    "embedding",
    "chat",
  ];

  const mixingStrategies = [
    "round-robin",
    "priority",
    "weighted",
    "smart-switch",
    "fallback",
  ] as const;

  const handleGlobalApprove = () => {
    factory.globalApprove("Manual global approval");
    setSystemStatus(factory.getSystemStatus());
  };

  const handleSetStrategy = (strategy: any) => {
    factory.setMixingStrategy(strategy);
    setSystemStatus(factory.getSystemStatus());
  };

  const handleTestModel = async (
    modelId: string,
    mode: Mode,
    useStackMode = false
  ) => {
    setLoading(true);
    try {
      const result = await client.generate({
        mode,
        model: useStackMode ? undefined : modelId,
        prompt: testPrompt,
        useStack: useStackMode,
        stackSize,
      });
      setTestResults((prev) => [...prev, result]);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleModeTest = async () => {
    setLoading(true);
    setTestResults([]);
    try {
      const result = await client.generate({
        mode: selectedMode,
        capability: selectedCapability || undefined,
        prompt: testPrompt,
        useStack,
        stackSize,
      });
      setTestResults([result]);
    } catch (error) {
      console.error("Mode test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getModelsForMode = (mode: Mode) => {
    return factory.getModelsForMode(mode);
  };

  const getOptimalModel = (mode: Mode) => {
    return factory.getOptimalModel(mode, selectedCapability as any);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-4xl font-bold mb-8">
          Global Provider Management & Model Stack Mixer
        </h1>

        {/* System Status */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
          <h2 className="text-2xl font-semibold mb-4">System Status</h2>
          {systemStatus && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {systemStatus.globallyApproved ? "✅" : "❌"}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Global Approval
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {systemStatus.approvedProviders}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Approved Providers
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {systemStatus.approvedModels}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Approved Models
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {systemStatus.mixingStrategy.type}
                </div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">
                  Mixing Strategy
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-4">
            <button
              onClick={handleGlobalApprove}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Force Global Approval
            </button>
            <select
              value={factory.getMixingStrategy().type}
              onChange={(e) => handleSetStrategy(e.target.value)}
              className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
            >
              {mixingStrategies.map((strategy) => (
                <option key={strategy} value={strategy}>
                  {strategy}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Provider Approvals */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Provider Approvals</h2>
          <div className="grid gap-4">
            {systemStatus?.providers.map((approval: any) => (
              <div
                key={approval.provider}
                className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-4 h-4 rounded-full ${
                      approval.isApproved ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <h3 className="font-semibold capitalize">
                      {approval.provider}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {approval.models.length} models |{" "}
                      {approval.modes.length} modes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      approval.isApproved
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {approval.isApproved ? "Approved" : "Not Approved"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Registry */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Model Registry</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-700">
                  <th className="text-left p-3 font-semibold">Model</th>
                  <th className="text-left p-3 font-semibold">Provider</th>
                  <th className="text-left p-3 font-semibold">Modes</th>
                  <th className="text-left p-3 font-semibold">Capabilities</th>
                  <th className="text-left p-3 font-semibold">Context</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.values(modelRegistry).map((model) => (
                  <tr
                    key={model.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="p-3 font-medium">{model.name}</td>
                    <td className="p-3 capitalize">{model.provider}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {model.modes.map((mode) => (
                          <span
                            key={mode}
                            className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                          >
                            {mode}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((cap) => (
                          <span
                            key={cap}
                            className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded"
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      {model.contextWindow.toLocaleString()} tokens
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          model.isApproved
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {model.isApproved ? "Approved" : "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mode Mixer Test */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Model Stack Mixer</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Test Mode</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value as Mode)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              >
                {modes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode} ({getModelsForMode(mode).length} models)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Capability</label>
              <select
                value={selectedCapability}
                onChange={(e) => setSelectedCapability(e.target.value)}
                className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
              >
                <option value="">Any</option>
                {capabilities.map((cap) => (
                  <option key={cap} value={cap}>
                    {cap}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Test Prompt</label>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 h-24"
            />
          </div>

          <div className="flex items-center gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useStack}
                onChange={(e) => setUseStack(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Use Model Stack</span>
            </label>
            {useStack && (
              <div className="flex items-center gap-2">
                <label>Stack Size:</label>
                <input
                  type="number"
                  value={stackSize}
                  onChange={(e) => setStackSize(parseInt(e.target.value))}
                  min="1"
                  max="10"
                  className="w-16 px-2 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800"
                />
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleModeTest}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Testing..." : "Test Mode"}
            </button>
            <button
              onClick={() => setTestResults([])}
              className="px-6 py-2 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Clear Results
            </button>
          </div>

          {/* Optimal Model Suggestion */}
          {selectedMode && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold mb-2">Optimal Model Suggestion</h4>
              {getOptimalModel(selectedMode) ? (
                <div className="flex items-center gap-4">
                  <span className="font-medium">
                    {getOptimalModel(selectedMode)?.name}
                  </span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">
                    ({getOptimalModel(selectedMode)?.provider})
                  </span>
                </div>
              ) : (
                <p className="text-zinc-600 dark:text-zinc-400">
                  No suitable model found for this mode
                </p>
              )}
            </div>
          )}

          {/* Model Stack Preview */}
          {useStack && selectedMode && (
            <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-semibold mb-2">Model Stack Preview</h4>
              <div className="space-y-2">
                {factory.getModelStack(selectedMode, stackSize).map((model, i) => (
                  <div
                    key={model.id}
                    className="flex items-center justify-between p-2 bg-white dark:bg-zinc-800 rounded"
                  >
                    <div>
                      <span className="font-medium">{model.name}</span>
                      <span className="text-sm text-zinc-600 dark:text-zinc-400 ml-2">
                        ({model.provider})
                      </span>
                    </div>
                    <div className="text-sm">
                      Priority: {model.priority} | Weight: {model.weight}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Test Results</h3>
              <div className="space-y-4">
                {testResults.map((result, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg ${
                      result.success
                        ? "bg-green-50 dark:bg-green-900/20"
                        : "bg-red-50 dark:bg-red-900/20"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            result.success
                              ? "text-green-700 dark:text-green-300"
                              : "text-red-700 dark:text-red-300"
                          }`}
                        >
                          {result.provider} / {result.model}
                        </span>
                        <span className="text-sm text-zinc-600 dark:text-zinc-400">
                          Mode: {result.mode}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          result.success
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                        }`}
                      >
                        {result.success ? "Success" : "Failed"}
                      </span>
                    </div>
                    {result.content && (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                        {result.content}
                      </p>
                    )}
                    {result.error && (
                      <p className="text-sm text-red-600 dark:text-red-400">
                        Error: {result.error}
                      </p>
                    )}
                    {result.usage && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        Tokens: {result.usage.totalTokens} total (
                        {result.usage.promptTokens} prompt +
                        {result.usage.completionTokens} completion)
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Provider Details */}
        <div className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-semibold mb-4">Provider Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(modelRegistry).map((model) => (
              <div
                key={model.id}
                className="p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{model.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      model.isApproved
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    }`}
                  >
                    {model.isApproved ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                  Provider: {model.provider}
                </p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {model.modes.map((mode) => (
                    <span
                      key={mode}
                      className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Context: {model.contextWindow.toLocaleString()} tokens
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
