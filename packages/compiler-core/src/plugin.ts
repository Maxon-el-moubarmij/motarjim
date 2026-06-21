import type { CompilerPlugin, PassManager } from './types.js';
import type { PhaseId, CompilerPass } from './types.js';

/**
 * Create a simple pass-based plugin from a pass factory.
 */
export function definePass<P extends PhaseId>(
  id: string,
  phase: P,
  run: CompilerPass<P>['run'],
  opts?: {
    name?: string;
    description?: string;
    before?: string[];
    after?: string[];
  },
): CompilerPass<P> {
  return {
    id,
    phase,
    name: opts?.name ?? id,
    description: opts?.description,
    before: opts?.before,
    after: opts?.after,
    run,
  };
}

/**
 * Create a plugin from a list of pass definitions.
 */
export function createPlugin(
  id: string,
  name: string,
  passes: CompilerPass[],
  description?: string,
): CompilerPlugin {
  return {
    id,
    name,
    description,
    register(pm: PassManager): void {
      for (const pass of passes) {
        pm.register(pass);
      }
    },
  };
}

/**
 * Composable plugin: merges multiple plugins into one.
 */
export function composePlugins(...plugins: CompilerPlugin[]): CompilerPlugin {
  return {
    id: plugins.map(p => p.id).join('+'),
    name: plugins.map(p => p.name).join(' + '),
    description: `Composed plugin: ${plugins.map(p => p.name).join(', ')}`,
    register(pm: PassManager): void {
      for (const plugin of plugins) {
        plugin.register(pm);
      }
    },
  };
}
