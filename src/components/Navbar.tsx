import React from 'react';
import {
  Wifi,
  WifiOff,
  LayoutDashboard,
  Users,
  Radio,
  History,
  Smartphone,
  Code2,
  BookOpen,
  Lock,
  Unlock,
  ShieldCheck
} from 'lucide-react';
import { ServerStatus } from '../types';

export type ActiveTab = 'dashboard' | 'users' | 'live' | 'history' | 'simulator' | 'code' | 'architecture';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  serverStatus: ServerStatus;
  onToggleServer: () => void;
  isAdminUnlocked: boolean;
  onLockAdmin: () => void;
  onUnlockAdmin: () => void;
  totalUsersCount: number;
  activeOnlineCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  serverStatus,
  onToggleServer,
  isAdminUnlocked,
  onLockAdmin,
  onUnlockAdmin,
  totalUsersCount,
  activeOnlineCount,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users, badge: totalUsersCount },
    { id: 'live', label: 'Live Connections', icon: Radio, badge: activeOnlineCount, highlightBadge: activeOnlineCount > 0 },
    { id: 'history', label: 'Logs & History', icon: History },
    { id: 'simulator', label: 'Captive Portal Test', icon: Smartphone, accent: true },
    { id: 'code', label: 'Android Code & ZIP', icon: Code2 },
    { id: 'architecture', label: 'Architecture Guide', icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#020617] border-b border-[#334155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold shadow-sm">
              <Wifi className="w-4 h-4 text-white" />
              {serverStatus.isRunning && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-[#020617]"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#f8fafc] text-sm sm:text-base tracking-tight">
                  Hotspot Auth & Monitor
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Android + Kotlin
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] hidden sm:block">
                Captive Portal & Room Database Logging
              </p>
            </div>
          </div>

          {/* Quick Server Status & Admin Lock */}
          <div className="flex items-center gap-3">
            
            {/* Server Quick Toggle */}
            <button
              onClick={onToggleServer}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-200 ${
                serverStatus.isRunning
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
              }`}
              title="Click to toggle Hotspot Captive Server"
            >
              {serverStatus.isRunning ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]"></span>
                  <span className="hidden md:inline font-bold">HOTSPOT ACTIVE</span>
                  <span className="font-mono text-[11px] text-emerald-300">192.168.43.1:8080</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>HOTSPOT OFFLINE</span>
                </>
              )}
            </button>

            {/* Admin PIN Lock/Unlock Status */}
            <button
              onClick={isAdminUnlocked ? onLockAdmin : onUnlockAdmin}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                isAdminUnlocked
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20'
                  : 'bg-[#1e293b] border-[#334155] text-[#94a3b8] hover:bg-[#334155]/60 hover:text-[#f8fafc]'
              }`}
              title={isAdminUnlocked ? 'Admin Mode Unlocked (Click to Lock)' : 'Locked (Click to enter PIN)'}
            >
              {isAdminUnlocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Admin Unlocked</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Admin Locked</span>
                </>
              )}
            </button>

          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-2 pt-1 scrollbar-none border-t border-[#334155]">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-[#1e293b] text-[#f8fafc] font-semibold border-b-2 border-indigo-500'
                    : tab.accent
                    ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20'
                    : 'text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#1e293b]/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : tab.accent ? 'text-indigo-400' : 'text-[#94a3b8]'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : tab.highlightBadge
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-[#334155] text-[#94a3b8]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
