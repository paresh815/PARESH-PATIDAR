import React from 'react';
import {
  Users,
  Wifi,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Plus,
  Play,
  Square,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  UserCheck,
  UserX,
  Copy,
  Check
} from 'lucide-react';
import { UserEntity, ConnectionLogEntity, LoginAttemptEntity, ServerStatus } from '../types';

interface DashboardViewProps {
  users: UserEntity[];
  logs: ConnectionLogEntity[];
  attempts: LoginAttemptEntity[];
  serverStatus: ServerStatus;
  onToggleServer: () => void;
  onNavigateToUsers: () => void;
  onNavigateToLive: () => void;
  onNavigateToSimulator: () => void;
  onNavigateToCode: () => void;
  onDisconnectClient: (logId: number) => void;
  onOpenAddUser: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  users,
  logs,
  attempts,
  serverStatus,
  onToggleServer,
  onNavigateToUsers,
  onNavigateToLive,
  onNavigateToSimulator,
  onNavigateToCode,
  onDisconnectClient,
  onOpenAddUser,
}) => {
  const [copiedUser, setCopiedUser] = React.useState<string | null>(null);

  const activeSessions = logs.filter(l => l.status === 'connected');
  
  // Calculate today's stats
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayConnectionsCount = logs.filter(l => new Date(l.connected_at).getTime() >= startOfDay).length;
  const todayFailedAttemptsCount = attempts.filter(a => !a.success && new Date(a.timestamp).getTime() >= startOfDay).length;

  const handleCopyCredentials = (username: string, samplePass: string) => {
    navigator.clipboard.writeText(`User: ${username} | Pass: ${samplePass}`);
    setCopiedUser(username);
    setTimeout(() => setCopiedUser(null), 2000);
  };

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
    return `${mins}m ${secs}s`;
  };

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="space-y-6 pb-12">

      {/* Top Banner: Hotspot Server Status & Architecture Indicator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Main Server Card */}
        <div className={`lg:col-span-2 rounded-xl p-5 border transition-all ${
          serverStatus.isRunning
            ? 'bg-[#1e293b] border-indigo-500/30 shadow-sm'
            : 'bg-[#1e293b] border-rose-500/30'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className={`p-3 rounded-lg border ${
                serverStatus.isRunning
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}>
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-[#f8fafc]">
                    Embedded Hotspot Captive Server
                  </h2>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    serverStatus.isRunning
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {serverStatus.isRunning ? 'RUNNING :8080' : 'STOPPED'}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] mt-1">
                  Local Android Gateway: <span className="font-mono text-indigo-300 font-medium">http://192.168.43.1:8080</span>
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[#94a3b8]">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#94a3b8]" />
                    Uptime: <strong className="text-[#f8fafc] font-mono">{formatUptime(serverStatus.uptimeSeconds)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Hotspot SSID: <strong className="text-[#f8fafc] font-mono">{serverStatus.ssid}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Active Clients: <strong className="text-emerald-400 font-bold">{activeSessions.length}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Server Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={onToggleServer}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  serverStatus.isRunning
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                    : 'bg-emerald-600 text-white font-bold hover:bg-emerald-500'
                }`}
              >
                {serverStatus.isRunning ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-rose-400" />
                    Stop Server
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white" />
                    Start Server
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Simulator & Code Shortcuts */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Quick Actions</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-xs text-[#94a3b8] mb-3">
              Test client authentication or inspect Kotlin Android Studio code:
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onNavigateToSimulator}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 rounded-lg text-xs font-semibold transition-colors"
            >
              <Smartphone className="w-4 h-4" />
              <span>Test Portal</span>
            </button>

            <button
              onClick={onOpenAddUser}
              className="flex items-center justify-center gap-1.5 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add User</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4 Core Primary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Currently Connected Users */}
        <div className="bg-[#1e293b] border border-[#334155] hover:border-emerald-500/40 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94a3b8]">CURRENTLY CONNECTED</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#f8fafc] font-mono">
              {activeSessions.length}
            </span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]"></span>
              Live Online
            </span>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-1">Authorized client sessions</p>
        </div>

        {/* Metric 2: Total Users */}
        <div className="bg-[#1e293b] border border-[#334155] hover:border-indigo-500/40 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94a3b8]">TOTAL USERS</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#f8fafc] font-mono">
              {users.length}
            </span>
            <span className="text-xs text-[#94a3b8]">
              ({users.filter(u => u.active).length} Active)
            </span>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-1">Stored in Room SQLite DB</p>
        </div>

        {/* Metric 3: Today's Connections */}
        <div className="bg-[#1e293b] border border-[#334155] hover:border-indigo-500/40 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94a3b8]">TODAY'S SESSIONS</span>
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#f8fafc] font-mono">
              {todayConnectionsCount}
            </span>
            <span className="text-xs text-indigo-300">Sessions</span>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-1">Since 00:00 AM</p>
        </div>

        {/* Metric 4: Failed Login Attempts */}
        <div className="bg-[#1e293b] border border-[#334155] hover:border-rose-500/40 rounded-xl p-5 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#94a3b8]">FAILED ATTEMPTS</span>
            <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#f8fafc] font-mono">
              {todayFailedAttemptsCount}
            </span>
            <span className="text-xs text-rose-400">Rejected</span>
          </div>
          <p className="text-[11px] text-[#94a3b8] mt-1">Invalid credentials/disabled</p>
        </div>

      </div>

      {/* Main Content Split: Live Connected Devices + User List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Currently Connected Devices */}
        <div className="lg:col-span-2 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-[#f8fafc] text-sm sm:text-base">
                Live Connected Devices ({activeSessions.length})
              </h3>
            </div>
            <button
              onClick={onNavigateToLive}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              View Full Live Monitor <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {activeSessions.length === 0 ? (
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#0f172a] text-[#94a3b8] mx-auto flex items-center justify-center mb-3 border border-[#334155]">
                <Wifi className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#f8fafc]">No Authorized Devices Connected</p>
              <p className="text-xs text-[#94a3b8] mt-1 max-w-sm mx-auto">
                Users must connect to the Wi-Fi hotspot and authenticate on the Captive Portal page.
              </p>
              <button
                onClick={onNavigateToSimulator}
                className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs inline-flex items-center gap-2 transition-colors shadow-sm"
              >
                <Smartphone className="w-4 h-4" />
                Simulate Client Login (e.g. Rahul)
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {activeSessions.map(session => (
                <div
                  key={session.id}
                  className="bg-[#1e293b] border border-[#334155] hover:border-emerald-500/30 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f8fafc] text-sm">
                          @{session.username}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#22c55e]"></span>
                          Online
                        </span>
                      </div>
                      <p className="text-xs text-[#94a3b8] font-medium mt-0.5">
                        {session.device_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-[#94a3b8] font-mono">
                        <span className="text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                          IP: {session.ip_address}
                        </span>
                        <span>Connected: {new Date(session.connected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => onDisconnectClient(session.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Login Attempts Stream */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-[#94a3b8] text-xs uppercase tracking-wider">
                Recent Authentication Attempts
              </h4>
            </div>

            <div className="bg-[#1e293b] border border-[#334155] rounded-xl divide-y divide-[#334155] overflow-hidden">
              {attempts.slice(0, 5).map(attempt => (
                <div key={attempt.id} className="p-3 sm:p-3.5 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${attempt.success ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f8fafc]">@{attempt.username}</span>
                        <span className="text-[#94a3b8] font-mono text-[11px]">{attempt.ip_address}</span>
                      </div>
                      <p className="text-[11px] text-[#94a3b8] truncate">
                        {attempt.device_info} {attempt.failure_reason && `• ${attempt.failure_reason}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      attempt.success
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {attempt.success ? 'AUTHORIZED' : 'REJECTED'}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      {formatTimeAgo(attempt.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right 1 Column: Authorized Hotspot Users List */}
        <div className="space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-[#f8fafc] text-sm sm:text-base">
                Hotspot Users ({users.length})
              </h3>
            </div>
            <button
              onClick={onNavigateToUsers}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              Manage <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {users.slice(0, 5).map(user => {
              const defaultPasswordSample =
                user.username === 'rahul' ? 'RAHUL123' :
                user.username === 'amit' ? 'AMIT456' :
                user.username === 'mohan' ? 'MOHAN789' :
                user.username === 'priya' ? 'PRIYA999' : '••••••••';

              return (
                <div
                  key={user.id}
                  className="bg-[#1e293b] border border-[#334155] rounded-xl p-3.5 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        user.active
                          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                          : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155]'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#f8fafc] text-xs">{user.name}</span>
                          <span className="text-[11px] text-[#94a3b8] font-mono">@{user.username}</span>
                        </div>
                        <span className="text-[10px] text-[#94a3b8]">
                          {user.total_connections} logins • Last: {formatTimeAgo(user.last_connected_at)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        user.active
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {user.active ? 'Active' : 'Disabled'}
                      </span>
                      
                      <button
                        onClick={() => handleCopyCredentials(user.username, defaultPasswordSample)}
                        className="p-1 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#334155] rounded"
                        title="Copy Sample Credential"
                      >
                        {copiedUser === user.username ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {user.notes && (
                    <p className="text-[11px] text-[#94a3b8] mt-2 bg-[#0f172a] px-2 py-1 rounded border border-[#334155]">
                      {user.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <button
            onClick={onOpenAddUser}
            className="w-full py-2.5 px-4 bg-[#1e293b] hover:bg-[#334155]/50 border border-dashed border-[#334155] hover:border-indigo-500 text-indigo-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Hotspot User</span>
          </button>

        </div>

      </div>

    </div>
  );
};
