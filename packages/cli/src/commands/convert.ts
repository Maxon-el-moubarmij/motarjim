import type { CliConfig, ResolvedOptions } from '../types.js';
import { loadConfigFile, getConfigFromArgs, clearConfigCache } from '../config/loader.js';
import { resolveOptions } from '../config/defaults.js';
import { runPipeline, writeOutput, logStats, logDryRun } from '../services/pipeline.js';
import { runWizard } from '../services/wizard.js';
import { formatError, displayFormattedError } from '../services/error-formatter.js';

export async function convertCommand(args: Record<string, unknown>): Promise<void> {
  clearConfigCache();

  const cliOpts = getConfigFromArgs(args);
  const configFile = await loadConfigFile();
  let options = resolveOptions(cliOpts, configFile || undefined);

  if (args.dryRun) {
    options.dryRun = true;
  }

  if (!options.input || !options.target) {
    const prefilled: Partial<ResolvedOptions> = {};
    if (options.input) prefilled.input = options.input;
    if (options.css) prefilled.css = options.css;
    if (options.target) prefilled.target = options.target;
    if (options.aiEnhance !== undefined) prefilled.aiEnhance = options.aiEnhance;
    if (options.aiModel) prefilled.aiModel = options.aiModel;

    if (options.output) prefilled.output = options.output;

    options = await runWizard(prefilled);
  }

  if (options.dryRun) {
    logDryRun(options);
    return;
  }

  const result = await runPipeline(options);

  if (options.output) {
    writeOutput(result.code, options.output);
    console.log(`Written to ${options.output}`);
  } else {
    console.log(result.code);
  }

  logStats(result.stats);
}
