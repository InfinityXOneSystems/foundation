/**
 * SOP Validation System
 * Ensures SOP compliance and quality standards
 * 
 * @package validation
 * @author JARVIS
 * @version 1.0.0
 */

import { EventEmitter } from "events";
import type { SOP } from "../sop/sop-system";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export type SOPValidationSeverity = "critical" | "major" | "minor" | "info";
export type SOPValidationCategory = "structure" | "content" | "compliance" | "quality" | "security";

export interface SOPValidationRule {
  id: string;
  name: string;
  category: SOPValidationCategory;
  severity: SOPValidationSeverity;
  description: string;
  validate: (sop: SOP) => SOPValidationResult;
}

export interface SOPValidationResult {
  rule_id: string;
  passed: boolean;
  severity: SOPValidationSeverity;
  message: string;
  location?: string | undefined;
  details?: Record<string, unknown> | undefined;
  suggestions?: string[] | undefined;
}

export interface SOPValidationReport {
  report_id: string;
  timestamp: string;
  sop_id: string;
  sop_title: string;
  total_rules: number;
  passed: number;
  failed: number;
  critical: number;
  major: number;
  minor: number;
  results: SOPValidationResult[];
  compliance_score: number;
  quality_score: number;
  summary: string;
}

// ============================================================
// SOP VALIDATOR
// ============================================================

export class SOPValidator extends EventEmitter {
  private rules: Map<string, SOPValidationRule>;
  private reports: SOPValidationReport[];

  constructor() {
    super();
    this.rules = new Map();
    this.reports = [];
    this.initializeDefaultRules();
  }

