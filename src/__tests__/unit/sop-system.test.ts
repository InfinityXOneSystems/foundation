/**
 * SOP System Tests
 * Unit tests for SOP management
 * 
 * @package __tests__/unit
 * @author JARVIS
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { SOPSystem } from "../../sop/sop-system";
import type { SOPStep } from "../../sop/sop-system";

// Helper function to create a valid SOPStep
function createTestStep(stepNumber = 1, action = "Test action"): SOPStep {
  return {
    step_number: stepNumber,
    title: `Step ${stepNumber}`,
    description: action,
    instructions: [action, "Additional instruction"],
    preconditions: [],
    postconditions: [],
    estimated_time_minutes: 5,
    responsible_role: "operator",
    validation_criteria: ["Success"],
  };
}

describe("SOPSystem", () => {
  let sopSystem: SOPSystem;

  beforeEach(() => {
    sopSystem = new SOPSystem();
  });

  describe("SOP Creation", () => {
    it("should create a new SOP", () => {
      const sop = sopSystem.createSOP(
        "sop-001",
        "Test SOP",
        "Test Description",
        "operational",
        "high",
        [createTestStep()],
        "test-user"
      );

      expect(sop).toBeDefined();
      expect(sop.id).toBe("sop-001");
      expect(sop.title).toBe("Test SOP");
    });

    it("should throw error for duplicate SOP", () => {
      sopSystem.createSOP(
        "sop-dup",
        "Test",
        "Desc",
        "operational",
        "high",
        [createTestStep()],
        "user"
      );

      expect(() => {
        sopSystem.createSOP(
          "sop-dup",
          "Test",
          "Desc",
          "operational",
          "high",
          [createTestStep()],
          "user"
        );
      }).toThrow();
    });
  });

  describe("SOP Retrieval", () => {
    it("should retrieve SOP by ID", () => {
      sopSystem.createSOP(
        "sop-r1",
        "SOP 1",
        "Desc",
        "operational",
        "high",
        [createTestStep()],
        "user1"
      );

      const sop = sopSystem.getSOP("sop-r1");
      expect(sop).toBeDefined();
      expect(sop?.title).toBe("SOP 1");
    });

    it("should return undefined for non-existent SOP", () => {
      const sop = sopSystem.getSOP("non-existent");
      expect(sop).toBeUndefined();
    });

    it("should search all SOPs", () => {
      sopSystem.createSOP(
        "sop-list-1",
        "SOP 1",
        "Desc",
        "operational",
        "high",
        [createTestStep()],
        "user1"
      );

      const sops = sopSystem.searchSOPs({});
      expect(sops.length).toBeGreaterThanOrEqual(1);
    });

    it("should search SOPs by status", () => {
      sopSystem.createSOP(
        "sop-search-1",
        "SOP 1",
        "Desc",
        "operational",
        "high",
        [createTestStep()],
        "user1"
      );

      const sops = sopSystem.searchSOPs({ status: "draft" });
      expect(Array.isArray(sops)).toBe(true);
    });
  });

  describe("SOP Updates", () => {
    it("should update SOP", () => {
      sopSystem.createSOP(
        "sop-upd",
        "Original",
        "Desc",
        "operational",
        "medium",
        [createTestStep()],
        "user1"
      );

      const updated = sopSystem.updateSOP("sop-upd", { title: "Updated" }, "user1");
      expect(updated).toBeDefined();
      expect(updated?.title).toBe("Updated");
    });
  });

  describe("SOP Validation", () => {
    it("should validate SOP", () => {
      sopSystem.createSOP(
        "sop-val",
        "Validate Me",
        "Desc",
        "operational",
        "low",
        [createTestStep()],
        "user1"
      );

      const result = sopSystem.validateSOP("sop-val");
      expect(result).toBeDefined();
      expect(typeof result.valid).toBe("boolean");
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });
});
