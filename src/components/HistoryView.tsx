import React, { useState } from 'react';
import {
  History,
  Search,
  Filter,
  Download,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Laptop,
  Smartphone,
  ShieldAlert,
  FileSpreadsheet
} from 'lucide-react';
import { ConnectionLogEntity, LoginAttemptEntity } from '../types';
import { dbService } from '../services/dbSimulator';

interface HistoryViewProps {
  logs: ConnectionLogEntity[];
  attempts: LoginAttemptEntity[];
  onRefresh: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  logs,
  attempts,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'attempts'>('sessions');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected' | 'kicked' | 'success' | 'failed'>('all');

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear historic connection logs and login attempts?')) {
      dbService.clearHistoryLogs();
      onRefresh();
    }
  };

  const exportToCSV = () => {
    if (activeTab === 'sessions') {
      const headers = ['ID', 'User ID', 'Username', 'Device Name', 'IP Address', 'Connected At', 'Disconnected At', 'Status', 'Bytes In', 'Bytes Out'];
      const rows = logs.map(l => [
        l.id,
        l.user_id,
        l.username,
        `"${l.device_name}"`,
        l.ip_address,
        l.connected_at,
        l.disconnected_at || 'Active',
        l.status,
        l.bytes_in,
        l.bytes_out
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `hotspot_sessions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['ID', 'Username', 'IP Address', 'Device Info', 'Timestamp', 'Success', 'Failure Reason'];
      const rows = attempts.map(a => [
        a.id,
        a.username,
        a.ip_address,
        `"${a.device_info}"`,
        a.timestamp,
        a.success ? 'TRUE' : 'FALSE',
        `"${a.failure_reason || 'N/A'}"`
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `hotspot_login_attempts_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ip_address.includes(searchQuery) ||
      log.device_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return log.status === statusFilter;
  });

  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch =
      attempt.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.ip_address.includes(searchQuery) ||
      attempt.device_info.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (attempt.failure_reason && attempt.failure_reason.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'success') return attempt.success;
    if (statusFilter === 'failed') return !attempt.success;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Connection History & Audit Logs
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Complete records of Wi-Fi hotspot sessions, device IPs, timestamps, and authentication attempts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] border border-[#334155] rounded-lg text-xs font-medium flex items-center gap-2 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#1e293b] border border-[#334155] p-3 rounded-xl">
        
        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#0f172a] p-1 rounded-lg border border-[#334155] self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('sessions');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'sessions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Connection Sessions ({logs.length})
          </button>

          <button
            onClick={() => {
              setActiveTab('attempts');
              setStatusFilter('all');
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'attempts'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#94a3b8] hover:text-[#f8fafc]'
            }`}
          >
            Login Attempts ({attempts.length})
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center gap-2 bg-[#0f172a] px-3 py-1.5 rounded-lg border border-[#334155] w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Filter user, IP, or device..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none w-full"
          />
        </div>

      </div>

      {/* Sessions Table View */}
      {activeTab === 'sessions' ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#f8fafc]">
              <thead className="bg-[#0f172a] text-[#94a3b8] font-medium uppercase tracking-wider text-[11px] border-b border-[#334155]">
                <tr>
                  <th className="px-4 py-3.5">User</th>
                  <th className="px-4 py-3.5">Device & User-Agent</th>
                  <th className="px-4 py-3.5">IP Address</th>
                  <th className="px-4 py-3.5">Connected At</th>
                  <th className="px-4 py-3.5">Disconnected At</th>
                  <th className="px-4 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#94a3b8]">
                      No connection records matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-[#f8fafc] whitespace-nowrap">
                        @{log.username}
                      </td>
                      <td className="px-4 py-3.5 max-w-xs truncate">
                        <span className="font-medium text-[#f8fafc]">{log.device_name}</span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-indigo-300 whitespace-nowrap">
                        {log.ip_address}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#94a3b8] whitespace-nowrap">
                        {new Date(log.connected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#94a3b8] whitespace-nowrap">
                        {log.disconnected_at
                          ? new Date(log.disconnected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })
                          : <span className="text-emerald-400 font-bold">Currently Active</span>
                        }
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.status === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : log.status === 'kicked'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155]'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Login Attempts Table View */
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#f8fafc]">
              <thead className="bg-[#0f172a] text-[#94a3b8] font-medium uppercase tracking-wider text-[11px] border-b border-[#334155]">
                <tr>
                  <th className="px-4 py-3.5">Result</th>
                  <th className="px-4 py-3.5">User ID</th>
                  <th className="px-4 py-3.5">Device & Client</th>
                  <th className="px-4 py-3.5">Client IP</th>
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Failure Reason / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[#94a3b8]">
                      No login attempt records found.
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map(attempt => (
                    <tr key={attempt.id} className="hover:bg-[#0f172a]/50 transition-colors">
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {attempt.success ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle className="w-3 h-3" />
                            SUCCESS
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <XCircle className="w-3 h-3" />
                            FAILED
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#f8fafc] whitespace-nowrap">
                        @{attempt.username}
                      </td>
                      <td className="px-4 py-3.5 text-[#f8fafc] max-w-xs truncate">
                        {attempt.device_info}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-indigo-300 whitespace-nowrap">
                        {attempt.ip_address}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[#94a3b8] whitespace-nowrap">
                        {new Date(attempt.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                      </td>
                      <td className="px-4 py-3.5 text-[#94a3b8]">
                        {attempt.failure_reason ? (
                          <span className="text-rose-300 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/50 text-[11px]">
                            {attempt.failure_reason}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">Authorized & Authenticated</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
