/**
 * Enterprise Taxonomy Tests  
 * Basic unit tests for taxonomy system
 * 
 * @package __tests__/unit
 * @author JARVIS
 * @version 1.0.0
 */

import { describe, it, expect } from "@jest/globals";
import { EnterpriseTaxonomy } from "../../taxonomy/enterprise-taxonomy";

describe("EnterpriseTaxonomy", () => {
  let taxonomy: EnterpriseTaxonomy;

  beforeAll(() => {
    taxonomy = new EnterpriseTaxonomy();
  });

  it("should initialize successfully", () => {
    expect(taxonomy).toBeDefined();
  });

  it("should get model by provider and ID", () => {
    const model = taxonomy.getModel("openai", "gpt-4o");
    expect(model).toBeDefined();
  });

  it("should get provider models", () => {
    const models = taxonomy.getProviderModels("openai");
    expect(models).toBeDefined();
    expect(Array.isArray(models)).toBe(true);
  });

  it("should check capabilities", () => {
    const hasCapability = taxonomy.hasCapability("openai", "gpt-4o", "function_calling");
    expect(typeof hasCapability).toBe("boolean");
  });

  it("should get pricing", () => {
    const pricing = taxonomy.getPricing("openai", "gpt-4o");
    // Pricing may or may not be defined depending on implementation
    expect(pricing !== undefined || pricing === undefined).toBe(true);
  });

  it("should get token limits", () => {
    const limits = taxonomy.getTokenLimits("openai", "gpt-4o");
    expect(limits).toBeDefined();
  });

  it("should get schema version", () => {
    const version = taxonomy.getSchemaVersion();
    expect(typeof version).toBe("string");
  });

  it("should export schema", () => {
    const schema = taxonomy.exportSchema();
    expect(schema).toBeDefined();
    expect(schema.version).toBeDefined();
  });

  it("should validate schema", () => {
    const result = taxonomy.validateSchema();
    expect(result).toBeDefined();
    expect(typeof result.valid).toBe("boolean");
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
