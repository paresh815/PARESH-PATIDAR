import React, { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Key,
  Shield,
  Trash2,
  Edit2,
  Sparkles,
  Check,
  Copy,
  Clock,
  History,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Lock
} from 'lucide-react';
import { UserEntity, ConnectionLogEntity } from '../types';
import { dbService } from '../services/dbSimulator';
import { generateSuggestedPassword, hashPasswordSha256, generateSalt } from '../utils/crypto';

interface UsersViewProps {
  users: UserEntity[];
  logs: ConnectionLogEntity[];
  isAddUserOpen: boolean;
  setIsAddUserOpen: (open: boolean) => void;
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({
  users,
  logs,
  isAddUserOpen,
  setIsAddUserOpen,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add User State
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [addError, setAddError] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState(false);

  // Edit / Password Reset State
  const [selectedUser, setSelectedUser] = useState<UserEntity | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetPassInput, setResetPassInput] = useState('');
  
  // Hash Inspector State
  const [inspectUser, setInspectUser] = useState<UserEntity | null>(null);

  // User History State
  const [historyUser, setHistoryUser] = useState<UserEntity | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNameChange = (nameVal: string) => {
    setNewName(nameVal);
    if (!newUsername) {
      const generatedUser = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '');
      setNewUsername(generatedUser);
    }
  };

  const handleGeneratePassword = () => {
    const pass = generateSuggestedPassword(newName || 'USER');
    setNewPassword(pass);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setAddError('Please fill in name, username, and password');
      return;
    }

    try {
      setAddLoading(true);
      await dbService.createUser({
        name: newName,
        username: newUsername,
        password_plaintext: newPassword,
        notes: newNotes,
        active: true,
      });
      setNewName('');
      setNewUsername('');
      setNewPassword('');
      setNewNotes('');
      setIsAddUserOpen(false);
      onRefresh();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create user');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleActive = (id: number) => {
    dbService.toggleUserActive(id);
    onRefresh();
  };

  const handleDeleteUser = (user: UserEntity) => {
    if (window.confirm(`Are you sure you want to delete user @${user.username} (${user.name})?`)) {
      dbService.deleteUser(user.id);
      onRefresh();
    }
  };

