import React from 'react';
import { VaultProvider, useVault } from './context/VaultContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewView } from './components/dashboard/OverviewView';
import { VaultListView } from './components/vault/VaultListView';
import { WorkspacesView } from './components/workspaces/WorkspacesView';
import { SettingsView } from './components/settings/SettingsView';

// Modals & Drawers
import { ItemDetailModal } from './components/vault/ItemDetailModal';
import { CreateItemModal } from './components/vault/CreateItemModal';
import { PasswordGeneratorModal } from './components/generator/PasswordGeneratorModal';
import { EmergencyKitModal } from './components/recovery/EmergencyKitModal';
import { EmergencyRecoveryModal } from './components/recovery/EmergencyRecoveryModal';
import { ExtensionSimulatorDrawer } from './components/extension/ExtensionSimulatorDrawer';
import { AIAssistantDrawer } from './components/ai/AIAssistantDrawer';
import { VaultLockScreen } from './components/lock/VaultLockScreen';
import { AndroidAppModal } from './components/android/AndroidAppModal';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { StartupSplash } from './components/splash/StartupSplash';

import { MobileBottomNav } from './components/layout/MobileBottomNav';

const MainLayout: React.FC = () => {
  const { 
    activeTab, 
    isAndroidModalOpen, 
    setIsAndroidModalOpen,
    isRecoveryModalOpen,
    setIsRecoveryModalOpen
  } = useVault();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200 antialiased">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main View Area */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-8">
          {activeTab === 'overview' && <OverviewView />}
          {activeTab === 'vault' && <VaultListView />}
          {activeTab === 'workspaces' && <WorkspacesView />}
          {(activeTab === 'settings' || activeTab === 'security') && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden on md+) */}
      <MobileBottomNav />

      {/* Global Modals & Overlays */}
      <ItemDetailModal />
      <CreateItemModal />
      <PasswordGeneratorModal />
      <EmergencyKitModal />
      <ExtensionSimulatorDrawer />
      <AIAssistantDrawer />
      <VaultLockScreen />
      <EmergencyRecoveryModal
        isOpen={isRecoveryModalOpen}
        onClose={() => setIsRecoveryModalOpen(false)}
      />
      <AndroidAppModal 
        isOpen={isAndroidModalOpen} 
        onClose={() => setIsAndroidModalOpen(false)} 
      />
      <OfflineIndicator />
      <StartupSplash />
    </div>
  );
};

export default function App() {
  return (
    <VaultProvider>
      <MainLayout />
    </VaultProvider>
  );
}
