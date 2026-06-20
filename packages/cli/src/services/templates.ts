import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, resolve } from 'path';

export interface Template {
  name: string;
  description: string;
  files: Record<string, string>;
}

const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Landing Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <nav class="navbar">
    <div class="logo">Brand</div>
    <div class="nav-links">
      <a href="#">Features</a>
      <a href="#">Pricing</a>
      <a href="#">About</a>
      <a href="#" class="btn-primary">Get Started</a>
    </div>
  </nav>

  <section class="hero">
    <h1>Build Faster Native Apps</h1>
    <p>Convert your HTML designs into real native UI code automatically.</p>
    <div class="hero-buttons">
      <a href="#" class="btn-primary">Get Started</a>
      <a href="#" class="btn-secondary">Learn More</a>
    </div>
  </section>

  <section class="features">
    <div class="feature-card">
      <h3>Fast</h3>
      <p>Sub-second compilation for most pages.</p>
    </div>
    <div class="feature-card">
      <h3>Local-First</h3>
      <p>Everything runs on your machine.</p>
    </div>
    <div class="feature-card">
      <h3>Multi-Platform</h3>
      <p>Flutter, Compose, and SwiftUI support.</p>
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2024 Brand. All rights reserved.</p>
  </footer>
</body>
</html>`;

const LANDING_PAGE_CSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: #333;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #0070f3;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-links a {
  text-decoration: none;
  color: #666;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: linear-gradient(135deg, #0070f3, #00a8ff);
  color: white;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.hero-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: white;
  color: #0070f3;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 600;
}

.btn-secondary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: white;
  text-decoration: none;
  border: 2px solid white;
  border-radius: 8px;
  font-weight: 600;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  text-align: center;
}

.feature-card h3 {
  margin-bottom: 0.5rem;
  color: #0070f3;
}

.footer {
  text-align: center;
  padding: 2rem;
  background: #f5f5f5;
  color: #666;
}`;

const DASHBOARD_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <aside class="sidebar">
    <div class="logo">Dashboard</div>
    <nav class="sidebar-nav">
      <a href="#" class="active">Overview</a>
      <a href="#">Analytics</a>
      <a href="#">Users</a>
      <a href="#">Settings</a>
    </nav>
  </aside>

  <main class="main-content">
    <header class="app-bar">
      <h1>Overview</h1>
      <div class="user-info">
        <span>John Doe</span>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <h3>Users</h3>
        <p class="stat-value">12,345</p>
        <p class="stat-change positive">+12%</p>
      </div>
      <div class="stat-card">
        <h3>Revenue</h3>
        <p class="stat-value">$45,678</p>
        <p class="stat-change positive">+8%</p>
      </div>
      <div class="stat-card">
        <h3>Active</h3>
        <p class="stat-value">1,234</p>
        <p class="stat-change negative">-3%</p>
      </div>
    </div>

    <section class="table-section">
      <h2>Recent Activity</h2>
      <table>
        <tr><th>User</th><th>Action</th><th>Date</th></tr>
        <tr><td>Alice</td><td>Login</td><td>2024-01-15</td></tr>
        <tr><td>Bob</td><td>Purchase</td><td>2024-01-14</td></tr>
      </table>
    </section>
  </main>
</body>
</html>`;

const DASHBOARD_CSS = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  display: flex;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  min-height: 100vh;
}

.sidebar {
  width: 250px;
  background: #1a1a2e;
  color: white;
  padding: 2rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 2rem;
}

.sidebar-nav a {
  display: block;
  padding: 0.75rem 1rem;
  color: #a0a0b8;
  text-decoration: none;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.sidebar-nav a.active {
  background: #0070f3;
  color: white;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: #f5f7fa;
}

.app-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  margin: 0.5rem 0;
}

.stat-change {
  font-size: 0.875rem;
}

.stat-change.positive { color: #10b981; }
.stat-change.negative { color: #ef4444; }

.table-section {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.table-section h2 {
  margin-bottom: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

th {
  font-weight: 600;
  color: #666;
}`;

