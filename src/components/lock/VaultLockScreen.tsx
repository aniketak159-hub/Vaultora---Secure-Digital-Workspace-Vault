import React, { useState, useEffect, useRef } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Lock, 
  Fingerprint, 
  KeyRound, 
  AlertCircle, 
  FileKey2, 
  Timer,
  Eye,
  EyeOff,
  ShieldCheck
} from 'lucide-react';

export const VaultLockScreen: React.FC = () => {
  const { 
    lockState, 
    unlockVault, 
    setIsRecoveryModalOpen, 
    storageDiagnostics,
    isVaultInitialized,
    initializeNewVault
  } = useVault();

  const [passphrase, setPassphrase] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initial vault setup state (when starting clean)
  const [setupPassphrase, setSetupPassphrase] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');

  // Rate limiting / Throttling state for safe handling of incorrect attempts
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return Number(sessionStorage.getItem('vaultora_lock_failed_attempts') || 0);
    } catch {
      return 0;
    }
  });
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle cooldown timer countdown
  useEffect(() => {
    if (lockoutRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setLockoutRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockoutRemaining]);

  if (!lockState.isLocked) return null;

  const calculateLockoutSeconds = (attempts: number): number => {
    if (attempts >= 10) return 60;
    if (attempts >= 7) return 30;
    if (attempts >= 5) return 15;
    if (attempts >= 3) return 5;
    return 0;
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutRemaining > 0) return;

    const trimmed = passphrase.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your master passphrase.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const success = await unlockVault(trimmed);
      if (success) {
        setFailedAttempts(0);
        try {
          sessionStorage.removeItem('vaultora_lock_failed_attempts');
        } catch {}
      } else {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);
        try {
          sessionStorage.setItem('vaultora_lock_failed_attempts', String(newAttempts));
        } catch {}

        const cooldown = calculateLockoutSeconds(newAttempts);
        if (cooldown > 0) {
          setLockoutRemaining(cooldown);
          setErrorMsg(`Authentication failed: Incorrect master passphrase. Rate limiting active: please wait ${cooldown} seconds.`);
        } else {
          setErrorMsg(`Authentication failed: Incorrect master passphrase. Attempt ${newAttempts}.`);
        }
      }
    } catch {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      const cooldown = calculateLockoutSeconds(newAttempts);
      if (cooldown > 0) setLockoutRemaining(cooldown);
      setErrorMsg('Cryptographic decryption failed: Invalid key material.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInitializeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!setupPassphrase || setupPassphrase.length < 8) {
      setErrorMsg('Master passphrase must be at least 8 characters long.');
      return;
    }

    if (setupPassphrase !== setupConfirm) {
      setErrorMsg('Passphrases do not match. Please verify typing.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await initializeNewVault(setupPassphrase);
      if (!success) {
        setErrorMsg('Failed to initialize vault. Please try again.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Initialization failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricUnlock = async () => {
    if (lockoutRemaining > 0) return;
    setErrorMsg('');

    const isAndroidKeystore = typeof window !== 'undefined' && 
      (window as any).VaultoraAndroidKeystore && 
      typeof (window as any).VaultoraAndroidKeystore.isKeystoreAvailable === 'function' &&
      (window as any).VaultoraAndroidKeystore.isKeystoreAvailable();

    if (isAndroidKeystore) {
      setErrorMsg('Hardware biometrics are active. Please enter your master passphrase once to authenticate this session.');
    } else {
      setErrorMsg('Hardware biometrics (TEE / StrongBox) are available in the native Android application. In browser sessions, please enter your master passphrase.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/95 backdrop-blur-md text-slate-100 overflow-y-auto">
      <div className="w-full max-w-md my-8 space-y-5">
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
            <Lock className="w-6 h-6 stroke-[2.2]" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            {isVaultInitialized ? 'Vaultora Locked' : 'Initialize Vaultora'}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            {isVaultInitialized
              ? 'Your zero-knowledge encrypted digital workspace and vault.'
              : 'Create a master passphrase to seal and protect your private zero-knowledge vault.'}
          </p>
        </div>

        {/* Card */}
        <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl space-y-4">
          {/* Rate Limiting Active Banner */}
          {lockoutRemaining > 0 && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2.5 animate-pulse">
              <Timer className="w-4 h-4 text-rose-400 shrink-0" />
              <div>
                <strong className="block text-white">Brute-Force Rate Limiting Active</strong>
                <span>Please wait {lockoutRemaining} seconds before trying again ({failedAttempts} failed attempts).</span>
              </div>
            </div>
          )}

          {isVaultInitialized ? (
            /* UNLOCK FORM */
            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="text-slate-300 font-medium">Master Passphrase</label>
                  <span className="text-[11px] text-emerald-400 font-mono">PBKDF2 SHA-256</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoFocus
                    disabled={lockoutRemaining > 0 || isSubmitting}
                    placeholder="Enter your master passphrase..."
                    value={passphrase}
                    onChange={(e) => {
                      setPassphrase(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono min-h-[44px] disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                    title={showPassword ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || lockoutRemaining > 0 || !passphrase.trim()}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {lockoutRemaining > 0 
                    ? `Locked for ${lockoutRemaining}s` 
                    : isSubmitting 
                      ? 'Deriving Keys...' 
                      : 'Unlock Vault'}
                </span>
              </button>
            </form>
          ) : (
            /* SETUP / INITIALIZATION FORM */
            <form onSubmit={handleInitializeSetup} className="space-y-4">
              <div>
                <label className="text-slate-300 font-medium block text-xs mb-1.5">
                  Create Master Passphrase (min 8 characters)
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="Create strong master passphrase..."
                  value={setupPassphrase}
                  onChange={(e) => setSetupPassphrase(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono min-h-[44px]"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block text-xs mb-1.5">
                  Confirm Master Passphrase
                </label>
                <input
                  type="password"
                  placeholder="Re-enter master passphrase to confirm..."
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono min-h-[44px]"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-950/40 border border-rose-800/80 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !setupPassphrase || !setupConfirm}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg shadow-sm shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSubmitting ? 'Initializing Vault (600,000 PBKDF2)...' : 'Create Vault & Generate Emergency Kit'}
                </span>
              </button>
            </form>
          )}

          {/* Biometric / Hardware Keystore Option */}
          {isVaultInitialized && (
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={handleBiometricUnlock}
                disabled={isSubmitting || lockoutRemaining > 0}
                className="w-full py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2 min-h-[40px] disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-indigo-400" />
                <span>
                  {storageDiagnostics.androidKeystoreBridge.available 
                    ? 'Unlock with Android KeyStore (TEE / StrongBox)' 
                    : 'Biometric Unlock (Hardware Keystore / WebAuthn)'}
                </span>
              </button>
            </div>
          )}

          {/* Emergency Kit Recovery Access */}
          <div className="text-center pt-1 border-t border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsRecoveryModalOpen(true)}
              className="text-xs text-slate-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer py-1"
            >
              <FileKey2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Recover via 24-Word Emergency Seed Phrase</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
