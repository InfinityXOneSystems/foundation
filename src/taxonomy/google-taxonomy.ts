// src/taxonomy/google-taxonomy.ts
// Google taxonomy system for entity, intent, and action classification
export const googleTaxonomy = {
  entities: [
    'DriveFile', 'Sheet', 'Doc', 'CalendarEvent', 'Task', 'KeepNote', 'GmailThread',
    'Function', 'PubSubTopic', 'StorageObject', 'User', 'Project', 'Label', 'Workflow'
  ],
  intents: [
    'Create', 'Read', 'Update', 'Delete', 'Sync', 'Share', 'Analyze', 'Summarize', 'Notify', 'Archive', 'Restore'
  ],
  actions: [
    'API_CALL', 'WEBHOOK', 'CRON', 'PUSH', 'PULL', 'NOTIFY', 'REVIEW', 'APPROVE', 'REJECT', 'ARCHIVE', 'RESTORE'
  ]
};

export function classifyGoogle(entity: string, intent: string, action: string) {
  return {
    entity: googleTaxonomy.entities.includes(entity) ? entity : 'Unknown',
    intent: googleTaxonomy.intents.includes(intent) ? intent : 'Unknown',
    action: googleTaxonomy.actions.includes(action) ? action : 'Unknown'
  };
}