const TEMPLATES: Record<string, Template> = {
  'landing-page': {
    name: 'landing-page',
    description: 'A marketing landing page with hero, features, and footer',
    files: {
      'designs/index.html': LANDING_PAGE_HTML,
      'designs/styles.css': LANDING_PAGE_CSS,
    },
  },
  'dashboard': {
    name: 'dashboard',
    description: 'An admin dashboard with sidebar, stats, and table',
    files: {
      'designs/index.html': DASHBOARD_HTML,
      'designs/styles.css': DASHBOARD_CSS,
    },
  },
  'ecommerce': {
    name: 'ecommerce',
    description: 'E-commerce product listing page',
    files: {
      'designs/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shop</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="top-bar">
    <h1 class="logo">Shop</h1>
    <nav>
      <a href="#">Home</a>
      <a href="#">Products</a>
      <a href="#">Cart (0)</a>
    </nav>
  </header>

  <div class="product-grid">
    <div class="product-card">
      <div class="product-image"></div>
      <h3>Product Name</h3>
      <p class="price">$29.99</p>
      <button class="btn-primary">Add to Cart</button>
    </div>
    <div class="product-card">
      <div class="product-image"></div>
      <h3>Another Product</h3>
      <p class="price">$49.99</p>
      <button class="btn-primary">Add to Cart</button>
    </div>
    <div class="product-card">
      <div class="product-image"></div>
      <h3>Third Product</h3>
      <p class="price">$19.99</p>
      <button class="btn-primary">Add to Cart</button>
    </div>
  </div>
</body>
</html>`,
      'designs/styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 1rem;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.logo { color: #0070f3; }

.top-bar nav a {
  margin-left: 1rem;
  text-decoration: none;
  color: #666;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.product-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
}

.product-image {
  height: 160px;
  background: #f3f4f6;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.price {
  font-size: 1.25rem;
  font-weight: bold;
  color: #0070f3;
  margin: 0.5rem 0;
}

.btn-primary {
  width: 100%;
  padding: 0.75rem;
  background: #0070f3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}`,
    },
  },
  'portfolio': {
    name: 'portfolio',
    description: 'Personal portfolio/showcase website',
    files: {
      'designs/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="hero">
    <h1>Jane Designer</h1>
    <p>UI/UX Designer & Developer</p>
  </header>

  <section class="work">
    <div class="project-card">
      <div class="project-image"></div>
      <h3>Project One</h3>
      <p>A mobile app redesign.</p>
    </div>
    <div class="project-card">
      <div class="project-image"></div>
      <h3>Project Two</h3>
      <p>A dashboard interface.</p>
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2024 Jane Designer</p>
  </footer>
</body>
</html>`,
      'designs/styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Georgia, serif;
  color: #333;
  line-height: 1.6;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: #fafafa;
}

.hero h1 { font-size: 3rem; margin-bottom: 0.5rem; }
.hero p { color: #666; font-size: 1.2rem; }

.work {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.project-card {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.project-image {
  height: 200px;
  background: #e5e7eb;
}

.project-card h3, .project-card p {
  padding: 0.5rem 1rem;
}

.footer {
  text-align: center;
  padding: 2rem;
  color: #666;
}`,
    },
  },
  'blog': {
    name: 'blog',
    description: 'Blog layout with article cards',
    files: {
      'designs/index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header class="blog-header">
    <h1>My Blog</h1>
    <p>Thoughts on design and code</p>
  </header>

  <div class="posts">
    <article class="post-card">
      <h2>Getting Started with HTML-Native</h2>
      <p class="meta">Jan 15, 2024 · 5 min read</p>
      <p>Learn how to convert your HTML designs into native mobile UI code...</p>
    </article>
    <article class="post-card">
      <h2>Why Local-First Compilers Matter</h2>
      <p class="meta">Jan 10, 2024 · 3 min read</p>
      <p>Exploring the benefits of compiling designs locally without cloud dependencies...</p>
    </article>
  </div>

  <footer class="blog-footer">
    <p>&copy; 2024 My Blog</p>
  </footer>
</body>
</html>`,
      'designs/styles.css': `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  color: #333;
}

.blog-header {
  text-align: center;
  padding: 3rem 0;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 2rem;
}

.blog-header h1 { font-size: 2.5rem; }
.blog-header p { color: #666; }

.posts {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.post-card {
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.post-card h2 { margin-bottom: 0.5rem; color: #0070f3; }
.meta { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; }

.blog-footer {
  text-align: center;
  padding: 2rem 0;
  margin-top: 2rem;
  border-top: 1px solid #e5e7eb;
  color: #666;
}`,
    },
  },
};

export function getTemplateNames(): string[] {
  return Object.keys(TEMPLATES);
}

export function getTemplate(name: string): Template | undefined {
  return TEMPLATES[name];
}

export function getAllTemplates(): Template[] {
  return Object.values(TEMPLATES);
}

export function scaffoldTemplate(template: Template, targetDir: string): void {
  for (const [relativePath, content] of Object.entries(template.files)) {
    const fullPath = resolve(join(targetDir, relativePath));
    const dir = join(fullPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(fullPath, content, 'utf-8');
  }
}
