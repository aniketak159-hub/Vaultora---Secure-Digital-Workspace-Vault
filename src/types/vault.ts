export type ItemCategory = 
  | 'login' 
  | 'note' 
  | 'licence' 
  | 'identity' 
  | 'wifi' 
  | 'card' 
  | 'secret';

export type WorkspaceType = 'personal' | 'team' | 'client';

export type CollaboratorRole = 'admin' | 'editor' | 'viewer';

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: CollaboratorRole;
  avatar?: string;
  addedAt: string;
}

export interface ClientWorkspace {
  id: string;
  name: string;
  type: WorkspaceType;
  clientName?: string;
  description: string;
  collections: string[]; // e.g. ["Hosting & DNS", "Social Accounts", "E-Commerce", "Advertising"]
  collaborators: Collaborator[];
  color: string;
  itemCount: number;
  lastActive: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
  isSecret: boolean;
}

export interface VaultItem {
  id: string;
  workspaceId: string; // 'personal' or client workspace ID
  collection: string; // e.g. 'Hosting', 'Marketing', 'Core', 'Finance'
  title: string;
  category: ItemCategory;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  lastRotatedAt?: string;
  needsRotation?: boolean;

  // Login specific
  url?: string;
  username?: string;
  password?: string;
  mfaEnabled?: boolean;
  mfaSecret?: string;
  passkeySupported?: boolean;

  // Secure Note specific
  noteContent?: string;
  recoveryCodes?: string[];

  // Software Licence specific
  licenceKey?: string;
  softwareName?: string;
  licensedTo?: string;
  seats?: number;
  expiryDate?: string;

  // Identity specific
  idType?: 'passport' | 'drivers_licence' | 'national_id' | 'social_security';
  documentNumber?: string;
  fullName?: string;
  issueDate?: string;
  expiryDateId?: string;
  issuingCountry?: string;

  // Wi-Fi & Infrastructure specific
  ssid?: string;
  wifiPassword?: string;
  securityType?: 'WPA3-Personal' | 'WPA2-Enterprise' | 'WPA2-Personal' | 'WPA';
  routerAdminUrl?: string;
  routerAdminUser?: string;
  routerAdminPass?: string;

  // Bank & Card specific
  cardholderName?: string;
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardBrand?: 'Visa' | 'Mastercard' | 'Amex' | 'Other';
  bankName?: string;
  accountNumber?: string;
  routingNumber?: string;

  // Developer & Secret specific
  secretType?: 'ssh_key' | 'api_token' | 'database_url' | 'env_file';
  secretValue?: string;
  fingerprint?: string;

  // General custom fields
  customFields?: CustomField[];

  // Encrypted attachment simulation
  attachmentName?: string;
  attachmentSizeKb?: number;
}

export interface AuditLog {
  id: string;
  action: 'view' | 'copy' | 'edit' | 'create' | 'delete' | 'rotate' | 'revoke_access' | 'export';
  itemTitle: string;
  itemId?: string;
  userEmail: string;
  timestamp: string;
  ipAddress: string;
  workspaceName: string;
}

export interface SecurityFinding {
  id: string;
  itemId: string;
  itemTitle: string;
  severity: 'critical' | 'high' | 'medium' | 'info';
  type: 'weak_password' | 'reused_password' | 'missing_mfa' | 'compromised' | 'stale_credential' | 'overprivileged_share';
  title: string;
  description: string;
  recommendation: string;
}

export interface VaultLockState {
  isLocked: boolean;
  masterKeyDerived: boolean;
  autoLockMinutes: number;
  lastActivity: number;
  biometricsEnabled: boolean;
  emergencyKitGenerated: boolean;
}
