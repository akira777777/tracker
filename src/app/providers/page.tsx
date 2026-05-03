import { checkAllProviders, providers } from "@/lib/providers";
import { useEffect, useState } from "react";

interface ProviderHealth {
  name: string;
  status: "connected" | "disconnected" | "error";
  lastCheck: string;
  error?: string;
}

export default function ProvidersPage() {
  const [health, setHealth] = useState<ProviderHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHealth() {
      setLoading(true);
      const results = await checkAllProviders();
      setHealth(results);
      setLoading(false);
    }
    fetchHealth();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-500";
      case "disconnected":
        return "bg-gray-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Provider Connections</h1>
        
        <div className="grid gap-4">
          {loading ? (
            <div className="text-center py-8">Checking provider connections...</div>
          ) : (
            health.map((provider) => (
              <div
                key={provider.name}
                className="bg-white dark:bg-zinc-900 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${getStatusColor(provider.status)}`}></div>
                    <h2 className="text-xl font-semibold">{provider.name}</h2>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    provider.status === "connected" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : provider.status === "disconnected"
                      ? "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }`}>
                    {provider.status}
                  </span>
                </div>
                {provider.error && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                    Error: {provider.error}
                  </p>
                )}
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Last checked: {new Date(provider.lastCheck).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 p-4 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <h3 className="text-lg font-semibold mb-4">Configured Providers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.values(providers).map((provider) => (
              <div key={provider.name} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${provider.isConfigured ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-sm">{provider.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
