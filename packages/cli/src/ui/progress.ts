import ora from 'ora';
import type { Ora } from 'ora';

export function createPipelineSpinners(): {
  start: (name: string) => void;
  succeed: (name: string) => void;
  fail: (name: string, error?: string) => void;
  stopAll: () => void;
} {
  const spinners = new Map<string, Ora>();

  return {
    start(name: string) {
      const spinner = ora({ text: name, discardStdin: false }).start();
      spinners.set(name, spinner);
    },
    succeed(name: string) {
      const spinner = spinners.get(name);
      if (spinner) {
        spinner.succeed();
        spinners.delete(name);
      }
    },
    fail(name: string, error?: string) {
      const spinner = spinners.get(name);
      if (spinner) {
        spinner.fail(error ? `${name}: ${error}` : name);
        spinners.delete(name);
      }
    },
    stopAll() {
      for (const [, spinner] of spinners) {
        spinner.stop();
      }
      spinners.clear();
    },
  };
}
