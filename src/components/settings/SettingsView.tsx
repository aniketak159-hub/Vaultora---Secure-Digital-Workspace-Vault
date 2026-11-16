import React, { useState, useMemo } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Shield, 
  Lock, 
  KeyRound, 
  Timer, 
  FileKey2, 
  HardDrive, 
  Smartphone, 
  Cpu, 
  RotateCcw, 
  Sparkles,
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Download, 
  Upload, 
  ShieldCheck, 
  ShieldAlert, 
  Info,
  Clock,
  Layers,
  Activity
} from 'lucide-react';
import { evaluatePasswordStrength, checkCredentialBreachStatus } from '../../crypto/cryptoService';

export const SettingsView: React.FC = () => {
  const { 
    lockState, 
    securityFindings, 
    items, 
    workspaces,
    storageDiagnostics, 
    lockVault, 
    changeMasterPassphrase, 
    setAutoLockMinutes, 
    setIsEmergencyKitModalOpen,
    setIsRecoveryModalOpen,
    exportEncryptedVault,
    rotatePassword,
    copyToClipboard
  } = useVault();

  // Navigation tab within Settings
  const [activeTab, setActiveTab] = useState<'security' | 'hygiene' | 'storage' | 'audit'>('security');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable technical detail states
  const [showKdfDetails, setShowKdfDetails] = useState(false);
  const [showPlatformDetails, setShowPlatformDetails] = useState(false);
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);

  // Master Passphrase Rotation state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStatus, setRotationStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ 
    type: 'idle', 
    message: '' 
  });

  // Export status
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Credential hygiene filter
  const [hygieneFilter, setHygieneFilter] = useState<string>('all');
  const [testingPassword, setTestingPassword] = useState('');
  const [breachResult, setBreachResult] = useState<{ isCompromised: boolean; hashPrefix: string; count?: number } | null>(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

  // Detect platform
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

  // Derived counts
  const criticalCount = securityFindings.filter(f => f.severity === 'critical').length;
  const highCount = securityFindings.filter(f => f.severity === 'high').length;

  // New Passphrase Strength
  const newPassStrength = useMemo(() => {
    if (!newPass) return null;
    return evaluatePasswordStrength(newPass);
  }, [newPass]);

  // Handle Master Passphrase Rotation
  const handleExecuteRotation = async () => {
    setIsConfirmModalOpen(false);
    setIsRotating(true);
    setRotationStatus({ type: 'idle', message: '' });

    try {
      const success = await changeMasterPassphrase(newPass, oldPass);
      if (success) {
        setRotationStatus({ 
          type: 'success', 
          message: 'Master passphrase successfully rotated! All records re-encrypted with a fresh salt and new AES-256-GCM key.' 
        });
        setOldPass('');
        setNewPass('');
      } else {
        setRotationStatus({ 
          type: 'error', 
          message: 'Passphrase verification failed. Please check your current master passphrase and try again.' 
        });
      }
    } catch (err) {
      setRotationStatus({ 
        type: 'error', 
        message: 'Cryptographic re-encryption failed. Previous key and vault state safely preserved.' 
      });
    } finally {
      setIsRotating(false);
    }
  };

  // Handle encrypted backup export
  const handleExportBackup = async () => {
    try {
      const encryptedArchive = await exportEncryptedVault();
      const blob = new Blob([encryptedArchive], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vaultora-backup-${new Date().toISOString().slice(0, 10)}.vaultora`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportNotice('Encrypted backup successfully generated and downloaded.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      setExportNotice('Failed to generate encrypted backup.');
      setTimeout(() => setExportNotice(null), 4000);
    }
  };

  // Handle Breach Check
  const handleManualBreachCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testingPassword) return;
    setIsCheckingBreach(true);
    const result = await checkCredentialBreachStatus(testingPassword);
    setBreachResult({
      isCompromised: result.isCompromised,
      hashPrefix: result.hashPrefix,
      count: result.breachCount
    });
    setIsCheckingBreach(false);
  };

  // Filter findings for hygiene tab
  const filteredFindings = securityFindings.filter(f => {
    if (hygieneFilter === 'all') return true;
    if (hygieneFilter === 'critical') return f.severity === 'critical';
    if (hygieneFilter === 'reused') return f.type === 'reused_password';
    if (hygieneFilter === 'weak') return f.type === 'weak_password';
    if (hygieneFilter === 'mfa') return f.type === 'missing_mfa';
    if (hygieneFilter === 'stale') return f.type === 'stale_credential';
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 select-none">
      {/* Settings Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            System &amp; Vault Preferences
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Configure zero-knowledge security, manage your master passphrase, adjust session timeouts, and control encrypted backups.
          </p>
        </div>

        {/* Search within Settings */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search settings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg text-xs font-medium overflow-x-auto">
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'security'
              ? 'bg-slate-800 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Security &amp; Privacy
        </button>
        <button
          onClick={() => setActiveTab('hygiene')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'hygiene'
              ? 'bg-slate-800 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Credential Health</span>
          {criticalCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
              {criticalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-3 py-1.5 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'storage'
              ? 'bg-slate-800 text-white font-semibold shadow-xs'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Storage &amp; Platform Architecture
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SECURITY & PRIVACY                                      */}
      {/* ============================================================== */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* SECTION A: SECURITY OVERVIEW */}
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Security Overview</span>
              </h2>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Vault Active &amp; Authenticated</span>
              </span>
            </div>

            {/* Compact 4-Card Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Vault Encryption</span>
                <span className="font-semibold text-slate-200 mt-1 block font-mono">AES-256-GCM</span>
                <span className="text-[10px] text-emerald-400 font-medium">Configured</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Auto-Lock Timeout</span>
                <span className="font-semibold text-slate-200 mt-1 block font-mono">{lockState.autoLockMinutes} Minutes</span>
                <span className="text-[10px] text-emerald-400 font-medium">Active</span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Emergency Recovery</span>
                <span className="font-semibold text-slate-200 mt-1 block font-mono">24-Word Kit</span>
                <span className="text-[10px] text-emerald-400 font-medium">
                  {lockState.emergencyKitGenerated ? 'Configured' : 'Setup Required'}
                </span>
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg">
                <span className="text-slate-500 block text-[11px]">Credential Warnings</span>
                <span className={`font-semibold mt-1 block font-mono ${criticalCount > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
                  {criticalCount > 0 ? `${criticalCount} Critical` : '0 Critical'}
                </span>
                <span className={`text-[10px] font-medium ${criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {criticalCount > 0 ? 'Needs Attention' : 'Optimal'}
                </span>
              </div>
            </div>
          </div>

          {/* SECTION D: MASTER PASSPHRASE MANAGEMENT */}
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Master Passphrase Management</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Rotate your master passphrase and re-encrypt all stored vault records with a freshly derived cryptographic key.
              </p>
            </div>

            <div className="space-y-3 max-w-lg">
              {/* Current Passphrase */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Current Master Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    placeholder="Enter current master passphrase..."
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Passphrase */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  New Master Passphrase (minimum 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Enter new master passphrase..."
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassStrength && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Strength: <strong className="text-white capitalize">{newPassStrength.label}</strong></span>
                      <span className="font-mono text-slate-400">{newPassStrength.score}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          newPassStrength.score < 40 
                            ? 'bg-rose-500' 
                            : newPassStrength.score < 70 
                              ? 'bg-amber-500' 
                              : 'bg-emerald-500'
                        }`}
                        style={{ width: `${newPassStrength.score}%` }}
                      />
                    </div>
                    {newPassStrength.feedback && (
                      <p className="text-[10px] text-slate-400">{newPassStrength.feedback}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Status Message */}
              {rotationStatus.message && (
                <div className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                  rotationStatus.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300'
                }`}>
                  {rotationStatus.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                  <span>{rotationStatus.message}</span>
                </div>
              )}

              <button
                type="button"
                disabled={isRotating || !oldPass || newPass.length < 8}
                onClick={() => setIsConfirmModalOpen(true)}
                className="py-2 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rotate Master Passphrase &amp; Re-encrypt</span>
              </button>
            </div>
          </div>

          {/* SECTION E: SESSION TIMEOUT & AUTO-LOCK */}
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Session Timeout &amp; Auto-Lock</h2>
              </div>
              <span className="font-mono text-emerald-400 text-xs">
                Selected: {lockState.autoLockMinutes} minutes
              </span>
            </div>
            <p className="text-xs text-slate-400">
              When no mouse, keyboard, or touch activity is detected for the selected period, Vaultora immediately locks the vault and purges decrypted secrets from memory.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 max-w-lg">
              {[5, 15, 30, 60].map(mins => {
                const isSelected = lockState.autoLockMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setAutoLockMinutes(mins)}
                    className={`py-2 px-3 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer border flex flex-col items-center gap-0.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-850'
                    }`}
                  >
                    <span>{mins} Minutes</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      {mins === 5 ? 'High Security' : mins === 15 ? 'Balanced' : 'Extended'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION G: EMERGENCY KIT & ENCRYPTED BACKUPS */}
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileKey2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Emergency Kit &amp; Encrypted Backups</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                Zero-Knowledge
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Your 24-word emergency recovery phrase and encrypted <code className="font-mono text-slate-300">.vaultora</code> archives guarantee independent data recovery on any device without relying on third-party servers.
            </p>

            <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-lg text-xs text-amber-300/90 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Important: Your master passphrase and recovery phrase serve distinct recovery roles. In a zero-knowledge architecture, no administrator can reset your credentials. If both are lost, your encrypted vault cannot be recovered.
              </span>
            </div>

            {exportNotice && (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{exportNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setIsEmergencyKitModalOpen(true)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileKey2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>24-Word Recovery Kit</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Export Encrypted Backup</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRecoveryModalOpen(true)}
                className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>Restore from Backup</span>
              </button>
            </div>
          </div>

          {/* SECTION F: IN-MEMORY PROTECTION & CLIPBOARD */}
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-semibold text-white">In-Memory Protection &amp; Immediate Lock</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Clipboard Auto-Clear: 30s</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              When the vault is locked, Vaultora immediately drops all state references to decrypted records and active CryptoKeys. While JavaScript runs within browser garbage-collected environments where absolute low-level RAM zeroization cannot be theoretically guaranteed, sensitive credentials are never stored unencrypted or retained after locking.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                <span>Clipboard buffer is automatically wiped 30 seconds after copying any secret.</span>
              </div>
              <button
                type="button"
                onClick={lockVault}
                className="py-2 px-3.5 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 hover:text-white border border-rose-800/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault Now</span>
              </button>
            </div>
          </div>

          {/* SECTION B: ENCRYPTION & KEY MANAGEMENT (WITH EXPANDABLE DETAILS) */}
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">Encryption &amp; Key Derivation Parameters</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowKdfDetails(!showKdfDetails)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{showKdfDetails ? 'Hide Technical Details' : 'Show Technical Details'}</span>
                {showKdfDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Vaultora uses client-side AES-256-GCM authenticated encryption. Your master key is derived locally using PBKDF2 with 600,000 iterations from your master passphrase, combined with a 256-bit cryptographically secure salt.
            </p>

            {showKdfDetails && (
              <div className="p-3.5 bg-slate-950 rounded-lg border border-slate-800 space-y-2.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Cipher Suite:</span>
                  <span className="text-white">AES-256-GCM (Authenticated)</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Key Derivation Function:</span>
                  <span className="text-white">PBKDF2-HMAC-SHA256</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">KDF Iteration Count:</span>
                  <span className="text-emerald-400">600,000 iterations (OWASP standard)</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Cryptographic Salt Length:</span>
                  <span className="text-white">256 bits (32 bytes via crypto.getRandomValues)</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1.5">
                  <span className="text-slate-500">Initialization Vector (IV):</span>
                  <span className="text-white">96 bits (12 bytes unique per payload, never reused)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Key Extractability:</span>
                  <span className="text-emerald-400">extractable: false (Hardware-isolated in RAM)</span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION C: DEVICE & PLATFORM SECURITY (WITH EXPANDABLE DETAILS) */}
          <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-semibold text-white">Device &amp; Platform Security</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowPlatformDetails(!showPlatformDetails)}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
              >
                <span>{showPlatformDetails ? 'Hide Platform Details' : 'Show Platform Details'}</span>
                {showPlatformDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Storage mechanisms differ between Web Browsers and the native Android APK. All persistent data is verified and encrypted at the application layer prior to hitting any filesystem.
            </p>

            {showPlatformDetails && (
              <div className="space-y-3 pt-1">
                {/* Web Security */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                  <span className="font-semibold text-indigo-300 block">Web Browser Environment</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Browser storage utilizes IndexedDB with an encrypted localStorage fallback. Storage durability is requested via <code className="font-mono text-slate-300">navigator.storage.persist()</code> to prevent browser cache eviction under low-disk scenarios.
                  </p>
                </div>

                {/* Android Security */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1 text-xs">
                  <span className="font-semibold text-sky-300 block">Android Native Environment (APK)</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    The Android APK enables <code className="font-mono text-slate-300">FLAG_SECURE</code> to block screen recording, screenshots, and task-switcher previews. The app includes an Android KeyStore hardware bridge interface targeting TEE/StrongBox hardware backed keys.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: CREDENTIAL HYGIENE & THREAT ANALYSIS                     */}
      {/* ============================================================== */}
      {activeTab === 'hygiene' && (
        <div className="space-y-6">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-slate-400">Total Findings</span>
              <div className="text-xl font-bold font-mono text-white mt-1 tabular-nums">{securityFindings.length}</div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-rose-400">Critical Threats</span>
              <div className="text-xl font-bold font-mono text-rose-400 mt-1 tabular-nums">{criticalCount}</div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-amber-400">Reused Passwords</span>
              <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">{highCount}</div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
              <span className="text-indigo-400">Missing 2FA</span>
              <div className="text-xl font-bold font-mono text-indigo-400 mt-1 tabular-nums">
                {securityFindings.filter(f => f.type === 'missing_mfa').length}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {['all', 'critical', 'reused', 'weak', 'mfa', 'stale'].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setHygieneFilter(f)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors cursor-pointer ${
                  hygieneFilter === f
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {f === 'all' ? `All (${securityFindings.length})` : f}
              </button>
            ))}
          </div>

          {/* Findings List */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-3">
              {filteredFindings.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">No active issues in this view</h3>
                  <p className="text-slate-400">All scanned accounts comply with hygiene standards.</p>
                </div>
              ) : (
                filteredFindings.map(finding => {
                  const item = items.find(i => i.id === finding.itemId);
                  const ws = item ? workspaces.find(w => w.id === item.workspaceId) : undefined;

                  return (
                    <div
                      key={finding.id}
                      className={`p-3.5 rounded-xl border text-xs space-y-2.5 ${
                        finding.severity === 'critical'
                          ? 'bg-rose-950/20 border-rose-900/60'
                          : finding.severity === 'high'
                            ? 'bg-amber-950/20 border-amber-900/60'
                            : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              finding.severity === 'critical' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            <h3 className="font-semibold text-white">{finding.title}</h3>
                          </div>
                          <p className="text-slate-300 mt-1 text-[11px] leading-relaxed">
                            {finding.description}
                          </p>
                        </div>

                        {item && item.category === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              const newP = rotatePassword(item.id);
                              copyToClipboard(newP, `Rotated password for ${item.title}`);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Rotate Secret</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Action: {finding.recommendation}</span>
                        {ws && <span className="font-mono text-slate-500">{ws.name}</span>}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Breach Scanner Side Card */}
            <div className="lg:col-span-4 space-y-4">
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3 text-xs">
                <div>
                  <h3 className="font-semibold text-white">k-Anonymity Breach Scanner</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Test credentials against known leaks without ever exposing your plain password.
                  </p>
                </div>

                <form onSubmit={handleManualBreachCheck} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Type password to test..."
                    value={testingPassword}
                    onChange={(e) => setTestingPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-500 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingBreach || !testingPassword}
                    className="w-full py-2 px-3 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer"
                  >
                    {isCheckingBreach ? 'Checking hash prefix...' : 'Check Breach Status'}
                  </button>
                </form>

                {breachResult && (
                  <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                    breachResult.isCompromised
                      ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                      : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  }`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      {breachResult.isCompromised ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{breachResult.isCompromised ? 'Compromised in Public Leaks' : 'No Public Leaks Found'}</span>
                    </div>
                    <div className="text-[10px] font-mono opacity-80">
                      SHA-1 Prefix: {breachResult.hashPrefix}*****
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: STORAGE & ARCHITECTURE                                  */}
      {/* ============================================================== */}
      {activeTab === 'storage' && (
        <div className="space-y-5 text-xs">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              <span>Storage Security Diagnostics</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Encryption Standard</span>
                <span className="font-mono text-white font-semibold">{storageDiagnostics.encryptionStandard}</span>
                <p className="text-[11px] text-slate-400 pt-1">Client-side authenticated AES-GCM cipher with nonces.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Key Derivation</span>
                <span className="font-mono text-white font-semibold">PBKDF2 600k Iterations</span>
                <p className="text-[11px] text-slate-400 pt-1">HMAC-SHA256 with 256-bit cryptographically secure salt.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                <span className="text-slate-500 block">Storage Persistence</span>
                <span className="font-mono text-emerald-400 font-semibold">IndexedDB + localStorage</span>
                <p className="text-[11px] text-slate-400 pt-1">Dual-layer replication with zero cleartext written to disk.</p>
              </div>
            </div>
          </div>

          {/* About Vaultora & Experience */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>About Vaultora Experience</span>
                </h2>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Production Build v1.0.7 &bull; Package <span className="font-mono text-slate-300">io.vaultora.app</span> &bull; Zero-Knowledge Client Architecture
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('vaultora:replay-splash'));
                }}
                className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preview Startup Animation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR MASTER PASSPHRASE ROTATION */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5 text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-white">Confirm Master Passphrase Rotation</h3>
            </div>
            <p className="text-slate-300 leading-relaxed">
              This operation will re-derive your primary encryption key using 600,000 PBKDF2 iterations with a fresh 256-bit salt, and re-encrypt all stored vault records.
            </p>
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400">
              Make sure you have memorized or securely backed up your new master passphrase.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3 py-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRotation}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
              >
                Proceed with Re-encryption
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
