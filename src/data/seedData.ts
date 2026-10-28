import { VaultItem, ClientWorkspace, AuditLog } from '../types/vault';

export const INITIAL_WORKSPACES: ClientWorkspace[] = [
  {
    id: 'personal',
    name: 'Personal Vault',
    type: 'personal',
    description: 'Private personal records, credentials, identity, and personal accounts.',
    collections: ['Personal Logins', 'Finances', 'Secure Notes'],
    collaborators: [],
    color: '#6366f1',
    itemCount: 0,
    lastActive: 'Just now'
  }
];

export const INITIAL_VAULT_ITEMS: VaultItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
