/**
 * Quantum Mind System
 * Unified multi-agent AI system with real-time sync and cloud integration
 * 
 * @package quantum-mind
 * @author JARVIS
 * @version 1.0.0
 */

// ============================================================
// CORE COMPONENTS
// ============================================================

export { quantumEventBus, QuantumEventBus } from "./event-bus";
export { unifiedBrain, UnifiedBrain } from "./unified-brain";
export {
  ingestionAgent,
  visionAgent,
  strategyAgent,
  validationAgent,
  documentAgent,
  QuantumAgent,
  IngestionAgent,
  VisionAgent,
  StrategyAgent,
  ValidationAgent,
  DocumentAgent,
} from "./agents";

// ============================================================
// DATA INGESTION & CRAWLING
// ============================================================

export {
  crawlerEngine,
  headlessBrowserAgent,
  CrawlerEngine,
  HeadlessBrowserAgent,
  ScraperUtils,
} from "./crawler";

// ============================================================
// CLOUD INTEGRATION
// ============================================================

export {
  googleDriveSync,
  googleCloudStorage,
  GoogleDriveSync,
  GoogleCloudStorage,
} from "./google-cloud";

// ============================================================
// PLATFORM CONNECTORS
// ============================================================

export {
  platformManager,
  chatgptPlatform,
  geminiPlatform,
  googlePlatform,
  githubPlatform,
  PlatformManager,
  ChatGPTPlatform,
  GeminiPlatform,
  GooglePlatform,
  GitHubPlatform,
} from "./platforms";

// ============================================================
// REAL-TIME SYNC
// ============================================================

export {
  fileWatcherSystem,
  dataStreamManager,
  initializeRealTimeTaxonomySync,
  FileWatcherSystem,
  RealTimeTaxonomySync,
  DataStreamManager,
} from "./realtime-sync";

// ============================================================
// ORCHESTRATOR
// ============================================================

export { default as QuantumMindOrchestrator } from "./orchestrator";
export type { QuantumMindConfig, QuantumMindStats } from "./orchestrator";

// ============================================================
// CONVENIENCE INITIALIZATION FUNCTION
// ============================================================

import QuantumMindOrchestrator, { QuantumMindConfig } from "./orchestrator";
import { EnterpriseTaxonomy } from "../taxonomy/enterprise-taxonomy";
import { AzureTaxonomy } from "../taxonomy/azure-taxonomy";

/**
 * Quick start function to initialize and start Quantum Mind
 */
export async function initializeQuantumMind(
  config: Partial<QuantumMindConfig> & {
    taxonomy: {
      enterprise_taxonomy: EnterpriseTaxonomy;
      azure_taxonomy: AzureTaxonomy;
    };
  }
): Promise<QuantumMindOrchestrator> {
  const default_config: QuantumMindConfig = {
    taxonomy: {
      enterprise_taxonomy: config.taxonomy.enterprise_taxonomy,
      azure_taxonomy: config.taxonomy.azure_taxonomy,
      auto_sync: config.taxonomy?.auto_sync ?? true,
    },
    google_cloud: config.google_cloud || {},
    platforms: config.platforms || {},
    file_watchers: config.file_watchers || {
      enabled: false,
    },
    frontend_options: config.frontend_options || {},
  };

  const orchestrator = new QuantumMindOrchestrator(default_config);
  await orchestrator.initialize();

  return orchestrator;
}

/**
 * Quick start with auto-start
 */
export async function startQuantumMind(
  config: Partial<QuantumMindConfig> & {
    taxonomy: {
      enterprise_taxonomy: EnterpriseTaxonomy;
      azure_taxonomy: AzureTaxonomy;
    };
  }
): Promise<QuantumMindOrchestrator> {
  const orchestrator = await initializeQuantumMind(config);
  await orchestrator.start();
  return orchestrator;
}

// ============================================================
// PACKAGE INFO
// ============================================================

export const QUANTUM_MIND_VERSION = "1.0.0";
export const QUANTUM_MIND_AUTHOR = "JARVIS";
export const QUANTUM_MIND_DESCRIPTION = "Unified multi-agent AI system with real-time sync and cloud integration";

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║             🧠 QUANTUM MIND SYSTEM v${QUANTUM_MIND_VERSION}                ║
║                                                           ║
║  Unified Multi-Agent AI System                            ║
║  • 5 Specialized Agents                                   ║
║  • Real-time Event Streaming                              ║
║  • Inter-Agent Debate & Consensus                         ║
║  • Persistent Idea Generation                             ║
║  • Google Cloud Integration                               ║
║  • Multi-Platform AI Connectors                           ║
║                                                           ║
║  Author: ${QUANTUM_MIND_AUTHOR}                                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);
