import inquirer from 'inquirer';
import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import type { PlatformTarget } from '@html-native/shared';
import type { ResolvedOptions } from '../types.js';
import { findMatchingCss } from '../config/defaults.js';

function findHtmlFiles(dir: string = process.cwd()): string[] {
  try {
    const entries = readdirSync(dir);
    return entries
      .filter(f => f.endsWith('.html'))
      .map(f => resolve(join(dir, f)));
  } catch {
    return [];
  }
}

function findCssFiles(dir: string = process.cwd()): string[] {
  try {
    const entries = readdirSync(dir);
    return entries
      .filter(f => f.endsWith('.css'))
      .map(f => resolve(join(dir, f)));
  } catch {
    return [];
  }
}

export async function runWizard(prefilled?: Partial<ResolvedOptions>): Promise<ResolvedOptions> {
  const htmlFiles = findHtmlFiles();
  const cssFiles = findCssFiles();

  const questions: Record<string, unknown>[] = [];

  if (!prefilled?.input) {
    if (htmlFiles.length === 0) {
      questions.push({
        type: 'input',
        name: 'input',
        message: 'Select HTML file:',
        default: 'index.html',
        validate: (input: string) => {
          if (!input) return 'HTML file path is required';
          return existsSync(resolve(input)) ? true : `File not found: ${input}`;
        },
      });
    } else {
      questions.push({
        type: 'list',
        name: 'input',
        message: 'Select HTML file:',
        choices: htmlFiles,
      });
    }
  }

  if (!prefilled?.css) {
    const defaultCss = prefilled?.input ? findMatchingCss(prefilled.input) : undefined;

    if (cssFiles.length > 0 || defaultCss) {
      const choices = ['(None)'];
      if (defaultCss) choices.push(defaultCss);
      choices.push(...cssFiles.filter(f => f !== defaultCss));

      questions.push({
        type: 'list',
        name: 'css',
        message: 'Select CSS file:',
        choices,
        filter: (val: string) => val === '(None)' ? undefined : val,
      });
    } else {
      questions.push({
        type: 'input',
        name: 'css',
        message: 'CSS file path (optional):',
        default: undefined,
      });
    }
  }

  if (!prefilled?.target) {
    questions.push({
      type: 'list',
      name: 'target',
      message: 'Select target platform:',
      choices: [
        { name: 'Flutter (.dart)', value: 'flutter' },
        { name: 'Jetpack Compose (.kt)', value: 'compose' },
        { name: 'SwiftUI (.swift)', value: 'swiftui' },
      ],
    });
  }

  if (!prefilled?.output) {
    questions.push({
      type: 'input',
      name: 'output',
      message: 'Output location:',
      default: (answers: Record<string, string>) => {
        const target = (prefilled?.target || answers.target || 'flutter') as PlatformTarget;
        const extMap: Record<PlatformTarget, string> = {
          flutter: '.dart', compose: '.kt', swiftui: '.swift',
        };
        return `generated/output${extMap[target]}`;
      },
    });
  }

  if (prefilled?.aiEnhance === undefined) {
    questions.push({
      type: 'confirm',
      name: 'aiEnhance',
      message: 'Enable AI enhancement? (requires local Ollama)',
      default: false,
    });
  }

  if (prefilled?.aiModel === undefined) {
    questions.push({
      type: 'input',
      name: 'aiModel',
      message: 'AI model name (if AI enabled):',
      default: 'qwen2.5:7b',
      when: (answers: Record<string, unknown>) => answers.aiEnhance === true || prefilled?.aiEnhance === true,
    });
  }

  const answers = await inquirer.prompt(questions);

  return {
    input: prefilled?.input || answers.input,
    css: prefilled?.css !== undefined ? prefilled.css : answers.css,
    target: prefilled?.target || answers.target,
    output: prefilled?.output || answers.output,
    aiEnhance: prefilled?.aiEnhance !== undefined ? prefilled.aiEnhance : answers.aiEnhance,
    aiModel: answers.aiModel || prefilled?.aiModel,
    dryRun: false,
  };
}
