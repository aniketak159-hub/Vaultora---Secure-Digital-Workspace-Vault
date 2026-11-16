import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  X, 
  Copy, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Trash2, 
  ExternalLink, 
  Star, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Check, 
  Edit3, 
  Save 
} from 'lucide-react';
import { evaluatePasswordStrength } from '../../crypto/cryptoService';
import { VaultItem } from '../../types/vault';
import { DeleteConfirmModal } from '../common/DeleteConfirmModal';

export const ItemDetailModal: React.FC = () => {
  const { 
    activeItem, 
    setActiveItem, 
    updateItem, 
    deleteItem, 
    rotatePassword, 
    copyToClipboard, 
    workspaces,
    toggleFavorite 
  } = useVault();

  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<VaultItem>>({});
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!activeItem) return null;

  const currentWorkspace = workspaces.find(w => w.id === activeItem.workspaceId);
  const strength = activeItem.password ? evaluatePasswordStrength(activeItem.password) : null;

  const handleStartEdit = () => {
    setEditFormData({ ...activeItem });
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    updateItem(activeItem.id, editFormData);
    setActiveItem({ ...activeItem, ...editFormData } as VaultItem);
    setIsEditing(false);
  };

  const handleRotate = () => {
    const newPass = rotatePassword(activeItem.id);
    setActiveItem({ ...activeItem, password: newPass, needsRotation: false });
    copyToClipboard(newPass, `Rotated password for ${activeItem.title}`, { title: activeItem.title, id: activeItem.id });
  };

  const handleConfirmDelete = () => {
    deleteItem(activeItem.id);
    setActiveItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <span 
              className="w-2.5 h-2.5 rounded-full shrink-0" 
              style={{ backgroundColor: currentWorkspace?.color || '#64748b' }} 
            />
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">
                {activeItem.title}
              </h2>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
                <span className="truncate max-w-[100px]">{currentWorkspace?.name}</span>
                <span>·</span>
                <span className="truncate max-w-[100px]">{activeItem.collection}</span>
                <span>·</span>
                <span className="capitalize">{activeItem.category}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => toggleFavorite(activeItem.id)}
              className="p-2 text-slate-400 hover:text-amber-400 rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <Star className={`w-4 h-4 ${activeItem.favorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              onClick={() => setActiveItem(null)}
              className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
          {/* Compromised Alert if flagged */}
          {(activeItem.needsRotation || activeItem.password === 'password123') && (
            <div className="p-3 sm:p-3.5 bg-rose-950/30 border border-rose-900/60 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>This password is compromised or flagged for rotation.</span>
              </div>
              <button
                onClick={handleRotate}
                className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-colors cursor-pointer shrink-0 min-h-[38px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rotate Now</span>
              </button>
            </div>
          )}

          {/* Edit Form or View Fields */}
          {isEditing ? (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Title</label>
                <input
                  type="text"
                  value={editFormData.title || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white min-h-[44px]"
                />
              </div>

              {activeItem.category === 'login' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1">Website URL</label>
                    <input
                      type="text"
                      value={editFormData.url || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, url: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Username / Email</label>
                    <input
                      type="text"
                      value={editFormData.username || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">Password</label>
                    <input
                      type="text"
                      value={editFormData.password || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono min-h-[44px]"
                    />
                  </div>
                </>
              )}

              {activeItem.category === 'note' && (
                <div>
                  <label className="block text-slate-400 mb-1">Secure Note Content</label>
                  <textarea
                    rows={6}
                    value={editFormData.noteContent || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, noteContent: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Category-specific Viewers */}
              {activeItem.category === 'login' && (
                <div className="space-y-3">
                  {/* URL */}
                  {activeItem.url && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block">Website URL</span>
                        <a 
                          href={activeItem.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-xs font-mono text-indigo-400 hover:underline truncate block"
                        >
                          {activeItem.url}
                        </a>
                      </div>
                      <a
                        href={activeItem.url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Username */}
                  {activeItem.username && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] sm:text-[11px] text-slate-400 block">Username / Account ID</span>
                        <span className="text-xs font-mono text-slate-100 truncate block">
                          {activeItem.username}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(activeItem.username || '', `Username for ${activeItem.title}`)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800 rounded-lg transition-colors cursor-pointer shrink-0"
                        title="Copy Username"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Password */}
                  {activeItem.password && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] sm:text-[11px] font-medium text-slate-300">Saved Account Password</span>
                          <span className="text-[9px] text-slate-500 font-mono">(Encrypted Record)</span>
                        </div>
                        {strength && (
                          <span className={`text-[10px] sm:text-[11px] font-mono tabular-nums truncate ${
                            strength.score >= 3 ? 'text-emerald-400' : strength.score === 2 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {strength.entropyBits} bits ({strength.label})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="font-mono text-xs text-slate-100 tracking-wider truncate flex-1">
                          {showPassword ? activeItem.password : '••••••••••••••••••••'}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => setShowPassword(!showPassword)}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title={showPassword ? 'Hide' : 'Reveal'}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(activeItem.password || '', `Password for ${activeItem.title}`, { title: activeItem.title, id: activeItem.id })}
                            className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white active:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Copy Password"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleRotate}
                            className="w-9 h-9 flex items-center justify-center text-indigo-400 hover:text-indigo-300 active:bg-indigo-950/60 rounded-lg transition-colors cursor-pointer"
                            title="Generate & Rotate Password"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {strength && strength.feedback.length > 0 && (
                        <div className="text-[10px] sm:text-[11px] text-slate-400 pt-1">
                          Guidance: {strength.feedback.join(' · ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2FA Status */}
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 block">Two-Factor Authentication</span>
                      <span className="text-xs text-slate-200">
                        {activeItem.mfaEnabled ? 'Enabled on Account' : 'Not Recorded / Disabled'}
                      </span>
                    </div>
                    {activeItem.passkeySupported && (
                      <span className="text-[10px] sm:text-[11px] text-sky-400 bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded">
                        Passkey
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Secure Note Viewer */}
              {activeItem.category === 'note' && (
                <div className="space-y-3">
                  {activeItem.noteContent && (
                    <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                      <span className="text-[11px] text-slate-400 block mb-1">Encrypted Note Body</span>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                        {activeItem.noteContent}
                      </p>
                    </div>
                  )}

                  {activeItem.recoveryCodes && activeItem.recoveryCodes.length > 0 && (
                    <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">Emergency Recovery Codes</span>
                        <button
                          onClick={() => copyToClipboard(activeItem.recoveryCodes?.join('\n') || '', 'All Recovery Codes')}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 p-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copy All</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-xs">
                        {activeItem.recoveryCodes.map((code, idx) => (
                          <div 
                            key={idx}
                            onClick={() => copyToClipboard(code, `Recovery Code #${idx + 1}`)}
                            className="p-2 bg-slate-900 border border-slate-800 rounded text-slate-200 hover:border-slate-700 cursor-pointer flex items-center justify-between min-h-[36px]"
                          >
                            <span>{code}</span>
                            <Copy className="w-3 h-3 text-slate-500" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Licence Viewer */}
              {activeItem.category === 'licence' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                    <span className="text-[11px] text-slate-400 block">Software / Plan</span>
                    <span className="text-xs font-semibold text-white">{activeItem.softwareName}</span>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-slate-400 block">Licence Key</span>
                      <span className="text-xs font-mono text-amber-300 truncate block">
                        {activeItem.licenceKey}
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeItem.licenceKey || '', 'Licence Key')}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">Seats</span>
                      <span className="text-slate-200 font-mono">{activeItem.seats || '1'} User(s)</span>
                    </div>
                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl">
                      <span className="text-[11px] text-slate-400 block">Renewal / Expiry</span>
                      <span className="text-slate-200 font-mono">{activeItem.expiryDate || 'Perpetual'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Wi-Fi Viewer */}
              {activeItem.category === 'wifi' && (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-slate-400 block">Network SSID</span>
                      <span className="text-xs font-mono font-semibold text-white truncate block">{activeItem.ssid}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeItem.ssid || '', 'Wi-Fi SSID')}
                      className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] text-slate-400 block">Wi-Fi Password</span>
                      <span className="text-xs font-mono text-teal-300 truncate block">
                        {showPassword ? activeItem.wifiPassword : '••••••••••••••••'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(activeItem.wifiPassword || '', 'Wi-Fi Password')}
                        className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Developer Secret Viewer */}
              {activeItem.category === 'secret' && (
                <div className="space-y-3">
                  <div className="p-3.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 capitalize">
                        {activeItem.secretType?.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setShowSecret(!showSecret)}
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                        >
                          {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(activeItem.secretValue || '', `Secret for ${activeItem.title}`, { title: activeItem.title, id: activeItem.id })}
                          className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-white rounded-lg"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre-wrap">
                      {showSecret ? activeItem.secretValue : '••••••••••••••••••••••••••••••••••••••••'}
                    </div>
                  </div>
                </div>
              )}

              {/* Cards & Banking */}
              {activeItem.category === 'card' && (
                <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{activeItem.bankName || 'Payment Card'}</span>
                    <span className="font-semibold text-slate-200">{activeItem.cardBrand || 'Card'}</span>
                  </div>
                  <div className="font-mono text-sm sm:text-base tracking-widest text-white">
                    {activeItem.cardNumber || '•••• •••• •••• ••••'}
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 block">CARDHOLDER</span>
                      <span className="text-slate-200 font-medium truncate max-w-[120px] block">{activeItem.cardholderName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 block">EXPIRES</span>
                      <span className="font-mono text-slate-200">{activeItem.cardExpiry}</span>
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-slate-500 block">CVV</span>
                      <span className="font-mono text-slate-200">{activeItem.cardCvv}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Fields if any */}
              {activeItem.customFields && activeItem.customFields.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800/60">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Custom Attributes
                  </span>
                  {activeItem.customFields.map(f => (
                    <div key={f.id} className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">{f.label}</span>
                        <span className="font-mono text-slate-200">{f.value}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(f.value, f.label)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer min-h-[40px] p-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors cursor-pointer min-h-[40px]"
                >
                  <Save className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleStartEdit}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer min-h-[40px]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Record</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${activeItem.title}"?`}
        description={`Are you sure you want to permanently delete "${activeItem.title}" from your encrypted zero-knowledge vault? This action cannot be undone.`}
        confirmLabel="Permanently Delete"
      />
    </div>
  );
};