  /**
   * Initialize default SOP validation rules
   */
  private initializeDefaultRules(): void {
    // Structure validation
    this.registerRule({
      id: "sop-title-length",
      name: "Title Length",
      category: "structure",
      severity: "critical",
      description: "SOP title must be between 10 and 200 characters",
      validate: (sop) => {
        const titleLength = sop.title.length;
        const isValid = titleLength >= 10 && titleLength <= 200;

        return {
          rule_id: "sop-title-length",
          passed: isValid,
          severity: "critical",
          message: isValid
            ? "Title length is valid"
            : `Title length ${titleLength} is outside range 10-200`,
          location: "title",
          details: { title_length: titleLength },
        };
      },
    });

    this.registerRule({
      id: "sop-minimum-steps",
      name: "Minimum Steps",
      category: "structure",
      severity: "critical",
      description: "SOP must have at least 3 steps",
      validate: (sop) => {
        const stepCount = sop.steps.length;
        const isValid = stepCount >= 3;

        return {
          rule_id: "sop-minimum-steps",
          passed: isValid,
          severity: "critical",
          message: isValid
            ? `SOP has ${stepCount} steps`
            : `SOP has only ${stepCount} step(s), minimum is 3`,
          location: "steps",
          details: { step_count: stepCount },
        };
      },
    });

    this.registerRule({
      id: "sop-step-numbering",
      name: "Step Numbering",
      category: "structure",
      severity: "major",
      description: "Steps must be numbered sequentially starting from 1",
      validate: (sop) => {
        const invalidSteps = sop.steps.filter(
          (step, idx) => step.step_number !== idx + 1
        );

        const isValid = invalidSteps.length === 0;

        return {
          rule_id: "sop-step-numbering",
          passed: isValid,
          severity: "major",
          message: isValid
            ? "Step numbering is sequential"
            : `${invalidSteps.length} step(s) have incorrect numbering`,
          location: "steps",
          details: isValid
            ? undefined
            : {
                invalid_steps: invalidSteps.map((s) => ({
                  expected: sop.steps.indexOf(s) + 1,
                  actual: s.step_number,
                  title: s.title,
                })),
              },
        };
      },
    });

    // Content validation
    this.registerRule({
      id: "sop-step-instructions",
      name: "Step Instructions",
      category: "content",
      severity: "critical",
      description: "Each step must have at least one instruction",
      validate: (sop) => {
        const stepsWithoutInstructions = sop.steps.filter(
          (step) => step.instructions.length === 0
        );

        const isValid = stepsWithoutInstructions.length === 0;

        return {
          rule_id: "sop-step-instructions",
          passed: isValid,
          severity: "critical",
          message: isValid
            ? "All steps have instructions"
            : `${stepsWithoutInstructions.length} step(s) missing instructions`,
          location: "steps",
          details: isValid
            ? undefined
            : {
                missing_instructions: stepsWithoutInstructions.map((s) => ({
                  step_number: s.step_number,
                  title: s.title,
                })),
              },
        };
      },
    });

    this.registerRule({
      id: "sop-step-responsibility",
      name: "Step Responsibility",
      category: "content",
      severity: "major",
      description: "Each step must have a responsible role defined",
      validate: (sop) => {
        const stepsWithoutRole = sop.steps.filter(
          (step) => !step.responsible_role || step.responsible_role.length === 0
        );

        const isValid = stepsWithoutRole.length === 0;

        return {
          rule_id: "sop-step-responsibility",
          passed: isValid,
          severity: "major",
          message: isValid
            ? "All steps have responsible roles"
            : `${stepsWithoutRole.length} step(s) missing responsible role`,
          location: "steps",
          details: isValid
            ? undefined
            : {
                missing_roles: stepsWithoutRole.map((s) => ({
                  step_number: s.step_number,
                  title: s.title,
                })),
              },
        };
      },
    });

    this.registerRule({
      id: "sop-description-length",
      name: "Description Length",
      category: "content",
      severity: "minor",
      description: "SOP description should be at least 50 characters",
      validate: (sop) => {
        const descLength = sop.description.length;
        const isValid = descLength >= 50;

        return {
          rule_id: "sop-description-length",
          passed: isValid,
          severity: "minor",
          message: isValid
            ? "Description length is adequate"
            : `Description is only ${descLength} characters, recommend at least 50`,
          location: "description",
          details: { description_length: descLength },
        };
      },
    });

    // Compliance validation
    this.registerRule({
      id: "sop-owner-defined",
      name: "Owner Defined",
      category: "compliance",
      severity: "critical",
      description: "SOP must have an owner assigned",
      validate: (sop) => {
        const isValid = Boolean(sop.metadata.created_by && sop.metadata.created_by.length > 0);

        return {
          rule_id: "sop-owner-defined",
          passed: isValid,
          severity: "critical",
          message: isValid ? "SOP owner (created_by) is defined" : "SOP owner (created_by) is missing",
          location: "metadata.created_by",
        };
      },
    });

    this.registerRule({
      id: "sop-version-format",
      name: "Version Format",
      category: "compliance",
      severity: "major",
      description: "Version should follow semantic versioning (x.y.z)",
      validate: (sop) => {
        const versionRegex = /^\d+\.\d+\.\d+$/;
        const isValid = versionRegex.test(sop.version);

        return {
          rule_id: "sop-version-format",
          passed: isValid,
          severity: "major",
          message: isValid
            ? "Version format is valid"
            : `Version ${sop.version} does not follow semantic versioning`,
          location: "version",
          suggestions: isValid ? undefined : ["Use format: major.minor.patch (e.g., 1.0.0)"],
        };
      },
    });

    this.registerRule({
      id: "sop-review-date",
      name: "Review Date",
      category: "compliance",
      severity: "major",
      description: "SOP should have a next review date set",
      validate: (sop) => {
        const hasReviewDate = (sop.metadata as Record<string, unknown>).next_review_date !== undefined;

        return {
          rule_id: "sop-review-date",
          passed: hasReviewDate,
          severity: "major",
          message: hasReviewDate
            ? "Review date is set"
            : "No next review date defined",
          location: "metadata.next_review_date",
          ...(!hasReviewDate && {
            suggestions: ["Set a periodic review date (e.g., annually)"],
          }),
        };
      },
    });

    // Quality validation
    this.registerRule({
      id: "sop-prerequisites-count",
      name: "Prerequisites Count",
      category: "quality",
      severity: "minor",
      description: "Complex SOPs should have prerequisites defined",
      validate: (sop) => {
        const hasPrereqs = sop.prerequisites && sop.prerequisites.length > 0;
        const isComplex = sop.steps.length > 10;
        const isValid = !isComplex || hasPrereqs;

        return {
          rule_id: "sop-prerequisites-count",
          passed: isValid,
          severity: "minor",
          message: isValid
            ? "Prerequisites are appropriate"
            : "Complex SOP should define prerequisites",
          location: "prerequisites",
          details: {
            step_count: sop.steps.length,
            prerequisite_count: sop.prerequisites?.length || 0,
          },
        };
      },
    });

    this.registerRule({
      id: "sop-related-sops",
      name: "Related SOPs",
      category: "quality",
      severity: "info",
      description: "SOPs should reference related procedures",
      validate: (sop) => {
        const hasRelated = sop.related_sops && sop.related_sops.length > 0;

        return {
          rule_id: "sop-related-sops",
          passed: hasRelated,
          severity: "info",
          message: hasRelated
            ? `${sop.related_sops.length} related SOP(s) linked`
            : "No related SOPs defined",
          location: "related_sops",
          details: { related_count: sop.related_sops?.length || 0 },
        };
      },
    });

    this.registerRule({
      id: "sop-estimated-time",
      name: "Estimated Time",
      category: "quality",
      severity: "minor",
      description: "Each step should have realistic estimated time",
      validate: (sop) => {
        const stepsWithoutTime = sop.steps.filter(
          (step) => !step.estimated_time_minutes || step.estimated_time_minutes <= 0
        );

        const isValid = stepsWithoutTime.length === 0;

        return {
          rule_id: "sop-estimated-time",
          passed: isValid,
          severity: "minor",
          message: isValid
            ? "All steps have estimated time"
            : `${stepsWithoutTime.length} step(s) missing estimated time`,
          location: "steps",
        };
      },
    });

    // Security validation
    this.registerRule({
      id: "sop-sensitive-data-handling",
      name: "Sensitive Data Handling",
      category: "security",
      severity: "critical",
      description: "SOPs handling sensitive data must have security tags",
      validate: (sop) => {
        const description = sop.description.toLowerCase();
        const title = sop.title.toLowerCase();
        
        const sensitiveKeywords = [
          "password",
          "credential",
          "api key",
          "secret",
          "token",
          "pii",
          "personal",
          "sensitive",
        ];

        const containsSensitive = sensitiveKeywords.some(
          (keyword) => description.includes(keyword) || title.includes(keyword)
        );

        if (!containsSensitive) {
          return {
            rule_id: "sop-sensitive-data-handling",
            passed: true,
            severity: "info",
            message: "No sensitive data handling detected",
            location: "tags",
          };
        }

        const hasSecurityTags = sop.tags.some((tag) =>
          ["security", "compliance", "confidential", "restricted"].includes(
            tag.toLowerCase()
          )
        );

        return {
          rule_id: "sop-sensitive-data-handling",
          passed: hasSecurityTags,
          severity: "critical",
          message: hasSecurityTags
            ? "Security tags present for sensitive SOP"
            : "SOP handles sensitive data but lacks security tags",
          location: "tags",
          suggestions: hasSecurityTags
            ? undefined
            : ["Add tags: security, compliance, confidential, or restricted"],
        };
      },
    });
  }

