import { existsSync, readdirSync } from 'fs';
import { join, resolve, extname, basename, dirname } from 'path';
import type { PlatformTarget } from '@motarjim/shared';
import type { CliConfig, ResolvedOptions } from '../types.js';

const TARGET_BY_EXTENSION: Record<string, PlatformTarget> = {
  '.dart': 'flutter',
  '.kt': 'compose',
  '.swift': 'swiftui',
};

export function detectTargetFromOutput(output: string): PlatformTarget | undefined {
  const ext = extname(output).toLowerCase();
  return TARGET_BY_EXTENSION[ext];
}

export function findMatchingCss(htmlPath: string): string | undefined {
  const dir = dirname(htmlPath);
  const base = basename(htmlPath, extname(htmlPath));
  const cssPath = join(dir, `${base}.css`);
  const resolved = resolve(cssPath);
  if (existsSync(resolved)) {
    return resolved;
  }
  return undefined;
}

export function findSingleHtmlFile(dir: string = process.cwd()): string | undefined {
  try {
    const entries = readdirSync(dir);
    const htmlFiles = entries.filter(f => f.endsWith('.html'));
    if (htmlFiles.length === 1) {
      return resolve(join(dir, htmlFiles[0]));
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export function generateDefaultOutput(input: string, target: PlatformTarget): string {
  const base = basename(input, extname(input));
  const extMap: Record<PlatformTarget, string> = {
    flutter: '.dart',
    compose: '.kt',
    swiftui: '.swift',
  };
  const outDir = join(process.cwd(), 'generated');
  return resolve(join(outDir, `${base}${extMap[target]}`));
}

export function resolveOptions(cliOptions: CliConfig, configFile?: CliConfig): ResolvedOptions {
  const merged: CliConfig = { ...configFile, ...cliOptions };

  let input = merged.input;
  let css = merged.css;
  let target = merged.target;
  let output = merged.output;

  if (!input) {
    input = findSingleHtmlFile();
  }

  if (input && !css) {
    css = findMatchingCss(input);
  }

  if (output && !target) {
    target = detectTargetFromOutput(output);
  }

  if (input && target && !output) {
    output = generateDefaultOutput(input, target);
  }

  if (!output && target) {
    output = generateDefaultOutput(input || 'output.html', target);
  }

  return {
    input: input || '',
    css,
    target: target || 'flutter',
    output,
    aiEnhance: merged.aiEnhance,
    aiModel: merged.aiModel,
    dryRun: (cliOptions as Record<string, unknown>).dryRun === true,
  } as ResolvedOptions;
}
