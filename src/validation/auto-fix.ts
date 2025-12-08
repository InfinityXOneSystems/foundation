/**
 * Auto-Fix Validation Issues
 * Automatically fixes common validation problems
 *
 * @package validation
 * @author JARVIS
 * @version 1.0.0
 */

import { createLogger } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";

const logger = createLogger("auto-fix");

export interface ValidationIssue {
  type: string;
  severity: "error" | "warning" | "info";
  message: string;
  file?: string;
  line?: number;
  fixable: boolean;
  fix?: () => Promise<void>;
}

export interface AutoFixResult {
  issue: ValidationIssue;
  fixed: boolean;
  error?: string;
}

export class AutoFixValidator {
  private fixes: Map<string, (issue: ValidationIssue) => Promise<void>> =
    new Map();

  constructor() {
    this.registerStandardFixes();
  }

  // Register standard fixes
  private registerStandardFixes(): void {
    // Fix missing README files
    this.registerFix("missing-readme", async (issue) => {
      if (!issue.file) return;
      const readmePath = path.join(issue.file, "README.md");
      const content = `# ${path.basename(
        issue.file
      )}\n\nGenerated README file.\n`;
      await fs.promises.writeFile(readmePath, content);
      logger.info("Created README.md", { path: readmePath });
    });

    // Fix missing package.json fields
    this.registerFix("missing-package-field", async (issue) => {
      if (!issue.file) return;
      const packageJson = JSON.parse(
        await fs.promises.readFile(issue.file, "utf-8")
      );

      // Add missing fields with defaults
      if (!packageJson.description)
        packageJson.description = "Package description";
      if (!packageJson.version) packageJson.version = "0.0.1";
      if (!packageJson.license) packageJson.license = "MIT";
      if (!packageJson.author) packageJson.author = "InfinityXOneSystems";

      await fs.promises.writeFile(
        issue.file,
        JSON.stringify(packageJson, null, 2)
      );
      logger.info("Fixed package.json", { path: issue.file });
    });

    // Fix missing environment variables with defaults
    this.registerFix("missing-env-var", async (issue) => {
      const envPath = path.join(process.cwd(), ".env");
      const envExample = path.join(process.cwd(), ".env.example");

      if (fs.existsSync(envExample)) {
        await fs.promises.copyFile(envExample, envPath);
        logger.info("Created .env from .env.example");
      } else {
        await fs.promises.writeFile(envPath, "# Environment variables\n");
        logger.info("Created empty .env file");
      }
    });

    // Fix trailing whitespace
    this.registerFix("trailing-whitespace", async (issue) => {
      if (!issue.file) return;
      const content = await fs.promises.readFile(issue.file, "utf-8");
      const fixed = content.replace(/[ \t]+$/gm, "");
      await fs.promises.writeFile(issue.file, fixed);
      logger.info("Fixed trailing whitespace", { path: issue.file });
    });

    // Fix missing semicolons (TypeScript/JavaScript)
    this.registerFix("missing-semicolon", async (issue) => {
      if (!issue.file || !issue.line) return;
      const content = await fs.promises.readFile(issue.file, "utf-8");
      const lines = content.split("\n");
      lines[issue.line - 1] = lines[issue.line - 1].trimEnd() + ";";
      await fs.promises.writeFile(issue.file, lines.join("\n"));
      logger.info("Added semicolon", { path: issue.file, line: issue.line });
    });

    // Fix inconsistent indentation
    this.registerFix("inconsistent-indent", async (issue) => {
      if (!issue.file) return;
      const content = await fs.promises.readFile(issue.file, "utf-8");

      // Detect and normalize indentation (2 spaces)
      const normalized = content.replace(/^[ \t]+/gm, (match) => {
        const spaces = match.replace(/\t/g, "  "); // Convert tabs to spaces
        return spaces.replace(/  /g, "  "); // Ensure 2-space indent
      });

      await fs.promises.writeFile(issue.file, normalized);
      logger.info("Fixed indentation", { path: issue.file });
    });

    // Fix deprecated model references
    this.registerFix("deprecated-model", async (issue) => {
      if (!issue.file) return;
      const content = await fs.promises.readFile(issue.file, "utf-8");

      // Common model migrations
      const migrations: Record<string, string> = {
        "gpt-3.5-turbo-0301": "gpt-3.5-turbo",
        "text-davinci-003": "gpt-3.5-turbo-instruct",
        "code-davinci-002": "gpt-4",
      };

      let fixed = content;
      for (const [old, new_] of Object.entries(migrations)) {
        fixed = fixed.replace(new RegExp(old, "g"), new_);
      }

      await fs.promises.writeFile(issue.file, fixed);
      logger.info("Updated deprecated model references", { path: issue.file });
    });

    // Fix invalid parameter ranges
    this.registerFix("invalid-parameter", async (issue) => {
      if (!issue.file) return;
      const content = await fs.promises.readFile(issue.file, "utf-8");

      // Fix common parameter issues
      let fixed = content
        // Temperature should be 0-2
        .replace(/"temperature":\s*([3-9]|\d{2,})/g, '"temperature": 1')
        // Top_p should be 0-1
        .replace(/"top_p":\s*([2-9]|\d{2,})/g, '"top_p": 1')
        // Frequency penalty -2 to 2
        .replace(
          /"frequency_penalty":\s*([3-9]|\d{2,})/g,
          '"frequency_penalty": 2'
        );

      await fs.promises.writeFile(issue.file, fixed);
      logger.info("Fixed invalid parameters", { path: issue.file });
    });

    logger.info("Registered standard auto-fixes", { count: this.fixes.size });
  }

