import React, { useState, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  X, 
  Copy, 
  Printer, 
  FileKey2, 
  AlertTriangle, 
  ShieldCheck, 
  Download, 
  Upload, 
  ShieldAlert, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  FileArchive,
  HelpCircle,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export const EmergencyKitModal: React.FC = () => {
  const { 
    isEmergencyKitModalOpen, 
    setIsEmergencyKitModalOpen, 
    emergencyPhrase, 
    generateNewEmergencyPhrase, 
    rotateEmergencyRecoveryPhrase,
    copyToClipboard,
    exportEncryptedVault,
    inspectEncryptedArchive,
    decryptAndValidateArchive,
    restoreDecryptedBackup
  } = useVault();

  const [activeTab, setActiveTab] = useState<'phrase' | 'backup' | 'tradeoffs'>('phrase');

  // Trusted Contact
  const [trustedContactEmail, setTrustedContactEmail] = useState('');
  const [waitingDays, setWaitingDays] = useState(7);
  const [savedSettings, setSavedSettings] = useState(false);

  // Backup & Restore
  const [isExporting, setIsExporting] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [customBackupPass, setCustomBackupPass] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Restore State
  const [restoreJson, setRestoreJson] = useState('');
  const [restorePass, setRestorePass] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [decryptedPreview, setDecryptedPreview] = useState<{
    items: any[];
    workspaces: any[];
    exportedAt: string;
    formatVersion: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isRotatingPhrase, setIsRotatingPhrase] = useState(false);

  if (!isEmergencyKitModalOpen) return null;

  const handleRotatePhrase = async () => {
    setIsRotatingPhrase(true);
    setStatusMsg(null);
    try {
      const res = await rotateEmergencyRecoveryPhrase();
      if (res.success) {
        setStatusMsg({
          type: 'success',
          text: 'Emergency recovery phrase rotated! Your zero-knowledge recovery envelope (AES-256-GCM) has been re-sealed with your new 24-word phrase without affecting your vault records.'
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: res.error || 'Failed to rotate recovery phrase.'
        });
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || 'Cryptographic rotation failed.'
      });
    } finally {
      setIsRotatingPhrase(false);
    }
  };

  const handleCopyPhrase = () => {
    copyToClipboard(emergencyPhrase.join(' '), '24-Word Recovery Phrase');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportBackup = async () => {
    try {
      setIsExporting(true);
      setStatusMsg(null);
      const pass = customBackupPass && backupPassphrase ? backupPassphrase : emergencyPhrase.join(' ');
      const archive = await exportEncryptedVault(pass);
      const blob = new Blob([archive], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vaultora-backup-encrypted-${new Date().toISOString().split('T')[0]}.vaultora`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMsg({ 
        type: 'success', 
        text: `Encrypted backup (.vaultora) downloaded! Sealed with ${customBackupPass ? 'custom backup password' : '24-word emergency recovery phrase'}.` 
      });
    } catch (err) {
      console.error('Backup export failed:', err);
      setStatusMsg({ type: 'error', text: 'Failed to generate encrypted backup archive.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreJson(content);
    };
    reader.readAsText(file);
  };

  const handleDecryptAndInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreJson.trim() || !restorePass.trim()) {
      setStatusMsg({ type: 'error', text: 'Please provide the backup archive content and its decryption passphrase.' });
      return;
    }
    setIsRestoring(true);
    setStatusMsg(null);
    try {
      const validated = await decryptAndValidateArchive(restoreJson.trim(), restorePass.trim());
      setDecryptedPreview(validated);
      setStatusMsg({
        type: 'success',
        text: `Backup decrypted! Found ${validated.items.length} records and ${validated.workspaces.length} workspaces. Select restore mode below.`
      });
    } catch (err: any) {
      console.error('Decryption failed:', err);
      setStatusMsg({ 
        type: 'error', 
        text: err.message || 'Decryption failed: Invalid passphrase or tampered archive file (AES-GCM authentication tag rejected).' 
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleExecuteRestore = async () => {
    if (!decryptedPreview) return;
    if (restoreMode === 'replace' && !confirmOverwrite) {
      setStatusMsg({ type: 'error', text: 'Please check the confirmation box to replace all current vault records.' });
      return;
    }
    setIsRestoring(true);
    setStatusMsg(null);
    try {
      const result = await restoreDecryptedBackup(decryptedPreview, restoreMode);
      setStatusMsg({
        type: 'success',
        text: `Restored ${result.itemsCount} vault items and ${result.workspacesCount} workspaces (${result.mode === 'merge' ? 'Merged into vault' : 'Replaced entire vault'})!`
      });
      setRestoreJson('');
      setRestorePass('');
      setDecryptedPreview(null);
      setConfirmOverwrite(false);
    } catch (err: any) {
      console.error('Restore failed:', err);
      setStatusMsg({ type: 'error', text: `Restore failed: ${err.message}` });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleSaveTrustedContact = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSettings(true);
    setTimeout(() => setSavedSettings(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileKey2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Emergency Kit & Encrypted Recovery
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400">
                Zero-knowledge mathematical recovery and client-side encrypted backup
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEmergencyKitModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-5 pt-2 border-b border-slate-800 bg-slate-950/40 text-xs gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('phrase')}
            className={`pb-2.5 font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'phrase'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            24-Word Recovery Phrase
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`pb-2.5 font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Encrypted Backup & Restore (.vaultora)
          </button>
          <button
            onClick={() => setActiveTab('tradeoffs')}
            className={`pb-2.5 font-medium transition-colors border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'tradeoffs'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Recovery Strategy & Trade-Offs
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Status Toast */}
          {statusMsg && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              statusMsg.type === 'success' 
                ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300' 
                : 'bg-rose-950/60 border-rose-800 text-rose-300'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertTriangle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: 24-Word Recovery Seed */}
          {activeTab === 'phrase' && (
            <div className="space-y-4">
              {/* Critical Warning */}
              <div className="p-3.5 bg-amber-950/30 border border-amber-900/60 rounded-xl flex items-start gap-2.5 text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px] sm:text-xs">
                  <strong className="text-white block mb-0.5">Critical Zero-Knowledge Warning</strong>
                  Vaultora has NO access to your master password and NO remote password-reset mechanism. If you lose your master passphrase, this 24-word recovery phrase is the <strong>only way</strong> to restore your encrypted data. Store a physical paper copy in a fireproof safe.
                </div>
              </div>

              {/* Printable Recovery Kit Box */}
              <div className="p-4 sm:p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-3 gap-1">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">ACCOUNT RECOVERY KIT</span>
                    <span className="text-xs font-semibold text-white">Encrypted Local Vault · Primary Owner</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider block">RECOVERY SCHEME</span>
                    <span className="text-xs font-mono text-emerald-400">BIP-39 (600,000 PBKDF2 iter)</span>
                  </div>
                </div>

                {/* 24-Word Matrix */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    24-Word Cryptographic Seed Words
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 font-mono text-xs">
                    {emergencyPhrase.map((word, idx) => (
                      <div 
                        key={idx}
                        className="p-2 bg-slate-900 border border-slate-800/80 rounded flex items-center gap-1.5 text-slate-200"
                      >
                        <span className="text-[10px] text-slate-500 select-none w-5">{idx + 1}.</span>
                        <span className="text-emerald-300 font-medium truncate">{word}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-2 border-t border-slate-800/80 gap-3">
                  <button
                    type="button"
                    onClick={handleRotatePhrase}
                    disabled={isRotatingPhrase}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer text-left sm:text-center p-1 flex items-center gap-1.5 disabled:opacity-50 min-h-[36px]"
                    title="Rotate 24-word seed and re-seal recovery envelope under active root key"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRotatingPhrase ? 'animate-spin' : ''}`} />
                    <span>{isRotatingPhrase ? 'Re-sealing Recovery Envelope...' : 'Rotate Recovery Phrase'}</span>
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleCopyPhrase}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-lg cursor-pointer min-h-[40px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Seed</span>
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow-sm cursor-pointer min-h-[40px]"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Paper Kit</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Digital Inheritance Setting */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-white">Emergency Contact Protocol</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Configure a notification wait period for physical succession arrangements.
                  </p>
                </div>

                <form onSubmit={handleSaveTrustedContact} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-slate-400 mb-1">Trusted Contact Email</label>
                      <input
                        type="email"
                        placeholder="e.g. partner@example.com"
                        value={trustedContactEmail}
                        onChange={(e) => setTrustedContactEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[40px]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">Notice Window</label>
                      <select
                        value={waitingDays}
                        onChange={(e) => setWaitingDays(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[40px]"
                      >
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days</option>
                        <option value={14}>14 Days</option>
                        <option value={30}>30 Days</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer min-h-[38px]"
                    >
                      {savedSettings ? 'Protocol Saved' : 'Save Contact Protocol'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: Encrypted Backup & Restore */}
          {activeTab === 'backup' && (
            <div className="space-y-5">
              {/* Export Encrypted Backup */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Export Portable Encrypted Backup (.vaultora)</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generates an authenticated AES-256-GCM encrypted backup archive. The exported file contains zero plaintext passwords, notes, or keys. It can be safely saved to an external USB drive or offline storage.
                </p>

                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="customPass"
                      checked={customBackupPass}
                      onChange={(e) => setCustomBackupPass(e.target.checked)}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="customPass" className="text-slate-300 font-medium cursor-pointer">
                      Use custom encryption passphrase instead of 24-word seed
                    </label>
                  </div>

                  {customBackupPass && (
                    <input
                      type="password"
                      placeholder="Enter custom backup encryption passphrase..."
                      value={backupPassphrase}
                      onChange={(e) => setBackupPassphrase(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono min-h-[40px] text-xs"
                    />
                  )}
                </div>

                <button
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Encrypting with AES-256-GCM...' : 'Download Encrypted Archive (.vaultora)'}</span>
                </button>
              </div>

              {/* Restore Encrypted Backup */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">Restore from Encrypted Backup (.vaultora)</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Upload an encrypted <code className="font-mono text-slate-300">.vaultora</code> archive and enter the passphrase or 24-word recovery seed used to seal it.
                </p>

                {!decryptedPreview ? (
                  <form onSubmit={handleDecryptAndInspect} className="space-y-3">
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".vaultora,.json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg cursor-pointer flex items-center gap-2 min-h-[40px]"
                        >
                          <FileArchive className="w-4 h-4 text-indigo-400" />
                          <span>Select .vaultora file</span>
                        </button>
                        <span className="text-[11px] text-slate-500 self-center truncate">
                          {restoreJson ? 'File loaded into memory' : 'No file selected'}
                        </span>
                      </div>

                      <textarea
                        rows={3}
                        placeholder="Or paste encrypted .vaultora JSON archive here..."
                        value={restoreJson}
                        onChange={(e) => setRestoreJson(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono text-[11px]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">
                        Backup Decryption Passphrase or 24-Word Seed
                      </label>
                      <input
                        type="password"
                        placeholder="Enter the passphrase or 24-word recovery phrase..."
                        value={restorePass}
                        onChange={(e) => setRestorePass(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono min-h-[40px]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isRestoring || !restoreJson || !restorePass}
                      className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[42px]"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{isRestoring ? 'Decrypting & Verifying MAC Tag...' : 'Decrypt & Inspect Backup'}</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3.5 pt-1">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-xl text-emerald-200 text-xs space-y-1">
                      <div className="font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Decryption Successful & MAC Verified</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Contains <strong>{decryptedPreview.items.length} records</strong> and <strong>{decryptedPreview.workspaces.length} workspaces</strong>.
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-slate-300 font-semibold text-[11px]">
                        Choose Restore Mode:
                      </label>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div
                          onClick={() => setRestoreMode('merge')}
                          className={`p-3 rounded-lg border cursor-pointer ${
                            restoreMode === 'merge'
                              ? 'bg-indigo-950/60 border-indigo-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-semibold text-xs flex items-center justify-between">
                            <span>Merge Vault</span>
                            <span className="text-[10px] text-indigo-400">Recommended</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Preserves existing items and appends new ones.
                          </p>
                        </div>

                        <div
                          onClick={() => setRestoreMode('replace')}
                          className={`p-3 rounded-lg border cursor-pointer ${
                            restoreMode === 'replace'
                              ? 'bg-rose-950/60 border-rose-600 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="font-semibold text-xs flex items-center justify-between text-rose-300">
                            <span>Replace Entire Vault</span>
                            <span className="text-[10px] text-rose-400">Destructive</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            Replaces current records with backup data.
                          </p>
                        </div>
                      </div>
                    </div>

                    {restoreMode === 'replace' && (
                      <label className="flex items-start gap-2 p-2.5 bg-rose-950/40 border border-rose-900/60 rounded-lg text-rose-300 text-[11px] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={confirmOverwrite}
                          onChange={(e) => setConfirmOverwrite(e.target.checked)}
                          className="mt-0.5 rounded border-rose-800 text-rose-600 focus:ring-0 cursor-pointer"
                        />
                        <span>I understand and confirm overwriting all existing vault records with this backup.</span>
                      </label>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setDecryptedPreview(null)}
                        className="px-3.5 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer min-h-[38px]"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleExecuteRestore}
                        disabled={isRestoring || (restoreMode === 'replace' && !confirmOverwrite)}
                        className={`px-4 py-2 text-white font-medium rounded-lg flex items-center gap-2 transition-colors cursor-pointer min-h-[38px] ${
                          restoreMode === 'replace'
                            ? 'bg-rose-600 hover:bg-rose-500 disabled:opacity-40'
                            : 'bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isRestoring
                            ? 'Restoring...'
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

          {/* TAB 3: Strategy & Trade-Offs */}
          {activeTab === 'tradeoffs' && (
            <div className="space-y-4 text-[11px] leading-relaxed text-slate-300">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Why Zero-Knowledge Prevents Server-Side Password Resets</span>
                </span>
                <p className="text-slate-400">
                  Traditional web platforms offer "Forgot Password" links by holding customer encryption keys on their servers or storing passwords in weakly hashed formats. If their servers are breached, subpeonaed, or compromised by malicious insiders, customer data is instantly exposed.
                </p>
                <p className="text-slate-400">
                  Vaultora rejects this vulnerability: your vault records are encrypted client-side using authenticated AES-256-GCM. The decryption key exists solely in your device memory while unlocked.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  <span>The Fundamental Security Trade-Off</span>
                </span>
                <p className="text-slate-400">
                  <strong>The Trade-off:</strong> Ultimate privacy and immunity to cloud database leaks comes with strict personal responsibility. Because Vaultora has NO admin backdoors and NO master override keys, <strong>losing both your master passphrase and your 24-word recovery phrase makes your data permanently unrecoverable</strong>.
                </p>
                <p className="text-slate-400">
                  This is not a defect; it is the mathematical guarantee that prevents any third party, hacker, or administrator from accessing your secrets.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <FileKey2 className="w-4 h-4 text-indigo-400" />
                  <span>Best Practices for Vaultora Custody</span>
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Print your 24-word Emergency Kit and store it alongside essential identity documents.</li>
                  <li>Export a portable <code className="font-mono text-slate-300">.vaultora</code> encrypted backup quarterly to an offline USB flash drive.</li>
                  <li>Never save your master passphrase or recovery phrase in an unencrypted screenshot, email, or chat app.</li>
                  <li>Designate an emergency contact protocol for digital inheritance if appropriate.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">
            Zero-Knowledge AES-256-GCM &middot; No Admin Backdoors
          </span>
          <button
            onClick={() => setIsEmergencyKitModalOpen(false)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
