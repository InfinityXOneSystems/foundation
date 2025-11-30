# Enterprise Taxonomy System Documentation

## Overview

The Enterprise Taxonomy System provides a comprehensive framework for managing AI model taxonomies, SOPs, validation, and cross-provider compatibility. This system mirrors industry standards from OpenAI, Anthropic, Groq, and Google.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Core Systems](#core-systems)
3. [Taxonomy System](#taxonomy-system)
4. [SOP Management](#sop-management)
5. [Tagging System](#tagging-system)
6. [Validation](#validation)
7. [Evolution Tracking](#evolution-tracking)
8. [Multi-Provider Mapping](#multi-provider-mapping)
9. [API Reference](#api-reference)

---

## Quick Start

```typescript
import { EnterpriseTaxonomy } from './src/taxonomy/enterprise-taxonomy';
import { SOPSystem } from './src/sop/sop-system';
import { TaggingSystem } from './src/taxonomy/tagging-system';
import { TaxonomyValidator } from './src/validation/taxonomy-validator';

// Initialize systems
const taxonomy = new EnterpriseTaxonomy();
const sopSystem = new SOPSystem();
const taggingSystem = new TaggingSystem();
const validator = new TaxonomyValidator();

// Load provider taxonomies
const openaiTax = taxonomy.getProviderTaxonomy('openai');
const claudeTax = taxonomy.getProviderTaxonomy('anthropic');

// Validate taxonomy
const report = validator.validateProvider(openaiTax);
console.log(report.summary);
```

---

## Core Systems

### 1. **Taxonomy System**
Enterprise-grade taxonomy for AI models with:
- Model definitions (GPT, Claude, Mixtral, Gemini)
- Capability matrices
- Pricing tiers
- Token limits
- Moderation rules
- Compliance frameworks

### 2. **SOP Management**
Complete SOP lifecycle management:
- CRUD operations
- Versioning and revision tracking
- Approval workflows
- Compliance mapping
- Execution tracking
- Audit trails

### 3. **Tagging System**
Hierarchical tagging infrastructure:
- Semantic tags
- Domain-specific tags
- Tag hierarchies
- Auto-tagging
- Tag validation

### 4. **Validation Layer**
Comprehensive validation:
- Taxonomy consistency checks
- SOP compliance validation
- Cross-provider validation
- Scoring and reporting

### 5. **Evolution Tracking**
Change management system:
- Taxonomy change tracking
- Impact assessments
- Migration guides
- Evolution documentation
- Audit trails

### 6. **Multi-Provider Mapping**
Cross-provider compatibility:
- Model equivalence mapping
- Capability translation
- Parameter conversion
- Migration paths

---

## Taxonomy System

### Creating a Custom Taxonomy

```typescript
import { EnterpriseTaxonomy, ModelTier } from './src/taxonomy/enterprise-taxonomy';

const taxonomy = new EnterpriseTaxonomy();

// Get model by ID
const gpt4o = taxonomy.getModel('openai', 'gpt-4o');
console.log(gpt4o?.token_limits.context_window); // 128000

// Get models by capability
const visionModels = taxonomy.getModelsByCapability('vision');
console.log(visionModels.map(m => m.id));

// Get models by task type
const codeModels = taxonomy.getModelsByTaskType('code');
console.log(codeModels.map(m => m.id));
```

### Model Structure

```typescript
interface ModelTier {
  id: string;
  family: ModelFamily;
  provider: ProviderName;
  version: string;
  release_date: string;
  capabilities: Record<string, Capability>;
  task_types: TaskType[];
  moderation_rules: ModerationRule[];
  pricing: Record<string, PricingTier>;
  token_limits: TokenLimits;
  status: CapabilityLevel;
  parameters: ParameterBounds;
  supported_formats: string[];
  training_data_cutoff: string;
  metadata: Record<string, unknown>;
}
```

### Capabilities

```typescript
// Check if model has capability
const hasVision = gpt4o?.capabilities.vision?.enabled;

// Get capability version
const visionVersion = gpt4o?.capabilities.vision?.version;

// Check deprecation
const isDeprecated = gpt4o?.capabilities.some_feature?.deprecated_at;
```

---

## SOP Management

### Creating an SOP

```typescript
import { SOPSystem } from './src/sop/sop-system';

const sopSystem = new SOPSystem();

const sopId = sopSystem.createSOP(
  'Model Deployment Procedure',
  'Standard procedure for deploying AI models to production',
  'deployment',
  'high',
  'admin',
  ['deployment', 'ai', 'production'],
  [
    {
      step_number: 1,
      title: 'Pre-deployment Validation',
      description: 'Validate model before deployment',
      instructions: [
        'Run model through validation suite',
        'Check compliance requirements',
        'Verify resource allocation',
      ],
      preconditions: ['Model trained and tested'],
      postconditions: ['Validation report generated'],
      estimated_time_minutes: 30,
      responsible_role: 'ML Engineer',
      validation_criteria: ['All tests pass', 'No compliance issues'],
    },
    {
      step_number: 2,
      title: 'Deploy to Staging',
      description: 'Deploy model to staging environment',
      instructions: [
        'Update deployment configuration',
        'Deploy using CI/CD pipeline',
        'Verify deployment success',
      ],
      preconditions: ['Validation passed'],
      postconditions: ['Model running in staging'],
      estimated_time_minutes: 45,
      responsible_role: 'DevOps Engineer',
      validation_criteria: ['Health checks pass', 'Monitoring active'],
    },
    {
      step_number: 3,
      title: 'Production Deployment',
      description: 'Deploy model to production',
      instructions: [
        'Create deployment ticket',
        'Execute production deployment',
        'Monitor for 24 hours',
      ],
      preconditions: ['Staging verification complete'],
      postconditions: ['Model in production'],
      estimated_time_minutes: 60,
      responsible_role: 'DevOps Engineer',
      validation_criteria: ['Zero errors', 'Performance within SLA'],
    },
  ]
);

console.log(`Created SOP: ${sopId}`);
```

### Updating SOPs

```typescript
// Update SOP
sopSystem.updateSOP(
  sopId,
  {
    status: 'approved',
    priority: 'critical',
  },
  'admin'
);

// Add approval
sopSystem.addApproval(sopId, {
  approver_id: 'approver-1',
  approver_name: 'John Doe',
  status: 'approved',
  comments: 'Looks good',
  revision_number: 1,
});
```

### Executing SOPs

```typescript
// Record execution
const executionId = sopSystem.recordExecution(
  sopId,
  'operator-1',
  [
    { step_number: 1, status: 'completed', notes: 'All validations passed' },
    { step_number: 2, status: 'completed', notes: 'Deployed successfully' },
    { step_number: 3, status: 'in_progress', notes: 'Monitoring active' },
  ]
);

// Get execution history
const executions = sopSystem.getExecutionHistory(sopId);
console.log(`Total executions: ${executions.length}`);
```

---

## Tagging System

### Creating Tags

```typescript
import { TaggingSystem } from './src/taxonomy/tagging-system';

const tagging = new TaggingSystem();

// Create tags
const prodTag = tagging.createTag(
  'prod-001',
  'Production',
  'environment',
  'global',
  'Production environment tag',
  'infrastructure',
  'admin',
  ['prod', 'production', 'live']
);

const mlTag = tagging.createTag(
  'ml-001',
  'Machine Learning',
  'domain',
  'project',
  'Machine learning related',
  'technology',
  'admin',
  ['ml', 'ai', 'artificial-intelligence']
);

// Create hierarchy
tagging.linkTags('ml-001', 'ml-sub-001');
```

### Tagging Resources

```typescript
// Tag a resource
tagging.tagResource('sop-123', 'sop', ['prod-001', 'ml-001']);

// Search by tags
const resources = tagging.searchByTags(['production', 'ml']);
console.log(resources);

// Get tag statistics
const stats = tagging.getTagStatistics('prod-001');
console.log(`Used ${stats.usage_count} times`);
```

---

## Validation

### Taxonomy Validation

```typescript
import { TaxonomyValidator } from './src/validation/taxonomy-validator';

const validator = new TaxonomyValidator();

// Validate provider
const report = validator.validateProvider(openaiTaxonomy);

console.log(report.summary);
console.log(`Errors: ${report.errors}`);
console.log(`Warnings: ${report.warnings}`);

// Check specific results
report.results.forEach(result => {
  if (!result.passed) {
    console.log(`❌ ${result.message}`);
    result.suggestions?.forEach(s => console.log(`  → ${s}`));
  }
});
```

### SOP Validation

```typescript
import { SOPValidator } from './src/validation/sop-validator';

const sopValidator = new SOPValidator();

// Validate SOP
const sopReport = sopValidator.validateSOP(sop);

console.log(`Compliance Score: ${sopReport.compliance_score}/100`);
console.log(`Quality Score: ${sopReport.quality_score}/100`);
console.log(`Critical Issues: ${sopReport.critical}`);
console.log(`Major Issues: ${sopReport.major}`);

// Get actionable feedback
sopReport.results
  .filter(r => !r.passed && r.severity === 'critical')
  .forEach(r => {
    console.log(`🚨 ${r.message}`);
    console.log(`   Location: ${r.location}`);
  });
```

---

## Evolution Tracking

### Recording Changes

```typescript
import { EvolutionSync } from './src/memory/evolution/evolution-sync';

const evolution = new EvolutionSync();

// Record a change
const changeId = evolution.recordChange(
  'added',
  'model',
  'openai:gpt-4o-mini',
  'GPT-4o Mini',
  'Added new cost-effective model',
  '1.0.0',
  '1.1.0',
  {
    breaking_changes: false,
    migration_required: false,
    affected_models: ['gpt-4o'],
    affected_sops: [],
    estimated_migration_time_hours: 0,
  },
  {
    old_approach: 'N/A',
    new_approach: 'Use gpt-4o-mini for cost-effective tasks',
    migration_steps: ['Update model configuration', 'Test performance'],
  },
  {},
  'admin'
);

// Create evolution document
const docId = evolution.createEvolutionDoc(
  'Q4 2024 Model Updates',
  'AI-ML',
  'research',
  'Track Q4 model releases and updates',
  ['model-updates', 'ai'],
  'admin'
);

// Link change to document
evolution.linkChangeToDoc(changeId, docId, 'admin');
```

---

## Multi-Provider Mapping

### Finding Equivalent Models

```typescript
import { ProviderMapper } from './src/mapping/provider-mapper';

const mapper = new ProviderMapper();

// Find equivalent model
const mapping = mapper.findEquivalentModel('openai', 'gpt-4o', 'anthropic');
console.log(`Equivalent: ${mapping?.target_model}`); // claude-3-5-sonnet
console.log(`Compatibility: ${mapping?.compatibility_score}`); // 0.95

// Get all alternatives
const alternatives = mapper.getMappingsForModel('openai', 'gpt-4o');
alternatives.forEach(alt => {
  console.log(`${alt.target_provider}: ${alt.target_model} (${alt.compatibility_score})`);
});
```

### Translating Requests

```typescript
// Translate API request
const translation = mapper.translateRequest(
  'openai',
  'gpt-4o',
  'anthropic',
  {
    max_tokens: 4096,
    temperature: 0.7,
    top_p: 0.9,
  }
);

console.log(`Target model: ${translation.target_model}`);
console.log('Translated params:', translation.translated_parameters);
translation.warnings.forEach(w => console.log(`⚠️ ${w}`));
```

### Migration Planning

```typescript
// Get migration path
const migration = mapper.getMigrationPath('openai', 'anthropic', 'gpt-4o');

console.log(`Recommended: ${migration.recommended_model}`);
console.log(`Compatibility: ${migration.compatibility_score}`);

console.log('\nRequired Changes:');
migration.required_changes.forEach(c => console.log(`  - ${c}`));

console.log('\nMigration Steps:');
migration.migration_steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
```

---

## API Reference

### EnterpriseTaxonomy

```typescript
class EnterpriseTaxonomy {
  getProviderTaxonomy(provider: ProviderName): TaxonomyProvider
  getModel(provider: ProviderName, modelId: string): ModelTier | undefined
  getModelsByCapability(capability: string): ModelTier[]
  getModelsByTaskType(taskType: TaskType): ModelTier[]
  getModelsByFamily(family: ModelFamily): ModelTier[]
  getComplianceFramework(): ComplianceFramework
  getAllModels(): ModelTier[]
}
```

### SOPSystem

```typescript
class SOPSystem {
  createSOP(...): string
  getSOP(id: string): SOP | undefined
  updateSOP(id: string, updates: Partial<SOP>, updater: string): void
  deleteSOP(id: string, deletedBy: string): boolean
  searchSOPs(criteria: SOPSearchCriteria): SOP[]
  addApproval(sopId: string, approval: ApprovalRecord): void
  recordExecution(sopId: string, executedBy: string, results: StepResult[]): string
  getExecutionHistory(sopId: string): SOPExecution[]
}
```

### TaggingSystem

```typescript
class TaggingSystem {
  createTag(...): Tag
  getTag(id: string): Tag | undefined
  tagResource(resourceId: string, resourceType: string, tagIds: string[]): void
  searchByTags(tagNames: string[]): TaggedResource[]
  linkTags(parentId: string, childId: string): void
  getTagStatistics(tagId: string): TagStatistics
}
```

### TaxonomyValidator

```typescript
class TaxonomyValidator {
  validateProvider(provider: TaxonomyProvider): ValidationReport
  validateCompliance(compliance: ComplianceFramework): ValidationReport
  validateCrossProvider(providers: TaxonomyProvider[]): ValidationReport
  registerRule(rule: ValidationRule): void
  getReport(reportId: string): ValidationReport | undefined
}
```

### SOPValidator

```typescript
class SOPValidator {
  validateSOP(sop: SOP): SOPValidationReport
  validateMultipleSOPs(sops: SOP[]): SOPValidationReport[]
  registerRule(rule: SOPValidationRule): void
  getReport(reportId: string): SOPValidationReport | undefined
}
```

### ProviderMapper

```typescript
class ProviderMapper {
  findEquivalentModel(source: ProviderName, model: string, target: ProviderName): ModelMapping | undefined
  getMappingsForModel(provider: ProviderName, modelId: string): ModelMapping[]
  translateRequest(source: ProviderName, model: string, target: ProviderName, params: Record<string, unknown>): TranslationResult
  getMigrationPath(from: ProviderName, to: ProviderName, model: string): MigrationPath
  isCrossProviderCapable(capability: string, providers: ProviderName[]): CapabilityCheck
}
```

---

## Best Practices

### 1. **Always Validate**
```typescript
// Validate before using
const report = validator.validateProvider(taxonomy);
if (report.errors > 0) {
  console.error('Taxonomy has errors');
  process.exit(1);
}
```

### 2. **Track Changes**
```typescript
// Record all taxonomy changes
evolution.recordChange(/* ... */);
```

### 3. **Use Mapping for Migrations**
```typescript
// Always check compatibility before migrating
const migration = mapper.getMigrationPath(from, to, model);
if (migration.compatibility_score < 0.8) {
  console.warn('Low compatibility - review required');
}
```

### 4. **Maintain SOP Compliance**
```typescript
// Regular SOP validation
const report = sopValidator.validateSOP(sop);
if (report.compliance_score < 90) {
  console.warn('SOP needs improvement');
}
```

---

## License

MIT License - See LICENSE file for details

## Contributing

Contributions welcome! Please follow the coding standards and ensure all tests pass.

## Support

For issues and questions, please open an issue on GitHub.
