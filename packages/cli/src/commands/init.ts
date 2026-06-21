import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

const CONFIG_JSON = `{
  "input": "designs/index.html",
  "css": "designs/styles.css",
  "target": "flutter",
  "output": "generated/output.dart",
  "aiEnhance": false
}
`;

const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My App</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Welcome to HTML-Native</h1>
    <p>Edit this HTML to design your native app.</p>
    <button class="btn">Get Started</button>
  </div>
</body>
</html>`;

const SAMPLE_CSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  text-align: center;
  padding: 2rem;
}

h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.125rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
}`;

export async function initCommand(): Promise<void> {
  const root = process.cwd();
  const dirs = ['designs', 'generated'];

  for (const dir of dirs) {
    const fullPath = join(root, dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
      console.log(`  Created ${dir}/`);
    } else {
      console.log(`  ${dir}/ already exists`);
    }
  }

  const configPath = join(root, 'motarjim.config.json');
  if (!existsSync(configPath)) {
    writeFileSync(configPath, CONFIG_JSON, 'utf-8');
    console.log('  Created motarjim.config.json');
  } else {
    console.log('  motarjim.config.json already exists');
  }

  const htmlPath = join(root, 'designs', 'index.html');
  if (!existsSync(htmlPath)) {
    writeFileSync(htmlPath, SAMPLE_HTML, 'utf-8');
    console.log('  Created designs/index.html');
  } else {
    console.log('  designs/index.html already exists');
  }

  const cssPath = join(root, 'designs', 'styles.css');
  if (!existsSync(cssPath)) {
    writeFileSync(cssPath, SAMPLE_CSS, 'utf-8');
    console.log('  Created designs/styles.css');
  } else {
    console.log('  designs/styles.css already exists');
  }

  console.log('\nProject initialized successfully!');
  console.log('\nNext steps:');
  console.log('  1. Edit designs/index.html and designs/styles.css');
  console.log('  2. Run: motarjim convert');
}
