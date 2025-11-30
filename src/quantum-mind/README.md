# 🧠 Quantum Mind System

**Unified Multi-Agent AI System with Real-Time Sync and Cloud Integration**

Version: 1.0.0  
Author: JARVIS

---

## Overview

The Quantum Mind System is a comprehensive multi-agent AI architecture that enables:

- **Inter-Agent Debates** with consensus building
- **Persistent Idea Generation** from quantum thinking
- **Real-Time Event Streaming** across all components
- **Google Cloud Integration** for outputs and memory persistence
- **Multi-Platform AI Connectors** (ChatGPT, Gemini, Google, GitHub)
- **Modular Web Crawling** with headless browser support
- **Automated Document Generation** from consensus results

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    QUANTUM MIND SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐           ┌──────────────────┐        │
│  │  Unified Brain  │◄─────────►│  Event Bus       │        │
│  │  • Debates      │           │  • Pub/Sub       │        │
│  │  • Consensus    │           │  • Priority Queue│        │
│  │  • Ideas        │           │  • Metrics       │        │
│  └────────┬────────┘           └────────┬─────────┘        │
│           │                              │                  │
│  ┌────────▼──────────────────────────────▼────────┐        │
│  │           5 QUANTUM AGENTS                      │        │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐       │        │
│  │  │Ingest│  │Vision│  │Strat │  │Valid │       │        │
│  │  └──────┘  └──────┘  └──────┘  └──────┘       │        │
│  │              ┌──────────┐                      │        │
│  │              │ Document │                      │        │
│  │              └──────────┘                      │        │
│  └──────────────────────┬──────────────────────────┘       │
│                         │                                   │
│  ┌──────────────────────▼─────────────────────────┐        │
│  │  DATA SOURCES                                   │        │
│  │  • Crawler Engine      • ChatGPT Platform      │        │
│  │  • Headless Browser    • Gemini Platform       │        │
│  │  • Scraper Utils       • Google Platform       │        │
│  │                        • GitHub Platform        │        │
│  └─────────────────────────────────────────────────┘        │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │  REAL-TIME SYNC                              │          │
│  │  • File Watchers       • Taxonomy Sync       │          │
│  │  • Cloud Sync          • Data Streaming      │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │  CLOUD INTEGRATION                           │          │
│  │  • Google Drive Sync   • Cloud Storage       │          │
│  │  • Conversations       • Memory Persistence  │          │
│  │  • Strategies/Plans    • Brain Snapshots     │          │
│  └──────────────────────────────────────────────┘          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Components

### Core Components

#### 1. Event Bus (`event-bus.ts`)
Central nervous system for all component communication.

**Features:**
- Priority-based pub/sub (critical → high → medium → low)
- Async event delivery with error handling
- Event logging with delivery tracking
- Metrics: total events, events by source, processing time

**Usage:**
```typescript
import { quantumEventBus } from './quantum-mind';

// Subscribe to events
quantumEventBus.subscribe('my_subscriber', ['data_scraped'], ['crawler_system'], (event) => {
  console.log('Received:', event);
});

// Publish events
quantumEventBus.publish('my_system', 'custom_event', { data: 'value' }, 'high');
```

#### 2. Unified Brain (`unified-brain.ts`)
Shared consciousness layer managing debates and consensus.

**Features:**
- Inter-agent debate rounds
- Convergence analysis (threshold: 0.8 or max 5 rounds)
- Consensus building with supporting/dissenting agents
- Persistent idea generation
- Shared memory with query capabilities

**Usage:**
```typescript
import { unifiedBrain } from './quantum-mind';

// Initiate thinking
const thought_id = unifiedBrain.initiateThinking(
  'Migration Strategy',
  'Determine best approach for Azure migration',
  'quantum',
  ['ingestion', 'vision', 'strategy', 'validation', 'document'],
  { budget: 'medium', timeline: 'Q2' }
);

// Query memory
const memories = unifiedBrain.queryMemory({
  tags: ['azure', 'migration'],
  memory_type: 'pattern',
  limit: 10
});
```

#### 3. Quantum Agents (`agents.ts`)
5 specialized agents with distinct roles.

**Agents:**

