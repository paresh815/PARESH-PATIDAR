/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { UsersView } from './components/UsersView';
import { LiveConnectionsView } from './components/LiveConnectionsView';
import { HistoryView } from './components/HistoryView';
import { CaptivePortalSimulator } from './components/CaptivePortalSimulator';
import { AndroidCodeExplorer } from './components/AndroidCodeExplorer';
import { ArchitectureGuideModal } from './components/ArchitectureGuideModal';
import { AdminPinModal } from './components/AdminPinModal';
import { dbService } from './services/dbSimulator';
import { UserEntity, ConnectionLogEntity, LoginAttemptEntity, ServerStatus } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Data state from dbService
  const [users, setUsers] = useState<UserEntity[]>(dbService.getUsers());
  const [logs, setLogs] = useState<ConnectionLogEntity[]>(dbService.getLogs());
  const [attempts, setAttempts] = useState<LoginAttemptEntity[]>(dbService.getAttempts());
  const [serverStatus, setServerStatus] = useState<ServerStatus>(dbService.getServerStatus());

  // Security & Modal state
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(true); // Default true for seamless developer review
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // Subscribe to DB updates
  useEffect(() => {
    const unsubscribe = dbService.subscribe(() => {
      setUsers(dbService.getUsers());
      setLogs(dbService.getLogs());
      setAttempts(dbService.getAttempts());
      setServerStatus(dbService.getServerStatus());
    });
    return () => unsubscribe();
  }, []);

  const handleRefresh = () => {
    setUsers(dbService.getUsers());
    setLogs(dbService.getLogs());
    setAttempts(dbService.getAttempts());
    setServerStatus(dbService.getServerStatus());
  };

  const handleToggleServer = () => {
    dbService.toggleServer();
  };

  const handleDisconnectClient = (logId: number) => {
    dbService.disconnectClient(logId);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f8fafc] flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        serverStatus={serverStatus}
        onToggleServer={handleToggleServer}
        isAdminUnlocked={isAdminUnlocked}
        onLockAdmin={() => setIsAdminUnlocked(false)}
        onUnlockAdmin={() => setIsPinModalOpen(true)}
        totalUsersCount={users.length}
        activeOnlineCount={logs.filter(l => l.status === 'connected').length}
      />

      {/* Main App Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {activeTab === 'dashboard' && (
          <DashboardView
            users={users}
            logs={logs}
            attempts={attempts}
            serverStatus={serverStatus}
            onToggleServer={handleToggleServer}
            onNavigateToUsers={() => setActiveTab('users')}
            onNavigateToLive={() => setActiveTab('live')}
            onNavigateToSimulator={() => setActiveTab('simulator')}
            onNavigateToCode={() => setActiveTab('code')}
            onDisconnectClient={handleDisconnectClient}
            onOpenAddUser={() => {
              setActiveTab('users');
              setIsAddUserModalOpen(true);
            }}
          />
        )}

        {activeTab === 'users' && (
          <UsersView
            users={users}
            logs={logs}
            isAddUserOpen={isAddUserModalOpen}
            setIsAddUserOpen={setIsAddUserModalOpen}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'live' && (
          <LiveConnectionsView
            logs={logs}
            users={users}
            onNavigateToSimulator={() => setActiveTab('simulator')}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            logs={logs}
            attempts={attempts}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'simulator' && (
          <CaptivePortalSimulator
            serverStatus={serverStatus}
            users={users}
            onLoginSuccess={() => {
              handleRefresh();
            }}
          />
        )}

        {activeTab === 'code' && (
          <AndroidCodeExplorer />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureGuideModal />
        )}

      </main>

      {/* Admin PIN Verification / Change Modal */}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => {
          setIsAdminUnlocked(true);
          setIsPinModalOpen(false);
        }}
      />

    </div>
  );
}
