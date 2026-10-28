import React from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Key, 
  FileText, 
  Award, 
  CreditCard, 
  Wifi, 
  Fingerprint, 
  Terminal, 
  Plus, 
  FolderLock, 
  FileKey2,
  Users,
  Briefcase,
  Settings,
  X
} from 'lucide-react';
import { ItemCategory } from '../../types/vault';

export const Sidebar: React.FC = () => {
  const { 
    items, 
    workspaces, 
    activeWorkspaceId, 
    setActiveWorkspaceId, 
    selectedCategory, 
    setSelectedCategory,
    selectedCollection,
    setSelectedCollection,
    setIsCreateModalOpen,
    setIsEmergencyKitModalOpen,
    setActiveTab,
    securityFindings,
    isMobileMenuOpen,
    setIsMobileMenuOpen
  } = useVault();

  const categories: { id: 'all' | ItemCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All Records', icon: <FolderLock className="w-4 h-4 text-slate-400" /> },
    { id: 'login', label: 'Logins & Passwords', icon: <Key className="w-4 h-4 text-indigo-400" /> },
    { id: 'note', label: 'Secure Notes & 2FA', icon: <FileText className="w-4 h-4 text-emerald-400" /> },
    { id: 'licence', label: 'Software Licences', icon: <Award className="w-4 h-4 text-amber-400" /> },
    { id: 'identity', label: 'Identity & Travel', icon: <Fingerprint className="w-4 h-4 text-sky-400" /> },
    { id: 'wifi', label: 'Wi-Fi & Networks', icon: <Wifi className="w-4 h-4 text-teal-400" /> },
    { id: 'card', label: 'Cards & Banking', icon: <CreditCard className="w-4 h-4 text-purple-400" /> },
    { id: 'secret', label: 'Developer Secrets', icon: <Terminal className="w-4 h-4 text-rose-400" /> },
  ];

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const criticalCount = securityFindings.filter(f => f.severity === 'critical').length;

  const handleSelectWorkspace = (id: string) => {
    setActiveWorkspaceId(id);
    setSelectedCollection(null);
    setIsMobileMenuOpen(false);
  };

  const handleSelectCategory = (catId: 'all' | ItemCategory) => {
    setSelectedCategory(catId);
    setActiveTab('vault');
    setIsMobileMenuOpen(false);
  };

  const renderSidebarBody = () => (
    <div className="flex flex-col justify-between h-full select-none">
      {/* Scrollable upper content */}
      <div className="overflow-y-auto px-4 py-4 space-y-6">
        {/* Primary Action Button */}
        <button
          onClick={() => {
            setIsCreateModalOpen(true);
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Vault Record</span>
        </button>

        {/* Workspace Selector */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Workspaces & Clients
            </span>
            <button 
              onClick={() => {
                setActiveTab('workspaces');
                setIsMobileMenuOpen(false);
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors p-1"
            >
              Manage
            </button>
          </div>
          <div className="space-y-0.5">
            <button
              onClick={() => handleSelectWorkspace('all')}
              className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md transition-colors text-left cursor-pointer min-h-[40px] ${
                activeWorkspaceId === 'all' 
                  ? 'bg-slate-800 text-white font-medium' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">All Workspaces</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {items.length}
              </span>
            </button>

            {workspaces.map(ws => (
              <button
                key={ws.id}
                onClick={() => handleSelectWorkspace(ws.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md transition-colors text-left cursor-pointer min-h-[40px] ${
                  activeWorkspaceId === ws.id 
                    ? 'bg-slate-800 text-white font-medium' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: ws.color }}
                  />
                  <span className="truncate">{ws.name}</span>
                </div>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  {ws.itemCount}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Collections in Current Workspace */}
        {currentWorkspace && currentWorkspace.collections.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Collections
              </span>
              {selectedCollection && (
                <button
                  onClick={() => setSelectedCollection(null)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors p-1"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="space-y-0.5">
              {currentWorkspace.collections.map(col => (
                <button
                  key={col}
                  onClick={() => {
                    setSelectedCollection(selectedCollection === col ? null : col);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md transition-colors text-left cursor-pointer min-h-[36px] ${
                    selectedCollection === col 
                      ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60 font-medium' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span className="truncate">{col}</span>
                  <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                    {items.filter(i => i.workspaceId === currentWorkspace.id && i.collection === col).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Record Categories */}
        <div>
          <div className="mb-2 px-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Record Types
            </span>
          </div>
          <div className="space-y-0.5">
            {categories.map(cat => {
              const count = cat.id === 'all' 
                ? (activeWorkspaceId === 'all' ? items.length : items.filter(i => i.workspaceId === activeWorkspaceId).length)
                : items.filter(i => (activeWorkspaceId === 'all' || i.workspaceId === activeWorkspaceId) && i.category === cat.id).length;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 text-xs rounded-md transition-colors text-left cursor-pointer min-h-[40px] ${
                    selectedCategory === cat.id 
                      ? 'bg-slate-800 text-white font-medium' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {cat.icon}
                    <span className="truncate">{cat.label}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Security Health Alert Bar */}
        <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-300">Security Health</span>
            <span className={`font-mono text-xs tabular-nums font-semibold ${
              criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {criticalCount > 0 ? `${criticalCount} Actionable` : 'Optimal'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            {criticalCount > 0 
              ? `${criticalCount} passwords require immediate rotation or MFA.`
              : items.length === 0
                ? 'Vault is clean and ready. Add records to monitor security health.'
                : 'All credentials meet entropy and hygiene baselines.'}
          </p>
          <button
            onClick={() => {
              setActiveTab('settings');
              setIsMobileMenuOpen(false);
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer"
          >
            Open Security Settings &rarr;
          </button>
        </div>
      </div>

      {/* Bottom Footer Section */}
      <div className="p-3 border-t border-slate-800 space-y-2 bg-slate-900/60 pb-safe">
        <button
          onClick={() => {
            setActiveTab('settings');
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left cursor-pointer min-h-[40px]"
        >
          <Settings className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">Settings &amp; Security</span>
        </button>

        <button
          onClick={() => {
            setIsEmergencyKitModalOpen(true);
            setIsMobileMenuOpen(false);
          }}
          className="w-full flex items-center gap-2 px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors text-left cursor-pointer min-h-[40px]"
        >
          <FileKey2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">Emergency Recovery Kit</span>
        </button>

        <div className="pt-2 border-t border-slate-800/80 px-1 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>Zero-Knowledge AES-256</span>
            <span className="text-emerald-400">Verified</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Keys derived locally via PBKDF2.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex-col justify-between h-[calc(100vh-57px)] sticky top-[57px] select-none">
        {renderSidebarBody()}
      </aside>

      {/* Mobile Slide-Over Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Container */}
          <div className="relative w-72 max-w-[85vw] h-full bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col z-10">
            {/* Drawer Top Header with close button */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Vault Navigation
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {renderSidebarBody()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
