import React, { useState } from 'react';
import { useVault } from '../../context/VaultContext';
import { 
  X, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  Tag, 
  ArrowRight, 
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';

export const AIAssistantDrawer: React.FC = () => {
  const { 
    isAiAssistantOpen, 
    setIsAiAssistantOpen, 
    items, 
    setActiveItem, 
    workspaces,
    updateItem 
  } = useVault();

  const [naturalQuery, setNaturalQuery] = useState('');
  const [queryResults, setQueryResults] = useState<any[]>([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [activeTab, setActiveTab] = useState<'finder' | 'hygiene'>('finder');

  if (!isAiAssistantOpen) return null;

  // Natural language query processor (local privacy-first semantic matcher)
  const handleRunQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalQuery.trim()) return;

    const q = naturalQuery.toLowerCase();
    const matches = items.filter(it => {
      // Intent matching
      const matchesClient = workspaces.some(w => q.includes(w.name.toLowerCase()) && it.workspaceId === w.id);
      const matchesHosting = (q.includes('hosting') || q.includes('cloud') || q.includes('server')) && (it.collection.toLowerCase().includes('hosting') || it.tags.some(t => t.includes('cloud') || t.includes('aws')));
      const matchesDatabase = (q.includes('database') || q.includes('sql') || q.includes('postgres')) && (it.category === 'secret' || it.title.toLowerCase().includes('database'));
      const matchesWifi = (q.includes('wifi') || q.includes('wi-fi') || q.includes('network')) && it.category === 'wifi';
      const matchesLicence = (q.includes('licence') || q.includes('license') || q.includes('software')) && it.category === 'licence';
      const matchesMfa = (q.includes('mfa') || q.includes('2fa') || q.includes('two factor')) && it.category === 'login' && !it.mfaEnabled;
      const directWordMatch = it.title.toLowerCase().includes(q) || it.collection.toLowerCase().includes(q);

      return matchesClient || matchesHosting || matchesDatabase || matchesWifi || matchesLicence || matchesMfa || directWordMatch;
    });

    setQueryResults(matches);
    setHasQueried(true);
  };

  // Find items with missing metadata or tags
  const itemsMissingTags = items.filter(i => i.tags.length === 0);
  const itemsMissingUrls = items.filter(i => i.category === 'login' && !i.url);

  const handleApplySuggestedTag = (itemId: string, suggestedTag: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    updateItem(itemId, {
      tags: [...item.tags, suggestedTag]
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {/* Top Header */}
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-white">AI Vault Assistant (Module F)</h2>
                <p className="text-[10px] text-slate-400">Privacy-first metadata assistance</p>
              </div>
            </div>
            <button
              onClick={() => setIsAiAssistantOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Privacy Guarantee Pill */}
          <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted secrets are never transmitted to LLMs. All queries operate on client metadata.</span>
          </div>

          {/* Tab Selector */}
          <div className="flex p-2 bg-slate-900 border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('finder')}
              className={`flex-1 py-1.5 rounded font-medium text-center transition-colors cursor-pointer ${
                activeTab === 'finder' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Natural Language Finder
            </button>
            <button
              onClick={() => setActiveTab('hygiene')}
              className={`flex-1 py-1.5 rounded font-medium text-center transition-colors cursor-pointer ${
                activeTab === 'hygiene' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Metadata Suggestions
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(100vh-220px)] text-xs">
            {activeTab === 'finder' ? (
              <div className="space-y-4">
                <form onSubmit={handleRunQuery} className="space-y-2">
                  <label className="block text-slate-400 font-medium">
                    Ask a question about your vault records
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. Find hosting credentials for Acme, or accounts missing MFA"
                      value={naturalQuery}
                      onChange={(e) => setNaturalQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    Search with Natural Language
                  </button>
                </form>

                {/* Example Quick Prompts */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                    Example Queries
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Which accounts are missing MFA?',
                      'Which passwords need rotation?',
                      'Find production API keys',
                      'Show Wi-Fi networks'
                    ].map(sample => (
                      <button
                        key={sample}
                        onClick={() => {
                          setNaturalQuery(sample);
                        }}
                        className="text-[11px] text-indigo-300 bg-indigo-950/40 hover:bg-indigo-950 border border-indigo-900/60 px-2 py-1 rounded transition-colors text-left"
                      >
                        {sample}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results List */}
                {hasQueried && (
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-300 block">
                      Found {queryResults.length} Relevant Record(s)
                    </span>

                    {queryResults.length === 0 ? (
                      <div className="p-4 bg-slate-950 rounded-lg text-center text-slate-500">
                        No matches found for that query.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {queryResults.map(item => (
                          <div 
                            key={item.id}
                            onClick={() => {
                              setActiveItem(item);
                              setIsAiAssistantOpen(false);
                            }}
                            className="p-3 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="font-semibold text-white truncate">{item.title}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span>{item.collection}</span>
                              <span>·</span>
                              <span className="capitalize">{item.category}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-200 mb-1">Missing Metadata Clean-up</h3>
                  <p className="text-[11px] text-slate-400">
                    The assistant analyzed vault metadata locally and detected these optimization opportunities:
                  </p>
                </div>

                {/* Untagged items suggestion */}
                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Suggested Tags for Organization
                  </span>
                  {items.slice(0, 3).map(item => (
                    <div key={item.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                      <div className="font-medium text-slate-200 truncate">{item.title}</div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <span className="text-[11px] text-slate-500">Suggested:</span>
                        <button
                          onClick={() => handleApplySuggestedTag(item.id, 'client-verified')}
                          className="text-[10px] text-indigo-300 bg-indigo-950/60 border border-indigo-800/80 px-2 py-0.5 rounded hover:bg-indigo-900/60"
                        >
                          + #client-verified
                        </button>
                        <button
                          onClick={() => handleApplySuggestedTag(item.id, 'critical-infra')}
                          className="text-[10px] text-sky-300 bg-sky-950/60 border border-sky-800/80 px-2 py-0.5 rounded hover:bg-sky-900/60"
                        >
                          + #critical-infra
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500">
          Module F Design Constitution: No raw plaintext or master keys are passed to external models.
        </div>
      </div>
    </div>
  );
};