- **IngestionAgent**: Data quality analysis, source verification
- **VisionAgent**: Pattern detection, long-term strategic vision
- **StrategyAgent**: Strategic option generation, frontend option integration
- **ValidationAgent**: Validation checks, confidence scoring
- **DocumentAgent**: Template-based doc generation (strategy/plan/handoff)

**Usage:**
```typescript
import { ingestionAgent, visionAgent } from './quantum-mind';

// Agents automatically subscribe to unified brain
// They respond to perspective_requested events
// No manual triggering needed - all event-driven
```

### Data Ingestion

#### 4. Crawler Engine (`crawler.ts`)
Modular web scraping and data ingestion.

**Features:**
- Job queue system with status tracking
- Rate limiting support
- Headless browser integration (placeholder)
- Multi-source support: web, API, RSS, document, database, stream

**Usage:**
```typescript
import { crawlerEngine } from './quantum-mind';

const job_id = crawlerEngine.createJob({
  source_type: 'web',
  source_url: 'https://example.com',
  headless_browser: true,
  selectors: {
    title: 'h1',
    content: '.article-body'
  },
  rate_limit: { requests_per_second: 1 }
});
```

### Cloud Integration

#### 5. Google Drive Sync (`google-cloud.ts`)
Syncs outputs to Google Drive folders.

**Features:**
- Folder structure: conversations/, strategies/, plans/, memories/, documents/
- Sync queue with status tracking
- Markdown formatting for Drive documents
- Event-driven sync triggers

**Usage:**
```typescript
import { googleDriveSync } from './quantum-mind';

// Configure folders
googleDriveSync.configureFolders('base_folder_id', {
  conversations: 'conversations_folder_id',
  strategies: 'strategies_folder_id',
  plans: 'plans_folder_id',
  memories: 'memories_folder_id',
  documents: 'documents_folder_id'
});

// Sync is automatic via event subscriptions
// Manual sync also available:
await googleDriveSync.syncStrategy(idea_id);
```

#### 6. Google Cloud Storage (`google-cloud.ts`)
Memory persistence and brain snapshots.

**Features:**
- Memory storage with date-based paths
- Brain snapshot functionality
- Object listing and retrieval

**Usage:**
```typescript
import { googleCloudStorage } from './quantum-mind';

// Store memory
await googleCloudStorage.storeMemory('memory_id', memory_data);

// Store brain snapshot
await googleCloudStorage.storeBrainSnapshot(full_brain_state);
```

### Platform Connectors

#### 7. Multi-Platform Integration (`platforms.ts`)
Unified interface for ChatGPT, Gemini, Google, GitHub.

**Features:**
- Unified query interface
- Event publishing for all interactions
- Enable/disable per platform
- Webhook support (GitHub)

**Usage:**
```typescript
import { platformManager, chatgptPlatform } from './quantum-mind';

// Configure platforms
platformManager.configurePlatform({
  platform: 'chatgpt',
  enabled: true,
  api_key: 'your_api_key',
  trigger_type: 'event'
});

// Query platform
const response = await chatgptPlatform.query(
  'What are Azure best practices?',
  'gpt-4',
  { temperature: 0.7 }
);
```

### Real-Time Sync

#### 8. File Watchers (`realtime-sync.ts`)
Monitor file system changes with debouncing.

**Features:**
- Node.js fs.watch integration
- Debounced change detection
- Multiple watch targets (taxonomy/SOP/memory/config/artifacts)
- Bidirectional sync support

**Usage:**
```typescript
import { fileWatcherSystem } from './quantum-mind';

fileWatcherSystem.addWatcher({
  id: 'taxonomy_watcher',
  target: 'taxonomy',
  path: '/path/to/taxonomy',
  recursive: true,
  sync_direction: 'local_to_cloud',
  debounce_ms: 1000,
  enabled: true
});
```

#### 9. Taxonomy Sync (`realtime-sync.ts`)
Real-time taxonomy change synchronization.

**Features:**
- Attaches to EnterpriseTaxonomy and AzureTaxonomy event emitters
- Automatic cloud sync on changes
- Force full sync capability

**Usage:**
```typescript
import { initializeRealTimeTaxonomySync } from './quantum-mind';

const sync = initializeRealTimeTaxonomySync(
  enterpriseTaxonomy,
  azureTaxonomy
);

// Automatic sync on taxonomy changes
// Manual full sync:
await sync.forceFullSync();
```

