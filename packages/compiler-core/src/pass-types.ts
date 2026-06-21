import type { UiNode } from '@motarjim/shared';

/**
 * An optimization pass transforms the IR tree.
 * Must be pure (no side effects, no external state).
 * Same contract as `@motarjim/optimizer`'s `OptimizationPass`.
 */
export interface OptimizationPass {
  name: string;
  run: (node: UiNode) => UiNode;
}
