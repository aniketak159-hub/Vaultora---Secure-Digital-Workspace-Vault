import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  Briefcase, 
  Users, 
  Plus, 
  Shield, 
  UserMinus, 
  RotateCcw, 
  FolderPlus, 
  Trash2, 
  ExternalLink, 
  Key, 
  AlertTriangle,
  CheckCircle2,
  Lock,
  X
} from 'lucide-react';
import { ClientWorkspace, CollaboratorRole } from '../../types/vault';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

export const WorkspacesView: React.FC = () => {
  const { 
    workspaces, 
    items, 
    setActiveWorkspaceId, 
    setActiveTab, 
    createWorkspace, 
    updateWorkspace,
    deleteWorkspace,
    addCollaborator, 
    revokeCollaborator,
    setIsCreateModalOpen
  } = useVault();

  const [selectedWsId, setSelectedWsId] = useState<string>(workspaces[0]?.id || 'personal');
  const [isNewWsModalOpen, setIsNewWsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');

  // Delete / Revoke modal state
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmLabel: 'Delete',
    onConfirm: () => {}
  });

  // New Workspace form state
  const [wsName, setWsName] = useState('');
  const [wsType, setWsType] = useState<'client' | 'team'>('client');
  const [wsDescription, setWsDescription] = useState('');
  const [wsColor, setWsColor] = useState('#0284c7');

  // New Collaborator form state
  const [collabName, setCollabName] = useState('');
  const [collabEmail, setCollabEmail] = useState('');
  const [collabRole, setCollabRole] = useState<CollaboratorRole>('viewer');

  const selectedWs = workspaces.find(w => w.id === selectedWsId) || workspaces[0];
  const wsItems = items.filter(i => i.workspaceId === selectedWs?.id);

  const handleCreateWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wsName.trim()) return;

    createWorkspace({
      name: wsName.trim(),
      type: wsType,
      description: wsDescription.trim() || 'Client accounts and credentials workspace.',
      collections: ['Hosting & Cloud', 'Social & Marketing', 'Domains & DNS'],
      collaborators: [
        {
          id: `owner_${Date.now()}`,
          name: 'You (Owner)',
          email: 'owner@vaultora.local',
          role: 'admin',
          addedAt: new Date().toISOString()
        }
      ],
      color: wsColor
    });

    setIsNewWsModalOpen(false);
    setWsName('');
    setWsDescription('');
  };

  const handleInviteCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabEmail.trim() || !selectedWs) return;

    addCollaborator(selectedWs.id, {
      name: collabName.trim() || collabEmail.split('@')[0],
      email: collabEmail.trim(),
      role: collabRole
    });

    setIsInviteModalOpen(false);
    setCollabName('');
    setCollabEmail('');
  };

  const handleAddCollection = () => {
    if (!newCollectionName.trim() || !selectedWs) return;
    if (selectedWs.collections.includes(newCollectionName.trim())) return;
    updateWorkspace(selectedWs.id, {
      collections: [...selectedWs.collections, newCollectionName.trim()]
    });
    setNewCollectionName('');
  };

  return (
    <div className="space-y-6 sm:space-y-8 max-w-7xl mx-auto pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
            Module C · Workspaces & Sharing
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Client & Team Vault Workspaces
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Keep client credentials isolated with role-based access, dedicated hosting/domain collections, and rapid access revocation.
          </p>
        </div>

        <button
          onClick={() => setIsNewWsModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors cursor-pointer w-full sm:w-auto whitespace-nowrap min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Client Workspace</span>
        </button>
      </div>

      {/* Workspace Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 text-nowrap">
        {workspaces.map(ws => (
          <button
            key={ws.id}
            onClick={() => setSelectedWsId(ws.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer min-h-[40px] ${
              selectedWs?.id === ws.id 
                ? 'bg-slate-800 text-white border border-slate-700 font-semibold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <span 
              className="w-2.5 h-2.5 rounded-full shrink-0" 
              style={{ backgroundColor: ws.color }}
            />
            <span>{ws.name}</span>
            <span className="font-mono text-[10px] text-slate-400 tabular-nums">
              ({items.filter(i => i.workspaceId === ws.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Active Workspace Detailed View */}
      {selectedWs && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left Column: Details, Collections & Items */}
          <div className="lg:col-span-7 space-y-6">
            {/* Workspace Overview Card */}
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm"
                    style={{ backgroundColor: selectedWs.color }}
                  >
                    {selectedWs.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-white">{selectedWs.name}</h2>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 capitalize">
                        · {selectedWs.type} vault
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedWs.description}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveWorkspaceId(selectedWs.id);
                    setActiveTab('vault');
                  }}
                  className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950/70 border border-indigo-900/60 rounded-lg transition-colors cursor-pointer shrink-0 min-h-[40px]"
                >
                  <span>Open in Vault</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Collections Management */}
              <div className="pt-3 border-t border-slate-800/80 space-y-3">
                <span className="text-xs font-semibold text-slate-300 block">
                  Compartments & Collections ({selectedWs.collections.length})
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {selectedWs.collections.map(col => {
                    const count = wsItems.filter(i => i.collection === col).length;
                    return (
                      <div 
                        key={col} 
                        className="px-2.5 py-1 bg-slate-950/80 border border-slate-800 rounded-md text-xs text-slate-300 flex items-center gap-1.5 group"
                      >
                        <span className="truncate max-w-[150px]">{col}</span>
                        <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                          {count}
                        </span>
                        {selectedWs.collections.length > 1 && (
                          <button
                            onClick={() => {
                              setDeleteModalConfig({
                                isOpen: true,
                                title: `Delete "${col}" Collection?`,
                                description: `Are you sure you want to remove the "${col}" collection? Contained records will be preserved and reassigned to "${selectedWs.collections[0]}".`,
                                confirmLabel: 'Delete Collection',
                                onConfirm: () => {
                                  const fallbackCol = selectedWs.collections.find(c => c !== col) || 'General';
                                  // Update items belonging to this collection
                                  items.forEach(it => {
                                    if (it.workspaceId === selectedWs.id && it.collection === col) {
                                      it.collection = fallbackCol;
                                    }
                                  });
                                  updateWorkspace(selectedWs.id, {
                                    collections: selectedWs.collections.filter(c => c !== col)
                                  });
                                }
                              });
                            }}
                            title={`Delete ${col} collection`}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add new collection input */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 max-w-sm">
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="New collection (e.g. Analytics & Ads)"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 min-h-[40px]"
                  />
                  <button
                    onClick={handleAddCollection}
                    className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap min-h-[40px] text-center"
                  >
                    Add Collection
                  </button>
                </div>
              </div>
            </div>

            {/* Items inside this Workspace */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">
                  Vault Records in {selectedWs.name} ({wsItems.length})
                </h3>
                <span className="text-[11px] text-slate-400">Zero-knowledge isolated</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/70 overflow-hidden">
                {wsItems.length === 0 ? (
                  <div className="p-6 text-center text-xs space-y-2">
                    <p className="text-slate-400">No records in this workspace yet.</p>
                    <button
                      onClick={() => {
                        setActiveWorkspaceId(selectedWs.id);
                        setIsCreateModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Record to Workspace</span>
                    </button>
                  </div>
                ) : (
                  wsItems.map(item => (
                    <div 
                      key={item.id}
                      className="p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-100 truncate">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 truncate">
                          <span>{item.collection}</span>
                          <span>·</span>
                          <span className="capitalize">{item.category}</span>
                          {item.needsRotation && (
                            <>
                              <span>·</span>
                              <span className="text-rose-400 font-medium">Rotate</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="text-xs font-mono text-slate-400 shrink-0 truncate max-w-[130px] sm:max-w-[200px]">
                        {item.username || item.ssid || item.softwareName || 'Secured'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Collaborators, Roles & Rapid Access Revocation */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">Access & Collaborators</h3>
                  <p className="text-xs text-slate-400">
                    Role-based permissions & revocation
                  </p>
                </div>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer min-h-[38px]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>

              {/* Collaborators List */}
              <div className="space-y-2.5">
                {selectedWs.collaborators.length === 0 ? (
                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-center text-xs space-y-1">
                    <p className="text-slate-300 font-medium">No external collaborators</p>
                    <p className="text-[11px] text-slate-500">
                      Invite team members or clients with role-based access control.
                    </p>
                  </div>
                ) : (
                  selectedWs.collaborators.map(c => {
                    const isSoleAdmin = c.role === 'admin' && selectedWs.collaborators.filter(col => col.role === 'admin').length <= 1;
                    return (
                      <div 
                        key={c.id}
                        className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-lg flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-slate-200 truncate flex items-center gap-1.5">
                            <span className="truncate">{c.name}</span>
                            <span className="text-[10px] text-slate-400 uppercase font-mono px-1 bg-slate-900 rounded shrink-0">
                              {c.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {c.email}
                          </div>
                        </div>

                        {/* Revoke button (disabled for sole admin to prevent lockouts) */}
                        {!isSoleAdmin && (
                          <button
                            onClick={() => {
                              setDeleteModalConfig({
                                isOpen: true,
                                title: `Revoke Access for ${c.name}?`,
                                description: `Revoking access will immediately strip ${c.email}'s credentials access and flag all active passwords in "${selectedWs.name}" for security rotation.`,
                                confirmLabel: 'Revoke & Rotate',
                                onConfirm: () => revokeCollaborator(selectedWs.id, c.id, true)
                              });
                            }}
                            title="Revoke access & flag credentials for rotation"
                            className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 border border-rose-900/60 rounded-lg transition-colors cursor-pointer shrink-0 min-h-[36px]"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Revoke</span>
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Rapid Revocation Explainer Box */}
              <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-lg text-xs space-y-1.5 text-slate-400 leading-relaxed">
                <div className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Contractor Departure Workflow</span>
                </div>
                <p className="text-[11px]">
                  When a contractor or employee departs, clicking <strong>Revoke</strong> instantly strips access and flags all active passwords in this workspace for credential rotation.
                </p>
              </div>
            </div>

            {/* Delete workspace danger zone if not personal */}
            {selectedWs.type !== 'personal' && (
              <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-semibold text-slate-300 block">Workspace Actions</span>
                  <span className="text-[11px] text-slate-400">Records will be safely migrated to Personal Vault</span>
                </div>
                <button
                  onClick={() => {
                    setDeleteModalConfig({
                      isOpen: true,
                      title: `Delete Workspace "${selectedWs.name}"?`,
                      description: `Are you sure you want to delete "${selectedWs.name}"? All ${wsItems.length} records inside will be safely migrated to your Personal Vault before deletion.`,
                      confirmLabel: 'Delete Workspace',
                      onConfirm: () => deleteWorkspace(selectedWs.id)
                    });
                  }}
                  className="px-3 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer min-h-[40px] text-center"
                >
                  Delete Workspace
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedWs && (
        <div className="p-8 sm:p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <Briefcase className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-base font-bold text-white">No Workspaces Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first workspace to compartmentalize accounts, credentials, and collaborator permissions.
          </p>
          <button
            onClick={() => setIsNewWsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Create Workspace</span>
          </button>
        </div>
      )}

      {/* New Workspace Modal */}
      {isNewWsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Workspace</h3>
              <button onClick={() => setIsNewWsModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspace} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 mb-1">Workspace / Client Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cloud Infrastructure, Client Project"
                  value={wsName}
                  onChange={(e) => setWsName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Vault Purpose</label>
                <select
                  value={wsType}
                  onChange={(e) => setWsType(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[44px]"
                >
                  <option value="client">Client Workspace (for external clients & projects)</option>
                  <option value="team">Team / Agency Internal (shared with internal staff)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Client web hosting, domains, social media accounts."
                  value={wsDescription}
                  onChange={(e) => setWsDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Badge Accent Color</label>
                <div className="flex items-center gap-2">
                  {['#0284c7', '#6366f1', '#8b5cf6', '#059669', '#d97706', '#e11d48'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWsColor(c)}
                      className={`w-7 h-7 rounded-full border-2 cursor-pointer transition-transform ${
                        wsColor === c ? 'scale-110 border-white' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewWsModalOpen(false)}
                  className="px-3 py-2 text-slate-300 hover:text-white min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg min-h-[40px]"
                >
                  Create Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite Collaborator Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white truncate">Invite to {selectedWs.name}</h3>
              <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInviteCollaborator} className="space-y-3.5">
              <div>
                <label className="block text-slate-400 mb-1">Collaborator Name</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Miller"
                  value={collabName}
                  onChange={(e) => setCollabName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="collaborator@company.com"
                  value={collabEmail}
                  onChange={(e) => setCollabEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Assigned Role</label>
                <select
                  value={collabRole}
                  onChange={(e) => setCollabRole(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[44px]"
                >
                  <option value="viewer">Viewer (Read-only credential access)</option>
                  <option value="editor">Editor (Can create & update credentials)</option>
                  <option value="admin">Admin (Can manage workspace settings & members)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-3 py-2 text-slate-300 hover:text-white min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg min-h-[40px]"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global In-App Delete / Revoke Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={deleteModalConfig.isOpen}
        onClose={() => setDeleteModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
        confirmLabel={deleteModalConfig.confirmLabel}
      />
    </div>
  );
};