  /**
   * Register a validation rule
   */
  registerRule(rule: SOPValidationRule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Validation rule already exists: ${rule.id}`);
    }

    this.rules.set(rule.id, rule);
    this.emit("rule_registered", { ruleId: rule.id });
  }

  /**
   * Unregister a validation rule
   */
  unregisterRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      this.emit("rule_unregistered", { ruleId });
    }
    return deleted;
  }

  /**
   * Get all registered rules
   */
  getRules(category?: SOPValidationCategory): SOPValidationRule[] {
    const allRules = Array.from(this.rules.values());
    return category ? allRules.filter((r) => r.category === category) : allRules;
  }

  /**
   * Validate an SOP
   */
  validateSOP(sop: SOP): SOPValidationReport {
    const reportId = `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const results: SOPValidationResult[] = [];

    // Run all validation rules
    for (const rule of this.rules.values()) {
      const result = rule.validate(sop);
      results.push(result);
    }

    const passed = results.filter((r) => r.passed);
    const failed = results.filter((r) => !r.passed);
    const critical = failed.filter((r) => r.severity === "critical");
    const major = failed.filter((r) => r.severity === "major");
    const minor = failed.filter((r) => r.severity === "minor");

    // Calculate scores
    const complianceScore = this.calculateComplianceScore(results);
    const qualityScore = this.calculateQualityScore(results);

    const report: SOPValidationReport = {
      report_id: reportId,
      timestamp,
      sop_id: sop.id,
      sop_title: sop.title,
      total_rules: results.length,
      passed: passed.length,
      failed: failed.length,
      critical: critical.length,
      major: major.length,
      minor: minor.length,
      results,
      compliance_score: complianceScore,
      quality_score: qualityScore,
      summary: this.generateSummary(critical.length, major.length, minor.length, passed.length),
    };

    this.reports.push(report);
    this.emit("validation_complete", { reportId, sopId: sop.id });

    return report;
  }

