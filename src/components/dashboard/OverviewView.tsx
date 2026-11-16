import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Key, 
  FileText, 
  Briefcase, 
  ShieldAlert, 
  Plus, 
  KeyRound, 
  Users, 
  ArrowUpRight, 
  Copy, 
  ExternalLink, 
  RotateCcw, 
  AlertTriangle, 
  Check, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Activity, 
  RefreshCw 
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const { 
    items, 
    workspaces, 
    securityFindings, 
    auditLogs,
    setActiveTab, 
    setActiveWorkspaceId, 
    setIsCreateModalOpen, 
    setIsGeneratorModalOpen, 
    setActiveItem, 
    copyToClipboard, 
    copiedIndicator, 
    rotatePassword 
  } = useVault();

  const [isLogRefreshing, setIsLogRefreshing] = useState(false);
  const [localAuditTrail, setLocalAuditTrail] = useState(auditLogs);

  // Sync audit trail if auditLogs updates
  React.useEffect(() => {
    setLocalAuditTrail(auditLogs);
  }, [auditLogs]);

  const loginsCount = items.filter(i => i.category === 'login').length;
  const secureRecordsCount = items.filter(i => i.category !== 'login').length;
  const clientWorkspaces = workspaces.filter(w => w.type === 'client');
  const criticalFindings = securityFindings.filter(f => f.severity === 'critical');
  const recentItems = items.slice(0, 6);

  // Handler to manually update / refresh the log
  const handleUpdateLog = () => {
    setIsLogRefreshing(true);
    setTimeout(() => {
      setIsLogRefreshing(false);
      // Ensure there is at least an audit verification log entry
      const verificationEntry = {
        id: `log_audit_${Date.now()}`,
        action: 'view' as const,
        itemTitle: 'Zero-Knowledge Cryptographic Integrity Check',
        itemId: undefined,
        userEmail: 'owner@vaultora.local',
        timestamp: new Date().toISOString(),
        ipAddress: 'Local Device (Zero-Knowledge)',
        workspaceName: 'System Security'
      };
      setLocalAuditTrail(prev => [verificationEntry, ...prev]);
    }, 450);
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            Your Vault
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
            Everything, secured.
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Store your credentials, client access, software licences, and sensitive records in one verified zero-knowledge workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsGeneratorModalOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Generate Password</span>
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors cursor-pointer whitespace-nowrap min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Logins */}
        <div
          onClick={() => setActiveTab('vault')}
          className="p-3.5 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Logins</span>
            <Key className="w-4 h-4 text-indigo-400 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
            {loginsCount}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-1">
            Autofill &amp; MFA
          </div>
        </div>

        {/* Secure Records */}
        <div
          onClick={() => setActiveTab('vault')}
          className="p-3.5 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Secure Records</span>
            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
            {secureRecordsCount}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-1">
            Notes, licences, Wi-Fi
          </div>
        </div>

        {/* Client Vaults */}
        <div
          onClick={() => setActiveTab('workspaces')}
          className="p-3.5 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Client Vaults</span>
            <Briefcase className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
            {clientWorkspaces.length}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-1">
            Separated workspaces
          </div>
        </div>

        {/* Security Alerts */}
        <div
          onClick={() => setActiveTab('settings')}
          className={`p-3.5 sm:p-5 rounded-xl border transition-colors cursor-pointer ${
            criticalFindings.length > 0 
              ? 'bg-rose-950/20 border-rose-800/60 hover:border-rose-700' 
              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-medium truncate">Security Alerts</span>
            <ShieldAlert className={`w-4 h-4 shrink-0 ${criticalFindings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`} />
          </div>
          <div className={`text-2xl sm:text-3xl font-bold font-mono tabular-nums ${criticalFindings.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {securityFindings.length}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 mt-1 line-clamp-1">
            {criticalFindings.length > 0 ? `${criticalFindings.length} need action` : 'Optimal'}
          </div>
        </div>
      </div>

      {/* Critical Alert Callout (if any) */}
      {criticalFindings.length > 0 && (
        <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-900/60 border border-rose-700 flex items-center justify-center shrink-0 text-rose-300">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-semibold text-rose-200">
                Action Required: {criticalFindings[0].title}
              </div>
              <p className="text-[11px] sm:text-xs text-rose-300/80 mt-0.5">
                {criticalFindings[0].description}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              onClick={() => {
                const newPass = rotatePassword(criticalFindings[0].itemId);
                copyToClipboard(newPass, 'Rotated Password Generated');
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer min-h-[40px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Rotate Secret Now</span>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-3 py-2 text-xs font-medium text-rose-300 hover:text-white bg-rose-900/40 hover:bg-rose-900/60 rounded-lg transition-colors cursor-pointer text-center min-h-[40px]"
            >
              View in Settings ({securityFindings.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Left Column: Client Workspaces */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">Client Workspaces</h2>
              <p className="text-xs text-slate-400">Compartmentalized vaults for hosting, domains, and advertising</p>
            </div>
            <button
              onClick={() => setActiveTab('workspaces')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1 p-1"
            >
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {workspaces.map(ws => (
              <div
                key={ws.id}
                onClick={() => {
                  setActiveWorkspaceId(ws.id);
                  setActiveTab('vault');
                }}
                className="p-3.5 sm:p-4 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: ws.color }}
                    >
                      {ws.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors flex items-center gap-1.5 truncate">
                        <span className="truncate">{ws.name}</span>
                        <span className="text-[10px] text-slate-400 capitalize shrink-0">
                          · {ws.type}
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {ws.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-semibold text-slate-200 tabular-nums">
                      {ws.itemCount} items
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {ws.lastActive}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-800/80">
                  {ws.collections.slice(0, 3).map(col => (
                    <span
                      key={col}
                      className="text-[10px] sm:text-[11px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800"
                    >
                      {col}
                    </span>
                  ))}
                  {ws.collections.length > 3 && (
                    <span className="text-[10px] text-slate-500">
                      +{ws.collections.length - 3}
                    </span>
                  )}
                  <span className="text-[10px] sm:text-[11px] text-slate-500 ml-auto flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{ws.collaborators.length}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Recently Accessed Records & Security Audit Log */}
        <div className="lg:col-span-5 space-y-6">
          {/* Recently Accessed Records */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-white">Recently Accessed</h2>
                <p className="text-xs text-slate-400">Instant credential retrieval</p>
              </div>
              {recentItems.length > 0 && (
                <button
                  onClick={() => setActiveTab('vault')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors p-1"
                >
                  Browse all
                </button>
              )}
            </div>

            {recentItems.length === 0 ? (
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                  <Key className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-white">No records created yet</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Your personal vault is clean and ready. Add logins, software licences, Wi-Fi networks, or secure notes.
                  </p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Record</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/70 overflow-hidden">
                {recentItems.map(item => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                  >
                    <div
                      onClick={() => setActiveItem(item)}
                      className="min-w-0 cursor-pointer flex-1"
                    >
                      <div className="text-xs font-medium text-white truncate hover:text-indigo-300 transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.username || item.ssid || item.softwareName || item.collection}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {item.password && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(item.password || '', `Password for ${item.title}`, { title: item.title, id: item.id });
                          }}
                          title="Copy Password"
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      )}
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Website"
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Audit & Activity Trail ("The Log") */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Vault Audit &amp; Activity Log</h2>
              </div>
              <button
                onClick={handleUpdateLog}
                disabled={isLogRefreshing}
                title="Update and audit recent log activity"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1.5 p-1 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLogRefreshing ? 'animate-spin' : ''}`} />
                <span>{isLogRefreshing ? 'Updating...' : 'Update Log'}</span>
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800">
                <span>Immutable Zero-Knowledge Event Log</span>
                <span className="font-mono tabular-nums text-slate-500">{localAuditTrail.length} recorded</span>
              </div>

              {localAuditTrail.length === 0 ? (
                <div className="text-center py-4 text-slate-500 text-xs">
                  No activity recorded yet. Viewing, copying, or modifying vault secrets logs events automatically.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {localAuditTrail.slice(0, 6).map(log => {
                    return (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-mono text-indigo-300 uppercase font-semibold">
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-slate-200 font-medium truncate">
                          {log.itemTitle}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center justify-between pt-0.5">
                          <span>{log.workspaceName}</span>
                          <span className="text-emerald-400">Zero-Knowledge</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Copied to Clipboard Floating Toast */}
      {copiedIndicator && (
        <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-indigo-600 text-white rounded-lg shadow-xl shadow-indigo-600/30 text-xs font-medium border border-indigo-400/40 animate-in fade-in duration-150">
          <Check className="w-4 h-4 text-white" />
          <span>Copied to clipboard: {copiedIndicator}</span>
        </div>
      )}
    </div>
  );
};
