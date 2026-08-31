import React, { useState } from 'react';
import {
  Smartphone,
  Wifi,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Zap,
  Globe,
  Radio
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { dbService } from '../services/dbSimulator';
import { ServerStatus, UserEntity } from '../types';

interface CaptivePortalSimulatorProps {
  serverStatus: ServerStatus;
  users: UserEntity[];
  onLoginSuccess: () => void;
}

export const CaptivePortalSimulator: React.FC<CaptivePortalSimulatorProps> = ({
  serverStatus,
  users,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('rahul');
  const [password, setPassword] = useState('RAHUL123');
  const [selectedDevice, setSelectedDevice] = useState('Samsung Galaxy S24 Ultra (SM-S928B)');
  const [clientIp, setClientIp] = useState('192.168.43.142');
  
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const devicePresets = [
    { label: 'Samsung Galaxy S24 (Android 14)', value: 'Samsung Galaxy S24 Ultra (SM-S928B)', ip: '192.168.43.142' },
    { label: 'OnePlus 12 5G (Android 14)', value: 'OnePlus 12 5G (CPH2581)', ip: '192.168.43.88' },
    { label: 'Apple iPhone 15 Pro (iOS 17)', value: 'Apple iPhone 15 Pro (iOS 17.4)', ip: '192.168.43.205' },
    { label: 'Xiaomi Redmi Note 13', value: 'Redmi Note 13 Pro+ 5G', ip: '192.168.43.91' },
    { label: 'Dell XPS Laptop (Windows 11)', value: 'Dell XPS 15 (Windows 11 NCSI)', ip: '192.168.43.60' },
  ];

  const handleSelectPreset = (uName: string, pass: string, reason?: string) => {
    setUsername(uName);
    setPassword(pass);
    setFeedback(null);
  };

  const handleDeviceChange = (deviceVal: string) => {
    setSelectedDevice(deviceVal);
    const found = devicePresets.find(p => p.value === deviceVal);
    if (found) setClientIp(found.ip);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setFeedback(null);

    const timestamp = new Date().toLocaleTimeString();
    setDebugLog(prev => [
      `[${timestamp}] POST http://${serverStatus.gatewayIp}:${serverStatus.port}/api/login`,
      `[${timestamp}] Headers: Client-IP: ${clientIp}, User-Agent: ${selectedDevice}`,
      `[${timestamp}] Payload: { username: "${username.trim()}", password: "•••" }`,
      ...prev.slice(0, 7)
    ]);

    // Simulate network latency (250ms)
    await new Promise(r => setTimeout(r, 300));

    const result = await dbService.authenticateClient({
      username: username.trim(),
      password_plaintext: password.trim(),
      ip_address: clientIp,
      device_name: selectedDevice,
      user_agent: `Mozilla/5.0 (${selectedDevice}) HotspotAuth/1.0`,
    });

    setIsLoading(false);
    setFeedback({
      success: result.success,
      message: result.message,
    });

    if (result.success) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      onLoginSuccess();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            Interactive Client Captive Portal Simulator
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Experience how connected mobile devices interact with your Android Hotspot embedded web server.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#94a3b8]">Server Target:</span>
          <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
            http://{serverStatus.gatewayIp}:{serverStatus.port}/login
          </span>
        </div>
      </div>

      {/* Main Grid: Mobile Frame Simulator + Test Scenarios & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side (5 cols): Smartphone Mockup with Live Captive Login Page */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-[360px] bg-[#1e293b] border-4 border-[#334155] rounded-[36px] p-4 shadow-2xl relative overflow-hidden ring-1 ring-slate-600/30">
            
            {/* Phone Top Notch & Status Bar */}
            <div className="flex items-center justify-between px-2 pt-1 pb-3 text-[10px] text-[#94a3b8] font-mono">
              <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="w-16 h-3.5 bg-[#0f172a] rounded-full mx-auto"></div>
              <div className="flex items-center gap-1.5 text-[#f8fafc]">
                <Wifi className="w-3 h-3 text-indigo-400" />
                <span className="font-bold">100%</span>
              </div>
            </div>

            {/* Captive Portal Browser Header Bar */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-2 mb-3 flex items-center gap-2 text-xs">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="font-mono text-[11px] text-[#f8fafc] truncate">
                http://{serverStatus.gatewayIp}:{serverStatus.port}/login
              </span>
              <span className="ml-auto text-[9px] uppercase font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                Captive
              </span>
            </div>

            {/* Captive Portal Inside Screen */}
            <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-5 min-h-[440px] flex flex-col justify-between">
              
              <div>
                {/* Branding Icon & Title */}
                <div className="text-center pt-2 pb-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mx-auto mb-2.5 shadow-sm">
                    <Wifi className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-[#f8fafc]">Hotspot Login</h3>
                  <p className="text-[11px] text-[#94a3b8] mt-0.5">
                    Wi-Fi Hotspot Authentication System
                  </p>
                </div>

                {/* Status / Error / Success Message Box */}
                {feedback && (
                  <div className={`p-3 rounded-lg text-xs mb-4 border flex items-start gap-2 animate-in fade-in zoom-in-95 duration-150 ${
                    feedback.success
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  }`}>
                    {feedback.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="text-[11px] leading-relaxed">
                      <strong>{feedback.success ? 'Success!' : 'Auth Failed:'}</strong> {feedback.message}
                    </div>
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleFormSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#f8fafc] mb-1">
                      User ID / Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. rahul, amit, mohan"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-xs text-[#f8fafc] font-mono focus:outline-none focus:border-indigo-500 placeholder-[#94a3b8]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#f8fafc] mb-1">
                      Hotspot Password
                    </label>
                    <input
                      type="text"
                      placeholder="Enter assigned password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1e293b] border border-[#334155] rounded-lg text-xs text-[#f8fafc] font-mono font-bold focus:outline-none focus:border-indigo-500 placeholder-[#94a3b8]"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || !serverStatus.isRunning}
                    className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verifying with Database...</span>
                      </>
                    ) : (
                      <>
                        <span>Connect to Hotspot</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Bottom Hotspot Security Notice */}
              <div className="pt-4 border-t border-[#334155] text-center text-[10px] text-[#94a3b8]">
                Client IP: <span className="text-[#f8fafc] font-mono">{clientIp}</span><br />
                Secured by Android Hotspot Manager
              </div>

            </div>

            {/* Phone Home Bar */}
            <div className="w-24 h-1 bg-[#334155] rounded-full mx-auto mt-3"></div>

          </div>
        </div>

        {/* Right Side (7 cols): Test Presets, Simulation Scenarios & Live Packet Debugger */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Quick Preset Buttons (As requested by user prompt) */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-[#f8fafc] text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Quick Test Scenarios (User Prompt Examples)
              </h3>
              <span className="text-[11px] text-[#94a3b8]">Click to fill form</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Preset 1: Rahul (Authorized) */}
              <button
                type="button"
                onClick={() => handleSelectPreset('rahul', 'RAHUL123')}
                className="p-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] hover:border-indigo-500/40 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f8fafc] text-xs group-hover:text-indigo-300">
                    Rahul (Authorized)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Valid Test
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#94a3b8] mt-1">
                  User: <strong className="text-[#f8fafc]">rahul</strong> | Pass: <strong className="text-amber-300">RAHUL123</strong>
                </p>
              </button>

              {/* Preset 2: Amit (Authorized) */}
              <button
                type="button"
                onClick={() => handleSelectPreset('amit', 'AMIT456')}
                className="p-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] hover:border-indigo-500/40 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f8fafc] text-xs group-hover:text-indigo-300">
                    Amit (Authorized)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Valid Test
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#94a3b8] mt-1">
                  User: <strong className="text-[#f8fafc]">amit</strong> | Pass: <strong className="text-amber-300">AMIT456</strong>
                </p>
              </button>

              {/* Preset 3: Mohan (Deactivated) */}
              <button
                type="button"
                onClick={() => handleSelectPreset('mohan', 'MOHAN789')}
                className="p-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] hover:border-rose-500/40 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f8fafc] text-xs group-hover:text-rose-300">
                    Mohan (Deactivated)
                  </span>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Disabled Test
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#94a3b8] mt-1">
                  User: <strong className="text-[#f8fafc]">mohan</strong> | Pass: <strong className="text-amber-300">MOHAN789</strong>
                </p>
              </button>

              {/* Preset 4: Invalid Password */}
              <button
                type="button"
                onClick={() => handleSelectPreset('rahul', 'WRONG_PASSWORD_999')}
                className="p-3 bg-[#0f172a] hover:bg-[#1e293b] border border-[#334155] hover:border-rose-500/40 rounded-lg text-left transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#f8fafc] text-xs group-hover:text-rose-300">
                    Wrong Password Test
                  </span>
                  <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Fail Audit
                  </span>
                </div>
                <p className="text-[11px] font-mono text-[#94a3b8] mt-1">
                  User: <strong className="text-[#f8fafc]">rahul</strong> | Pass: <strong className="text-rose-300">WRONG999</strong>
                </p>
              </button>

            </div>
          </div>

          {/* Client Device Hardware & IP Selector */}
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-[#f8fafc] text-sm flex items-center gap-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              Simulated Client Device Hardware & IP
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#f8fafc] mb-1">Device Model / User-Agent</label>
                <select
                  value={selectedDevice}
                  onChange={e => handleDeviceChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-[#f8fafc] focus:outline-none focus:border-indigo-500"
                >
                  {devicePresets.map(dp => (
                    <option key={dp.value} value={dp.value}>
                      {dp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#f8fafc] mb-1">Assigned DHCP Local IP</label>
                <input
                  type="text"
                  value={clientIp}
                  onChange={e => setClientIp(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-[#334155] rounded-lg text-xs text-indigo-300 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Live HTTP Request Debug Log Console */}
          <div className="bg-[#0f172a] border border-[#334155] rounded-xl p-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#334155]">
              <span className="text-[#94a3b8] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Captive Portal HTTP Request Stream
              </span>
              <button
                onClick={() => setDebugLog([])}
                className="text-[10px] text-[#94a3b8] hover:text-[#f8fafc]"
              >
                Clear Log
              </button>
            </div>

            {debugLog.length === 0 ? (
              <p className="text-[#94a3b8] text-[11px] py-2">
                Awaiting authentication requests... Submit the form on the phone preview to see real-time packet exchange.
              </p>
            ) : (
              <div className="space-y-1 text-[11px] text-[#f8fafc] max-h-36 overflow-y-auto">
                {debugLog.map((log, i) => (
                  <div key={i} className="text-[#94a3b8]">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
