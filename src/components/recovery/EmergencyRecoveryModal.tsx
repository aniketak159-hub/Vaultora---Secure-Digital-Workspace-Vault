import React, { useState, useMemo, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  X, 
  FileKey2, 
  AlertCircle, 
  CheckCircle2, 
  KeyRound, 
  ShieldCheck, 
  Upload, 
  FileArchive,
  ArrowRight,
  RefreshCw,
  Lock
} from 'lucide-react';
import { 
  validateRecoveryPhrase, 
  RECOVERY_WORDS 
} from '../../crypto/cryptoService';

interface EmergencyRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyRecoveryModal: React.FC<EmergencyRecoveryModalProps> = ({ isOpen, onClose }) => {
  const { 
    recoverVaultWithPhrase, 
    decryptAndValidateArchive, 
    restoreDecryptedBackup,
    changeMasterPassphrase,
    lockVault
  } = useVault();

  const [activeTab, setActiveTab] = useState<'device' | 'backup'>('device');
  const [phraseInput, setPhraseInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    itemsCount: number;
    workspacesCount: number;
    mode: 'device' | 'backup';
  } | null>(null);

  // New master passphrase setup after successful recovery
  const [newMasterPass, setNewMasterPass] = useState('');
  const [confirmMasterPass, setConfirmMasterPass] = useState('');
  const [isSettingNewPass, setIsSettingNewPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState(false);

  // Backup restore state
  const [backupJson, setBackupJson] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Real-time phrase analysis
  const phraseAnalysis = useMemo(() => {
    return validateRecoveryPhrase(phraseInput);
  }, [phraseInput]);

  if (!isOpen) return null;

  const handleDeviceRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!phraseAnalysis.isValid) {
      setErrorMessage(phraseAnalysis.error || 'Please enter a valid 24-word recovery phrase.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await recoverVaultWithPhrase(phraseAnalysis.normalizedPhrase);
      if (result.success) {
        setSuccessInfo({
          itemsCount: result.itemsCount ?? 0,
          workspacesCount: result.workspacesCount ?? 1,
          mode: 'device'
        });
      } else {
        setErrorMessage(
          result.error || 
          'Recovery failed: The supplied 24-word phrase could not decrypt this local vault. If you have an encrypted .vaultora backup archive, switch to the "Restore Encrypted Backup" tab.'
        );
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Decryption failed: Invalid key material or corrupted vault data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setBackupJson((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleBackupRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!phraseInput.trim()) {
      setErrorMessage('Please enter the 24-word phrase or passphrase used to seal the backup.');
      return;
    }

    if (!backupJson.trim()) {
      setErrorMessage('Please select or paste an encrypted .vaultora backup file.');
      return;
    }

    setIsProcessing(true);
    try {
      const normalizedPass = phraseAnalysis.isValid 
        ? phraseAnalysis.normalizedPhrase 
        : phraseInput.trim();

      const validated = await decryptAndValidateArchive(backupJson.trim(), normalizedPass);
      const restored = await restoreDecryptedBackup(validated, 'replace');

      setSuccessInfo({
        itemsCount: restored.itemsCount,
        workspacesCount: restored.workspacesCount,
        mode: 'backup'
      });
    } catch (err: any) {
      setErrorMessage(
        err.message || 
        'Decryption failed: Invalid passphrase or corrupted archive (AES-256-GCM authentication tag rejected).'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetNewMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');

    if (!newMasterPass || newMasterPass.length < 8) {
      setPassError('New master passphrase must be at least 8 characters long.');
      return;
    }

    if (newMasterPass !== confirmMasterPass) {
      setPassError('Passphrases do not match. Please verify typing.');
      return;
    }

    setIsSettingNewPass(true);
    try {
      // Re-encrypt vault under the new master passphrase
      const success = await changeMasterPassphrase(newMasterPass);
      if (success) {
        setPassSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setPassError('Failed to re-encrypt vault with new passphrase.');
      }
    } catch (err: any) {
      setPassError(err.message || 'Error rotating master passphrase.');
    } finally {
      setIsSettingNewPass(false);
    }
  };

  const handleFinishAndEnter = () => {
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md text-slate-100 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <FileKey2 className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Emergency Vault Recovery
              </h2>
              <p className="text-xs text-slate-400">
                Zero-knowledge mathematical decryption via 24-word emergency seed
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection (only if not yet recovered) */}
        {!successInfo && (
          <div className="flex px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
            <button
              onClick={() => { setActiveTab('device'); setErrorMessage(''); }}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === 'device'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Recover Local Vault
            </button>
            <button
              onClick={() => { setActiveTab('backup'); setErrorMessage(''); }}
              className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
                activeTab === 'backup'
                  ? 'border-emerald-500 text-white font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Restore Encrypted Backup (.vaultora)
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {/* STEP 1: Recovery Input Form */}
          {!successInfo ? (
            activeTab === 'device' ? (
              <form onSubmit={handleDeviceRecovery} className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="text-slate-300 font-medium">
                      24-Word Emergency Seed Phrase
                    </label>
                    <span className={`font-mono text-[11px] px-2 py-0.5 rounded ${
                      phraseAnalysis.normalizedWords.length === 24 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {phraseAnalysis.normalizedWords.length} / 24 words
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Enter or paste the 24 words from your Emergency Kit in sequential order. Whitespace, line breaks, and capitalization are automatically normalized.
                  </p>

                  <textarea
                    rows={4}
                    autoFocus
                    placeholder="e.g. abandon ability able about above absent absorb abstract absurd abuse access accident..."
                    value={phraseInput}
                    onChange={(e) => {
                      setPhraseInput(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
                  />
                </div>

                {/* Live validation feedback */}
                {phraseAnalysis.invalidWords.length > 0 && (
                  <div className="p-2.5 bg-amber-950/40 border border-amber-900/60 rounded-lg text-[11px] text-amber-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong>Unrecognized word(s):</strong>{' '}
                      {phraseAnalysis.invalidWords.join(', ')}. Please verify spelling against the Vaultora recovery dictionary.
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      {errorMessage}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-h-[42px]"
                  >
                    Return to Unlock
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing || !phraseAnalysis.isValid}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Deriving Keys (600,000 PBKDF2)...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Recover Vault Access</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: Restore from Encrypted Backup */
              <form onSubmit={handleBackupRecovery} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-slate-300 font-medium block text-xs">
                    Select Encrypted Backup File (.vaultora)
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".vaultora,.json"
                    onChange={handleBackupFileSelect}
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
                    <span className="text-[11px] text-slate-400 self-center truncate">
                      {backupJson ? 'Backup loaded into memory' : 'No file chosen'}
                    </span>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="Or paste contents of encrypted .vaultora backup archive here..."
                    value={backupJson}
                    onChange={(e) => setBackupJson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-white font-mono placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-300 font-medium block text-xs">
                    24-Word Emergency Seed Phrase or Backup Password
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter 24-word recovery seed or custom backup password..."
                    value={phraseInput}
                    onChange={(e) => setPhraseInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono placeholder-slate-500"
                  />
                </div>

                {errorMessage && (
                  <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      {errorMessage}
                    </div>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer min-h-[42px]"
                  >
                    Return to Unlock
                  </button>

                  <button
                    type="submit"
                    disabled={isProcessing || !backupJson.trim() || !phraseInput.trim()}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2 min-h-[42px]"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Decrypting Backup...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Restore & Decrypt Backup</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )
          ) : (
            /* STEP 2: Vault Successfully Decrypted - Option to Set New Master Passphrase */
            <div className="space-y-5">
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/80 rounded-xl text-xs space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Vault Decrypted & MAC Verified Successfully!</span>
                </div>
                <p className="text-slate-300 leading-relaxed text-[11px]">
                  Restored access to <strong>{successInfo.itemsCount} credentials</strong> across{' '}
                  <strong>{successInfo.workspacesCount} workspaces</strong>. All client-side authenticated AES-256-GCM verification tags verified OK.
                </p>
              </div>

              {/* Set New Master Passphrase Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3.5">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-semibold text-white">
                    Set New Master Passphrase (Recommended)
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Now that your vault is unsealed, establish a fresh master passphrase to re-encrypt your vault and restore standard daily login.
                </p>

                <form onSubmit={handleSetNewMasterPassword} className="space-y-3">
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">
                      New Master Passphrase (min 8 characters)
                    </label>
                    <input
                      type="password"
                      placeholder="Enter strong new master passphrase..."
                      value={newMasterPass}
                      onChange={(e) => setNewMasterPass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500 min-h-[40px]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1">
                      Confirm New Master Passphrase
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new master passphrase..."
                      value={confirmMasterPass}
                      onChange={(e) => setConfirmMasterPass(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-indigo-500 min-h-[40px]"
                    />
                  </div>

                  {passError && (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-[11px] text-rose-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{passError}</span>
                    </div>
                  )}

                  {passSuccess && (
                    <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/80 rounded-lg text-[11px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Master passphrase updated and vault re-sealed under new key!</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleFinishAndEnter}
                      className="px-4 py-2 text-slate-400 hover:text-white transition-colors cursor-pointer text-center min-h-[40px]"
                    >
                      Enter Vault Directly
                    </button>

                    <button
                      type="submit"
                      disabled={isSettingNewPass || passSuccess}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[40px]"
                    >
                      {isSettingNewPass ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Re-encrypting Vault...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Save & Re-encrypt Vault</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500 font-mono">
            Zero-Knowledge AES-256-GCM &middot; Local Cryptographic Recovery
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