#### 10. Data Streaming (`realtime-sync.ts`)
Stream critical/high priority events to frontend.

**Features:**
- Subscribes to all critical/high events
- Stream stats tracking
- WebSocket/SSE placeholder

**Usage:**
```typescript
import { dataStreamManager } from './quantum-mind';

// Streaming is automatic
// Get stats:
const stats = dataStreamManager.getStreamStats();
```

### Orchestrator

#### 11. Quantum Mind Orchestrator (`orchestrator.ts`)
Main control system coordinating all components.

**Features:**
- Centralized initialization
- Configuration management
- System lifecycle (initialize → start → stop)
- Stats and state export

**Usage:**
```typescript
import { QuantumMindOrchestrator } from './quantum-mind';

const orchestrator = new QuantumMindOrchestrator({
  taxonomy: {
    enterprise_taxonomy: myEnterpriseTaxonomy,
    azure_taxonomy: myAzureTaxonomy,
    auto_sync: true
  },
  google_cloud: {
    drive_base_folder_id: 'folder_id',
    storage_bucket: 'my-bucket'
  },
  platforms: {
    chatgpt_api_key: process.env.CHATGPT_API_KEY,
    gemini_api_key: process.env.GEMINI_API_KEY
  },
  file_watchers: {
    enabled: true,
    paths: {
      taxonomy: './taxonomy',
      memory: './memory'
    }
  }
});

await orchestrator.initialize();
await orchestrator.start();

// Initiate thinking
const thought_id = await orchestrator.think(
  'Cloud Migration',
  'Plan migration to Azure',
  {
    mode: 'quantum',
    participating_agents: ['vision', 'strategy', 'validation', 'document']
  }
);

// Get stats
const stats = orchestrator.getStats();
```

## Quick Start

### Basic Usage

```typescript
import { startQuantumMind } from './quantum-mind';
import { EnterpriseTaxonomy } from './taxonomy/enterprise-taxonomy';
import { AzureTaxonomy } from './taxonomy/azure-taxonomy';

// Initialize taxonomy systems
const enterpriseTaxonomy = new EnterpriseTaxonomy();
const azureTaxonomy = new AzureTaxonomy();

// Start Quantum Mind
const orchestrator = await startQuantumMind({
  taxonomy: {
    enterprise_taxonomy: enterpriseTaxonomy,
    azure_taxonomy: azureTaxonomy,
    auto_sync: true
  },
  platforms: {
    chatgpt_api_key: process.env.CHATGPT_API_KEY
  }
});

// Initiate quantum thinking
const thought_id = await orchestrator.think(
  'System Architecture',
  'Design microservices architecture for e-commerce platform'
);

// Monitor progress
orchestrator.on('consensus_finalized', (event) => {
  console.log('Consensus reached:', event.consensus);
});
```

### Advanced Configuration

```typescript
import { initializeQuantumMind } from './quantum-mind';

const orchestrator = await initializeQuantumMind({
  taxonomy: {
    enterprise_taxonomy: myEnterpriseTaxonomy,
    azure_taxonomy: myAzureTaxonomy,
    auto_sync: true
  },
  google_cloud: {
    drive_base_folder_id: 'YOUR_FOLDER_ID',
    storage_bucket: 'your-bucket-name',
    folders: {
      conversations: 'conversations_folder_id',
      strategies: 'strategies_folder_id',
      plans: 'plans_folder_id',
      memories: 'memories_folder_id',
      documents: 'documents_folder_id'
    }
  },
  platforms: {
    chatgpt_api_key: process.env.CHATGPT_API_KEY,
    gemini_api_key: process.env.GEMINI_API_KEY,
    google_api_key: process.env.GOOGLE_API_KEY,
    github_token: process.env.GITHUB_TOKEN
  },
  file_watchers: {
    enabled: true,
    paths: {
      taxonomy: './src/taxonomy',
      sop: './docs/ops/sop',
      memory: './src/memory',
      artifacts: './artifacts'
    }
  },
  frontend_options: {
    default_strategy: 'balanced',
    risk_tolerance: 'medium'
  }
});

await orchestrator.start();
```

## Event Flow

### Quantum Thinking Process

