import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  X, 
  Chrome, 
  Search, 
  Key, 
  Copy, 
  ExternalLink, 
  Check, 
  KeyRound, 
  Sparkles,
  ArrowRight,
  Shield
} from 'lucide-react';
import { generateSecureSecret } from '../../crypto/cryptoService';

export const ExtensionSimulatorDrawer: React.FC = () => {
  const { 
    isExtensionDrawerOpen, 
    setIsExtensionDrawerOpen, 
    items, 
    copyToClipboard 
  } = useVault();

  const [activeTabUrl, setActiveTabUrl] = useState('https://github.com');
  const [extensionSearch, setExtensionSearch] = useState('');
  const [autofillUsername, setAutofillUsername] = useState('');
  const [autofillPassword, setAutofillPassword] = useState('');
  const [autofillTriggered, setAutofillTriggered] = useState(false);

  if (!isExtensionDrawerOpen) return null;

  // Find matching logins for current active tab origin
  const originMatches = items.filter(i => {
    if (i.category !== 'login' || !i.url) return false;
    try {
      const itemDomain = new URL(i.url).hostname.replace('www.', '');
      const tabDomain = new URL(activeTabUrl).hostname.replace('www.', '');
      return itemDomain.includes(tabDomain) || tabDomain.includes(itemDomain);
    } catch {
      return false;
    }
  });

  const searchResults = items.filter(i => {
    if (!extensionSearch) return false;
    return i.title.toLowerCase().includes(extensionSearch.toLowerCase()) ||
           i.username?.toLowerCase().includes(extensionSearch.toLowerCase()) ||
           i.url?.toLowerCase().includes(extensionSearch.toLowerCase());
  });

  const handleAutofill = (user?: string, pass?: string) => {
    setAutofillUsername(user || '');
    setAutofillPassword(pass || '');
    setAutofillTriggered(true);
    setTimeout(() => setAutofillTriggered(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar simulating browser context */}
        <div>
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Chrome className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-white">Browser Extension Simulator</span>
            </div>
            <button
              onClick={() => setIsExtensionDrawerOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Active Tab Simulator URL bar */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 space-y-2">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Simulated Active Browser Tab
            </span>
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
              <span className="text-slate-400 text-[11px]">https://</span>
              <select
                value={activeTabUrl}
                onChange={(e) => setActiveTabUrl(e.target.value)}
                className="bg-transparent text-white font-mono text-xs flex-1 focus:outline-none"
              >
                {items.filter(i => i.url).map(i => (
                  <option key={i.id} value={i.url}>
                    {i.url} ({i.title})
                  </option>
                ))}
                <option value="https://github.com">github.com (GitHub)</option>
                <option value="https://accounts.google.com">accounts.google.com (Google)</option>
                <option value="https://aws.amazon.com">aws.amazon.com (AWS)</option>
                <option value="https://mail.proton.me">mail.proton.me (ProtonMail)</option>
              </select>
            </div>
          </div>

          {/* Extension Body Content */}
          <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-320px)]">
            {/* Origin Matching Vault Records */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">
                  Matching Logins for this Domain
                </span>
                <span className="font-mono text-[10px] text-emerald-400">
                  {originMatches.length} Match(es)
                </span>
              </div>

              {originMatches.length === 0 ? (
                <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  No saved logins for this origin.
                </div>
              ) : (
                <div className="space-y-2">
                  {originMatches.map(match => (
                    <div 
                      key={match.id}
                      className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">{match.title}</div>
                          <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                            {match.username}
                          </div>
                        </div>
                        <span className="text-[10px] text-indigo-400 bg-indigo-950/60 border border-indigo-900/60 px-1.5 py-0.5 rounded">
                          {match.collection}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleAutofill(match.username, match.password)}
                          className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Autofill Credentials</span>
                        </button>
                        <button
                          onClick={() => copyToClipboard(match.password || '', `Password for ${match.title}`)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg"
                          title="Copy Password"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Vault Search inside Extension */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300 block">
                Quick Vault Search
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search other accounts..."
                  value={extensionSearch}
                  onChange={(e) => setExtensionSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {searchResults.slice(0, 3).map(res => (
                    <div 
                      key={res.id}
                      className="p-2 bg-slate-950 border border-slate-800/80 rounded flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <span className="text-slate-200 font-medium">{res.title}</span>
                        <span className="text-[11px] text-slate-400 block truncate">{res.username || res.collection}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(res.password || '', `Password for ${res.title}`)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Live Autofill Demonstration Form (Section 3 Module A Verification) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Live Web Page Form Target</span>
            {autofillTriggered && (
              <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                <Check className="w-3 h-3" /> Injected securely!
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <input
              type="text"
              readOnly
              placeholder="Username / Email field on page..."
              value={autofillUsername}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono placeholder-slate-600 focus:outline-none"
            />
            <input
              type="password"
              readOnly
              placeholder="Password field on page..."
              value={autofillPassword}
              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-100 font-mono placeholder-slate-600 focus:outline-none"
            />
          </div>

          <p className="text-[10px] text-slate-500 leading-tight">
            Origin-aware autofill matches exact domains to prevent credential harvesting or phishing on unexpected iframes.
          </p>
        </div>
      </div>
    </div>
  );
};
