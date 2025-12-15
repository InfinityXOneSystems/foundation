#!/usr/bin/env node
/**
 * risk-gate.js
 * Analyzes PR changes and assigns risk tier
 * Outputs: docs/system/RISK_GATE_REPORT.json
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Infinity Prime - Risk Gate Analysis');
console.log('=' .repeat(50));

// Get changed files
let changedFiles = [];
try {
  const output = execSync('git diff --name-only origin/main...HEAD', {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'ignore']
  });
  changedFiles = output.trim().split('\n').filter(Boolean);
} catch (error) {
  console.warn('⚠️  Could not get changed files, assuming empty');
  changedFiles = [];
}

console.log(`\n📁 Changed files: ${changedFiles.length}`);

// Risk factors
const riskFactors = [];
let riskScore = 0;

// Tier 1: Documentation only (score: 0-10)
const docOnly = changedFiles.every(f =>
  f.match(/\.(md|txt)$/i) ||
  f.startsWith('docs/') ||
  f.includes('README')
);

if (docOnly && changedFiles.length > 0) {
  riskScore = 5;
  riskFactors.push('Documentation-only changes');
}

// Tier 2 factors (score: 11-30)
if (changedFiles.some(f => f.match(/test|spec|__tests__/i))) {
  riskScore += 5;
  riskFactors.push('Test file changes');
}

if (changedFiles.some(f => f.includes('package.json') || f.includes('package-lock.json'))) {
  riskScore += 10;
  riskFactors.push('Dependency changes');
}

if (changedFiles.some(f => f.match(/\.(ts|js|tsx|jsx)$/i) && !f.includes('test'))) {
  riskScore += 15;
  riskFactors.push('Source code changes');
}

// Tier 3 factors (score: 31-60)
if (changedFiles.some(f => f.includes('auth') || f.includes('security'))) {
  riskScore += 25;
  riskFactors.push('Security-sensitive code');
}

if (changedFiles.some(f => f.includes('schema') || f.includes('migration'))) {
  riskScore += 20;
  riskFactors.push('Database schema changes');
}

if (changedFiles.some(f => f.includes('api/') || f.includes('routes/'))) {
  riskScore += 15;
  riskFactors.push('API endpoint changes');
}

// Tier 4 factors (score: 61+)
if (changedFiles.some(f => f.includes('.github/workflows'))) {
  riskScore += 30;
  riskFactors.push('CI/CD workflow changes');
}

if (changedFiles.some(f => f.includes('docker') || f.includes('k8s') || f.includes('deploy'))) {
  riskScore += 25;
  riskFactors.push('Infrastructure changes');
}

if (changedFiles.some(f => f.includes('config') && f.match(/\.(json|yaml|yml)$/i))) {
  riskScore += 20;
  riskFactors.push('Configuration changes');
}

// Determine tier
let tier = 1;
let tierLabel = 'SAFE - Auto-merge eligible';
let autoMergeAllowed = true;

if (riskScore >= 61) {
  tier = 4;
  tierLabel = 'BLOCKED - High risk, requires senior approval';
  autoMergeAllowed = false;
} else if (riskScore >= 31) {
  tier = 3;
  tierLabel = 'BLOCKED - Medium risk, requires manual review';
  autoMergeAllowed = false;
} else if (riskScore >= 11) {
  tier = 2;
  tierLabel = 'SAFE - Auto-merge eligible with passing checks';
  autoMergeAllowed = true;
} else {
  tier = 1;
  tierLabel = 'SAFE - Auto-merge eligible';
  autoMergeAllowed = true;
}

// Build report
const report = {
  timestamp: new Date().toISOString(),
  risk_tier: tier,
  risk_score: riskScore,
  tier_label: tierLabel,
  auto_merge_allowed: autoMergeAllowed,
  risk_factors: riskFactors,
  changed_files_count: changedFiles.length,
  changed_files: changedFiles,
  rules_version: '1.0.0',
};

// Output report
console.log(`\n📊 Risk Assessment:`);
console.log(`   Tier: ${tier}`);
console.log(`   Score: ${riskScore}`);
console.log(`   Label: ${tierLabel}`);
console.log(`   Auto-merge: ${autoMergeAllowed ? '✅ Yes' : '🔒 No'}`);
console.log(`\n🔍 Risk Factors (${riskFactors.length}):`);
riskFactors.forEach(factor => console.log(`   - ${factor}`));

// Save report
const outputDir = path.join(process.cwd(), 'docs/system');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'RISK_GATE_REPORT.json');
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));

console.log(`\n💾 Report saved to: ${outputPath}`);
console.log(`\n${autoMergeAllowed ? '✅' : '🔒'} Risk Gate: ${tierLabel}`);

// Exit with appropriate code
// 0 = safe to proceed, 1 = blocked
process.exit(autoMergeAllowed ? 0 : 1);
