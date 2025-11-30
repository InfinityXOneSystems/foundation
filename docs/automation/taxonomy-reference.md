# docs/automation/taxonomy-reference.md

# Taxonomy Reference (OpenAI & Google)

## OpenAI Taxonomy
- **Entities:** Project, Environment, Service, Deployment, Run, Integration, User, Adapter, Memory, Incident, Proposal, Validation, Tag, Document
- **Intents:** Create, Read, Update, Delete, Sync, Validate, Deploy, Ingest, Analyze, Summarize, Tag, Evolve
- **Actions:** API_CALL, WEBHOOK, CRON, PUSH, PULL, NOTIFY, REVIEW, APPROVE, REJECT, ARCHIVE, RESTORE

## Google Taxonomy
- **Entities:** DriveFile, Sheet, Doc, CalendarEvent, Task, KeepNote, GmailThread, Function, PubSubTopic, StorageObject, User, Project, Label, Workflow
- **Intents:** Create, Read, Update, Delete, Sync, Share, Analyze, Summarize, Notify, Archive, Restore
- **Actions:** API_CALL, WEBHOOK, CRON, PUSH, PULL, NOTIFY, REVIEW, APPROVE, REJECT, ARCHIVE, RESTORE

## Usage
- Use these taxonomies for classifying, tagging, and routing all automation, memory, and intelligence events.
- All new repos should import and extend these modules for consistent, production-grade automation.
