import type { PlatformTarget } from '@motarjim/shared';

export interface CliConfig {
  input?: string;
  css?: string;
  target?: PlatformTarget;
  output?: string;
  aiEnhance?: boolean;
  aiModel?: string;
  dryRun?: boolean;
}

export interface ResolvedOptions {
  input: string;
  css?: string;
  target: PlatformTarget;
  output?: string;
  aiEnhance?: boolean;
  aiModel?: string;
  dryRun?: boolean;
}

export interface ConversionStats {
  htmlNodes: number;
  styledNodes: number;
  componentsDetected: number;
  optimizationSavings: number;
  generatedLines: number;
  target: PlatformTarget;
  duration: number;
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  file?: string;
  line?: number;
  col?: number;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface PipelineStage {
  name: string;
  package: string;
  description: string;
}
