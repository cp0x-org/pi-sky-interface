export interface RuntimeConfig {
  rpcUrl: string;
  projectId: string;
  subgraphUrl: string;
}

let runtimeConfig: RuntimeConfig = { rpcUrl: '', projectId: '', subgraphUrl: '' };

export async function loadConfig(): Promise<RuntimeConfig> {
  if (!runtimeConfig.rpcUrl || !runtimeConfig.projectId) {
    const response = await fetch('/config.json');
    if (!response.ok) {
      throw new Error('Failed to load runtime config');
    }
    runtimeConfig = await response.json();
  }
  return runtimeConfig;
}
