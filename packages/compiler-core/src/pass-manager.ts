import type {
  PhaseId, PhaseDefinition, CompilerPass, PassManager as PassManagerInterface,
} from './types.js';
import { PHASES } from './types.js';

export class PassManager implements PassManagerInterface {
  private passes = new Map<string, CompilerPass>();

  register<P extends PhaseId>(pass: CompilerPass<P>): void {
    if (this.passes.has(pass.id)) {
      throw new Error(`Pass "${pass.id}" is already registered`);
    }
    this.passes.set(pass.id, pass);
  }

  unregister(passId: string): boolean {
    return this.passes.delete(passId);
  }

  hasPass(passId: string): boolean {
    return this.passes.has(passId);
  }

  getPass<P extends PhaseId>(passId: string): CompilerPass<P> | undefined {
    return this.passes.get(passId) as CompilerPass<P> | undefined;
  }

  getPasses<P extends PhaseId>(phase: P): CompilerPass<P>[] {
    return [...this.passes.values()]
      .filter((p): p is CompilerPass<P> => p.phase === phase);
  }

  getPhasePasses(phase: PhaseId): CompilerPass[] {
    return this.getPasses(phase);
  }

  phases(): PhaseDefinition[] {
    return [...PHASES];
  }

  /**
   * Resolve pass execution order for a phase using a simple topological
   * sort based on `before`/`after` constraints.
   */
  resolveOrder<P extends PhaseId>(phase: P): CompilerPass<P>[] {
    const candidates = this.getPasses(phase);
    if (candidates.length <= 1) return candidates;

    const id = (p: CompilerPass) => p.id;
    const adj = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    for (const p of candidates) {
      adj.set(id(p), new Set());
      inDegree.set(id(p), 0);
    }

    for (const p of candidates) {
      for (const before of p.before ?? []) {
        const edge = adj.get(before);
        if (edge && inDegree.has(id(p))) {
          edge.add(id(p));
          inDegree.set(id(p), (inDegree.get(id(p)) ?? 0) + 1);
        }
      }
      for (const after of p.after ?? []) {
        if (adj.has(id(p)) && inDegree.has(after)) {
          adj.get(id(p))!.add(after);
          inDegree.set(after, (inDegree.get(after) ?? 0) + 1);
        }
      }
    }

    const queue: string[] = [];
    for (const [pid, deg] of inDegree) {
      if (deg === 0) queue.push(pid);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const pid = queue.shift()!;
      sorted.push(pid);
      for (const neighbour of adj.get(pid) ?? []) {
        const nd = (inDegree.get(neighbour) ?? 1) - 1;
        inDegree.set(neighbour, nd);
        if (nd === 0) queue.push(neighbour);
      }
    }

    if (sorted.length < candidates.length) {
      const sortedSet = new Set(sorted);
      for (const p of candidates) {
        if (!sortedSet.has(id(p))) sorted.push(id(p));
      }
    }

    const map = new Map(candidates.map(p => [id(p), p]));
    return sorted.map(pid => map.get(pid)!).filter(Boolean);
  }

  clear(): void {
    this.passes.clear();
  }

  get count(): number {
    return this.passes.size;
  }
}