  /**
   * Validate multiple SOPs
   */
  validateMultipleSOPs(sops: SOP[]): SOPValidationReport[] {
    return sops.map((sop) => this.validateSOP(sop));
  }

  /**
   * Calculate compliance score (0-100)
   */
  private calculateComplianceScore(results: SOPValidationResult[]): number {
    const complianceResults = results.filter((r) =>
      ["structure", "content", "compliance"].includes(
        this.rules.get(r.rule_id)?.category || ""
      )
    );

    if (complianceResults.length === 0) return 100;

    const weights = { critical: 10, major: 5, minor: 2, info: 0 };
    let totalWeight = 0;
    let lostPoints = 0;

    for (const result of complianceResults) {
      const weight = weights[result.severity];
      totalWeight += weight;
      if (!result.passed) {
        lostPoints += weight;
      }
    }

    return totalWeight === 0 ? 100 : Math.round((1 - lostPoints / totalWeight) * 100);
  }

  /**
   * Calculate quality score (0-100)
   */
  private calculateQualityScore(results: SOPValidationResult[]): number {
    const qualityResults = results.filter((r) =>
      ["quality", "security"].includes(this.rules.get(r.rule_id)?.category || "")
    );

    if (qualityResults.length === 0) return 100;

    const weights = { critical: 10, major: 5, minor: 2, info: 1 };
    let totalWeight = 0;
    let lostPoints = 0;

    for (const result of qualityResults) {
      const weight = weights[result.severity];
      totalWeight += weight;
      if (!result.passed) {
        lostPoints += weight;
      }
    }

    return totalWeight === 0 ? 100 : Math.round((1 - lostPoints / totalWeight) * 100);
  }

  /**
   * Get validation report
   */
  getReport(reportId: string): SOPValidationReport | undefined {
    return this.reports.find((r) => r.report_id === reportId);
  }

  /**
   * Get all validation reports
   */
  getAllReports(): SOPValidationReport[] {
    return [...this.reports];
  }

  /**
   * Get reports for specific SOP
   */
  getReportsForSOP(sopId: string): SOPValidationReport[] {
    return this.reports.filter((r) => r.sop_id === sopId);
  }

  /**
   * Clear validation history
   */
  clearReports(): void {
    this.reports = [];
    this.emit("reports_cleared");
  }

  /**
   * Generate summary message
   */
  private generateSummary(
    critical: number,
    major: number,
    minor: number,
    passed: number
  ): string {
    if (critical > 0) {
      return `❌ Critical issues: ${critical} critical, ${major} major, ${minor} minor`;
    }
    if (major > 0) {
      return `⚠️ Major issues: ${major} major, ${minor} minor, ${passed} passed`;
    }
    if (minor > 0) {
      return `✓ Minor issues: ${minor} minor, ${passed} passed`;
    }
    return `✅ All ${passed} validation(s) passed`;
  }
}
