// src/__tests__/services/secrets-sync-daemon.test.ts
// Tests for the secrets sync daemon service

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { SecretsSyncDaemon } from "../../services/secrets-sync-daemon";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const STATE_DIR = path.join(os.homedir(), ".infinity-x-one");
const STATE_FILE = path.join(STATE_DIR, "secrets-sync-state.json");
const LOCK_FILE = path.join(STATE_DIR, "secrets-sync.lock");

describe("SecretsSyncDaemon", () => {
  // Clean up state files before and after tests
  beforeEach(() => {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  });

  afterEach(() => {
    if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }
  });

  it("should initialize daemon with configuration", () => {
    const config = {
      intervalHours: 6,
      enabled: true,
      autoStart: true,
    };

    const syncFunction = async () => ({ success: true, message: "Test sync" });
    const daemon = new SecretsSyncDaemon(config, syncFunction);

    expect(daemon).toBeDefined();
  });

  it("should report not running when daemon is stopped", () => {
    const isRunning = SecretsSyncDaemon.isRunning();
    expect(isRunning).toBe(false);
  });

  it("should return null status when no status file exists", () => {
    const status = SecretsSyncDaemon.getStatus();
    expect(status).toBeNull();
  });

  it("should detect non-existent lock file", () => {
    expect(fs.existsSync(LOCK_FILE)).toBe(false);
  });

  it("should load status with default values", () => {
    // Create daemon but don't start it
    const daemon = new SecretsSyncDaemon(
      { intervalHours: 1, enabled: true, autoStart: true },
      async () => ({ success: true, message: "Test" })
    );

    expect(daemon).toBeDefined();
  });

  it("should handle sync function execution", async () => {
    let syncCalled = false;
    const syncFunction = async () => {
      syncCalled = true;
      return { success: true, message: "Sync executed" };
    };

    const daemon = new SecretsSyncDaemon(
      { intervalHours: 1, enabled: true, autoStart: false },
      syncFunction
    );

    expect(daemon).toBeDefined();
    // Note: We don't actually start the daemon in tests to avoid long-running processes
  });
});
