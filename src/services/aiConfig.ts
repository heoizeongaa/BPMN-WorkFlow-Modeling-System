import type { AiConfig, AiProvider } from '@/types/ai';

const STORAGE_KEY = 'bpmn_ai_config';

const DEFAULT_MODELS: Record<AiProvider, string> = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
};

const DEFAULT_BASE_URLS: Record<AiProvider, string> = {
  claude: 'https://api.anthropic.com',
  openai: 'https://api.openai.com/v1',
};

export function loadAiConfig(): AiConfig | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as AiConfig;
  } catch {
    return null;
  }
}

export function saveAiConfig(config: AiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearAiConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultModel(provider: AiProvider): string {
  return DEFAULT_MODELS[provider];
}

export function getDefaultBaseUrl(provider: AiProvider): string {
  return DEFAULT_BASE_URLS[provider];
}
