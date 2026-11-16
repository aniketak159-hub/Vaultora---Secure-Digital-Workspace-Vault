import React, { useState, useEffect } from 'react';
import { useVault } from '../../context/VaultContext';
import { X, Copy, RotateCcw, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { 
  generateSecureSecret, 
  evaluatePasswordStrength, 
  PasswordGeneratorOptions, 
  PasswordStrength 
} from '../../crypto/cryptoService';

export const PasswordGeneratorModal: React.FC = () => {
  const { isGeneratorModalOpen, setIsGeneratorModalOpen, copyToClipboard } = useVault();

  const [mode, setMode] = useState<'password' | 'passphrase'>('password');
  const [length, setLength] = useState(20);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true);

  // Passphrase options
  const [wordCount, setWordCount] = useState(4);
  const [wordSeparator, setWordSeparator] = useState('-');
  const [capitalizeWords, setCapitalizeWords] = useState(true);

  const [currentSecret, setCurrentSecret] = useState('');
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  const handleRegenerate = () => {
    const opts: PasswordGeneratorOptions = {
      mode,
      length,
      useUpper,
      useLower,
      useNumbers,
      useSymbols,
      avoidAmbiguous,
      wordCount,
      wordSeparator,
      capitalizeWords
    };
    const secret = generateSecureSecret(opts);
    setCurrentSecret(secret);
    setStrength(evaluatePasswordStrength(secret));
  };

  useEffect(() => {
    if (isGeneratorModalOpen) {
      handleRegenerate();
    }
  }, [isGeneratorModalOpen, mode, length, useUpper, useLower, useNumbers, useSymbols, avoidAmbiguous, wordCount, wordSeparator, capitalizeWords]);

  if (!isGeneratorModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cryptographic Secret Generator</h2>
              <p className="text-xs text-slate-400">High-entropy randomness via Web Crypto</p>
            </div>
          </div>
          <button
            onClick={() => setIsGeneratorModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs">
          {/* Secret Display Box */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">Generated Value</span>
              {strength && (
                <span className={`font-mono text-[11px] tabular-nums font-semibold ${
                  strength.score >= 3 ? 'text-emerald-400' : strength.score === 2 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {strength.entropyBits} bits entropy ({strength.label})
                </span>
              )}
            </div>

            <div className="font-mono text-sm text-slate-100 break-all select-all leading-relaxed p-2 bg-slate-900/80 rounded border border-slate-800/80">
              {currentSecret}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 font-mono">
                Est. crack time: {strength?.crackTimeEstimate || 'Instant'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Generate New"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(currentSecret, 'Generated Secret')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Secret</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mode Selector */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-1.5 rounded-md font-medium text-center cursor-pointer transition-colors ${
                mode === 'password' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Random Password
            </button>
            <button
              onClick={() => setMode('passphrase')}
              className={`flex-1 py-1.5 rounded-md font-medium text-center cursor-pointer transition-colors ${
                mode === 'passphrase' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Memorable Passphrase
            </button>
          </div>

          {/* Controls */}
          {mode === 'password' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Password Length</span>
                  <span className="font-mono text-white font-semibold tabular-nums">{length} characters</span>
                </div>
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useUpper}
                    onChange={(e) => setUseUpper(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useLower}
                    onChange={(e) => setUseLower(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Lowercase (a-z)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Symbols (!@#$%)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer col-span-2">
                  <input
                    type="checkbox"
                    checked={avoidAmbiguous}
                    onChange={(e) => setAvoidAmbiguous(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                  />
                  <span>Avoid ambiguous characters (1, l, I, 0, O)</span>
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Word Count</span>
                  <span className="font-mono text-white font-semibold tabular-nums">{wordCount} words</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={8}
                  value={wordCount}
                  onChange={(e) => setWordCount(Number(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">Word Separator</label>
                  <select
                    value={wordSeparator}
                    onChange={(e) => setWordSeparator(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="-">Hyphen (-)</option>
                    <option value=".">Period (.)</option>
                    <option value="_">Underscore (_)</option>
                    <option value=" ">Space ( )</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={capitalizeWords}
                      onChange={(e) => setCapitalizeWords(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                    />
                    <span>Capitalize Words</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
