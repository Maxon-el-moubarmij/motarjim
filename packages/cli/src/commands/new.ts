import { join } from 'path';
import { scaffoldTemplate, getTemplate, getTemplateNames, getAllTemplates } from '../services/templates.js';

export async function newCommand(args: Record<string, unknown>): Promise<void> {
  const templateName = (args.template as string) || (args.args as string[])?.[0];

  if (!templateName) {
    console.log('Available templates:\n');
    for (const template of getAllTemplates()) {
      console.log(`  ${template.name.padEnd(16)} ${template.description}`);
    }
    console.log('\nUsage: motarjim new <template-name>');
    return;
  }

  const template = getTemplate(templateName);

  if (!template) {
    console.error(`Unknown template: "${templateName}"`);
    console.log('Available templates:');
    for (const name of getTemplateNames()) {
      console.log(`  - ${name}`);
    }
    process.exit(1);
  }

  const targetDir = process.cwd();
  scaffoldTemplate(template, targetDir);

  console.log(`Scaffolded "${template.name}" template:\n`);
  for (const filePath of Object.keys(template.files)) {
    console.log(`  Created ${filePath}`);
  }

  console.log('\nNext steps:');
  console.log(`  1. Edit the files in designs/`);
  console.log(`  2. Run: motarjim convert`);
}
