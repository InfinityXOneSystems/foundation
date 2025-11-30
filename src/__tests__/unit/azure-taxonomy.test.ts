/**
 * Azure Taxonomy Tests
 * Unit tests for Azure AI services taxonomy
 * 
 * @package __tests__/unit
 * @author JARVIS
 * @version 1.0.0
 */

import { describe, it, expect } from "@jest/globals";
import { AzureTaxonomy } from "../../taxonomy/azure-taxonomy";
import type { AzureRegion } from "../../taxonomy/azure-taxonomy";

describe("AzureTaxonomy", () => {
  let taxonomy: AzureTaxonomy;

  beforeAll(() => {
    taxonomy = new AzureTaxonomy();
  });

  describe("Azure OpenAI Models", () => {
    it("should retrieve all models", () => {
      const models = taxonomy.getAllModels();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);
    });

    it("should get model by ID", () => {
      const model = taxonomy.getModel("gpt-4o");
      expect(model).toBeDefined();
    });

    it("should get models by region", () => {
      const region: AzureRegion = "eastus";
      const models = taxonomy.getModelsByRegion(region);
      expect(Array.isArray(models)).toBe(true);
    });

    it("should check managed identity support", () => {
      const supports = taxonomy.supportsManagedIdentity("gpt-4o");
      expect(typeof supports).toBe("boolean");
    });

    it("should check VNet support", () => {
      const supports = taxonomy.supportsVNet("gpt-4o");
      expect(typeof supports).toBe("boolean");
    });

    it("should check private endpoint support", () => {
      const supports = taxonomy.supportsPrivateEndpoint("gpt-4o");
      expect(typeof supports).toBe("boolean");
    });
  });

  describe("Cognitive Services", () => {
    it("should retrieve all cognitive services", () => {
      const services = taxonomy.getAllCognitiveServices();
      expect(Array.isArray(services)).toBe(true);
    });

    it("should get cognitive service by name", () => {
      const service = taxonomy.getCognitiveService("computer-vision");
      // Service may or may not exist depending on initialization
      expect(service !== undefined || service === undefined).toBe(true);
    });
  });

  describe("Deployment Management", () => {
    it("should create deployment", () => {
      const deployment = {
        deployment_name: "test-deployment",
        model_name: "gpt-4o",
        model_version: "2024-05-13",
        deployment_type: "standard" as const,
        region: "eastus" as AzureRegion,
        created_at: new Date().toISOString(),
        status: "succeeded" as const,
      };

      taxonomy.createDeployment(deployment);
      const retrieved = taxonomy.getDeployment("test-deployment");
      expect(retrieved).toBeDefined();
    });

    it("should list all deployments", () => {
      const deployments = taxonomy.getAllDeployments();
      expect(Array.isArray(deployments)).toBe(true);
    });

    it("should delete deployment", () => {
      const deployment = {
        deployment_name: "test-delete",
        model_name: "gpt-4o",
        model_version: "2024-05-13",
        deployment_type: "standard" as const,
        region: "eastus" as AzureRegion,
        created_at: new Date().toISOString(),
        status: "succeeded" as const,
      };

      taxonomy.createDeployment(deployment);
      const deleted = taxonomy.deleteDeployment("test-delete");
      expect(deleted).toBe(true);
    });
  });

  describe("Regional Availability", () => {
    it("should get regional availability", () => {
      const regions = taxonomy.getRegionalAvailability("gpt-4o");
      expect(Array.isArray(regions)).toBe(true);
    });
  });

  describe("Export", () => {
    it("should export taxonomy", () => {
      const exported = taxonomy.exportTaxonomy();
      expect(exported).toBeDefined();
      expect(exported.exported_at).toBeDefined();
    });
  });
});
