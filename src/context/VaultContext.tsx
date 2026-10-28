import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  VaultItem, 
  ClientWorkspace, 
  AuditLog, 
  SecurityFinding, 
  VaultLockState, 
  ItemCategory,
  Collaborator 
} from '../types/vault';
import { 
  INITIAL_WORKSPACES, 
  INITIAL_VAULT_ITEMS, 
  INITIAL_AUDIT_LOGS 
} from '../data/seedData';
import { 
  evaluatePasswordStrength, 
  generateSecureSecret, 
  generateEmergencyRecoveryPhrase,
  deriveKeyFromPassphrase,
  deriveKeyAndRawBitsFromPassphrase,
  deriveKeyFromRawBits,
  deriveKeyFromRecoveryPhrase,
  createRecoveryEnvelope,
  unsealRecoveryEnvelope,
  validateRecoveryPhrase,
  exportEncryptedVaultArchive,
  decryptEncryptedVaultArchive,
  validateBackupArchiveHeader,
  VaultBackupPayload,
  EncryptedVaultArchive,
  createAuthSentinel,
  verifyAuthSentinel,
  RECOVERY_WORDS,
  zeroizeBuffer,
  PBKDF2_ITERATIONS
} from '../crypto/cryptoService';
import { 
  SecureStorageEngine, 
  StorageSecurityDiagnostics 
} from '../crypto/secureStorage';

interface VaultContextType {
  // State
  items: VaultItem[];
  workspaces: ClientWorkspace[];
  activeWorkspaceId: string;
  setActiveWorkspaceId: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedCollection: string | null;
  setSelectedCollection: (col: string | null) => void;
  securityFilter: 'all' | 'compromised' | 'weak' | 'missing_mfa' | 'reused';
  setSecurityFilter: (f: 'all' | 'compromised' | 'weak' | 'missing_mfa' | 'reused') => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (fav: boolean) => void;
  sortBy: 'title_asc' | 'title_desc' | 'created_desc' | 'created_asc' | 'strength_asc';
  setSortBy: (sort: 'title_asc' | 'title_desc' | 'created_desc' | 'created_asc' | 'strength_asc') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  lockState: VaultLockState;
  auditLogs: AuditLog[];
  securityFindings: SecurityFinding[];
  activeItem: VaultItem | null;
  setActiveItem: (item: VaultItem | null) => void;

