import React from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Shield, 
  Menu, 
  Sparkles, 
  KeyRound, 
  Lock, 
  Smartphone 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    lockVault, 
    setIsGeneratorModalOpen, 
    setIsAiAssistantOpen, 
    setIsAndroidModalOpen,
    isMobileMenuOpen, 
    setIsMobileMenuOpen, 
    securityFindings 
  } = useVault();

  const criticalIssuesCount = securityFindings.filter(f => f.severity === 'critical').length;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-3 sm:py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 select-none">
      {/* Brand & Mobile Hamburger */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu & workspaces"
          className="md:hidden p-2 -ml-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="#overview"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('overview');
          }}
          className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight text-white hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
          </div>
          <span>Vaultora</span>
        </a>
      </div>

      {/* Center Nav Links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('overview')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'overview' ? 'text-white font-semibold' : ''
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('vault')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'vault' ? 'text-white font-semibold' : ''
          }`}
        >
          Vault Items
        </button>
        <button
          onClick={() => setActiveTab('workspaces')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'workspaces' ? 'text-white font-semibold' : ''
          }`}
        >
          Workspaces
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'settings' || activeTab === 'security' ? 'text-white font-semibold' : ''
          }`}
        >
          <span>Settings</span>
          {criticalIssuesCount > 0 && (
            <span className="font-mono text-xs text-rose-400 font-semibold tabular-nums">
              ({criticalIssuesCount})
            </span>
          )}
        </button>
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <button
          onClick={() => setIsAiAssistantOpen(true)}
          title="AI-Assisted Vault Organization & Smart Finder"
          aria-label="AI Assistant"
          className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
        </button>

        <button
          onClick={() => setIsAndroidModalOpen(true)}
          title="Android App (Native APK)"
          aria-label="Android App"
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer min-h-[36px]"
        >
          <Smartphone className="w-3.5 h-3.5 text-sky-400" />
          <span>Android APK</span>
        </button>

        <button
          onClick={() => setIsGeneratorModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap cursor-pointer min-h-[36px]"
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">Generator</span>
        </button>

        <button
          onClick={lockVault}
          title="Lock Vault Now"
          aria-label="Lock Vault"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px]"
        >
          <Lock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lock Vault</span>
        </button>
      </div>
    </header>
  );
};
