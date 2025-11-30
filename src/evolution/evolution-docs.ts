// src/evolution/evolution-docs.ts
// Evolution Doc System: Tracks and updates documentation evolution, taxonomy, and memory integration.

import fs from 'fs';
import path from 'path';

const EVOLUTION_LOG = path.join(__dirname, '../../artifacts/evolution-log.json');

export interface EvolutionEvent {
  timestamp: string;
  entity: string;
  intent: string;
  action: string;
  details: string;
  user?: string;
}

export function logEvolutionEvent(event: EvolutionEvent) {
  let log: EvolutionEvent[] = [];
  if (fs.existsSync(EVOLUTION_LOG)) {
    log = JSON.parse(fs.readFileSync(EVOLUTION_LOG, 'utf-8'));
  }
  log.push(event);
  fs.writeFileSync(EVOLUTION_LOG, JSON.stringify(log, null, 2));
}

export function getEvolutionLog(): EvolutionEvent[] {
  if (!fs.existsSync(EVOLUTION_LOG)) return [];
  return JSON.parse(fs.readFileSync(EVOLUTION_LOG, 'utf-8'));
}

// Example: logEvolutionEvent({ timestamp: new Date().toISOString(), entity: 'Document', intent: 'Update', action: 'API_CALL', details: 'Updated onboarding doc', user: 'system' });