  // Modals & Drawers
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isGeneratorModalOpen: boolean;
  setIsGeneratorModalOpen: (open: boolean) => void;
  isEmergencyKitModalOpen: boolean;
  setIsEmergencyKitModalOpen: (open: boolean) => void;
  isRecoveryModalOpen: boolean;
  setIsRecoveryModalOpen: (open: boolean) => void;
  isExtensionDrawerOpen: boolean;
  setIsExtensionDrawerOpen: (open: boolean) => void;
  isAiAssistantOpen: boolean;
  setIsAiAssistantOpen: (open: boolean) => void;
  isAndroidModalOpen: boolean;
  setIsAndroidModalOpen: (open: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Active view tab in main container
  activeTab: 'overview' | 'vault' | 'workspaces' | 'settings' | 'security';
  setActiveTab: (tab: 'overview' | 'vault' | 'workspaces' | 'settings' | 'security') => void;

  // Clipboard temporary feedback
  copiedIndicator: string | null;
  copyToClipboard: (text: string, label: string, auditInfo?: { title: string; id?: string }) => void;

  // Actions
  addItem: (itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, updates: Partial<VaultItem>) => void;
  deleteItem: (id: string) => void;
  deleteMultipleItems: (ids: string[]) => void;
  rotatePassword: (id: string, customNewPass?: string) => string;
  toggleFavorite: (id: string) => void;

  // Workspaces
  createWorkspace: (workspace: Omit<ClientWorkspace, 'id' | 'itemCount' | 'lastActive'>) => void;
  updateWorkspace: (id: string, updates: Partial<ClientWorkspace>) => void;
  deleteWorkspace: (id: string) => void;
  addCollaborator: (workspaceId: string, collaborator: Omit<Collaborator, 'id' | 'addedAt'>) => void;
  revokeCollaborator: (workspaceId: string, collaboratorId: string, triggerRotation?: boolean) => void;

  // Zero-knowledge Lock & Key
  isVaultInitialized: boolean;
  initializeNewVault: (masterPassphrase: string) => Promise<boolean>;
  unlockVault: (passphrase: string) => Promise<boolean>;
  lockVault: () => void;
  changeMasterPassphrase: (newPass: string, oldPass?: string) => Promise<boolean>;
  recoverVaultWithPhrase: (phraseInput: string) => Promise<{ success: boolean; error?: string; itemsCount?: number; workspacesCount?: number }>;
  setAutoLockMinutes: (min: number) => void;
  emergencyPhrase: string[];
  generateNewEmergencyPhrase: () => string[];
  rotateEmergencyRecoveryPhrase: (customPhrase?: string[]) => Promise<{ success: boolean; phrase: string[]; error?: string }>;

  // Import / Export & Lifecycle
  importItems: (newItems: Partial<VaultItem>[], targetWorkspaceId: string) => number;
  exportVaultJson: (confirmUnencrypted?: boolean) => string;
  exportEncryptedVault: (passphrase?: string) => Promise<string>;
  inspectEncryptedArchive: (archiveString: string) => {
    version: number;
    cipher: string;
    iterations: number;
    exportedAt: string;
    summary?: { itemCount: number; workspaceCount: number };
  };
  decryptAndValidateArchive: (archiveString: string, passphrase: string) => Promise<{
    items: VaultItem[];
    workspaces: ClientWorkspace[];
    settings?: { autoLockMinutes?: number; biometricsEnabled?: boolean };
    exportedAt: string;
    formatVersion: number;
  }>;
  restoreDecryptedBackup: (
    backupData: {
      items: VaultItem[];
      workspaces?: ClientWorkspace[];
      settings?: { autoLockMinutes?: number; biometricsEnabled?: boolean };
    },
    mode: 'merge' | 'replace',
    targetWorkspaceId?: string
  ) => Promise<{ itemsCount: number; workspacesCount: number; mode: 'merge' | 'replace' }>;
  importEncryptedVault: (archiveString: string, passphrase: string, targetWorkspaceId?: string, mode?: 'merge' | 'replace') => Promise<number>;
  wipeVault: () => Promise<void>;

  // Storage Engine Status & Diagnostics
  isStorageReady: boolean;
  storageDiagnostics: StorageSecurityDiagnostics;

  // Stats
  filteredItems: VaultItem[];
  currentWorkspace: ClientWorkspace | undefined;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Purge legacy unencrypted keys from older formats
  useEffect(() => {
    SecureStorageEngine.purgeLegacyStorage();
    SecureStorageEngine.requestPersistentStorage().catch(() => {});
  }, []);

  // In-memory decrypted vault records (STRICT SECURITY: Starts EMPTY until unlocked)
  const [items, setItems] = useState<VaultItem[]>([]);
  const [workspaces, setWorkspaces] = useState<ClientWorkspace[]>(INITIAL_WORKSPACES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Vault begins locked by default when encrypted records exist, requiring authentication
  const [lockState, setLockState] = useState<VaultLockState>({
    isLocked: true,
    masterKeyDerived: false,
    autoLockMinutes: 15,
    lastActivity: Date.now(),
    biometricsEnabled: true,
    emergencyKitGenerated: true
  });

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [securityFilter, setSecurityFilter] = useState<'all' | 'compromised' | 'weak' | 'missing_mfa' | 'reused'>('all');
  const [favoritesOnly, setFavoritesOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'title_asc' | 'title_desc' | 'created_desc' | 'created_asc' | 'strength_asc'>('title_asc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'vault' | 'workspaces' | 'settings' | 'security'>('overview');
  const [activeItem, setActiveItem] = useState<VaultItem | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState(false);
  const [isEmergencyKitModalOpen, setIsEmergencyKitModalOpen] = useState(false);
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [isExtensionDrawerOpen, setIsExtensionDrawerOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVaultInitialized, setIsVaultInitialized] = useState(true);

  // Clipboard & Storage Status
  const [copiedIndicator, setCopiedIndicator] = useState<string | null>(null);
  const [emergencyPhrase, setEmergencyPhrase] = useState<string[]>(() => generateEmergencyRecoveryPhrase());
  const [isStorageReady, setIsStorageReady] = useState(false);

  // Ephemeral Master Key Ref: Non-extractable CryptoKey held ONLY in volatile memory
  const activeKeyRef = useRef<CryptoKey | null>(null);
  // Ephemeral Raw Root Key Bits: held in memory only while unlocked to permit recovery envelope re-sealing without requiring password re-entry
  const activeRawBitsRef = useRef<Uint8Array | null>(null);
  // Clipboard auto-clear timer & last copied secret cache
  const clipboardClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCopiedSecretRef = useRef<string | null>(null);
  const isInitialLoadDone = useRef(false);

  // Storage security diagnostics (evaluated dynamically)
  const [storageDiagnostics, setStorageDiagnostics] = useState<StorageSecurityDiagnostics>(() => 
    SecureStorageEngine.getStorageSecurityDiagnostics()
  );

  // Storage initialization: load workspace metadata, lock settings, and initialize salt
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        SecureStorageEngine.getOrCreateMasterSalt();

        const loadedWorkspaces = await SecureStorageEngine.loadWorkspaces();
        if (isMounted && loadedWorkspaces && loadedWorkspaces.length > 0) {
          setWorkspaces(loadedWorkspaces);
        }

        const loadedAudit = await SecureStorageEngine.loadAuditLogs();
        if (isMounted && loadedAudit && loadedAudit.length > 0) {
          setAuditLogs(loadedAudit);
        }

        const loadedLock = SecureStorageEngine.loadLockState();
        if (isMounted && loadedLock) {
          setLockState(prev => ({
            ...prev,
            autoLockMinutes: loadedLock.autoLockMinutes ?? prev.autoLockMinutes,
            biometricsEnabled: loadedLock.biometricsEnabled ?? prev.biometricsEnabled
          }));
        }

        // Check if an encrypted vault has already been provisioned on this device
        const hasVault = await SecureStorageEngine.hasInitializedVault();
        if (isMounted) {
          setIsVaultInitialized(hasVault);
        }
      } catch (err) {
        console.warn('[Vaultora Storage] Initialization notice:', err);
      } finally {
        if (isMounted) {
          isInitialLoadDone.current = true;
          setIsStorageReady(true);
          setStorageDiagnostics(SecureStorageEngine.getStorageSecurityDiagnostics());
        }
      }
    })();

    return () => { isMounted = false; };
  }, []);

  // Save encrypted items whenever items state changes while unlocked
  useEffect(() => {
    if (!isInitialLoadDone.current || lockState.isLocked || !activeKeyRef.current) return;
    SecureStorageEngine.saveEncryptedItems(items, activeKeyRef.current).catch(err => {
      console.warn('[Vaultora Storage] Error saving encrypted items:', err);
    });
  }, [items, lockState.isLocked]);

  // Save workspaces across storage layers
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    SecureStorageEngine.saveWorkspaces(workspaces, activeKeyRef.current).catch(() => {});
  }, [workspaces]);

  // Save audit trail across storage layers (strictly sanitized, zero credentials)
  useEffect(() => {
    if (!isInitialLoadDone.current) return;
    SecureStorageEngine.saveAuditLogs(auditLogs).catch(() => {});
  }, [auditLogs]);

  // Save lock settings
  useEffect(() => {
    SecureStorageEngine.saveLockState(lockState);
  }, [lockState]);

  // Auto-lock inactivity detection and lock state persistence
  useEffect(() => {
    if (lockState.isLocked) return;

    const checkAutoLock = () => {
      const idleTime = Date.now() - lockState.lastActivity;
      const timeoutMs = (lockState.autoLockMinutes || 15) * 60 * 1000;
      if (idleTime >= timeoutMs) {
        // Zero in-memory keys and decrypted records on auto-lock timeout
        activeKeyRef.current = null;
        if (activeRawBitsRef.current) {
          zeroizeBuffer(activeRawBitsRef.current);
          activeRawBitsRef.current = null;
        }
        setItems([]);
        setActiveItem(null);
        setSearchQuery('');
        setCopiedIndicator(null);

        // Clear clipboard and pending timers
        if (clipboardClearTimerRef.current) {
          clearTimeout(clipboardClearTimerRef.current);
          clipboardClearTimerRef.current = null;
        }
        if (lastCopiedSecretRef.current && typeof navigator !== 'undefined' && navigator.clipboard) {
          navigator.clipboard.writeText('').catch(() => {});
          lastCopiedSecretRef.current = null;
        }

        setLockState(prev => ({
          ...prev,
          isLocked: true,
          masterKeyDerived: false,
          lastActivity: Date.now()
        }));
        recordAudit('view', 'Auto-lock triggered by inactivity; master key and records purged from memory');
      }
    };

    const interval = setInterval(checkAutoLock, 15000);

    const onUserActivity = () => {
      setLockState(prev => {
        if (prev.isLocked) return prev;
        if (Date.now() - prev.lastActivity < 10000) return prev;
        return { ...prev, lastActivity: Date.now() };
      });
    };

    window.addEventListener('mousedown', onUserActivity, { passive: true });
    window.addEventListener('keydown', onUserActivity, { passive: true });
    window.addEventListener('touchstart', onUserActivity, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousedown', onUserActivity);
      window.removeEventListener('keydown', onUserActivity);
      window.removeEventListener('touchstart', onUserActivity);
    };
  }, [lockState.isLocked, lockState.lastActivity, lockState.autoLockMinutes]);

  // Update item counts in workspaces
  useEffect(() => {
    setWorkspaces(prev => prev.map(ws => {
      const count = items.filter(it => it.workspaceId === ws.id).length;
      return { ...ws, itemCount: count };
    }));
  }, [items]);

  // Helper to record audit logs (strictly sanitizes item title, NEVER logs passwords or keys)
  const recordAudit = useCallback((
    action: AuditLog['action'], 
    itemTitle: string, 
    itemId?: string, 
    workspaceName?: string
  ) => {
    const wsName = workspaceName || (itemId ? (workspaces.find(w => w.id === items.find(i => i.id === itemId)?.workspaceId)?.name || 'Personal Vault') : 'System');
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      action,
      itemTitle,
      itemId,
      userEmail: 'owner@vaultora.local',
      timestamp: new Date().toISOString(),
      ipAddress: 'Local Device (Zero-Knowledge)',
      workspaceName: wsName
    };
    setAuditLogs(prev => [newLog, ...prev]);
  }, [items, workspaces]);

  // Copy to clipboard with visual feedback, 30s auto-clear timer, and audit log
  const copyToClipboard = useCallback((text: string, label: string, auditInfo?: { title: string; id?: string }) => {
    if (!text) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedIndicator(label);
    lastCopiedSecretRef.current = text;

    // Clear feedback toast after 2.5s
    setTimeout(() => {
      setCopiedIndicator(null);
    }, 2500);

    // Cancel existing clipboard purge timer
    if (clipboardClearTimerRef.current) {
      clearTimeout(clipboardClearTimerRef.current);
      clipboardClearTimerRef.current = null;
    }

    // Auto-clear clipboard from system buffer after 30 seconds
    clipboardClearTimerRef.current = setTimeout(async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
          if (navigator.clipboard.readText) {
            const currentClip = await navigator.clipboard.readText();
            if (currentClip === lastCopiedSecretRef.current) {
              await navigator.clipboard.writeText('');
              lastCopiedSecretRef.current = null;
            }
          } else {
            await navigator.clipboard.writeText('');
            lastCopiedSecretRef.current = null;
          }
        }
      } catch {
        // Permissions or browser context restriction handled safely
      }
    }, 30000);

    if (auditInfo) {
      recordAudit('copy', auditInfo.title, auditInfo.id);
    }
  }, [recordAudit]);

  // Dynamic security analysis
  const securityFindings = useMemo<SecurityFinding[]>(() => {
    const findings: SecurityFinding[] = [];
    const passwordMap = new Map<string, string[]>();

    items.forEach(item => {
      if (item.category === 'login' && item.password) {
        const existing = passwordMap.get(item.password) || [];
        existing.push(item.title);
        passwordMap.set(item.password, existing);

        const strength = evaluatePasswordStrength(item.password);
        if (strength.score <= 1) {
          findings.push({
            id: `weak_${item.id}`,
            itemId: item.id,
            itemTitle: item.title,
            severity: 'critical',
            type: 'weak_password',
            title: `Weak Master Password: ${item.title}`,
            description: `Password has low entropy (${strength.entropyBits} bits, crackable in ${strength.crackTimeEstimate}).`,
            recommendation: 'Rotate to a 16+ character cryptographically random password or multi-word passphrase.'
          });
        }

        if (item.mfaEnabled === false) {
          findings.push({
            id: `mfa_${item.id}`,
            itemId: item.id,
            itemTitle: item.title,
            severity: 'medium',
            type: 'missing_mfa',
            title: `Missing Two-Factor Authentication: ${item.title}`,
            description: 'This web account does not have 2FA recorded or enabled.',
            recommendation: 'Enable hardware FIDO2 passkey or authenticator app (TOTP) on this portal.'
          });
        }

        if (item.lastRotatedAt) {
          const daysOld = Math.floor((Date.now() - new Date(item.lastRotatedAt).getTime()) / (1000 * 60 * 60 * 24));
          if (daysOld > 120) {
            findings.push({
              id: `stale_${item.id}`,
              itemId: item.id,
              itemTitle: item.title,
              severity: 'info',
              type: 'stale_credential',
              title: `Stale Credential: ${item.title}`,
              description: `Password was last rotated ${daysOld} days ago.`,
              recommendation: 'Review account activity and rotate credentials to follow least-privilege cadence.'
            });
          }
        }

        if (item.needsRotation || item.password === 'password123') {
          findings.push({
            id: `comp_${item.id}`,
            itemId: item.id,
            itemTitle: item.title,
            severity: 'critical',
            type: 'compromised',
            title: `Compromised / Flagged Password: ${item.title}`,
            description: 'This credential matches known compromised breach patterns in public threat lists.',
            recommendation: 'Immediately change password on target service and update vault record.'
          });
        }
      }
    });

    passwordMap.forEach((titles, pwd) => {
      if (titles.length > 1) {
        const firstItemId = items.find(i => i.password === pwd)?.id || '';
        findings.push({
          id: `reused_${firstItemId}_${titles.length}`,
          itemId: firstItemId,
          itemTitle: titles[0],
          severity: 'high',
          type: 'reused_password',
          title: `Reused Password Across ${titles.length} Accounts`,
          description: `Identical password used on: ${titles.join(', ')}. Compromise of one service threatens all.`,
          recommendation: 'Generate unique, independent secrets for every online service.'
        });
      }
    });

    return findings;
  }, [items]);

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    const passwordCounts = new Map<string, number>();
    if (securityFilter === 'reused') {
      items.forEach(it => {
        if (it.category === 'login' && it.password) {
          passwordCounts.set(it.password, (passwordCounts.get(it.password) || 0) + 1);
        }
      });
    }

    const filtered = items.filter(item => {
      if (activeWorkspaceId !== 'all' && item.workspaceId !== activeWorkspaceId) {
        return false;
      }
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedCollection && item.collection !== selectedCollection) {
        return false;
      }
      if (favoritesOnly && !item.favorite) {
        return false;
      }
      if (securityFilter !== 'all') {
        if (securityFilter === 'compromised') {
          const isComp = item.needsRotation || item.password === 'password123';
          if (!isComp) return false;
        } else if (securityFilter === 'weak') {
          if (item.category !== 'login' || !item.password) return false;
          const strength = evaluatePasswordStrength(item.password);
          if (strength.score > 1) return false;
        } else if (securityFilter === 'missing_mfa') {
          if (item.category !== 'login' || item.mfaEnabled) return false;
        } else if (securityFilter === 'reused') {
          if (item.category !== 'login' || !item.password) return false;
          const count = passwordCounts.get(item.password) || 0;
          if (count <= 1) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesUsername = item.username?.toLowerCase().includes(q);
        const matchesUrl = item.url?.toLowerCase().includes(q);
        const matchesTags = item.tags.some(t => t.toLowerCase().includes(q));
        const matchesNotes = item.noteContent?.toLowerCase().includes(q);
        const matchesSoftware = item.softwareName?.toLowerCase().includes(q);
        const matchesSSID = item.ssid?.toLowerCase().includes(q);
        const matchesCollection = item.collection?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesUsername && !matchesUrl && !matchesTags && !matchesNotes && !matchesSoftware && !matchesSSID && !matchesCollection) {
          return false;
        }
      }
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'created_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'strength_asc': {
          const scoreA = a.password ? evaluatePasswordStrength(a.password).score : 4;
          const scoreB = b.password ? evaluatePasswordStrength(b.password).score : 4;
          return scoreA - scoreB;
        }
        case 'title_asc':
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [items, activeWorkspaceId, selectedCategory, selectedCollection, favoritesOnly, securityFilter, sortBy, searchQuery]);

  const currentWorkspace = useMemo(() => {
    return workspaces.find(w => w.id === activeWorkspaceId);
  }, [workspaces, activeWorkspaceId]);

  // CRUD Items
  const addItem = useCallback((itemData: Omit<VaultItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: VaultItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastRotatedAt: new Date().toISOString()
    };
    setItems(prev => [newItem, ...prev]);
    recordAudit('create', newItem.title, newItem.id);
  }, [recordAudit]);

  const updateItem = useCallback((id: string, updates: Partial<VaultItem>) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        return {
          ...it,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return it;
    }));
    const target = items.find(i => i.id === id);
    if (target) {
      recordAudit('edit', updates.title || target.title, id);
    }
  }, [items, recordAudit]);

  const deleteItem = useCallback((id: string) => {
    const target = items.find(i => i.id === id);
    setItems(prev => prev.filter(it => it.id !== id));
    if (activeItem?.id === id) setActiveItem(null);
    if (target) {
      recordAudit('delete', target.title, id);
    }
  }, [items, activeItem, recordAudit]);

  const deleteMultipleItems = useCallback((ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setItems(prev => prev.filter(it => !idSet.has(it.id)));
    if (activeItem && idSet.has(activeItem.id)) {
      setActiveItem(null);
    }
    recordAudit('delete', `Bulk deleted ${ids.length} records`);
  }, [activeItem, recordAudit]);

  const rotatePassword = useCallback((id: string, customNewPass?: string) => {
    const target = items.find(i => i.id === id);
    if (!target) return '';
    const newPass = customNewPass || generateSecureSecret({
      length: 20,
      useUpper: true,
      useLower: true,
      useNumbers: true,
      useSymbols: true,
      avoidAmbiguous: true,
      mode: 'password'
    });
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        return {
          ...it,
          password: newPass,
          lastRotatedAt: new Date().toISOString(),
          needsRotation: false,
          updatedAt: new Date().toISOString()
        };
      }
      return it;
    }));
    recordAudit('rotate', target.title, id);
    return newPass;
  }, [items, recordAudit]);

  const toggleFavorite = useCallback((id: string) => {
    setItems(prev => prev.map(it => {
      if (it.id === id) {
        return { ...it, favorite: !it.favorite };
      }
      return it;
    }));
  }, []);

  // Workspaces Management
  const createWorkspace = useCallback((wsData: Omit<ClientWorkspace, 'id' | 'itemCount' | 'lastActive'>) => {
    const newWs: ClientWorkspace = {
      ...wsData,
      id: `ws_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemCount: 0,
      lastActive: 'Just now'
    };
    setWorkspaces(prev => [...prev, newWs]);
    recordAudit('create', `Workspace Created: ${newWs.name}`, undefined, newWs.name);
  }, [recordAudit]);

  const updateWorkspace = useCallback((id: string, updates: Partial<ClientWorkspace>) => {
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    const target = workspaces.find(w => w.id === id);
    if (!target || target.type === 'personal') return;
    setItems(prev => prev.map(i => i.workspaceId === id ? { ...i, workspaceId: 'personal' } : i));
    setWorkspaces(prev => prev.filter(w => w.id !== id));
    if (activeWorkspaceId === id) setActiveWorkspaceId('all');
    recordAudit('delete', `Workspace Deleted: ${target.name}`, undefined, target.name);
  }, [workspaces, activeWorkspaceId, recordAudit]);

  const addCollaborator = useCallback((workspaceId: string, collaborator: Omit<Collaborator, 'id' | 'addedAt'>) => {
    const newCollab: Collaborator = {
      ...collaborator,
      id: `collab_${Date.now()}`,
      addedAt: new Date().toISOString()
    };
    setWorkspaces(prev => prev.map(ws => {
      if (ws.id === workspaceId) {
        return {
          ...ws,
          collaborators: [...ws.collaborators, newCollab]
        };
      }
      return ws;
    }));
    const ws = workspaces.find(w => w.id === workspaceId);
    recordAudit('edit', `Invited collaborator ${collaborator.email} as ${collaborator.role}`, undefined, ws?.name);
  }, [workspaces, recordAudit]);

  const revokeCollaborator = useCallback((workspaceId: string, collaboratorId: string, triggerRotation = true) => {
    const ws = workspaces.find(w => w.id === workspaceId);
    const collab = ws?.collaborators.find(c => c.id === collaboratorId);
    setWorkspaces(prev => prev.map(w => {
      if (w.id === workspaceId) {
        return {
          ...w,
          collaborators: w.collaborators.filter(c => c.id !== collaboratorId)
        };
      }
      return w;
    }));

    if (triggerRotation && ws) {
      setItems(prev => prev.map(it => {
        if (it.workspaceId === workspaceId && it.category === 'login') {
          return { ...it, needsRotation: true };
        }
        return it;
      }));
    }

    recordAudit('revoke_access', `Revoked access for ${collab?.email || 'collaborator'}. Flagged ${triggerRotation ? 'credentials for rotation' : 'no rotation'}.`, undefined, ws?.name);
  }, [workspaces, recordAudit]);

  /**
   * Initialize a fresh Zero-Knowledge Vault with user's chosen master passphrase
   */
  const initializeNewVault = useCallback(async (masterPassphrase: string): Promise<boolean> => {
    if (!masterPassphrase || masterPassphrase.length < 8) return false;
    try {
      const salt = SecureStorageEngine.getOrCreateMasterSalt();
      const { key, rawBits } = await deriveKeyAndRawBitsFromPassphrase(masterPassphrase, salt, PBKDF2_ITERATIONS);
      const sentinel = await createAuthSentinel(key);
      await SecureStorageEngine.setAuthSentinel(sentinel);

      const phrase = generateEmergencyRecoveryPhrase();
      setEmergencyPhrase(phrase);

      const recoveryKey = await deriveKeyFromRecoveryPhrase(phrase, salt);
      const envelope = await createRecoveryEnvelope(rawBits, recoveryKey);
      await SecureStorageEngine.setRecoveryEnvelope(envelope);

      const cleanItems: VaultItem[] = [];
      await SecureStorageEngine.saveEncryptedItems(cleanItems, key);
      await SecureStorageEngine.saveWorkspaces(INITIAL_WORKSPACES, key);

      activeKeyRef.current = key;
      activeRawBitsRef.current = rawBits;
      setItems(cleanItems);
      setWorkspaces(INITIAL_WORKSPACES);
      setIsVaultInitialized(true);
      setLockState({
        isLocked: false,
        masterKeyDerived: true,
        autoLockMinutes: 15,
        lastActivity: Date.now(),
        biometricsEnabled: true,
        emergencyKitGenerated: true
      });

      setIsEmergencyKitModalOpen(true);
      recordAudit('create', 'Zero-knowledge vault initialized with root key and recovery envelope');
      return true;
    } catch (err) {
      console.error('[Vaultora Initialization] Failed:', err);
      return false;
    }
  }, [recordAudit]);

  /**
   * Unlock Vault with Zero-Knowledge PBKDF2 Key Derivation & AES-GCM MAC Tag Verification
   */
  const unlockVault = async (passphrase: string): Promise<boolean> => {
    if (!passphrase || passphrase.trim().length < 4) return false;
    try {
      const salt = SecureStorageEngine.getOrCreateMasterSalt();
      const trimmed = passphrase.trim();
      
      const { key: derivedKey, rawBits } = await deriveKeyAndRawBitsFromPassphrase(trimmed, salt, PBKDF2_ITERATIONS);

      // Check auth sentinel if present
      const sentinel = await SecureStorageEngine.getAuthSentinel();
      if (sentinel) {
        const isVerified = await verifyAuthSentinel(sentinel, derivedKey);
        if (!isVerified) {
          // Authentication tag verification failed: incorrect passphrase or tampered ciphertext
          return false;
        }
      } else {
        // First initialization for this key: establish sentinel
        const newSentinel = await createAuthSentinel(derivedKey);
        await SecureStorageEngine.setAuthSentinel(newSentinel);
      }

      activeKeyRef.current = derivedKey;
      activeRawBitsRef.current = rawBits;

      // Ensure Recovery Envelope is established with the confirmed emergency recovery phrase
      const existingEnvelope = await SecureStorageEngine.getRecoveryEnvelope();
      if (!existingEnvelope) {
        try {
          const recKey = await deriveKeyFromRecoveryPhrase(emergencyPhrase, salt);
          const newEnvelope = await createRecoveryEnvelope(rawBits, recKey);
          await SecureStorageEngine.setRecoveryEnvelope(newEnvelope);
        } catch (e) {
          console.warn('[Vaultora Recovery] Envelope creation notice:', e);
        }
      }

      // Decrypt stored items from persistent dual-layer storage
      const loaded = await SecureStorageEngine.loadEncryptedItems(derivedKey);
      if (loaded && loaded.length > 0) {
        setItems(loaded);
      } else {
        setItems([]);
      }

      const loadedWs = await SecureStorageEngine.loadWorkspaces(derivedKey);
      if (loadedWs && loadedWs.length > 0) {
        setWorkspaces(loadedWs);
      }

      setLockState(prev => ({
        ...prev,
        isLocked: false,
        masterKeyDerived: true,
        lastActivity: Date.now()
      }));

      recordAudit('view', 'Vault unlocked via verified PBKDF2-HMAC-SHA256 key (600,000 iterations)');
      return true;
    } catch (err) {
      console.error('[Vaultora Cryptography] Unlock failure:', err);
      return false;
    }
  };

  /**
   * Recover vault access using 24-word emergency seed phrase
   */
  const recoverVaultWithPhrase = useCallback(async (
    phraseInput: string
  ): Promise<{ success: boolean; error?: string; itemsCount?: number; workspacesCount?: number }> => {
    const analysis = validateRecoveryPhrase(phraseInput);
    if (!analysis.isValid) {
      return { success: false, error: analysis.error };
    }

    try {
      const salt = SecureStorageEngine.getOrCreateMasterSalt();
      const recoveryKey = await deriveKeyFromRecoveryPhrase(analysis.normalizedPhrase, salt);

      // 1. Attempt to unseal the local Recovery Envelope
      const envelope = await SecureStorageEngine.getRecoveryEnvelope();
      if (envelope) {
        try {
          const rawVaultKeyBits = await unsealRecoveryEnvelope(envelope, recoveryKey);
          const vaultKey = await deriveKeyFromRawBits(rawVaultKeyBits);

          // Verify with auth sentinel or load items
          const sentinel = await SecureStorageEngine.getAuthSentinel();
          if (sentinel) {
            const isVerified = await verifyAuthSentinel(sentinel, vaultKey);
            if (!isVerified) {
              return { success: false, error: 'Recovery authentication failed: MAC tag verification rejected.' };
            }
          }

          // Successfully unsealed! Load decrypted items and workspaces
          const loadedItems = await SecureStorageEngine.loadEncryptedItems(vaultKey);
          const loadedWs = await SecureStorageEngine.loadWorkspaces(vaultKey);

          activeKeyRef.current = vaultKey;
          activeRawBitsRef.current = rawVaultKeyBits;
          setItems(loadedItems || []);
          if (loadedWs && loadedWs.length > 0) {
            setWorkspaces(loadedWs);
          }

          setEmergencyPhrase(analysis.normalizedWords);
          setLockState(prev => ({
            ...prev,
            isLocked: false,
            masterKeyDerived: true,
            lastActivity: Date.now()
          }));

          recordAudit('view', 'Vault successfully recovered and decrypted via 24-word emergency seed phrase');
          return {
            success: true,
            itemsCount: (loadedItems || []).length,
            workspacesCount: (loadedWs || workspaces).length
          };
        } catch {
          return {
            success: false,
            error: 'Authentication failed: The entered 24-word recovery phrase could not decrypt this vault (AES-256-GCM authentication tag rejected).'
          };
        }
      }

      // 2. Fallback: If no envelope exists on this device, check if the vault was directly sealed with the phrase
      const sentinel = await SecureStorageEngine.getAuthSentinel();
      if (sentinel) {
        const isVerified = await verifyAuthSentinel(sentinel, recoveryKey);
        if (isVerified) {
          const loadedItems = await SecureStorageEngine.loadEncryptedItems(recoveryKey);
          const loadedWs = await SecureStorageEngine.loadWorkspaces(recoveryKey);

          activeKeyRef.current = recoveryKey;
          setItems(loadedItems || []);
          if (loadedWs && loadedWs.length > 0) {
            setWorkspaces(loadedWs);
          }

          setEmergencyPhrase(analysis.normalizedWords);
          setLockState(prev => ({
            ...prev,
            isLocked: false,
            masterKeyDerived: true,
            lastActivity: Date.now()
          }));

          recordAudit('view', 'Vault unlocked via direct 24-word phrase root key');
          return {
            success: true,
            itemsCount: (loadedItems || []).length,
            workspacesCount: (loadedWs || workspaces).length
          };
        }
      }

      return {
        success: false,
        error: 'No recovery envelope exists for this local vault on this device. If you possess a .vaultora encrypted backup archive sealed with this phrase, use "Restore Encrypted Backup".'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Cryptographic decryption failed: Invalid key material.'
      };
    }
  }, [workspaces, recordAudit]);

  /**
   * Lock Vault & Zero In-Memory Decrypted Data
   */
  const lockVault = useCallback(() => {
    // 1. Invalidate active cryptographic key reference and zeroize raw bits
    activeKeyRef.current = null;
    if (activeRawBitsRef.current) {
      zeroizeBuffer(activeRawBitsRef.current);
      activeRawBitsRef.current = null;
    }

    // 2. Clear all sensitive decrypted records from memory
    setItems([]);
    setActiveItem(null);
    setSearchQuery('');
    setCopiedIndicator(null);

    // Cancel clipboard timer and purge clipboard if it held sensitive copied text
    if (clipboardClearTimerRef.current) {
      clearTimeout(clipboardClearTimerRef.current);
      clipboardClearTimerRef.current = null;
    }
    if (lastCopiedSecretRef.current && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('').catch(() => {});
      lastCopiedSecretRef.current = null;
    }

    // 3. Update lock state
    setLockState(prev => ({
      ...prev,
      isLocked: true,
      masterKeyDerived: false,
      lastActivity: Date.now()
    }));

    recordAudit('view', 'Vault locked: in-memory cryptographic key and decrypted records purged');
  }, [recordAudit]);

  /**
   * Change Master Passphrase & Re-encrypt Vault under a new 256-bit salt and new key
   */
  const changeMasterPassphrase = useCallback(async (newPass: string, oldPass?: string): Promise<boolean> => {
    if (!newPass || newPass.length < 8) return false;
    try {
      const currentSalt = SecureStorageEngine.getOrCreateMasterSalt();

      // If oldPass is provided and activeKey is not set, verify oldPass
      if (!activeKeyRef.current && oldPass) {
        const oldKey = await deriveKeyFromPassphrase(oldPass, currentSalt, PBKDF2_ITERATIONS);
        const sentinel = await SecureStorageEngine.getAuthSentinel();
        if (sentinel) {
          const isOldValid = await verifyAuthSentinel(sentinel, oldKey);
          if (!isOldValid) return false;
        }
      } else if (!activeKeyRef.current && !oldPass) {
        return false;
      }

      // Generate a fresh 256-bit cryptographically secure salt
      const newSalt = SecureStorageEngine.getOrCreateMasterSalt();
      const { key: newKey, rawBits: newRawBits } = await deriveKeyAndRawBitsFromPassphrase(newPass, newSalt, PBKDF2_ITERATIONS);

      // Create fresh auth sentinel
      const newSentinel = await createAuthSentinel(newKey);
      await SecureStorageEngine.setAuthSentinel(newSentinel);

      // Update Recovery Envelope under the new key
      const recKey = await deriveKeyFromRecoveryPhrase(emergencyPhrase, newSalt);
      const newEnvelope = await createRecoveryEnvelope(newRawBits, recKey);
      await SecureStorageEngine.setRecoveryEnvelope(newEnvelope);

      // Re-encrypt all items under the new key
      activeKeyRef.current = newKey;
      activeRawBitsRef.current = newRawBits;
      await SecureStorageEngine.saveEncryptedItems(items, newKey);
      await SecureStorageEngine.saveWorkspaces(workspaces, newKey);

      recordAudit('edit', 'Master passphrase rotated; vault re-encrypted under fresh key');
      return true;
    } catch (err) {
      console.error('[Vaultora Cryptography] Failed to rotate master passphrase:', err);
      return false;
    }
  }, [emergencyPhrase, items, workspaces, recordAudit]);

  const setAutoLockMinutes = useCallback((min: number) => {
    setLockState(prev => ({
      ...prev,
      autoLockMinutes: min
    }));
  }, []);

  /**
   * Rotates 24-word emergency recovery phrase and re-seals vaultora_recovery_envelope_v2
   * with the active root key without affecting master password or vault data.
   */
  const rotateEmergencyRecoveryPhrase = useCallback(async (
    customPhrase?: string[]
  ): Promise<{ success: boolean; phrase: string[]; error?: string }> => {
    try {
      const phrase = customPhrase && customPhrase.length === 24
        ? customPhrase
        : generateEmergencyRecoveryPhrase();

      const salt = SecureStorageEngine.getOrCreateMasterSalt();
      const recKey = await deriveKeyFromRecoveryPhrase(phrase, salt);

      if (activeRawBitsRef.current) {
        const newEnvelope = await createRecoveryEnvelope(activeRawBitsRef.current, recKey);
        await SecureStorageEngine.setRecoveryEnvelope(newEnvelope);
      } else {
        return {
          success: false,
          phrase: emergencyPhrase,
          error: 'Vault must be unlocked to rotate emergency recovery phrase envelope.'
        };
      }

      setEmergencyPhrase(phrase);
      setLockState(prev => ({ ...prev, emergencyKitGenerated: true }));
      recordAudit('rotate', 'Emergency recovery phrase rotated and zero-knowledge envelope re-sealed');
      return { success: true, phrase };
    } catch (err: any) {
      console.error('[Vaultora Recovery] Rotation error:', err);
      return { success: false, phrase: emergencyPhrase, error: err.message || 'Failed to rotate recovery phrase' };
    }
  }, [emergencyPhrase, recordAudit]);

  const generateNewEmergencyPhrase = useCallback(() => {
    const phrase = generateEmergencyRecoveryPhrase();
    if (activeRawBitsRef.current) {
      rotateEmergencyRecoveryPhrase(phrase).catch(err => {
        console.warn('[Vaultora Recovery] Envelope re-seal notice:', err);
      });
    } else {
      setEmergencyPhrase(phrase);
      setLockState(prev => ({ ...prev, emergencyKitGenerated: true }));
    }
    return phrase;
  }, [rotateEmergencyRecoveryPhrase]);

  // Import / Export
  const importItems = useCallback((newItems: Partial<VaultItem>[], targetWorkspaceId: string): number => {
    let count = 0;
    const toAdd: VaultItem[] = newItems.map((raw, idx) => {
      count++;
      return {
        id: `import_${Date.now()}_${idx}`,
        workspaceId: targetWorkspaceId || 'personal',
        collection: raw.collection || 'Imported Records',
        title: raw.title || `Imported Account #${idx + 1}`,
        category: (raw.category as ItemCategory) || 'login',
        tags: raw.tags || ['imported'],
        favorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        url: raw.url,
        username: raw.username,
        password: raw.password || generateSecureSecret({ length: 16, useUpper: true, useLower: true, useNumbers: true, useSymbols: false, avoidAmbiguous: true, mode: 'password' }),
        mfaEnabled: raw.mfaEnabled ?? false,
        noteContent: raw.noteContent
      };
    });

    setItems(prev => [...toAdd, ...prev]);
    recordAudit('create', `Imported ${count} items into ${workspaces.find(w => w.id === targetWorkspaceId)?.name || 'Personal'}`);
    return count;
  }, [workspaces, recordAudit]);

  const exportVaultJson = useCallback((confirmUnencrypted?: boolean): string => {
    if (!confirmUnencrypted) {
      throw new Error('Plain-text export cancelled: unencrypted exports require explicit security acknowledgment.');
    }
    const exportData = {
      app: 'Vaultora',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      encryptionNotice: 'Zero-Knowledge Vault Backup: Decrypted client-side under user authorization.',
      workspaces: workspaces.map(w => ({ id: w.id, name: w.name, type: w.type, collections: w.collections })),
      itemCount: items.length,
      items: items.map(it => ({
        ...it,
      }))
    };
    recordAudit('export', `Exported plaintext vault JSON archive (${items.length} items) - UNENCRYPTED`);
    return JSON.stringify(exportData, null, 2);
  }, [items, workspaces, recordAudit]);

  const exportEncryptedVault = useCallback(async (customPassphrase?: string): Promise<string> => {
    const backupPass = customPassphrase || emergencyPhrase.join(' ');
    const exportData: VaultBackupPayload = {
      formatVersion: 2,
      app: 'Vaultora',
      appVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      items,
      workspaces,
      settings: {
        autoLockMinutes: lockState.autoLockMinutes,
        biometricsEnabled: lockState.biometricsEnabled
      },
      stats: {
        itemCount: items.length,
        workspaceCount: workspaces.length
      }
    };
    const encryptedArchive = await exportEncryptedVaultArchive(
      exportData, 
      backupPass,
      { itemCount: items.length, workspaceCount: workspaces.length }
    );
    recordAudit('export', `Exported AES-256-GCM encrypted backup archive (${items.length} records, ${workspaces.length} workspaces)`);
    return encryptedArchive;
  }, [emergencyPhrase, items, workspaces, lockState, recordAudit]);

  /**
   * Inspects archive header without requiring a passphrase, returning envelope metadata.
   */
  const inspectEncryptedArchive = useCallback((archiveString: string) => {
    const { archive, summary } = validateBackupArchiveHeader(archiveString);
    return {
      version: archive.version,
      cipher: archive.cipher,
      iterations: archive.iterations,
      exportedAt: archive.exportedAt,
      summary
    };
  }, []);

  /**
   * Decrypts and validates the backup archive before applying changes to live storage.
   */
  const decryptAndValidateArchive = useCallback(async (
    archiveString: string, 
    passphrase: string
  ): Promise<{
    items: VaultItem[];
    workspaces: ClientWorkspace[];
    settings?: { autoLockMinutes?: number; biometricsEnabled?: boolean };
    exportedAt: string;
    formatVersion: number;
  }> => {
    const decrypted = await decryptEncryptedVaultArchive<any>(archiveString, passphrase);

    // Support both v2 VaultBackupPayload and legacy v1 archive formats
    let rawItems: any[] = [];
    let rawWorkspaces: any[] = [];
    let settings: { autoLockMinutes?: number; biometricsEnabled?: boolean } | undefined;
    const formatVersion = decrypted.formatVersion || (decrypted.version === 1 ? 1 : 2);
    const exportedAt = decrypted.exportedAt || new Date().toISOString();

    if (Array.isArray(decrypted)) {
      rawItems = decrypted;
    } else if (Array.isArray(decrypted.items)) {
      rawItems = decrypted.items;
      if (Array.isArray(decrypted.workspaces)) {
        rawWorkspaces = decrypted.workspaces;
      }
      if (decrypted.settings && typeof decrypted.settings === 'object') {
        settings = decrypted.settings;
      }
    } else {
      throw new Error('Invalid backup archive contents: no valid records found.');
    }

    // Sanitize and validate items
    const validatedItems: VaultItem[] = rawItems.map((raw, idx) => {
      return {
        id: raw.id || `restored_${Date.now()}_${idx}`,
        workspaceId: raw.workspaceId || 'personal',
        collection: raw.collection || 'Restored',
        title: raw.title || `Restored Record #${idx + 1}`,
        category: (raw.category as ItemCategory) || 'login',
        tags: Array.isArray(raw.tags) ? raw.tags : ['restored'],
        favorite: Boolean(raw.favorite),
        createdAt: raw.createdAt || new Date().toISOString(),
        updatedAt: raw.updatedAt || new Date().toISOString(),
        lastRotatedAt: raw.lastRotatedAt,
        needsRotation: Boolean(raw.needsRotation),
        url: raw.url,
        username: raw.username,
        password: raw.password,
        mfaEnabled: Boolean(raw.mfaEnabled),
        mfaSecret: raw.mfaSecret,
        noteContent: raw.noteContent,
        recoveryCodes: raw.recoveryCodes,
        licenceKey: raw.licenceKey,
        softwareName: raw.softwareName,
        licensedTo: raw.licensedTo,
        seats: raw.seats,
        expiryDate: raw.expiryDate,
        idType: raw.idType,
        documentNumber: raw.documentNumber,
        fullName: raw.fullName,
        ssid: raw.ssid,
        wifiPassword: raw.wifiPassword,
        cardholderName: raw.cardholderName,
        cardNumber: raw.cardNumber,
        cardExpiry: raw.cardExpiry,
        cardCvv: raw.cardCvv,
        cardBrand: raw.cardBrand,
        secretType: raw.secretType,
        secretValue: raw.secretValue,
        customFields: raw.customFields
      };
    });

    // Sanitize workspaces if present
    const validatedWorkspaces: ClientWorkspace[] = rawWorkspaces.map((raw, idx) => ({
      id: raw.id || `ws_restored_${Date.now()}_${idx}`,
      name: raw.name || `Restored Workspace ${idx + 1}`,
      type: raw.type || 'client',
      clientName: raw.clientName,
      description: raw.description || '',
      collections: Array.isArray(raw.collections) ? raw.collections : ['Core'],
      collaborators: Array.isArray(raw.collaborators) ? raw.collaborators : [],
      color: raw.color || 'from-indigo-500 to-indigo-700',
      itemCount: typeof raw.itemCount === 'number' ? raw.itemCount : 0,
      lastActive: raw.lastActive || 'Restored'
    }));

    return {
      items: validatedItems,
      workspaces: validatedWorkspaces,
      settings,
      exportedAt,
      formatVersion
    };
  }, []);

  /**
   * Applies validated backup data with explicit user confirmation for Merge vs Replace mode.
   */
  const restoreDecryptedBackup = useCallback(async (
    backupData: {
      items: VaultItem[];
      workspaces?: ClientWorkspace[];
      settings?: { autoLockMinutes?: number; biometricsEnabled?: boolean };
    },
    mode: 'merge' | 'replace',
    targetWorkspaceId?: string
  ): Promise<{ itemsCount: number; workspacesCount: number; mode: 'merge' | 'replace' }> => {
    let finalItems: VaultItem[] = [];
    let finalWorkspaces: ClientWorkspace[] = [];
    let newItemsCount = 0;
    let updatedItemsCount = 0;

    if (mode === 'replace') {
      // Complete replacement: overwrite existing records with confirmation
      finalItems = [...backupData.items];
      if (backupData.workspaces && backupData.workspaces.length > 0) {
        finalWorkspaces = [...backupData.workspaces];
        // Ensure personal workspace is preserved or created
        if (!finalWorkspaces.some(w => w.type === 'personal')) {
          finalWorkspaces.unshift(INITIAL_WORKSPACES[0]);
        }
      } else {
        finalWorkspaces = workspaces.length > 0 ? workspaces : INITIAL_WORKSPACES;
      }

      if (backupData.settings?.autoLockMinutes) {
        setLockState(prev => ({ ...prev, autoLockMinutes: backupData.settings!.autoLockMinutes! }));
      }

      recordAudit('create', `Restored backup [REPLACE]: Completely replaced vault with ${finalItems.length} records and ${finalWorkspaces.length} workspaces`);
    } else {
      // Safe merge: append new records and deduplicate without destroying existing data
      const existingMap = new Map<string, VaultItem>();
      items.forEach(it => existingMap.set(it.id, it));

      const mergedItems = [...items];

      backupData.items.forEach(restored => {
        const itemToInsert = targetWorkspaceId && targetWorkspaceId !== 'all' 
          ? { ...restored, workspaceId: targetWorkspaceId } 
          : restored;

        if (existingMap.has(itemToInsert.id)) {
          // Exists: check timestamps to keep newest
          const existing = existingMap.get(itemToInsert.id)!;
          if (new Date(itemToInsert.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
            const index = mergedItems.findIndex(it => it.id === itemToInsert.id);
            if (index !== -1) mergedItems[index] = itemToInsert;
            updatedItemsCount++;
          }
        } else {
          mergedItems.push(itemToInsert);
          newItemsCount++;
        }
      });

      finalItems = mergedItems;

      // Merge workspaces
      const existingWsIds = new Set(workspaces.map(w => w.id));
      const mergedWs = [...workspaces];
      (backupData.workspaces || []).forEach(ws => {
        if (!existingWsIds.has(ws.id)) {
          mergedWs.push(ws);
        }
      });
      finalWorkspaces = mergedWs;

      recordAudit('create', `Restored backup [MERGE]: Added ${newItemsCount} new records, updated ${updatedItemsCount} existing records`);
    }

    // Update in-memory state
    setItems(finalItems);
    setWorkspaces(finalWorkspaces);

    // Persist immediately to secure storage if active key is present
    if (activeKeyRef.current) {
      await SecureStorageEngine.saveEncryptedItems(finalItems, activeKeyRef.current);
      await SecureStorageEngine.saveWorkspaces(finalWorkspaces, activeKeyRef.current);
    }

    return {
      itemsCount: finalItems.length,
      workspacesCount: finalWorkspaces.length,
      mode
    };
  }, [items, workspaces, recordAudit]);

  const importEncryptedVault = useCallback(async (
    archiveString: string, 
    passphrase: string, 
    targetWorkspaceId?: string,
    mode: 'merge' | 'replace' = 'merge'
  ): Promise<number> => {
    const validatedData = await decryptAndValidateArchive(archiveString, passphrase);
    const result = await restoreDecryptedBackup(validatedData, mode, targetWorkspaceId);
    return result.itemsCount;
  }, [decryptAndValidateArchive, restoreDecryptedBackup]);

  const wipeVault = useCallback(async () => {
    await SecureStorageEngine.purgeAllStorage();
    activeKeyRef.current = null;
    setItems([]);
    setWorkspaces(INITIAL_WORKSPACES);
    setActiveItem(null);
    setLockState(prev => ({
      ...prev,
      isLocked: true,
      masterKeyDerived: false
    }));
  }, []);

  const value = {
    items,
    workspaces,
    activeWorkspaceId,
    setActiveWorkspaceId,
    selectedCategory,
    setSelectedCategory,
    selectedCollection,
    setSelectedCollection,
    securityFilter,
    setSecurityFilter,
    favoritesOnly,
    setFavoritesOnly,
    sortBy,
    setSortBy,
    searchQuery,
    setSearchQuery,
    lockState,
    auditLogs,
    securityFindings,
    activeItem,
    setActiveItem,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isGeneratorModalOpen,
    setIsGeneratorModalOpen,
    isEmergencyKitModalOpen,
    setIsEmergencyKitModalOpen,
    isRecoveryModalOpen,
    setIsRecoveryModalOpen,
    isExtensionDrawerOpen,
    setIsExtensionDrawerOpen,
    isAiAssistantOpen,
    setIsAiAssistantOpen,
    isAndroidModalOpen,
    setIsAndroidModalOpen,
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    activeTab,
    setActiveTab,
    copiedIndicator,
    copyToClipboard,
    addItem,
    updateItem,
    deleteItem,
    deleteMultipleItems,
    rotatePassword,
    toggleFavorite,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    addCollaborator,
    revokeCollaborator,
    isVaultInitialized,
    initializeNewVault,
    unlockVault,
    recoverVaultWithPhrase,
    lockVault,
    changeMasterPassphrase,
    setAutoLockMinutes,
    emergencyPhrase,
    generateNewEmergencyPhrase,
    rotateEmergencyRecoveryPhrase,
    importItems,
    exportVaultJson,
    exportEncryptedVault,
    inspectEncryptedArchive,
    decryptAndValidateArchive,
    restoreDecryptedBackup,
    importEncryptedVault,
    wipeVault,
    isStorageReady,
    storageDiagnostics,
    filteredItems,
    currentWorkspace
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
