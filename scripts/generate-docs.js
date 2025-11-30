# scripts/generate-docs.js
// Auto-generate TypeScript API docs using TypeDoc
const { execSync } = require('child_process');

try {
  execSync('npx typedoc --out docs/api src', { stdio: 'inherit' });
  console.log('API documentation generated in docs/api');
} catch (err) {
  console.error('Failed to generate docs:', err);
  process.exit(1);
}
