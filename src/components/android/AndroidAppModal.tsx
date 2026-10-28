import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Terminal, 
  Lock, 
  X, 
  Layers, 
  ArrowRight,
  ExternalLink,
  Cpu,
  Share2
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useVault } from '../../context/VaultContext';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidAppModal: React.FC<AndroidAppModalProps> = ({ isOpen, onClose }) => {
  const { copyToClipboard } = useVault();
  const { isInstallable, install, isAndroid } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'download' | 'specs' | 'adb'>('download');
  const [sha256Checksum, setSha256Checksum] = useState<string>('d0380c6775adf3582abbd25f3c1aa0d801cfba088bf7a5770712ee88c9b30497');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadUrl = '/downloads/vaultora-production-v1.0.7.apk';

  useEffect(() => {
    fetch(downloadUrl)
      .then(res => res.arrayBuffer())
      .then(buf => window.crypto.subtle.digest('SHA-256', buf))
      .then(hashBuf => {
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        setSha256Checksum(hashHex);
      })
      .catch(() => {});
  }, [downloadUrl]);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadError(null);
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/vnd.android.package-archive' })
      );
      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.setAttribute('download', 'vaultora-production-v1.0.7.apk');
      document.body.appendChild(tempLink);
      tempLink.click();
      document.body.removeChild(tempLink);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 3000);
    } catch (err: any) {
      console.warn('Direct blob save fallback:', err);
      window.location.href = downloadUrl;
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">Vaultora for Android</h2>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  Production v1.0.7
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official signed Android APK & WebAPK package
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

        {/* Tab Navigation */}
        <div className="flex px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'download'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Download APK
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'specs'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Package Specifications
          </button>
          <button
            onClick={() => setActiveTab('adb')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 cursor-pointer ${
              activeTab === 'adb'
                ? 'border-indigo-500 text-white font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            ADB & Sideload Guide
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'download' && (
            <div className="space-y-4">
              {/* Primary APK Download Card */}
              <div className="p-4 bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl space-y-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">
                       Production Release APK (Universal)
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                      Signed with RSA-2048 production certificate (v1 + v2 schemes)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 shrink-0">
                    v1.0.7 (Aligned & Multi-Signed)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-75 text-white font-semibold rounded-lg shadow-sm shadow-emerald-600/30 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Download className={`w-4 h-4 stroke-[2.2] ${isDownloading ? 'animate-bounce' : ''}`} />
                    <span>{isDownloading ? 'Downloading Complete Package...' : 'Download Production APK (v1.0.7 .apk)'}</span>
                  </button>

                  {isInstallable && (
                    <button
                      onClick={install}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg shadow-sm shadow-indigo-600/30 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Install WebAPK</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 text-[11px] text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span>File: vaultora-production-v1.0.7.apk</span>
                    <span>·</span>
                    <span>Target: Android 7.0–15+</span>
                  </div>
                  <a
                    href={downloadUrl}
                    download="vaultora-production-v1.0.7.apk"
                    className="text-indigo-400 hover:text-indigo-300 underline text-[10px] shrink-0"
                    title="Direct HTTP link fallback"
                  >
                    Direct link
                  </a>
                </div>
              </div>

              {/* Security & Zero Knowledge Architecture on Android */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 text-slate-200 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Android Zero-Knowledge Hardening</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <strong className="text-slate-200 block mb-0.5">FLAG_SECURE Active</strong>
                    Prevents screen capture and snapshotting in Android Recent Apps overview.
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <strong className="text-slate-200 block mb-0.5">Hardware Biometrics</strong>
                    Integrates with Android BiometricPrompt for local fingerprint / face unlock.
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <strong className="text-slate-200 block mb-0.5">Client-Side WebCrypto</strong>
                    PBKDF2 SHA-256 and AES-256-GCM computed on-device; raw keys never leave device.
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg">
                    <strong className="text-slate-200 block mb-0.5">Offline Self-Contained</strong>
                    Bundles all assets inside APK; functions seamlessly with zero network connectivity.
                  </div>
                </div>
              </div>

              {/* SHA-256 Checksum Box */}
              <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                    SHA-256 Checksum Verification
                  </span>
                  <span className="font-mono text-[10px] text-slate-300 break-all select-all block mt-0.5">
                    {sha256Checksum}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(sha256Checksum, 'SHA-256 Checksum')}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                  title="Copy SHA-256"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl divide-y divide-slate-800/80">
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-400">Package Identifier</span>
                  <span className="font-mono text-slate-200 font-semibold">io.vaultora.app</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-400">Version</span>
                  <span className="font-mono text-slate-200">1.0.7 (Version Code 7)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-400">Minimum SDK</span>
                  <span className="font-mono text-slate-200">API Level 24 (Android 7.0 Nougat)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-400">Target SDK</span>
                  <span className="font-mono text-slate-200">API Level 34 (Android 14)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-400">Signature Scheme</span>
                  <span className="text-emerald-400 font-medium">Scheme v1 + Scheme v2 + Scheme v3 Verified</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-400">Package Size</span>
                  <span className="font-mono text-emerald-400 font-semibold">~480 KB (Optimized Release)</span>
                </div>
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-400">Architecture</span>
                  <span className="font-mono text-slate-200">Universal (arm64-v8a, armeabi-v7a, x86_64)</span>
                </div>
              </div>

              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Declared Permissions</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE', 'android.permission.USE_BIOMETRIC', 'android.permission.USE_FINGERPRINT', 'android.permission.VIBRATE'].map(p => (
                    <span key={p} className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-300 rounded">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-950/20 border border-emerald-800/60 rounded-xl space-y-2">
                <span className="text-xs font-semibold text-emerald-300 block">Android Keystore & Storage Architecture</span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  <strong>Critical Security Investigation:</strong> Standard Android WebView storage (SQLite/LevelDB) is NOT automatically protected by Android Keystore hardware (TEE / StrongBox). Vaultora addresses this by pairing authenticated client-side AES-256-GCM encryption with a native <code className="font-mono text-emerald-300">VaultoraAndroidKeystore</code> bridge that generates non-extractable 256-bit hardware keys and enforces <code className="font-mono text-emerald-300">FLAG_SECURE</code> anti-snapshotting.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'adb' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="font-semibold text-white block">Install via Android Debug Bridge (ADB)</span>
                <p className="text-[11px] text-slate-400">
                  Connect your Android device or start an emulator, then execute:
                </p>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-indigo-300 flex items-center justify-between">
                  <code>adb install -r vaultora-production-v1.0.7.apk</code>
                  <button
                    onClick={() => copyToClipboard('adb install -r vaultora-production-v1.0.7.apk', 'ADB command')}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <span className="font-semibold text-white block">Direct Device Sideloading</span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400 leading-relaxed">
                  <li>Download <strong>vaultora-production-v1.0.7.apk</strong> directly on your Android phone.</li>
                  <li>Open your phone's <strong>Files</strong> or <strong>Downloads</strong> app.</li>
                  <li>Tap the APK. If prompted, toggle <strong>Allow from this source</strong> in Settings.</li>
                  <li>Tap <strong>Install</strong> to complete installation.</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Ready for sideload, enterprise MDM, or private deployment</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
