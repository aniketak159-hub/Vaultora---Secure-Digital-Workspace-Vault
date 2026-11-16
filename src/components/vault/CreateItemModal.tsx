import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  X, 
  Key, 
  FileText, 
  Award, 
  CreditCard, 
  Wifi, 
  Fingerprint, 
  Terminal, 
  Sparkles, 
  KeyRound,
  Plus
} from 'lucide-react';
import { ItemCategory, VaultItem } from '../../types/vault';
import { generateSecureSecret } from '../../crypto/cryptoService';

export const CreateItemModal: React.FC = () => {
  const { 
    isCreateModalOpen, 
    setIsCreateModalOpen, 
    workspaces, 
    activeWorkspaceId, 
    addItem 
  } = useVault();

  const [category, setCategory] = useState<ItemCategory>('login');
  const [workspaceId, setWorkspaceId] = useState<string>(
    activeWorkspaceId === 'all' ? 'personal' : activeWorkspaceId
  );
  const [title, setTitle] = useState('');
  const [collection, setCollection] = useState('');
  const [tagsStr, setTagsStr] = useState('');

  // Login
  const [url, setUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Note
  const [noteContent, setNoteContent] = useState('');
  const [recoveryCodesStr, setRecoveryCodesStr] = useState('');

  // Licence
  const [softwareName, setSoftwareName] = useState('');
  const [licenceKey, setLicenceKey] = useState('');
  const [seats, setSeats] = useState(1);
  const [expiryDate, setExpiryDate] = useState('');

  // Wi-Fi
  const [ssid, setSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [routerAdminUrl, setRouterAdminUrl] = useState('');

  // Secret
  const [secretType, setSecretType] = useState<'ssh_key' | 'api_token' | 'database_url'>('api_token');
  const [secretValue, setSecretValue] = useState('');

  // Card
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [bankName, setBankName] = useState('');

  if (!isCreateModalOpen) return null;

  const currentWorkspace = workspaces.find(w => w.id === workspaceId);
  const availableCollections = currentWorkspace?.collections || ['General'];

  const handleGeneratePassword = () => {
    const generated = generateSecureSecret({
      length: 20,
      useUpper: true,
      useLower: true,
      useNumbers: true,
      useSymbols: true,
      avoidAmbiguous: true,
      mode: 'password'
    });
    setPassword(generated);
  };

  const handleGenerateWifiPassword = () => {
    const generated = generateSecureSecret({
      length: 16,
      useUpper: true,
      useLower: true,
      useNumbers: true,
      useSymbols: false,
      avoidAmbiguous: true,
      mode: 'password'
    });
    setWifiPassword(generated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsStr
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    const baseItem = {
      workspaceId,
      collection: collection.trim() || availableCollections[0] || 'General',
      title: title.trim(),
      category,
      tags,
      favorite: false
    };

    let itemPayload: any = { ...baseItem };

    if (category === 'login') {
      itemPayload = {
        ...itemPayload,
        url: url.trim(),
        username: username.trim(),
        password: password.trim(),
        mfaEnabled,
        lastRotatedAt: new Date().toISOString()
      };
    } else if (category === 'note') {
      const recoveryCodes = recoveryCodesStr
        .split('\n')
        .map(c => c.trim())
        .filter(Boolean);
      itemPayload = {
        ...itemPayload,
        noteContent: noteContent.trim(),
        recoveryCodes
      };
    } else if (category === 'licence') {
      itemPayload = {
        ...itemPayload,
        softwareName: softwareName.trim(),
        licenceKey: licenceKey.trim(),
        seats: Number(seats) || 1,
        expiryDate: expiryDate.trim()
      };
    } else if (category === 'wifi') {
      itemPayload = {
        ...itemPayload,
        ssid: ssid.trim(),
        wifiPassword: wifiPassword.trim(),
        securityType: 'WPA3-Personal',
        routerAdminUrl: routerAdminUrl.trim()
      };
    } else if (category === 'secret') {
      itemPayload = {
        ...itemPayload,
        secretType,
        secretValue: secretValue.trim()
      };
    } else if (category === 'card') {
      itemPayload = {
        ...itemPayload,
        cardholderName: cardholderName.trim(),
        cardNumber: cardNumber.trim(),
        cardExpiry: cardExpiry.trim(),
        cardCvv: cardCvv.trim(),
        bankName: bankName.trim(),
        cardBrand: 'Visa'
      };
    }

    addItem(itemPayload);
    setIsCreateModalOpen(false);

    // Reset fields
    setTitle('');
    setUrl('');
    setUsername('');
    setPassword('');
    setNoteContent('');
    setTagsStr('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-white">New Vault Record</h2>
            <p className="text-xs text-slate-400 mt-0.5">Encrypted client-side before storage</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Template Category Selector */}
          <div>
            <label className="block text-slate-400 font-medium mb-1.5">
              Record Template
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <button
                type="button"
                onClick={() => setCategory('login')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors min-h-[48px] ${
                  category === 'login' 
                    ? 'bg-indigo-950/80 border-indigo-600 text-indigo-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Key className="w-4 h-4 text-indigo-400" />
                <span className="text-[11px]">Login</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('note')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors min-h-[48px] ${
                  category === 'note' 
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px]">Note / 2FA</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('licence')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors min-h-[48px] ${
                  category === 'licence' 
                    ? 'bg-amber-950/80 border-amber-600 text-amber-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span className="text-[11px]">Licence</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('wifi')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors min-h-[48px] ${
                  category === 'wifi' 
                    ? 'bg-teal-950/80 border-teal-600 text-teal-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wifi className="w-4 h-4 text-teal-400" />
                <span className="text-[11px]">Wi-Fi</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('secret')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors min-h-[48px] ${
                  category === 'secret' 
                    ? 'bg-rose-950/80 border-rose-600 text-rose-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-4 h-4 text-rose-400" />
                <span className="text-[11px]">API Secret</span>
              </button>

              <button
                type="button"
                onClick={() => setCategory('card')}
                className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors min-h-[48px] ${
                  category === 'card' 
                    ? 'bg-purple-950/80 border-purple-600 text-purple-300 font-semibold' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CreditCard className="w-4 h-4 text-purple-400" />
                <span className="text-[11px]">Bank / Card</span>
              </button>
            </div>
          </div>

          {/* Workspace and Collection Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Target Workspace</label>
              <select
                value={workspaceId}
                onChange={(e) => setWorkspaceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
              >
                {workspaces.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Collection</label>
              <input
                type="text"
                value={collection}
                placeholder={availableCollections[0] || 'Hosting & Cloud'}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
              />
            </div>
          </div>

          {/* Record Title */}
          <div>
            <label className="block text-slate-400 mb-1">Title *</label>
            <input
              type="text"
              required
              value={title}
              placeholder={category === 'login' ? 'e.g. AWS Production Console' : 'e.g. Office Fiber Network'}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
            />
          </div>

          {/* Dynamic Template Specific Inputs */}
          {category === 'login' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Website URL</label>
                <input
                  type="url"
                  value={url}
                  placeholder="https://app.service.com"
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Username / Email</label>
                <input
                  type="text"
                  value={username}
                  placeholder="user@example.com"
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <label className="text-slate-300 font-medium">Account Password</label>
                    <span className="text-[10px] text-slate-500 font-normal">(for this service)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Generate Strong Secret</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={password}
                  placeholder="Enter or generate account password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Stored encrypted inside your vault. This is distinct from your zero-knowledge Vault Master Passphrase.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mfaCheckbox"
                  checked={mfaEnabled}
                  onChange={(e) => setMfaEnabled(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="mfaCheckbox" className="text-slate-300 cursor-pointer">
                  MFA / 2FA is active on this account
                </label>
              </div>
            </div>
          )}

          {category === 'note' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Secure Note Body</label>
                <textarea
                  rows={4}
                  value={noteContent}
                  placeholder="Enter private notes, server configurations, or instructions..."
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Emergency Backup Codes (one per line)</label>
                <textarea
                  rows={3}
                  value={recoveryCodesStr}
                  placeholder="8A92-4C10-99E1&#10;4F22-91BB-002A"
                  onChange={(e) => setRecoveryCodesStr(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          )}

          {category === 'licence' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Software / Product Name</label>
                <input
                  type="text"
                  value={softwareName}
                  placeholder="e.g. Adobe Creative Cloud for Teams"
                  onChange={(e) => setSoftwareName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Licence Key</label>
                <input
                  type="text"
                  value={licenceKey}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  onChange={(e) => setLicenceKey(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          )}

          {category === 'wifi' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Network SSID</label>
                <input
                  type="text"
                  value={ssid}
                  placeholder="e.g. Office_Guest_5GHz"
                  onChange={(e) => setSsid(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-400">Wi-Fi Password</label>
                  <button
                    type="button"
                    onClick={handleGenerateWifiPassword}
                    className="text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Generate Passphrase</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={wifiPassword}
                  placeholder="WPA3 Network Password"
                  onChange={(e) => setWifiPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          )}

          {category === 'secret' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1">Secret Type</label>
                <select
                  value={secretType}
                  onChange={(e) => setSecretType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="api_token">API Token / Secret Key</option>
                  <option value="ssh_key">SSH Private Key</option>
                  <option value="database_url">Database Connection String</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Secret Value</label>
                <textarea
                  rows={4}
                  value={secretValue}
                  placeholder="Paste private key, Bearer token, or connection string..."
                  onChange={(e) => setSecretValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="pt-2 border-t border-slate-800">
            <label className="block text-slate-400 mb-1">Tags (comma-separated)</label>
            <input
              type="text"
              value={tagsStr}
              placeholder="production, client, critical, billing"
              onChange={(e) => setTagsStr(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
            />
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm shadow-indigo-600/30 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Save Encrypted Record</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
