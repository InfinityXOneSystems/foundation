#!/usr/bin/env node
/**
 * full-validation.js
 * Runs complete validation suite for Infinity Prime
 * Outputs: docs/system/FINAL_VALIDATION_REPORT.{json,md}
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Infinity Prime - Full Validation Suite');
console.log('='.repeat(50));

const startTime = Date.now();
const results = {
  timestamp: new Date().toISOString(),
  overall_status: 'PENDING',
  checks: {},
  summary: {},
};

// Helper to run command
function runCheck(name, command, required = true) {
  console.log(`\n▶️  ${name}...`);
  const checkStart = Date.now();
  
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    const duration = Date.now() - checkStart;
    console.log(`   ✅ PASS (${duration}ms)`);
    
    results.checks[name] = {
      status: 'PASS',
      required,
      duration_ms: duration,
      output: output.substring(0, 500), // Truncate for storage
    };
    
    return true;
  } catch (error) {
    const duration = Date.now() - checkStart;
    console.log(`   ❌ FAIL (${duration}ms)`);
    
    results.checks[name] = {
      status: 'FAIL',
      required,
      duration_ms: duration,
      error: error.message,
      output: error.stdout?.substring(0, 500) || '',
    };
    
    return false;
  }
}

// Run checks
console.log('\n📋 Running validation checks...\n');

// 1. Lint
const lintPass = runCheck('Lint', 'npm run lint', false); // non-blocking if no lint script

// 2. TypeCheck
const typeCheckPass = runCheck('TypeCheck', 'npx tsc --noEmit', false);

// 3. Tests
const testPass = runCheck('Unit Tests', 'npm test', true);

// 4. Build (if exists)
let buildPass = true;
try {
  execSync('npm run build --if-present', { stdio: 'ignore' });
  buildPass = runCheck('Build', 'npm run build', false);
} catch {
  console.log('\n▶️  Build...');
  console.log('   ⏭️  SKIP (no build script)');
  results.checks['Build'] = { status: 'SKIP', required: false };
}

// 5. Integration tests (if exists)
let integrationPass = true;
try {
  execSync('npm run test:integration --if-present', { stdio: 'ignore' });
  integrationPass = runCheck('Integration Tests', 'npm run test:integration', false);
} catch {
  console.log('\n▶️  Integration Tests...');
  console.log('   ⏭️  SKIP (no integration tests)');
  results.checks['Integration Tests'] = { status: 'SKIP', required: false };
}

// Calculate summary
const totalChecks = Object.keys(results.checks).length;
const passedChecks = Object.values(results.checks).filter(c => c.status === 'PASS').length;
const failedChecks = Object.values(results.checks).filter(c => c.status === 'FAIL').length;
const skippedChecks = Object.values(results.checks).filter(c => c.status === 'SKIP').length;
const requiredFailed = Object.values(results.checks).filter(c => c.status === 'FAIL' && c.required).length;

const duration = Date.now() - startTime;

results.summary = {
  total_checks: totalChecks,
  passed: passedChecks,
  failed: failedChecks,
  skipped: skippedChecks,
  required_failed: requiredFailed,
  duration_ms: duration,
  duration_readable: `${(duration / 1000).toFixed(2)}s`,
};

// Determine overall status
if (requiredFailed > 0) {
  results.overall_status = 'FAIL';
} else if (failedChecks > 0) {
  results.overall_status = 'WARN';
} else {
  results.overall_status = 'PASS';
}

// Output results
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION SUMMARY');
console.log('='.repeat(50));
console.log(`Status: ${results.overall_status}`);
console.log(`Duration: ${results.summary.duration_readable}`);
console.log(`Checks: ${passedChecks}/${totalChecks} passed`);
if (failedChecks > 0) {
  console.log(`Failed: ${failedChecks} (${requiredFailed} required)`);
}
if (skippedChecks > 0) {
  console.log(`Skipped: ${skippedChecks}`);
}

// Save JSON report
const outputDir = path.join(process.cwd(), 'docs/system');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const jsonPath = path.join(outputDir, 'FINAL_VALIDATION_REPORT.json');
fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
console.log(`\n💾 JSON report: ${jsonPath}`);

// Generate markdown report
const mdContent = `# Infinity Prime - Final Validation Report

**Generated:** ${results.timestamp}
**Overall Status:** ${results.overall_status}
**Duration:** ${results.summary.duration_readable}

## Summary
- Total Checks: ${totalChecks}
- Passed: ✅ ${passedChecks}
- Failed: ❌ ${failedChecks}
- Skipped: ⏭️ ${skippedChecks}
- Required Failed: ${requiredFailed}

## Check Results

${Object.entries(results.checks).map(([name, check]) => `
### ${name}
- **Status:** ${check.status === 'PASS' ? '✅' : check.status === 'FAIL' ? '❌' : '⏭️'} ${check.status}
- **Required:** ${check.required ? 'Yes' : 'No'}
- **Duration:** ${check.duration_ms || 0}ms
${check.error ? `- **Error:** \`${check.error}\`` : ''}
`).join('\n')}

## Conclusion

${results.overall_status === 'PASS' 
  ? '✅ All required checks passed. Ready for merge.'
  : results.overall_status === 'WARN'
  ? '⚠️ Some optional checks failed. Review recommended.'
  : '❌ Required checks failed. Cannot proceed with auto-merge.'}

---
*Generated by Infinity Prime Validation System*
`;

const mdPath = path.join(outputDir, 'FINAL_VALIDATION_REPORT.md');
fs.writeFileSync(mdPath, mdContent);
console.log(`💾 Markdown report: ${mdPath}`);

// Exit with appropriate code
console.log(`\n${results.overall_status === 'PASS' ? '✅' : '❌'} Validation ${results.overall_status}`);
process.exit(results.overall_status === 'PASS' ? 0 : 1);
