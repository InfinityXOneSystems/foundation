// src/taxonomy/openai-taxonomy.ts
// OpenAI taxonomy system for entity, intent, and action classification
export const openAITaxonomy = {
  entities: [
    'Project', 'Environment', 'Service', 'Deployment', 'Run', 'Integration', 'User',
    'Adapter', 'Memory', 'Incident', 'Proposal', 'Validation', 'Tag', 'Document'
  ],
  intents: [
    'Create', 'Read', 'Update', 'Delete', 'Sync', 'Validate', 'Deploy', 'Ingest', 'Analyze', 'Summarize', 'Tag', 'Evolve'
  ],
  actions: [
    'API_CALL', 'WEBHOOK', 'CRON', 'PUSH', 'PULL', 'NOTIFY', 'REVIEW', 'APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE'
  ]
};

export function classifyOpenAI(entity: string, intent: string, action: string) {
  return {
    entity: openAITaxonomy.entities.includes(entity) ? entity : 'Unknown',
    intent: openAITaxonomy.intents.includes(intent) ? intent : 'Unknown',
    action: openAITaxonomy.actions.includes(action) ? action : 'Unknown'
  };
}