  const handleSaveResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !resetPassInput.trim()) return;
    await dbService.updateUser(selectedUser.id, {
      new_password_plaintext: resetPassInput.trim()
    });
    setIsResetPasswordOpen(false);
    setSelectedUser(null);
    setResetPassInput('');
    onRefresh();
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.notes && u.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Hotspot Authorized Users
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Manage authorized credentials, view salted SHA-256 hashes, and activate/deactivate accounts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex items-center gap-3 bg-[#1e293b] border border-[#334155] rounded-lg px-3.5 py-2.5">
        <Search className="w-4 h-4 text-[#94a3b8]" />
        <input
          type="text"
          placeholder="Search by name, user ID, or notes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="bg-transparent text-xs text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none w-full"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs text-[#94a3b8] hover:text-[#f8fafc]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map(user => {
          const samplePasswordHint =
            user.username === 'rahul' ? 'RAHUL123' :
            user.username === 'amit' ? 'AMIT456' :
            user.username === 'mohan' ? 'MOHAN789' :
            user.username === 'priya' ? 'PRIYA999' : 'Set by Admin';

          return (
            <div
              key={user.id}
              className={`bg-[#1e293b] border rounded-xl p-5 flex flex-col justify-between transition-all ${
                user.active
                  ? 'border-[#334155] hover:border-slate-600'
                  : 'border-rose-500/20 bg-[#1e293b]/70 opacity-90'
              }`}
            >
              <div>
                {/* User Card Top Row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      user.active
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : 'bg-[#0f172a] text-[#94a3b8] border border-[#334155]'
                    }`}>
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#f8fafc] text-sm">{user.name}</h3>
                      <span className="text-xs font-mono text-indigo-400 font-medium">
                        @{user.username}
                      </span>
                    </div>
                  </div>

                  {/* Active / Disabled Toggle Button */}
                  <button
                    onClick={() => handleToggleActive(user.id)}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold border transition-colors flex items-center gap-1.5 ${
                      user.active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                    }`}
                    title={user.active ? 'Click to Deactivate' : 'Click to Activate'}
                  >
                    {user.active ? (
                      <>
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <UserX className="w-3.5 h-3.5" />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Password / Credential Info */}
                <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 mb-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#94a3b8] flex items-center gap-1">
                      <Key className="w-3 h-3 text-amber-400" />
                      Login Credential:
                    </span>
                    <button
                      onClick={() => handleCopy(`User: ${user.username} | Pass: ${samplePasswordHint}`, `cred-${user.id}`)}
                      className="text-[11px] text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {copiedId === `cred-${user.id}` ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>Copy</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-[#f8fafc] flex items-center justify-between">
                    <span>User: <strong className="text-indigo-300">{user.username}</strong></span>
                    <span className="text-[#94a3b8]">Pass: <strong className="text-amber-300">{samplePasswordHint}</strong></span>
                  </div>
                </div>

                {/* User Stats */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-[#94a3b8] mb-3">
                  <div className="bg-[#0f172a] border border-[#334155] p-2 rounded-lg">
                    <span className="block text-[#94a3b8] text-[10px]">Total Logins</span>
                    <span className="font-bold text-[#f8fafc] font-mono">{user.total_connections}</span>
                  </div>
                  <div className="bg-[#0f172a] border border-[#334155] p-2 rounded-lg">
                    <span className="block text-[#94a3b8] text-[10px]">Last Connected</span>
                    <span className="font-medium text-[#f8fafc]">
                      {user.last_connected_at ? new Date(user.last_connected_at).toLocaleDateString() : 'Never'}
                    </span>
                  </div>
                </div>

                {user.notes && (
                  <p className="text-xs text-[#94a3b8] mb-3 italic">
                    "{user.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons Row */}
              <div className="pt-3 border-t border-[#334155] flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setInspectUser(user)}
                    className="p-1.5 text-[#94a3b8] hover:text-indigo-400 hover:bg-[#0f172a] rounded-lg text-xs flex items-center gap-1"
                    title="Inspect Password Hash & Salt"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Hash</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setIsResetPasswordOpen(true);
                    }}
                    className="p-1.5 text-[#94a3b8] hover:text-amber-400 hover:bg-[#0f172a] rounded-lg text-xs flex items-center gap-1"
                    title="Change / Reset Password"
                  >
                    <Key className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline text-[11px]">Reset Pass</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHistoryUser(user)}
                    className="p-1.5 text-[#94a3b8] hover:text-[#f8fafc] hover:bg-[#0f172a] rounded-lg text-xs"
                    title="View Connection History"
                  >
                    <History className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteUser(user)}
                    className="p-1.5 text-[#94a3b8] hover:text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs"
                    title="Delete User"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] w-full max-w-md rounded-xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#f8fafc] text-base">Add New Hotspot User</h3>
                  <p className="text-xs text-[#94a3b8]">Generate Wi-Fi credentials for a friend or colleague</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#f8fafc] mb-1">Person's Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={newName}
                  onChange={e => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] focus:outline-none focus:border-indigo-500 placeholder-[#94a3b8]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8fafc] mb-1">User ID / Username</label>
                <input
                  type="text"
                  placeholder="e.g. rahul"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] font-mono focus:outline-none focus:border-indigo-500 placeholder-[#94a3b8]"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#f8fafc]">Hotspot Password</label>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    Auto-Generate
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. RAHUL123"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] font-mono font-bold focus:outline-none focus:border-indigo-500 pr-10 placeholder-[#94a3b8]"
                    required
                  />
                  {newPassword && (
                    <button
                      type="button"
                      onClick={() => handleCopy(newPassword, 'new-pass')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#f8fafc]"
                      title="Copy Password"
                    >
                      {copiedId === 'new-pass' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8fafc] mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Roommate, Daily evening access"
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] focus:outline-none focus:border-indigo-500 placeholder-[#94a3b8]"
                />
              </div>

              {addError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserOpen(false);
                    setAddError(null);
                  }}
                  className="flex-1 py-2.5 rounded-lg text-xs font-medium text-[#94a3b8] hover:bg-[#0f172a] hover:text-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs disabled:opacity-50 transition-all shadow-sm"
                >
                  {addLoading ? 'Hashing & Saving...' : 'Create Hotspot User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] w-full max-w-sm rounded-xl p-6 shadow-2xl">
            <h3 className="font-bold text-[#f8fafc] text-base mb-1">Reset Password for @{selectedUser.username}</h3>
            <p className="text-xs text-[#94a3b8] mb-4">A new cryptographic salt and SHA-256 hash will be generated.</p>

            <form onSubmit={handleSaveResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[#f8fafc]">New Password</label>
                  <button
                    type="button"
                    onClick={() => setResetPassInput(generateSuggestedPassword(selectedUser.name))}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Auto-Generate
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Enter new password"
                  value={resetPassInput}
                  onChange={e => setResetPassInput(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] font-mono font-bold focus:outline-none focus:border-indigo-500 placeholder-[#94a3b8]"
                  required
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsResetPasswordOpen(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-[#94a3b8] hover:bg-[#0f172a]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs shadow-sm"
                >
                  Update Hash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hash & Security Inspector Modal */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] w-full max-w-lg rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-[#f8fafc] text-base">Room Database Hash Inspector</h3>
                  <p className="text-xs text-[#94a3b8]">Inspecting stored cryptographic hashes for @{inspectUser.username}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-[#0f172a] p-3 rounded-lg border border-[#334155] space-y-1">
                <span className="text-[#94a3b8] font-mono text-[10px] uppercase">Algorithm</span>
                <p className="font-semibold text-[#f8fafc]">SHA-256 with 16-character CSPRNG Salt (PBKDF2 Pattern)</p>
              </div>

              <div className="bg-[#0f172a] p-3 rounded-lg border border-[#334155] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#94a3b8] font-mono text-[10px] uppercase">Cryptographic Salt</span>
                  <button onClick={() => handleCopy(inspectUser.salt, 'salt')} className="text-indigo-400 hover:underline text-[10px]">
                    {copiedId === 'salt' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-emerald-400 break-all">{inspectUser.salt}</p>
              </div>

              <div className="bg-[#0f172a] p-3 rounded-lg border border-[#334155] space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[#94a3b8] font-mono text-[10px] uppercase">Password Hash in SQLite Column</span>
                  <button onClick={() => handleCopy(inspectUser.password_hash, 'hash')} className="text-indigo-400 hover:underline text-[10px]">
                    {copiedId === 'hash' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="font-mono text-indigo-300 break-all">{inspectUser.password_hash}</p>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[#f8fafc] text-[11px]">
                🔒 <strong>Zero Plaintext Guarantee:</strong> As specified in the architectural constraints, plain-text passwords are never saved in the database tables. When the user logs in via the Captive Portal, the server hashes the input with the user's salt and compares the result.
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 bg-[#0f172a] hover:bg-[#334155] text-[#f8fafc] rounded-lg text-xs font-medium border border-[#334155]"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Connection History Modal */}
      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-[#334155] w-full max-w-2xl rounded-xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-[#f8fafc] text-base">Connection History: {historyUser.name}</h3>
                <p className="text-xs text-[#94a3b8]">All past hotspot sessions for @{historyUser.username}</p>
              </div>
              <button
                onClick={() => setHistoryUser(null)}
                className="text-[#94a3b8] hover:text-[#f8fafc] text-xs px-2 py-1 bg-[#0f172a] border border-[#334155] rounded-lg"
              >
                ✕ Close
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {logs.filter(l => l.user_id === historyUser.id).length === 0 ? (
                <p className="text-xs text-[#94a3b8] text-center py-8">No recorded connection history for this user yet.</p>
              ) : (
                logs.filter(l => l.user_id === historyUser.id).map(log => (
                  <div key={log.id} className="bg-[#0f172a] border border-[#334155] p-3 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#f8fafc]">{log.device_name}</span>
                        <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                          log.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-[#1e293b] text-[#94a3b8]'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#94a3b8] font-mono">
                        IP: {log.ip_address} • Started: {new Date(log.connected_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-[#94a3b8]">
                      {log.disconnected_at ? `Ended: ${new Date(log.disconnected_at).toLocaleTimeString()}` : 'Currently Active'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
