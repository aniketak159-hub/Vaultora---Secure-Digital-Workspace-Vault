import React from 'react';
import { useVault } from '../../context/VaultContext';
import { Shield, Key, Briefcase, Settings, Plus } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    setIsCreateModalOpen, 
    securityFindings, 
    lockState 
  } = useVault();

  if (lockState.isLocked) return null;

  const criticalIssuesCount = securityFindings.filter(f => f.severity === 'critical').length;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 md:hidden flex items-center justify-around h-16 px-2 select-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* 1. Overview */}
      <button
        onClick={() => setActiveTab('overview')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
          activeTab === 'overview' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Shield className="w-5 h-5" />
        <span className="text-[10px] mt-1 tracking-tight">Overview</span>
      </button>

      {/* 2. Vault Items */}
      <button
        onClick={() => setActiveTab('vault')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
          activeTab === 'vault' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Key className="w-5 h-5" />
        <span className="text-[10px] mt-1 tracking-tight">Vault</span>
      </button>

      {/* 3. Center Floating Quick Add Action */}
      <div className="flex items-center justify-center px-1">
        <button
          onClick={() => setIsCreateModalOpen(true)}
          title="New Record"
          aria-label="Add New Vault Record"
          className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 active:scale-95 transition-transform cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Workspaces */}
      <button
        onClick={() => setActiveTab('workspaces')}
        className={`flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
          activeTab === 'workspaces' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Briefcase className="w-5 h-5" />
        <span className="text-[10px] mt-1 tracking-tight">Workspaces</span>
      </button>

      {/* 5. Settings */}
      <button
        onClick={() => setActiveTab('settings')}
        className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] cursor-pointer transition-colors ${
          activeTab === 'settings' || activeTab === 'security' ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <Settings className="w-5 h-5" />
          {criticalIssuesCount > 0 && (
            <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-mono font-bold flex items-center justify-center">
              {criticalIssuesCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-1 tracking-tight">Settings</span>
      </button>
    </nav>
  );
};
