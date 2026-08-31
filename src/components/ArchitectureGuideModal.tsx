import React from 'react';
import {
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Server,
  Smartphone,
  Wifi,
  Database,
  Lock,
  CheckCircle2,
  Cpu,
  ArrowRight
} from 'lucide-react';

export const ArchitectureGuideModal: React.FC = () => {
  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          Technical Architecture & Android OS Constraints Guide
        </h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">
          तकनीकी स्पष्टीकरण: Android OS में Hotspot User Authentication और Captive Portal कैसे काम करता है।
        </p>
      </div>

      {/* Android Limitation vs Solution Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Box 1: Why Android Restricts WPA2 Sniffing */}
        <div className="bg-[#1e293b] border border-rose-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Android OS Limitation (Why Captive Portal is Required)</span>
          </div>
          <p className="text-xs text-[#f8fafc] leading-relaxed">
            Android के security sandboxing के अनुसार, कोई भी third-party non-system app किसी user द्वारा system Wi-Fi settings में डाले गए WPA2/WPA3 पासवर्ड को secretly intercept या read नहीं कर सकता। यह Android OS का privacy protection नियम है।
          </p>
          <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
            <li>बिना Root के WPA2 Handshake passwords sniff नहीं किए जा सकते।</li>
            <li>System Hotspot में प्रति-व्यक्ति अलग WPA2 पासवर्ड का native UI सपोर्ट नहीं होता।</li>
          </ul>
        </div>

        {/* Box 2: The Production Captive Portal Solution */}
        <div className="bg-[#1e293b] border border-emerald-500/30 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Our Solution: Embedded Captive Portal Server</span>
          </div>
          <p className="text-xs text-[#f8fafc] leading-relaxed">
            हमारा आर्किटेक्चर ठीक उसी तकनीक (Captive Portal) का उपयोग करता है जैसा कि <strong>Airports, Hotels, और Metro Wi-Fi Networks</strong> में होता है।
          </p>
          <ul className="text-xs text-[#94a3b8] space-y-1.5 list-disc list-inside">
            <li>Android App के अंदर एक हल्का <strong>NanoHTTPD Web Server</strong> चलता है।</li>
            <li>User जैसे ही Hotspot से जुड़ता है, उसे <strong>Login Page</strong> दिखता है।</li>
            <li>User अपना व्यक्तिगत User ID और Password (उदा. Rahul / RAHUL123) डालता है।</li>
          </ul>
        </div>

      </div>

      {/* End-to-End Flow Diagram */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-[#f8fafc] text-sm flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          End-to-End Authentication Pipeline (Pipeline Diagram)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-center">
          
          <div className="bg-[#0f172a] p-3.5 rounded-lg border border-[#334155] flex flex-col items-center justify-center">
            <Wifi className="w-6 h-6 text-indigo-400 mb-2" />
            <span className="font-bold text-xs text-[#f8fafc]">1. Wi-Fi Connect</span>
            <span className="text-[10px] text-[#94a3b8] mt-1">Client connects to Android Hotspot AP</span>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-lg border border-[#334155] flex flex-col items-center justify-center">
            <Smartphone className="w-6 h-6 text-amber-400 mb-2" />
            <span className="font-bold text-xs text-[#f8fafc]">2. Portal Probe</span>
            <span className="text-[10px] text-[#94a3b8] mt-1">OS requests /generate_204 & opens Login UI</span>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-lg border border-[#334155] flex flex-col items-center justify-center">
            <Server className="w-6 h-6 text-indigo-400 mb-2" />
            <span className="font-bold text-xs text-[#f8fafc]">3. NanoHTTPD</span>
            <span className="text-[10px] text-[#94a3b8] mt-1">Embedded server at 192.168.43.1:8080</span>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-lg border border-[#334155] flex flex-col items-center justify-center">
            <Database className="w-6 h-6 text-emerald-400 mb-2" />
            <span className="font-bold text-xs text-[#f8fafc]">4. Room SQLite</span>
            <span className="text-[10px] text-[#94a3b8] mt-1">Verifies SHA-256 + Salted Hash in DB</span>
          </div>

          <div className="bg-[#0f172a] p-3.5 rounded-lg border border-[#334155] flex flex-col items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-teal-400 mb-2" />
            <span className="font-bold text-xs text-[#f8fafc]">5. Admin Monitor</span>
            <span className="text-[10px] text-[#94a3b8] mt-1">Live IP, device info & session logs recorded</span>
          </div>

        </div>
      </div>

      {/* Security & Database Rules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Password Security & Hashing</span>
          </div>
          <p className="text-xs text-[#f8fafc] leading-relaxed">
            ऐप में पासवर्ड कभी भी plain text में store नहीं होते:
          </p>
          <ul className="text-xs text-[#94a3b8] space-y-1">
            <li>प्रत्येक user के लिए 16-character cryptographic salt generate होता है।</li>
            <li><code>SHA-256(salt + password)</code> को Room Database के <code>password_hash</code> column में सुरक्षित रखा जाता है।</li>
            <li>Admin Master PIN को <code>Android Keystore</code> & <code>EncryptedSharedPreferences</code> से सुरक्षित किया गया है।</li>
          </ul>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Foreground Service & Uptime</span>
          </div>
          <p className="text-xs text-[#f8fafc] leading-relaxed">
            जब आप Hotspot Server चालू करते हैं:
          </p>
          <ul className="text-xs text-[#94a3b8] space-y-1">
            <li>Android <code>ForegroundService</code> चालू होता है (type: <code>connectedDevice</code>)।</li>
            <li>Notification Bar में live active clients count दिखाता रहता है।</li>
            <li>बैकग्राउंड में फ़ोन की स्क्रीन बंद होने पर भी server चलता रहता है (<code>WAKE_LOCK</code>)।</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