```
1. orchestrator.think(topic, description)
   │
   ├─► unifiedBrain.initiateThinking()
   │   │
   │   ├─► Publishes "perspective_requested" event
   │   │
   │   └─► All agents subscribe and respond
   │       │
   │       ├─► ingestionAgent.generatePerspective()
   │       ├─► visionAgent.generatePerspective()
   │       ├─► strategyAgent.generatePerspective()
   │       ├─► validationAgent.generatePerspective()
   │       └─► documentAgent.generatePerspective()
   │
   ├─► unifiedBrain collects perspectives
   │   │
   │   ├─► Analyzes convergence
   │   │
   │   └─► If convergence < 0.8 and rounds < 5:
   │       └─► Request counter-arguments (new debate round)
   │
   ├─► unifiedBrain.finalizeConsensus()
   │   │
   │   ├─► Builds consensus_result
   │   │
   │   └─► Publishes "consensus_finalized" event
   │
   ├─► unifiedBrain.generatePersistentIdea()
   │   │
   │   ├─► Creates PersistentIdea with automated_docs
   │   │
   │   └─► Publishes "document_generation_requested" event
   │
   ├─► documentAgent receives event
   │   │
   │   ├─► Generates strategy_doc, implementation_plan, handoff_doc
   │   │
   │   └─► Publishes "documents_generated" event
   │
   └─► googleDriveSync receives event
       │
       ├─► Syncs conversation to Drive
       ├─► Syncs strategy to Drive
       ├─► Syncs plan to Drive
       └─► Syncs all documents to Drive
```

## Events Reference

### Event Bus Events

| Event | Source | Payload | Priority |
|-------|--------|---------|----------|
| `perspective_requested` | unified_brain | {thought_id, topic, agent} | high |
| `consensus_finalized` | unified_brain | {thought_id, consensus} | high |
| `document_generation_requested` | unified_brain | {idea_id, docs} | medium |
| `documents_generated` | document_agent | {idea_id, documents} | medium |
| `data_scraped` | crawler_system | {job_id, result} | medium |
| `platform_data_received` | platform_* | {platform, data} | medium |
| `taxonomy_file_changed` | file_system | {path, operation} | high |
| `memory_sync_requested` | unified_brain | {memory_id} | low |

## API Reference

### QuantumMindOrchestrator

```typescript
class QuantumMindOrchestrator {
  constructor(config: QuantumMindConfig)
  
  // Lifecycle
  async initialize(): Promise<void>
  async start(): Promise<void>
  async stop(): Promise<void>
  
  // Core Operations
  async think(topic: string, description: string, options?: ThinkOptions): Promise<string>
  crawl(config: CrawlConfig): string
  async queryPlatform(platform: string, query: string, options?: any): Promise<string>
  
  // State Access
  getStats(): QuantumMindStats
  getThought(thought_id: string): QuantumThought | undefined
  getIdea(idea_id: string): PersistentIdea | undefined
  queryMemory(query: MemoryQuery): SharedMemory[]
  exportSystemState(): Record<string, unknown>
}
```

### UnifiedBrain

```typescript
class UnifiedBrain {
  initiateThinking(topic: string, description: string, mode: string, agents: string[], options: any): string
  recordPerspective(perspective: AgentPerspective): void
  finalizeConsensus(thought_id: string): void
  generatePersistentIdea(thought_id: string): string
  queryMemory(query: MemoryQuery): SharedMemory[]
  exportState(): BrainState
}
```

### CrawlerEngine

```typescript
class CrawlerEngine {
  createJob(config: CrawlConfig, schedule?: CrawlSchedule): string
  getJob(job_id: string): IngestionJob | undefined
  pauseJob(job_id: string): void
  resumeJob(job_id: string): void
  deleteJob(job_id: string): void
  getAllJobs(): IngestionJob[]
}
```

## Configuration

### Environment Variables

```bash
# Platform API Keys
CHATGPT_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
GOOGLE_API_KEY=your_google_key
GITHUB_TOKEN=your_github_token

# Google Cloud
GOOGLE_DRIVE_FOLDER_ID=your_folder_id
GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name

# Optional
FILE_WATCH_ENABLED=true
AUTO_TAXONOMY_SYNC=true
```

### Config File Example

