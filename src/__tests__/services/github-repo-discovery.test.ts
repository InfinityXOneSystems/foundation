// src/__tests__/services/github-repo-discovery.test.ts
// Tests for the GitHub repository discovery service

import { describe, it, expect, jest } from "@jest/globals";

// Mock the octokit module to avoid ESM import issues
jest.mock("octokit", () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      repos: {
        listForOrg: jest.fn(),
      },
      rateLimit: {
        get: jest.fn(),
      },
    },
  })),
}));

import { GitHubRepoDiscovery } from "../../services/github-repo-discovery";

describe("GitHubRepoDiscovery", () => {
  it("should initialize with token and config", () => {
    const token = "test-token";
    const config = {
      organization: "InfinityXOneSystems",
      includeArchived: false,
      includePrivate: true,
      excludeRepos: [],
    };

    const discovery = new GitHubRepoDiscovery(token, config);
    expect(discovery).toBeDefined();
  });

  it("should handle empty exclude list", () => {
    const token = "test-token";
    const config = {
      organization: "TestOrg",
      includeArchived: true,
      includePrivate: true,
      excludeRepos: [],
    };

    const discovery = new GitHubRepoDiscovery(token, config);
    expect(discovery).toBeDefined();
  });

  it("should handle exclude list with repos", () => {
    const token = "test-token";
    const config = {
      organization: "TestOrg",
      includeArchived: false,
      includePrivate: false,
      excludeRepos: ["repo1", "repo2"],
    };

    const discovery = new GitHubRepoDiscovery(token, config);
    expect(discovery).toBeDefined();
  });

  it("should clear cache", () => {
    GitHubRepoDiscovery.clearCache();
    // If no error is thrown, the test passes
    expect(true).toBe(true);
  });

  it("should be instantiable with different organizations", () => {
    const token = "test-token";
    const config1 = {
      organization: "Org1",
      includeArchived: false,
      includePrivate: true,
      excludeRepos: [],
    };
    const config2 = {
      organization: "Org2",
      includeArchived: true,
      includePrivate: false,
      excludeRepos: ["test"],
    };

    const discovery1 = new GitHubRepoDiscovery(token, config1);
    const discovery2 = new GitHubRepoDiscovery(token, config2);

    expect(discovery1).toBeDefined();
    expect(discovery2).toBeDefined();
  });
});
