import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  ShieldAlert, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Key, 
  Lock, 
  Info, 
  Search, 
  ShieldCheck, 
  RefreshCw,
  HardDrive,
  Cpu,
  Smartphone,
  Layers,
  KeyRound,
  Shield,
  EyeOff,
  Flame,
  Check,
  X,
  Timer,
  FileKey2
} from 'lucide-react';
import { evaluatePasswordStrength, checkCredentialBreachStatus } from '../../crypto/cryptoService';

export const SecurityCentreView: React.FC = () => {
  const { 
    securityFindings, 
    items, 
    rotatePassword, 
    copyToClipboard, 
    workspaces,
    storageDiagnostics,
    lockVault,
    changeMasterPassphrase,
    lockState,
    setAutoLockMinutes,
    setIsEmergencyKitModalOpen
  } = useVault();

  const [activeSubTab, setActiveSubTab] = useState<'hygiene' | 'storage'>('storage');
  const [filterType, setFilterType] = useState<string>('all');
  const [testingPassword, setTestingPassword] = useState('');
  const [breachResult, setBreachResult] = useState<{ isCompromised: boolean; hashPrefix: string; count?: number } | null>(null);
  const [isCheckingBreach, setIsCheckingBreach] = useState(false);

  // Master passphrase rotation form state
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [rotationStatus, setRotationStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [isRotating, setIsRotating] = useState(false);

  const criticalIssues = securityFindings.filter(f => f.severity === 'critical');
  const highIssues = securityFindings.filter(f => f.severity === 'high');
  const mediumIssues = securityFindings.filter(f => f.severity === 'medium');

  const filteredFindings = securityFindings.filter(f => {
    if (filterType === 'all') return true;
    if (filterType === 'critical') return f.severity === 'critical';
    if (filterType === 'reused') return f.type === 'reused_password';
    if (filterType === 'weak') return f.type === 'weak_password';
    if (filterType === 'mfa') return f.type === 'missing_mfa';
    if (filterType === 'stale') return f.type === 'stale_credential';
    return true;
  });

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

  const handleRotateMasterPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPass || !newPass) {
      setRotationStatus({ type: 'error', message: 'Both current and new master passphrases are required.' });
      return;
    }
    if (newPass.length < 8) {
      setRotationStatus({ type: 'error', message: 'New master passphrase must be at least 8 characters long.' });
      return;
    }
    setIsRotating(true);
    setRotationStatus({ type: 'idle', message: '' });

    const success = await changeMasterPassphrase(newPass, oldPass);
    if (success) {
      setRotationStatus({ 
        type: 'success', 
        message: 'Master passphrase successfully rotated! All vault records and auth sentinels have been re-encrypted with a fresh 256-bit salt and new AES-256-GCM keys.' 
      });
      setOldPass('');
      setNewPass('');
    } else {
      setRotationStatus({ 
        type: 'error', 
        message: 'Current master passphrase verification failed. Please verify your current passphrase.' 
      });
    }
    setIsRotating(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-5 sm:pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
            Zero-Knowledge Security Centre
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Security Health & Cryptographic Storage
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Audit credential hygiene, inspect client-side AES-256-GCM storage architecture, and manage zero-knowledge encryption keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('storage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer min-h-[36px] ${
              activeSubTab === 'storage' 
                ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Storage Security & Keys
          </button>
          <button
            onClick={() => setActiveSubTab('hygiene')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer min-h-[36px] ${
              activeSubTab === 'hygiene' 
                ? 'bg-indigo-600 text-white font-semibold shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            Credential Threats ({securityFindings.length})
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Storage Security & Cryptographic Architecture */}
      {activeSubTab === 'storage' && (
        <div className="space-y-6">
          {/* Storage Architecture Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-indigo-400">
                <HardDrive className="w-5 h-5" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Cipher at Rest</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {storageDiagnostics.encryptionStandard}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vault records, notes, and credentials are authenticated and encrypted using 256-bit AES-GCM before writing to IndexedDB and localStorage. Zero plaintext on disk.
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>128-bit MAC Tag Authenticity Active</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Cpu className="w-5 h-5" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Key Derivation (KDF)</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                PBKDF2-HMAC-SHA256
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                600,000 iterations (OWASP recommended standard) using a 256-bit (32-byte) cryptographically secure salt. Mitigates brute-force GPU and rainbow-table attacks.
              </p>
              <div className="pt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Non-Extractable RAM Key (extractable: false)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-sky-400">
                <Smartphone className="w-5 h-5" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Platform Security</span>
              </div>
              <div className="text-base font-bold text-white font-mono">
                {storageDiagnostics.androidKeystoreBridge.available ? 'AndroidKeyStore TEE' : 'Web Sandbox + Android Bridge'}
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Addresses Android WebView storage limitation: WebView SQLite files are not automatically Keystore-protected. The app includes a native Android KeyStore hardware bridge.
              </p>
              <div className="pt-2 text-[10px] text-sky-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>FLAG_SECURE Anti-Snapshotting</span>
              </div>
            </div>
          </div>

          {/* Deep-Dive Analysis: Browser Limitations & Android Keystore */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Web Storage Limitations & Mitigations */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 text-xs">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Web Browser Storage Limitations & Mitigations
                </h3>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Standard web browsers (Chrome, Edge, Firefox, Safari) present specific security boundaries that must be explicitly accounted for in zero-knowledge architectures:
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-rose-300 block">1. Unencrypted Browser Disk Storage</span>
                  <p className="text-slate-400">
                    By default, browsers store IndexedDB and localStorage as unencrypted SQLite or LevelDB files on the host operating system.
                  </p>
                  <p className="text-emerald-400 font-medium pt-0.5">
                    <strong>Vaultora Mitigation:</strong> All data is authenticated and encrypted with AES-256-GCM before writing to the storage API. Host files contain only high-entropy ciphertext.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-rose-300 block">2. No Native Hardware Root-of-Trust</span>
                  <p className="text-slate-400">
                    Web standards lack an API to seal keys in a hardware TPM/Secure Enclave across origins without user interaction.
                  </p>
                  <p className="text-emerald-400 font-medium pt-0.5">
                    <strong>Vaultora Mitigation:</strong> Keys are derived purely on-demand using 600,000 PBKDF2 iterations from the user's master password, held in ephemeral memory, and never persisted to disk.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-rose-300 block">3. Storage Eviction Under Pressure</span>
                  <p className="text-slate-400">
                    Browsers may evict IndexedDB data if device storage becomes constrained.
                  </p>
                  <p className="text-emerald-400 font-medium pt-0.5">
                    <strong>Vaultora Mitigation:</strong> Explicitly calls <code className="font-mono text-slate-300">navigator.storage.persist()</code> and maintains dual-layer replication with localStorage fallback.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Android Keystore-Backed Protection vs WebView Storage */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  Android Keystore vs. WebView Storage
                </h3>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Critical mobile security finding: Browser storage inside an Android WebView (<code className="font-mono text-slate-300">/data/data/io.vaultora.app/app_webview</code>) is NOT automatically protected by Android Keystore hardware.
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-slate-200 block">The WebView Security Pitfall</span>
                  <p className="text-slate-400">
                    Many hybrid apps assume WebView storage inherits hardware Keystore protection. On rooted devices or forensic physical inspection, cleartext WebView files can be read.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-emerald-300 block">Vaultora's Hardware Bridge Architecture</span>
                  <p className="text-slate-400">
                    In <code className="font-mono text-slate-300">MainActivity.java</code>, Vaultora exposes a native <code className="font-mono text-slate-300">VaultoraAndroidKeystore</code> interface utilizing <code className="font-mono text-slate-300">KeyStore.getInstance("AndroidKeyStore")</code> with 256-bit AES-GCM hardware-backed keys (TEE / StrongBox).
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1">
                  <span className="font-semibold text-sky-300 block">OS-Level Window Hardening</span>
                  <p className="text-slate-400">
                    <code className="font-mono text-slate-300">WindowManager.LayoutParams.FLAG_SECURE</code> is enabled on the window, preventing screenshots, screencasting, and preview thumbnailing in the Android Recent Apps switcher.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Master Passphrase Rotation & In-Memory Zeroization Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rotate Master Passphrase Form */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 text-xs">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Rotate Master Passphrase & Re-encrypt Vault</h3>
              </div>
              <p className="text-[11px] text-slate-400">
                Re-encrypts all items and generates a fresh 256-bit cryptographically secure salt. Never leaves raw passwords or keys in storage.
              </p>

              <form onSubmit={handleRotateMasterPass} className="space-y-3 pt-1">
                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    Current Master Passphrase
                  </label>
                  <input
                    type="password"
                    placeholder="Enter current master passphrase..."
                    value={oldPass}
                    onChange={(e) => setOldPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[40px]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-300 block mb-1">
                    New Master Passphrase (8+ characters)
                  </label>
                  <input
                    type="password"
                    placeholder="Enter strong new master passphrase..."
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[40px]"
                  />
                </div>

                {rotationStatus.message && (
                  <div className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                    rotationStatus.type === 'success' 
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                      : 'bg-rose-950/40 border-rose-800 text-rose-300'
                  }`}>
                    {rotationStatus.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <X className="w-4 h-4 shrink-0" />}
                    <span>{rotationStatus.message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isRotating}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm transition-colors cursor-pointer min-h-[42px] flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isRotating ? 'Re-encrypting Vault (600,000 PBKDF2 iter)...' : 'Re-encrypt Vault with New Key'}</span>
                </button>
              </form>
            </div>

            {/* In-Memory Zeroization & Security Lifecycle */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 text-xs flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">In-Memory Protection & Zeroization</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Decrypted credentials and master cryptographic keys exist solely in ephemeral, non-extractable client memory while the vault is active.
                </p>

                <div className="p-3 bg-slate-950 rounded-lg font-mono text-[10px] space-y-1.5 text-slate-300">
                  <div className="text-rose-400 font-semibold">// Zeroization Protocol:</div>
                  <div>1. activeKeyRef.current = null (Drops GC reference to CryptoKey)</div>
                  <div>2. items = [] (Purges decrypted records from React state)</div>
                  <div>3. activeItem = null (Purges active credential inspector)</div>
                  <div>4. searchQuery = '' (Purges query caches)</div>
                  <div>5. navigator.clipboard buffer auto-cleared after 30s</div>
                </div>

                <p className="text-[11px] text-slate-400">
                  When you lock the vault or the inactivity timer expires, all decrypted contents are immediately expunged from volatile RAM.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={lockVault}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/80 rounded-lg transition-colors cursor-pointer min-h-[42px] flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Lock Vault Now (Zero Memory)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Session Timeout & Emergency Recovery Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Session Timeout & Auto-Lock Settings */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Session Timeout & Application Auto-Lock</h3>
                </div>
                <span className="font-mono text-emerald-400 text-[11px]">
                  Current: {lockState.autoLockMinutes} minutes
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Vaultora continuously monitors user input (<code className="font-mono text-slate-300">mousedown</code>, <code className="font-mono text-slate-300">keydown</code>, <code className="font-mono text-slate-300">touchstart</code>). If no activity occurs within the timeout window, the vault automatically locks and purges all decrypted secrets from device RAM.
              </p>

              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 15, 30, 60].map(mins => (
                  <button
                    key={mins}
                    onClick={() => setAutoLockMinutes(mins)}
                    className={`py-2 px-2.5 rounded-lg font-mono text-xs font-semibold text-center transition-all cursor-pointer border ${
                      lockState.autoLockMinutes === mins
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-500">
                Recommended: 15m for desktop workstations, 5m for shared or mobile environments.
              </p>
            </div>

            {/* Emergency Recovery & Encrypted Backup Kit Card */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 text-xs flex flex-col justify-between">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileKey2 className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Emergency Kit & Encrypted Backups</h3>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold font-mono">
                    Zero Backdoors
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your 24-word recovery phrase allows mathematical recovery on any device without server assistance. You can also export and restore encrypted <code className="font-mono text-slate-300">.vaultora</code> backup archives sealed with authenticated AES-256-GCM.
                </p>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] text-amber-300/90 flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Warning: Losing both your master passphrase and recovery kit makes encrypted records permanently unrecoverable.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setIsEmergencyKitModalOpen(true)}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors cursor-pointer min-h-[40px] flex items-center justify-center gap-2"
                >
                  <FileKey2 className="w-4 h-4" />
                  <span>Manage Emergency Kit & Encrypted Backups</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Credential Threat Analysis & Hygiene */}
      {activeSubTab === 'hygiene' && (
        <div className="space-y-6">
          {/* Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] sm:text-xs text-slate-400 block mb-1 truncate">Actionable Findings</span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {securityFindings.length}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Total issues</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-rose-950/20 border border-rose-900/60 rounded-xl">
              <span className="text-[11px] sm:text-xs text-rose-400 block mb-1 truncate">Critical Threats</span>
              <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
                {criticalIssues.length}
              </div>
              <span className="text-[10px] text-rose-400/80 mt-0.5 block truncate">Rotate immediately</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-amber-950/20 border border-amber-900/60 rounded-xl">
              <span className="text-[11px] sm:text-xs text-amber-400 block mb-1 truncate">Reused Passwords</span>
              <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
                {highIssues.length}
              </div>
              <span className="text-[10px] text-amber-400/80 mt-0.5 block truncate">Shared across accounts</span>
            </div>

            <div className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] sm:text-xs text-slate-400 block mb-1 truncate">Missing 2FA</span>
              <div className="text-2xl font-bold font-mono text-indigo-400 tabular-nums">
                {mediumIssues.length}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block truncate">Needs second factor</span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 text-xs text-nowrap">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer min-h-[36px] ${
                filterType === 'all' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Issues ({securityFindings.length})
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer min-h-[36px] ${
                filterType === 'critical' ? 'bg-rose-950/70 text-rose-300 border border-rose-800 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Critical ({criticalIssues.length})
            </button>
            <button
              onClick={() => setFilterType('reused')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer min-h-[36px] ${
                filterType === 'reused' ? 'bg-amber-950/70 text-amber-300 border border-amber-800 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Reused Passwords
            </button>
            <button
              onClick={() => setFilterType('weak')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer min-h-[36px] ${
                filterType === 'weak' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Weak Entropy
            </button>
            <button
              onClick={() => setFilterType('mfa')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer min-h-[36px] ${
                filterType === 'mfa' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Missing MFA
            </button>
            <button
              onClick={() => setFilterType('stale')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer min-h-[36px] ${
                filterType === 'stale' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Stale (&gt;120d)
            </button>
          </div>

          {/* Main List of Actionable Findings */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            <div className="lg:col-span-8 space-y-3">
              {items.length === 0 ? (
                <div className="p-8 sm:p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">Vault Health Optimal · Clean State</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                      No credentials in current view. As you add logins, Vaultora will automatically audit entropy, identify compromised passwords, and track MFA adoption.
                    </p>
                  </div>
                </div>
              ) : filteredFindings.length === 0 ? (
                <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <h3 className="text-sm font-semibold text-white">No active issues in this category</h3>
                  <p className="text-xs text-slate-400">All scanned accounts comply with hygiene standards.</p>
                </div>
              ) : (
                filteredFindings.map(finding => {
                  const item = items.find(i => i.id === finding.itemId);
                  const ws = item ? workspaces.find(w => w.id === item.workspaceId) : undefined;

                  return (
                    <div 
                      key={finding.id}
                      className={`p-3.5 sm:p-4 rounded-xl border text-xs space-y-3 transition-colors ${
                        finding.severity === 'critical' 
                          ? 'bg-rose-950/20 border-rose-900/60' 
                          : finding.severity === 'high' 
                            ? 'bg-amber-950/20 border-amber-900/60' 
                            : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              finding.severity === 'critical' ? 'bg-rose-500' : finding.severity === 'high' ? 'bg-amber-500' : 'bg-indigo-400'
                            }`} />
                            <h3 className="text-sm font-semibold text-white">
                              {finding.title}
                            </h3>
                          </div>
                          <p className="text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                            {finding.description}
                          </p>
                        </div>

                        {item && item.category === 'login' && (
                          <button
                            onClick={() => {
                              const newP = rotatePassword(item.id);
                              copyToClipboard(newP, `Rotated password for ${item.title}`);
                            }}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0 whitespace-nowrap min-h-[40px] w-full sm:w-auto"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Rotate Secret</span>
                          </button>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-slate-400">
                        <div>
                          <strong className="text-slate-300">Action:</strong> {finding.recommendation}
                        </div>
                        {ws && (
                          <span className="font-mono text-slate-500 shrink-0">
                            {ws.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Column: Privacy-Preserving Breach Simulator & Safe Architecture explainer */}
            <div className="lg:col-span-4 space-y-6">
              {/* k-Anonymity Breach Scanner */}
              <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3.5 text-xs">
                <div>
                  <h3 className="text-sm font-semibold text-white">k-Anonymity Breach Scanner</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Test any credential using privacy-preserving SHA-1 prefix matching. Raw passwords are never transmitted.
                  </p>
                </div>

                <form onSubmit={handleManualBreachCheck} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Type password to test (e.g. password123)"
                    value={testingPassword}
                    onChange={(e) => setTestingPassword(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 min-h-[44px]"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingBreach || !testingPassword}
                    className="w-full py-2.5 px-3 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors cursor-pointer min-h-[44px]"
                  >
                    {isCheckingBreach ? 'Computing SHA-1 Hash...' : 'Check Breach Status'}
                  </button>
                </form>

                {breachResult && (
                  <div className={`p-3 rounded-lg border space-y-1 ${
                    breachResult.isCompromised 
                      ? 'bg-rose-950/40 border-rose-800/80 text-rose-300' 
                      : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                  }`}>
                    <div className="font-semibold flex items-center gap-1.5">
                      {breachResult.isCompromised ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{breachResult.isCompromised ? 'Compromised in Public Breaches' : 'No Breach Matches Found'}</span>
                    </div>
                    <div className="text-[11px] opacity-90 font-mono">
                      SHA-1 Prefix: {breachResult.hashPrefix}*****
                    </div>
                    {breachResult.isCompromised && (
                      <p className="text-[11px] opacity-80 pt-0.5">
                        Found in threat corpora. This password should never be used.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Architecture Disclaimer */}
              <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-2 text-xs text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-300 block">
                  Ethical Security Notice
                </span>
                <p className="text-[11px]">
                  Vaultora provides verified cryptographic derivation and threat correlation. We do not claim an account is safe from every future attack, nor that a domain scan guarantees an account has not been compromised.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