  // Register a custom fix
  registerFix(
    issueType: string,
    fixFn: (issue: ValidationIssue) => Promise<void>
  ): void {
    this.fixes.set(issueType, fixFn);
    logger.debug("Registered fix", { issueType });
  }

  // Attempt to fix an issue
  async fix(issue: ValidationIssue): Promise<AutoFixResult> {
    if (!issue.fixable) {
      return {
        issue,
        fixed: false,
        error: "Issue is not auto-fixable",
      };
    }

    const fixFn = this.fixes.get(issue.type);
    if (!fixFn) {
      return {
        issue,
        fixed: false,
        error: `No fix registered for issue type: ${issue.type}`,
      };
    }

    try {
      await fixFn(issue);
      logger.info("Successfully fixed issue", {
        type: issue.type,
        file: issue.file,
      });

      return {
        issue,
        fixed: true,
      };
    } catch (error: any) {
      logger.error(
        "Failed to fix issue",
        { type: issue.type, file: issue.file },
        error
      );
      return {
        issue,
        fixed: false,
        error: error.message,
      };
    }
  }

  // Fix multiple issues
  async fixAll(issues: ValidationIssue[]): Promise<AutoFixResult[]> {
    const results: AutoFixResult[] = [];
    const fixableIssues = issues.filter((i) => i.fixable);

    logger.info("Starting auto-fix", {
      total: issues.length,
      fixable: fixableIssues.length,
    });

    for (const issue of fixableIssues) {
      const result = await this.fix(issue);
      results.push(result);
    }

    const fixed = results.filter((r) => r.fixed).length;
    logger.info("Auto-fix completed", {
      total: results.length,
      fixed,
      failed: results.length - fixed,
    });

    return results;
  }

  // Generate fix report
  generateReport(results: AutoFixResult[]): string {
    const fixed = results.filter((r) => r.fixed);
    const failed = results.filter((r) => !r.fixed);

    const lines = [
      "Auto-Fix Report",
      "=".repeat(50),
      "",
      `Total Issues: ${results.length}`,
      `Fixed: ${fixed.length}`,
      `Failed: ${failed.length}`,
      "",
    ];

    if (fixed.length > 0) {
      lines.push("Fixed Issues:", "");
      fixed.forEach((r) => {
        lines.push(`  ✓ ${r.issue.type}: ${r.issue.message}`);
        if (r.issue.file) lines.push(`    File: ${r.issue.file}`);
      });
      lines.push("");
    }

    if (failed.length > 0) {
      lines.push("Failed Issues:", "");
      failed.forEach((r) => {
        lines.push(`  ✗ ${r.issue.type}: ${r.issue.message}`);
        if (r.error) lines.push(`    Error: ${r.error}`);
      });
    }

    return lines.join("\n");
  }
}

// Export singleton instance
export const autoFixer = new AutoFixValidator();

// CLI usage
if (require.main === module) {
  (async () => {
    // Example issues (in real usage, these would come from validation)
    const issues: ValidationIssue[] = [
      {
        type: "trailing-whitespace",
        severity: "warning",
        message: "File has trailing whitespace",
        file: path.join(process.cwd(), "test.txt"),
        fixable: true,
      },
    ];

    const results = await autoFixer.fixAll(issues);
    console.log(autoFixer.generateReport(results));
  })();
}
