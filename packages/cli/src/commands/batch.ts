import { readdirSync, existsSync } from 'fs';
import { join, resolve, extname, basename, dirname } from 'path';
import type { PlatformTarget } from '@html-native/shared';
import type { CliConfig, ResolvedOptions } from '../types.js';
import { loadConfigFile, clearConfigCache } from '../config/loader.js';
import { findMatchingCss } from '../config/defaults.js';
import { runPipeline, writeOutput, logStats } from '../services/pipeline.js';

export async function batchCommand(args: Record<string, unknown>): Promise<void> {
  clearConfigCache();

  const configFile = await loadConfigFile();
  const inputDir = (args.inputDir as string) || (configFile?.input ? dirname(resolve(configFile.input)) : 'designs');
  const resolvedDir = resolve(inputDir);
  const target = ((args.target as string) || configFile?.target || 'flutter') as PlatformTarget;

  if (!existsSync(resolvedDir)) {
    console.error(`Error: Directory not found: ${resolvedDir}`);
    process.exit(1);
  }

  const entries = readdirSync(resolvedDir);
  const htmlFiles = entries.filter(f => f.endsWith('.html')).sort();

  if (htmlFiles.length === 0) {
    console.error(`No HTML files found in ${resolvedDir}`);
    process.exit(1);
  }

  const extMap: Record<PlatformTarget, string> = {
    flutter: '.dart', compose: '.kt', swiftui: '.swift',
  };

  let outputDir = resolve(args.outputDir as string || 'generated');

  console.log(`Batch converting ${htmlFiles.length} file(s) from ${resolvedDir}`);
  console.log(`Target: ${target}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of htmlFiles) {
    const inputPath = join(resolvedDir, file);
    const base = basename(file, '.html');
    const cssPath = findMatchingCss(inputPath);
    const outputPath = join(outputDir, `${base}${extMap[target]}`);

    try {
      console.log(`  Converting: ${file}...`);

      const options: ResolvedOptions = {
        input: inputPath,
        css: cssPath,
        target,
        output: outputPath,
        aiEnhance: args.aiEnhance as boolean | undefined,
        aiModel: args.aiModel as string | undefined,
        dryRun: false,
      };

      const result = await runPipeline(options);
      writeOutput(result.code, outputPath);
      logStats(result.stats);
      successCount++;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`  Failed: ${file} — ${message}\n`);
      failCount++;
    }
  }

  console.log(`\nBatch complete: ${successCount} succeeded, ${failCount} failed`);
}