```typescript
const config: QuantumMindConfig = {
  taxonomy: {
    enterprise_taxonomy: enterpriseTaxonomy,
    azure_taxonomy: azureTaxonomy,
    auto_sync: true
  },
  google_cloud: {
    drive_base_folder_id: process.env.GOOGLE_DRIVE_FOLDER_ID,
    storage_bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET
  },
  platforms: {
    chatgpt_api_key: process.env.CHATGPT_API_KEY,
    gemini_api_key: process.env.GEMINI_API_KEY,
    google_api_key: process.env.GOOGLE_API_KEY,
    github_token: process.env.GITHUB_TOKEN
  },
  file_watchers: {
    enabled: process.env.FILE_WATCH_ENABLED === 'true',
    paths: {
      taxonomy: './src/taxonomy',
      sop: './docs/ops/sop',
      memory: './src/memory',
      artifacts: './artifacts'
    }
  },
  frontend_options: {
    default_strategy: 'balanced',
    risk_tolerance: 'medium',
    innovation_level: 'high'
  }
};
```

## Dependencies

### Required
- `events` (Node.js EventEmitter)
- `fs` (Node.js file system)
- `../taxonomy/enterprise-taxonomy`
- `../taxonomy/azure-taxonomy`
- `../clients/unified-client`

### Optional (for full functionality)
- `googleapis` - Google Drive API
- `@google-cloud/storage` - Google Cloud Storage
- `puppeteer` or `playwright` - Headless browser automation
- `@octokit/rest` - GitHub API

## Testing

```typescript
// Example test
import { startQuantumMind } from './quantum-mind';

describe('Quantum Mind System', () => {
  it('should initialize successfully', async () => {
    const orchestrator = await startQuantumMind({
      taxonomy: { enterprise_taxonomy: mock, azure_taxonomy: mock }
    });
    
    expect(orchestrator).toBeDefined();
    
    const stats = orchestrator.getStats();
    expect(stats.agents_active).toBe(5);
  });
  
  it('should complete quantum thinking process', async () => {
    const orchestrator = await startQuantumMind(config);
    
    const thought_id = await orchestrator.think(
      'Test Topic',
      'Test description'
    );
    
    // Wait for consensus
    await new Promise((resolve) => {
      orchestrator.once('consensus_finalized', resolve);
    });
    
    const thought = orchestrator.getThought(thought_id);
    expect(thought.status).toBe('consensus');
  });
});
```

## Troubleshooting

### Common Issues

1. **Event bus not delivering events**
   - Check subscriber filters (event_types, sources, priority)
   - Verify publish() includes correct source and event_type
   - Check event logs: `quantumEventBus.getEventLogs()`

2. **Agents not responding to perspectives**
   - Ensure unified brain initiated thinking correctly
   - Check agent subscriptions in constructors
   - Verify event bus is running

3. **Google Drive sync failing**
   - Configure folders before syncing: `googleDriveSync.configureFolders()`
   - Check API credentials
   - Verify folder IDs are correct

4. **File watchers not triggering**
   - Ensure watchers are added: `fileWatcherSystem.addWatcher()`
   - Check debounce_ms setting (may be delayed)
   - Verify paths are correct and have permissions

## Roadmap

### Phase 1: Core System ✅
- [x] Event bus architecture
- [x] Unified brain with debates
- [x] 5 specialized agents
- [x] Modular crawler system
- [x] Google Cloud integration
- [x] Platform connectors
- [x] Real-time sync
- [x] Orchestrator

### Phase 2: API Integration 🚧
- [ ] Google Drive API implementation
- [ ] Google Cloud Storage implementation
- [ ] Headless browser (puppeteer/playwright)
- [ ] GitHub Octokit integration
- [ ] Google Custom Search API

### Phase 3: Frontend 📋
- [ ] WebSocket server for streaming
- [ ] Real-time dashboard
- [ ] Modular options interface
- [ ] Debate visualization
- [ ] Memory browser

### Phase 4: Advanced Features 📋
- [ ] Multi-modal agent support
- [ ] Reinforcement learning for agents
- [ ] Auto-scaling crawler workers
- [ ] Advanced memory queries (vector search)
- [ ] Idea execution automation

## License

MIT License - See LICENSE file

## Contributing

Contributions welcome! Please see CONTRIBUTING.md

## Support

For issues or questions:
- GitHub Issues: [link]
- Documentation: [link]
- Discord: [link]

---

**Built with ❤️ by JARVIS**
