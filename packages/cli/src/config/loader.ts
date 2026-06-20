import { cosmiconfig } from 'cosmiconfig';
import type { CliConfig } from '../types.js';

const explorer = cosmiconfig('html-native', {
  searchPlaces: [
    'html-native.config.json',
    'html-native.config.js',
    'html-native.config.ts',
    '.html-nativrc',
    '.html-nativrc.json',
  ],
});

let cachedConfig: CliConfig | null | undefined;

export async function loadConfigFile(cwd: string = process.cwd()): Promise<CliConfig | null> {
  if (cachedConfig !== undefined) {
    return cachedConfig;
  }

  try {
    const result = await explorer.search(cwd);
    if (result && !result.isEmpty) {
      cachedConfig = result.config as CliConfig;
      return cachedConfig;
    }
  } catch {
    // Config file is optional; silently ignore errors
  }

  cachedConfig = null;
  return null;
}

export function getConfigFromArgs(args: Record<string, unknown>): CliConfig {
  const config: CliConfig = {};

  if (typeof args.input === 'string') config.input = args.input;
  if (typeof args.css === 'string') config.css = args.css;
  if (typeof args.target === 'string') config.target = args.target as CliConfig['target'];
  if (typeof args.output === 'string') config.output = args.output;
  if (typeof args.aiEnhance === 'boolean') config.aiEnhance = args.aiEnhance;
  if (typeof args.aiModel === 'string') config.aiModel = args.aiModel;

  return config;
}

export function clearConfigCache(): void {
  cachedConfig = undefined;
}
