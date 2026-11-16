import React, { useState, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Search, 
  Plus, 
  Key, 
  FileText, 
  Award, 
  CreditCard, 
  Wifi, 
  Fingerprint, 
  Terminal, 
  Copy, 
  ExternalLink, 
  Star, 
  RotateCcw, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  ChevronRight,
  Download,
  Upload,
  Trash2,
  Filter,
  ArrowUpDown,
  ShieldAlert,
  CheckSquare,
  Square,
  X,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { ItemCategory, VaultItem } from '../../types/vault';
import { evaluatePasswordStrength } from '../../crypto/cryptoService';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

export const VaultListView: React.FC = () => {
  const { 
    filteredItems, 
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
    setActiveItem,
    setIsCreateModalOpen,
    copyToClipboard,
    toggleFavorite,
    deleteItem,
    deleteMultipleItems,
    exportVaultJson,
    exportEncryptedVault,
    inspectEncryptedArchive,
    decryptAndValidateArchive,
    restoreDecryptedBackup,
    importItems,
    importEncryptedVault,
    emergencyPhrase
  } = useVault();

  // Multi-selection state for bulk delete
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportPassphrase, setExportPassphrase] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showUnencryptedWarning, setShowUnencryptedWarning] = useState(false);
  const [unencryptedAcknowledge, setUnencryptedAcknowledge] = useState(false);

  // Import & Restore Flow states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [restoreStep, setRestoreStep] = useState<'unseal' | 'confirm'>('unseal');
  const [pendingArchiveContent, setPendingArchiveContent] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string | null>(null);
  const [importPassphrase, setImportPassphrase] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);
  const [archiveHeaderInfo, setArchiveHeaderInfo] = useState<{
    version: number;
    cipher: string;
    iterations: number;
    exportedAt: string;
    summary?: { itemCount: number; workspaceCount: number };
  } | null>(null);
  const [decryptedPreview, setDecryptedPreview] = useState<{
    items: VaultItem[];
    workspaces: any[];
    settings?: any;
    exportedAt: string;
    formatVersion: number;
  } | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [confirmReplaceAck, setConfirmReplaceAck] = useState(false);

  // Delete modal state
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    targetId?: string;
    targetTitle?: string;
    count?: number;
  }>({
    isOpen: false,
    type: 'single'
  });

  const getCategoryIcon = (cat: ItemCategory) => {
    switch (cat) {
      case 'login': return <Key className="w-4 h-4 text-indigo-400" />;
      case 'note': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'licence': return <Award className="w-4 h-4 text-amber-400" />;
      case 'identity': return <Fingerprint className="w-4 h-4 text-sky-400" />;
      case 'wifi': return <Wifi className="w-4 h-4 text-teal-400" />;
      case 'card': return <CreditCard className="w-4 h-4 text-purple-400" />;
      case 'secret': return <Terminal className="w-4 h-4 text-rose-400" />;
    }
  };

  // Toggle single item selection
  const handleToggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Select all or deselect all
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(it => it.id));
    }
  };

  // Open single item delete dialog
  const promptDeleteItem = (item: VaultItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteModalConfig({
      isOpen: true,
      type: 'single',
      targetId: item.id,
      targetTitle: item.title
    });
  };

  // Open bulk delete dialog
  const promptDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    setDeleteModalConfig({
      isOpen: true,
      type: 'bulk',
      count: selectedIds.length
    });
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (deleteModalConfig.type === 'single' && deleteModalConfig.targetId) {
      deleteItem(deleteModalConfig.targetId);
      setSelectedIds(prev => prev.filter(id => id !== deleteModalConfig.targetId));
    } else if (deleteModalConfig.type === 'bulk') {
      deleteMultipleItems(selectedIds);
      setSelectedIds([]);
    }
    setDeleteModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleExportPlaintext = () => {
    if (!unencryptedAcknowledge) {
      setShowUnencryptedWarning(true);
      return;
    }
    try {
      const json = exportVaultJson(true);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vaultora-unencrypted-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
      setShowUnencryptedWarning(false);
      setUnencryptedAcknowledge(false);
      setImportStatus({
        type: 'success',
        text: 'Exported unencrypted plaintext JSON backup.'
      });
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        text: err.message || 'Failed to export plaintext JSON.'
      });
    }
  };

  const handleExportEncrypted = async () => {
    try {
      setIsExporting(true);
      const encryptedArchive = await exportEncryptedVault(exportPassphrase.trim() || undefined);
      const blob = new Blob([encryptedArchive], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vaultora-backup-${new Date().toISOString().split('T')[0]}.vaultora`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExportModalOpen(false);
      setExportPassphrase('');
      setImportStatus({
        type: 'success',
        text: 'Exported AES-256-GCM encrypted .vaultora archive!'
      });
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err) {
      console.error('Failed to export encrypted archive:', err);
      setImportStatus({
        type: 'error',
        text: 'Encryption error during export.'
      });
      setTimeout(() => setImportStatus(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        let parsed: any;
        try {
          parsed = JSON.parse(content);
        } catch {
          setImportStatus({
            type: 'error',
            text: 'Failed to parse file: Invalid JSON syntax or corrupt file.'
          });
          setTimeout(() => setImportStatus(null), 4500);
          return;
        }

        // Check if file is an encrypted .vaultora archive
        if (parsed.vaultoraEncrypted === true || file.name.endsWith('.vaultora')) {
          try {
            const header = inspectEncryptedArchive(content);
            setArchiveHeaderInfo(header);
            setPendingArchiveContent(content);
            setPendingFilename(file.name);
            setImportPassphrase('');
            setImportError(null);
            setRestoreStep('unseal');
            setDecryptedPreview(null);
            setConfirmReplaceAck(false);
            setIsImportModalOpen(true);
            return;
          } catch (err: any) {
            setImportStatus({
              type: 'error',
              text: err.message || 'Corrupted or incompatible .vaultora backup archive.'
            });
            setTimeout(() => setImportStatus(null), 5000);
            return;
          }
        }

        // Unencrypted JSON backup
        const importedArray = Array.isArray(parsed) ? parsed : (parsed.items || []);
        if (importedArray.length === 0) {
          setImportStatus({
            type: 'error',
            text: 'No valid records found in selected backup file.'
          });
          setTimeout(() => setImportStatus(null), 4000);
          return;
        }

        setDecryptedPreview({
          items: importedArray,
          workspaces: parsed.workspaces || [],
          settings: parsed.settings,
          exportedAt: parsed.exportedAt || new Date().toISOString(),
          formatVersion: 1
        });
        setPendingFilename(file.name);
        setPendingArchiveContent(content);
        setRestoreStep('confirm');
        setConfirmReplaceAck(false);
        setIsImportModalOpen(true);
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          text: `Failed to inspect backup file: ${err.message}`
        });
        setTimeout(() => setImportStatus(null), 4000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmDecrypt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingArchiveContent) return;
    if (!importPassphrase.trim()) {
      setImportError('Please enter the archive decryption passphrase or 24-word recovery seed.');
      return;
    }

    try {
      setIsProcessingImport(true);
      setImportError(null);
      const validated = await decryptAndValidateArchive(pendingArchiveContent, importPassphrase.trim());
      setDecryptedPreview(validated);
      setRestoreStep('confirm');
    } catch (err: any) {
      setImportError(err.message || 'Decryption failed: Authentication tag verification failed or password was incorrect.');
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!decryptedPreview) return;
    if (restoreMode === 'replace' && !confirmReplaceAck) {
      setImportError('Please check the confirmation box to replace your existing vault data.');
      return;
    }

    try {
      setIsProcessingImport(true);
      setImportError(null);
      const result = await restoreDecryptedBackup(
        decryptedPreview, 
        restoreMode, 
        activeWorkspaceId === 'all' ? undefined : activeWorkspaceId
      );

      setIsImportModalOpen(false);
      setPendingArchiveContent(null);
      setPendingFilename(null);
      setImportPassphrase('');
      setDecryptedPreview(null);
      setConfirmReplaceAck(false);

      setImportStatus({
        type: 'success',
        text: `Restored ${result.itemsCount} records and ${result.workspacesCount} workspaces (${result.mode === 'merge' ? 'Merged into existing vault' : 'Replaced entire vault'})!`
      });
      setTimeout(() => setImportStatus(null), 4500);
    } catch (err: any) {
      setImportError(`Restore operation failed: ${err.message}`);
    } finally {
      setIsProcessingImport(false);
    }
  };

  const handleTriggerImport = () => {
    fileInputRef.current?.click();
  };

  const hasActiveFilters = 
    activeWorkspaceId !== 'all' || 
    selectedCategory !== 'all' || 
    selectedCollection !== null || 
    securityFilter !== 'all' || 
    favoritesOnly || 
    searchQuery.trim().length > 0;

  const handleResetFilters = () => {
    setActiveWorkspaceId('all');
    setSelectedCategory('all');
    setSelectedCollection(null);
    setSecurityFilter('all');
    setFavoritesOnly(false);
    setSearchQuery('');
    setSortBy('title_asc');
  };

  const isAllSelected = filteredItems.length > 0 && selectedIds.length === filteredItems.length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6">
      {/* Top Search & Primary Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search credentials, URLs, licences..."
            className="w-full pl-9 pr-12 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors min-h-[44px]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white p-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer min-h-[40px] shrink-0 ${
              hasActiveFilters || showFilterDrawer
                ? 'bg-indigo-950/80 border-indigo-700 text-indigo-300 font-semibold'
                : 'text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border-slate-800'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 ml-0.5" />
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".json,.vaultora,application/json"
            className="hidden"
          />

          <button
            onClick={handleTriggerImport}
            title="Import JSON or .vaultora encrypted archive"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer min-h-[40px] shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Import</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            title="Export vault backup (Encrypted .vaultora or JSON)"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer min-h-[40px] shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors cursor-pointer whitespace-nowrap min-h-[40px] shrink-0 ml-auto sm:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Item</span>
          </button>
        </div>
      </div>

      {/* Import / Export Notification Banner */}
      {importStatus && (
        <div className={`flex items-center gap-2.5 p-3 rounded-xl text-xs animate-in fade-in border ${
          importStatus.type === 'success'
            ? 'bg-emerald-950/70 border-emerald-700/60 text-emerald-200'
            : 'bg-rose-950/80 border-rose-700/60 text-rose-200'
        }`}>
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1 font-medium">{importStatus.text}</span>
          <button 
            onClick={() => setImportStatus(null)} 
            className="p-1 hover:text-white text-slate-400 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Expanded Multi-Option Filter Toolbar */}
      <div className={`p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3.5 ${showFilterDrawer ? 'block' : 'hidden md:block'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. Category / Record Type Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Record Type
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[38px]"
            >
              <option value="all">All Types ({items.length})</option>
              <option value="login">Logins ({items.filter(i => i.category === 'login').length})</option>
              <option value="note">Secure Notes ({items.filter(i => i.category === 'note').length})</option>
              <option value="licence">Software Licences ({items.filter(i => i.category === 'licence').length})</option>
              <option value="wifi">Wi-Fi Keys ({items.filter(i => i.category === 'wifi').length})</option>
              <option value="secret">API & SSH Secrets ({items.filter(i => i.category === 'secret').length})</option>
              <option value="card">Bank Cards ({items.filter(i => i.category === 'card').length})</option>
            </select>
          </div>

          {/* 2. Workspace Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Workspace Scope
            </label>
            <select
              value={activeWorkspaceId}
              onChange={(e) => {
                setActiveWorkspaceId(e.target.value);
                setSelectedCollection(null);
              }}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[38px]"
            >
              <option value="all">All Workspaces</option>
              {workspaces.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({items.filter(i => i.workspaceId === w.id).length})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Security Status / Health Filter */}
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Security Health
            </label>
            <select
              value={securityFilter}
              onChange={(e) => setSecurityFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[38px]"
            >
              <option value="all">All Health Statuses</option>
              <option value="compromised">⚠️ Compromised / Needs Rotation</option>
              <option value="weak">⚡ Weak Master Passwords</option>
              <option value="missing_mfa">🛡️ Missing Two-Factor (2FA)</option>
              <option value="reused">🔄 Reused Passwords</option>
            </select>
          </div>

          {/* 4. Sort By */}
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Sort Order
            </label>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500 min-h-[38px]"
              >
                <option value="title_asc">Title (A to Z)</option>
                <option value="title_desc">Title (Z to A)</option>
                <option value="created_desc">Newest Added First</option>
                <option value="created_asc">Oldest Added First</option>
                <option value="strength_asc">Weakest Password First</option>
              </select>

              {/* Favorites Star Toggle Button */}
              <button
                type="button"
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                title={favoritesOnly ? 'Showing starred only' : 'Filter by favorites'}
                className={`p-2 rounded-lg border min-w-[38px] min-h-[38px] flex items-center justify-center transition-colors cursor-pointer ${
                  favoritesOnly
                    ? 'bg-amber-950/60 border-amber-600 text-amber-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Star className={`w-4 h-4 ${favoritesOnly ? 'fill-amber-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Badges & Reset Row */}
        {hasActiveFilters && (
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[11px] text-slate-500 font-medium">Active filters:</span>

            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[11px]">
                Type: {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="hover:text-rose-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {activeWorkspaceId !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[11px]">
                Workspace: {workspaces.find(w => w.id === activeWorkspaceId)?.name}
                <button onClick={() => setActiveWorkspaceId('all')} className="hover:text-rose-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {securityFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-950/70 border border-rose-900/60 text-rose-300 rounded text-[11px]">
                Health: {securityFilter.replace('_', ' ')}
                <button onClick={() => setSecurityFilter('all')} className="hover:text-rose-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {favoritesOnly && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-950/70 border border-amber-900/60 text-amber-300 rounded text-[11px]">
                Starred Only
                <button onClick={() => setFavoritesOnly(false)} className="hover:text-amber-200">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-800 text-slate-200 rounded text-[11px]">
                Search: "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-rose-400">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 text-[11px] ml-auto cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* Floating or Top Bulk Actions Bar when items are selected */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-indigo-950/90 border border-indigo-700/80 rounded-xl flex items-center justify-between gap-3 text-xs shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">
              {selectedIds.length} of {filteredItems.length} record(s) selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 text-slate-300 hover:text-white rounded transition-colors cursor-pointer"
            >
              Deselect All
            </button>
            <button
              onClick={promptDeleteBulk}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          </div>
        </div>
      )}


      {/* Items Count and Select-All Bar for Mobile */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSelectAll}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            {isAllSelected ? (
              <CheckSquare className="w-4 h-4 text-indigo-400" />
            ) : (
              <Square className="w-4 h-4 text-slate-500" />
            )}
            <span>Select All ({filteredItems.length})</span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-slate-500">
          {filteredItems.length} records shown
        </span>
      </div>

      {items.length === 0 ? (
        <div className="p-8 sm:p-16 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">Your Encrypted Vault is Ready</h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              No records stored yet. Add your logins, secure notes, software licences, Wi-Fi credentials, or developer secret tokens.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Record</span>
            </button>
            <button
              onClick={handleTriggerImport}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              <Upload className="w-4 h-4 text-slate-400" />
              <span>Import Existing Backup</span>
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-8 sm:p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No records match your criteria</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try resetting your active filters or create a new encrypted record.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer min-h-[40px]"
              >
                Clear Filters
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Record</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* MOBILE VIEW: Touch-friendly Card List (visible on mobile < md) */}
          <div className="block md:hidden space-y-2.5">
            {filteredItems.map(item => {
              const ws = workspaces.find(w => w.id === item.workspaceId);
              const isCompromised = item.needsRotation || item.password === 'password123';
              const isSelected = selectedIds.includes(item.id);

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItem(item)}
                  className={`p-3.5 bg-slate-900 border rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                    isSelected ? 'border-indigo-600 bg-indigo-950/20' : 'border-slate-800 active:bg-slate-850'
                  }`}
                >
                  {/* Selection Checkbox */}
                  <button
                    onClick={(e) => handleToggleSelect(item.id, e)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer shrink-0"
                    title={isSelected ? 'Deselect' : 'Select'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {item.title}
                        </span>
                        {item.favorite && (
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                        {item.username || item.ssid || item.softwareName || item.secretType || item.collection}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="truncate max-w-[100px]">{ws?.name || 'Personal'}</span>
                        <span>·</span>
                        <span>{item.collection}</span>
                        {isCompromised && (
                          <span className="text-rose-400 font-semibold">· Rotate</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Quick Action Buttons (Copy + Delete) */}
                  <div 
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item.password && (
                      <button
                        onClick={() => copyToClipboard(item.password || '', `Password for ${item.title}`, { title: item.title, id: item.id })}
                        title="Copy Password"
                        aria-label="Copy password"
                        className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/80 active:bg-slate-700 text-slate-300 active:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Mobile Direct Delete Button */}
                    <button
                      onClick={(e) => promptDeleteItem(item, e)}
                      title="Delete Record"
                      aria-label="Delete Record"
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800/50 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setActiveItem(item)}
                      title="Open details"
                      className="w-7 h-9 flex items-center justify-center text-slate-500"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP VIEW: High-density Tabular Grid (hidden on mobile, visible on >= md) */}
          <div className="hidden md:block bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 divide-y divide-slate-800">
                <thead className="bg-slate-950/70 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="w-9 px-3 py-3 text-center">
                      <button
                        onClick={handleToggleSelectAll}
                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                        title={isAllSelected ? 'Deselect all' : 'Select all'}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th scope="col" className="w-9 px-2 py-3 text-center">
                      <Star className="w-3.5 h-3.5 mx-auto text-slate-500" />
                    </th>
                    <th scope="col" className="px-4 py-3">Title & Category</th>
                    <th scope="col" className="px-4 py-3">Identifier / Username</th>
                    <th scope="col" className="px-4 py-3">Workspace & Collection</th>
                    <th scope="col" className="px-4 py-3">Security & Health</th>
                    <th scope="col" className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredItems.map(item => {
                    const ws = workspaces.find(w => w.id === item.workspaceId);
                    const strength = item.password ? evaluatePasswordStrength(item.password) : null;
                    const isCompromised = item.needsRotation || item.password === 'password123';
                    const isSelected = selectedIds.includes(item.id);

                    return (
                      <tr 
                        key={item.id}
                        onClick={() => setActiveItem(item)}
                        className={`hover:bg-slate-800/40 transition-colors cursor-pointer group ${
                          isSelected ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Checkbox for bulk delete selection */}
                        <td 
                          className="px-3 py-3.5 text-center"
                          onClick={(e) => handleToggleSelect(item.id, e)}
                        >
                          <button className="text-slate-400 hover:text-white p-1">
                            {isSelected ? (
                              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                            ) : (
                              <Square className="w-3.5 h-3.5 text-slate-600" />
                            )}
                          </button>
                        </td>

                        {/* Favorite button */}
                        <td 
                          className="px-2 py-3.5 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(item.id);
                          }}
                        >
                          <button className="text-slate-500 hover:text-amber-400 transition-colors cursor-pointer p-1">
                            <Star className={`w-3.5 h-3.5 ${item.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </td>

                        {/* Title & Category */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 bg-slate-800 rounded-md shrink-0">
                              {getCategoryIcon(item.category)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
                                {item.title}
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span className="capitalize">{item.category}</span>
                                {item.tags.length > 0 && (
                                  <>
                                    <span>·</span>
                                    <span className="truncate">#{item.tags.slice(0, 2).join(' #')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Identifier */}
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-slate-300 truncate max-w-[200px]">
                            {item.username || 
                             item.ssid || 
                             item.softwareName || 
                             item.cardholderName || 
                             item.secretType || 
                             (item.category === 'note' ? 'Secure Encrypted Note' : '—')}
                          </div>
                          {item.url && (
                            <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-0.5">
                              {item.url.replace(/^https?:\/\//, '')}
                            </div>
                          )}
                        </td>

                        {/* Workspace & Collection */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full shrink-0" 
                              style={{ backgroundColor: ws?.color || '#64748b' }} 
                            />
                            <span className="font-medium text-slate-200 truncate max-w-[150px]">
                              {ws?.name || 'Personal'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                            {item.collection}
                          </div>
                        </td>

                        {/* Security & Health */}
                        <td className="px-4 py-3.5">
                          {item.category === 'login' ? (
                            <div className="space-y-0.5">
                              {isCompromised ? (
                                <div className="flex items-center gap-1 text-rose-400 font-medium">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Compromised / Rotate</span>
                                </div>
                              ) : strength ? (
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[11px] font-mono tabular-nums ${
                                    strength.score >= 3 ? 'text-emerald-400' : strength.score === 2 ? 'text-amber-400' : 'text-rose-400'
                                  }`}>
                                    {strength.label}
                                  </span>
                                  {item.mfaEnabled && (
                                    <span className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-800/80 px-1 rounded">
                                      2FA
                                    </span>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          ) : (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>AES-256 GCM</span>
                            </div>
                          )}
                        </td>

                        {/* Actions (Copy + Direct Delete) */}
                        <td 
                          className="px-4 py-3.5 text-right whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            {item.username && (
                              <button
                                onClick={() => copyToClipboard(item.username || '', `Username for ${item.title}`)}
                                title="Copy Username"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              >
                                <span className="text-[10px] font-mono font-medium px-1">ID</span>
                              </button>
                            )}

                            {item.password && (
                              <button
                                onClick={() => copyToClipboard(item.password || '', `Password for ${item.title}`, { title: item.title, id: item.id })}
                                title="Copy Password"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.wifiPassword && (
                              <button
                                onClick={() => copyToClipboard(item.wifiPassword || '', `Wi-Fi Key for ${item.title}`, { title: item.title, id: item.id })}
                                title="Copy Wi-Fi Key"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.secretValue && (
                              <button
                                onClick={() => copyToClipboard(item.secretValue || '', `Secret token for ${item.title}`, { title: item.title, id: item.id })}
                                title="Copy Secret Token"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                title="Launch URL"
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {/* Direct Row Delete Action Button */}
                            <button
                              onClick={(e) => promptDeleteItem(item, e)}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={
          deleteModalConfig.type === 'single'
            ? `Delete "${deleteModalConfig.targetTitle}"?`
            : `Delete ${deleteModalConfig.count} Selected Records?`
        }
        description={
          deleteModalConfig.type === 'single'
            ? `Are you sure you want to permanently delete "${deleteModalConfig.targetTitle}" from your encrypted zero-knowledge vault? This action cannot be undone.`
            : `Are you sure you want to permanently delete these ${deleteModalConfig.count} selected encrypted records? Decryption keys will be purged and this action cannot be undone.`
        }
        confirmLabel={
          deleteModalConfig.type === 'single' ? 'Permanently Delete' : `Delete (${deleteModalConfig.count})`
        }
        itemCount={deleteModalConfig.count}
      />

      {/* Export Vault Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Export Vault Backup</h3>
                  <p className="text-[11px] text-slate-400">Zero-knowledge encrypted archive & disaster recovery</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setShowUnencryptedWarning(false);
                  setUnencryptedAcknowledge(false);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs overflow-y-auto">
              {/* Option 1: Encrypted .vaultora (Default & Recommended) */}
              <div className="p-4 bg-slate-950 border border-indigo-500/40 rounded-xl space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span className="font-semibold text-white text-xs">Encrypted Archive (.vaultora)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Default & Recommended
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Sealed with authenticated AES-256-GCM and PBKDF2-SHA256 (600,000 iterations). Encrypts all {items.length} records, {workspaces.length} workspaces, and security settings before export. Safe for cloud and external drives.
                </p>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                    Custom Archive Passphrase (leave blank to seal with your 24-word recovery seed)
                  </label>
                  <input
                    type="password"
                    value={exportPassphrase}
                    onChange={(e) => setExportPassphrase(e.target.value)}
                    placeholder="Enter passphrase or leave empty for recovery seed..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs min-h-[38px]"
                  />
                </div>
                <button
                  onClick={handleExportEncrypted}
                  disabled={isExporting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isExporting ? 'Encrypting & Generating (.vaultora)...' : 'Download Encrypted Archive (.vaultora)'}</span>
                </button>
              </div>

              {/* Option 2: Plaintext JSON (Heavily Guarded with Warning) */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-200 text-xs">Plaintext JSON (.json)</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    Unencrypted / Insecure
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Raw plaintext JSON. Passwords and notes will NOT be encrypted and can be read by any application on your computer.
                </p>

                {!showUnencryptedWarning ? (
                  <button
                    onClick={() => setShowUnencryptedWarning(true)}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
                  >
                    Reveal Unencrypted Plaintext Export Options...
                  </button>
                ) : (
                  <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-lg space-y-2.5 text-[11px] text-rose-300">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">Security Warning: Plaintext Exposure</strong>
                        Exporting in plaintext writes raw passwords to disk. Anyone with access to your device can read all your credentials.
                      </div>
                    </div>
                    <label className="flex items-center gap-2 pt-1 text-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={unencryptedAcknowledge}
                        onChange={(e) => setUnencryptedAcknowledge(e.target.checked)}
                        className="rounded border-slate-700 text-rose-600 focus:ring-0 cursor-pointer"
                      />
                      <span>I understand that all my passwords will be exported in unencrypted plaintext</span>
                    </label>
                    <button
                      onClick={handleExportPlaintext}
                      disabled={!unencryptedAcknowledge}
                      className="w-full py-2 bg-rose-700 hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Plaintext JSON (.json)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import & Restore Modal (Multi-step with Overwrite Protection) */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Restore Vault from Backup</h3>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-[260px]">{pendingFilename}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setPendingArchiveContent(null);
                  setPendingFilename(null);
                  setImportError(null);
                  setDecryptedPreview(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Unseal Encrypted Archive */}
            {restoreStep === 'unseal' && (
              <form onSubmit={handleConfirmDecrypt} className="p-5 space-y-4 text-xs overflow-y-auto">
                {archiveHeaderInfo && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Archive Format:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Vaultora v{archiveHeaderInfo.version}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Cryptographic Cipher:</span>
                      <span className="font-mono text-indigo-400">{archiveHeaderInfo.cipher}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Key Derivation:</span>
                      <span className="font-mono text-slate-300">PBKDF2-SHA256 ({archiveHeaderInfo.iterations.toLocaleString()} iter)</span>
                    </div>
                    {archiveHeaderInfo.summary && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                        <span className="text-slate-400">Stored Records:</span>
                        <span className="text-white font-medium">{archiveHeaderInfo.summary.itemCount} items, {archiveHeaderInfo.summary.workspaceCount} workspaces</span>
                      </div>
                    )}
                  </div>
                )}

                {importError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1.5">
                    Archive Decryption Passphrase or 24-Word Recovery Seed
                  </label>
                  <input
                    type="password"
                    autoFocus
                    value={importPassphrase}
                    onChange={(e) => setImportPassphrase(e.target.value)}
                    placeholder="Enter passphrase or 24 words..."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 min-h-[42px] font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsImportModalOpen(false);
                      setPendingArchiveContent(null);
                      setPendingFilename(null);
                    }}
                    className="px-3.5 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[38px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingImport || !importPassphrase.trim()}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isProcessingImport ? 'Verifying MAC & Decrypting...' : 'Decrypt & Inspect Contents'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Confirmation & Overwrite Protection */}
            {restoreStep === 'confirm' && decryptedPreview && (
              <div className="p-5 space-y-4 text-xs overflow-y-auto">
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Backup Successfully Decrypted & Validated</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-slate-400">Vault Items:</span>{' '}
                      <strong className="text-white">{decryptedPreview.items.length} records</strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Workspaces:</span>{' '}
                      <strong className="text-white">{decryptedPreview.workspaces.length} workspaces</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Export Timestamp:</span>{' '}
                      <span className="text-slate-300 font-mono">{new Date(decryptedPreview.exportedAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {importError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-300 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{importError}</span>
                  </div>
                )}

                {/* Overwrite Protection Strategy */}
                <div className="space-y-2.5">
                  <label className="block text-[11px] text-slate-300 font-semibold">
                    Select Restore Strategy:
                  </label>

                  <div className="grid grid-cols-1 gap-2.5">
                    {/* Merge Option (Recommended) */}
                    <div 
                      onClick={() => setRestoreMode('merge')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        restoreMode === 'merge'
                          ? 'bg-indigo-950/50 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs flex items-center gap-1.5">
                          <span>Merge with Existing Vault</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Safe & Recommended
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'merge'}
                          onChange={() => setRestoreMode('merge')}
                          className="text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Preserves all {items.length} existing items. Adds non-duplicate records from backup and updates existing items where the backup has a newer timestamp.
                      </p>
                    </div>

                    {/* Replace Option (Destructive) */}
                    <div 
                      onClick={() => setRestoreMode('replace')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        restoreMode === 'replace'
                          ? 'bg-rose-950/40 border-rose-600 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          <span>Replace Entire Vault</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Destructive
                          </span>
                        </span>
                        <input
                          type="radio"
                          name="restoreMode"
                          checked={restoreMode === 'replace'}
                          onChange={() => setRestoreMode('replace')}
                          className="text-rose-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Permanently replaces all current records ({items.length} items) with the backup dataset. Current unsaved local changes will be deleted.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Overwrite Confirmation Checkbox if Replace is selected */}
                {restoreMode === 'replace' && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800 rounded-xl space-y-2 text-rose-200">
                    <label className="flex items-start gap-2 cursor-pointer text-[11px]">
                      <input
                        type="checkbox"
                        checked={confirmReplaceAck}
                        onChange={(e) => setConfirmReplaceAck(e.target.checked)}
                        className="rounded border-rose-800 text-rose-600 focus:ring-0 cursor-pointer mt-0.5"
                      />
                      <span>
                        I understand and confirm that replacing the vault will overwrite current local records with this backup file.
                      </span>
                    </label>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setRestoreStep('unseal')}
                    className="px-3.5 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[38px]"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteRestore}
                    disabled={isProcessingImport || (restoreMode === 'replace' && !confirmReplaceAck)}
                    className={`px-4 py-2 font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[38px] ${
                      restoreMode === 'replace'
                        ? 'bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isProcessingImport
                        ? 'Restoring Data...'
                        : restoreMode === 'replace'
                        ? `Replace Vault (${decryptedPreview.items.length} items)`
                        : `Merge Vault (${decryptedPreview.items.length} items)`}
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
