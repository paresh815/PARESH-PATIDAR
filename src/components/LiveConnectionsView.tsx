import React from 'react';
import {
  Radio,
  Wifi,
  Smartphone,
  Laptop,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  XCircle,
  UserX,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ConnectionLogEntity, UserEntity } from '../types';
import { dbService } from '../services/dbSimulator';

interface LiveConnectionsViewProps {
  logs: ConnectionLogEntity[];
  users: UserEntity[];
  onNavigateToSimulator: () => void;
  onRefresh: () => void;
}

export const LiveConnectionsView: React.FC<LiveConnectionsViewProps> = ({
  logs,
  users,
  onNavigateToSimulator,
  onRefresh,
}) => {
  const activeSessions = logs.filter(l => l.status === 'connected');

  const handleDisconnect = (logId: number) => {
    dbService.disconnectClient(logId);
    onRefresh();
  };

  const handleKickAndDisable = (session: ConnectionLogEntity) => {
    if (window.confirm(`Kick session and permanently deactivate user @${session.username}?`)) {
      dbService.kickClient(session.id);
      dbService.toggleUserActive(session.user_id);
      onRefresh();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const calculateDuration = (connectedAt: string) => {
    const diff = Math.floor((Date.now() - new Date(connectedAt).getTime()) / 1000);
    const mins = Math.floor(diff / 60);
    const secs = diff % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      return `${hrs}h ${mins % 60}m`;
    }
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
              Live Connected Hotspot Devices
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {activeSessions.length} Online
            </span>
          </div>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Active authenticated clients connected to your Android Wi-Fi Hotspot interface.
          </p>
        </div>

        <button
          onClick={onNavigateToSimulator}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition-colors self-start sm:self-center shadow-sm"
        >
          <Smartphone className="w-4 h-4" />
          <span>Connect New Device (Simulator)</span>
        </button>
      </div>

      {/* Active Clients List */}
      {activeSessions.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[#0f172a] text-[#94a3b8] mx-auto flex items-center justify-center mb-4 border border-[#334155]">
            <Wifi className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-[#f8fafc]">No Active Connections</h3>
          <p className="text-xs text-[#94a3b8] max-w-md mx-auto mt-1 mb-6">
            When friends or clients connect to your hotspot and enter their assigned credentials on the captive portal login page, their active IP, device model, and data usage will appear here in real-time.
          </p>
          <button
            onClick={onNavigateToSimulator}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs inline-flex items-center gap-2 transition-all shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Launch Interactive Client Login Simulator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSessions.map(session => {
            const user = users.find(u => u.id === session.user_id);
            const isPhone = session.device_name.toLowerCase().includes('phone') || session.device_name.toLowerCase().includes('galaxy') || session.device_name.toLowerCase().includes('oneplus') || session.device_name.toLowerCase().includes('redmi');

            return (
              <div
                key={session.id}
                className="bg-[#1e293b] border border-[#334155] hover:border-slate-600 rounded-xl p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: User details & status */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        {isPhone ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#f8fafc] text-base">
                            {user?.name || session.username}
                          </h3>
                          <span className="font-mono text-xs text-indigo-400 font-medium">
                            @{session.username}
                          </span>
                        </div>
                        <p className="text-xs text-[#94a3b8] font-medium">
                          {session.device_name}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                      Connected
                    </span>
                  </div>

                  {/* Network Details Card */}
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3.5 space-y-2 text-xs mb-4">
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-[#94a3b8]">IP Address</span>
                      <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {session.ip_address}
                      </span>
                    </div>

                    {session.mac_address && (
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[#94a3b8]">MAC / Identifier</span>
                        <span className="text-[#f8fafc]">{session.mac_address}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-[#94a3b8] flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Duration
                      </span>
                      <span className="text-[#f8fafc] font-medium font-mono">
                        {calculateDuration(session.connected_at)} (since {new Date(session.connected_at).toLocaleTimeString()})
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#334155]">
                      <span className="text-[#94a3b8]">Simulated Traffic</span>
                      <div className="flex items-center gap-3 text-[11px] font-mono">
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <ArrowDownCircle className="w-3.5 h-3.5" />
                          {formatBytes(session.bytes_in)}
                        </span>
                        <span className="text-indigo-400 flex items-center gap-0.5">
                          <ArrowUpCircle className="w-3.5 h-3.5" />
                          {formatBytes(session.bytes_out)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Disconnect & Kick Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#334155]">
                  <button
                    onClick={() => handleDisconnect(session.id)}
                    className="flex-1 py-2 px-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>

                  <button
                    onClick={() => handleKickAndDisable(session)}
                    className="py-2 px-3 bg-[#0f172a] hover:bg-rose-900/30 text-[#94a3b8] hover:text-rose-300 border border-[#334155] text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                    title="Disconnect and disable this user account"
                  >
                    <UserX className="w-4 h-4" />
                    <span className="hidden sm:inline">Kick & Block</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
