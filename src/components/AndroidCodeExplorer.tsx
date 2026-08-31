import React, { useState } from 'react';
import {
  Code2,
  FolderTree,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Layers,
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import JSZip from 'jszip';
import { ANDROID_PROJECT_FILES } from '../data/androidProjectFiles';
import { AndroidFileStructure } from '../types';

export const AndroidCodeExplorer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFileStructure>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [isZipping, setIsZipping] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ui' | 'data' | 'server' | 'security' | 'config' | 'docs'>('all');

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      // Add all project files with exact path hierarchy
      ANDROID_PROJECT_FILES.forEach(file => {
        zip.file(file.path, file.content);
      });

      // Add gradle wrapper properties and standard gradle configs
      zip.file(
        'gradle/wrapper/gradle-wrapper.properties',
        `distributionBase=GRADLE_USER_HOME\ndistributionPath=wrapper/dists\ndistributionUrl=https\\://services.gradle.org/distributions/gradle-8.4-bin.zip\nzipStoreBase=GRADLE_USER_HOME\nzipStorePath=wrapper/dists\n`
      );

      zip.file(
        'gradle.properties',
        `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\nandroid.nonTransitiveRClass=true\nkotlin.code.style=official\n`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AndroidHotspotAuth_Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating project zip:', e);
    } finally {
      setIsZipping(false);
    }
  };

  const filteredFiles = ANDROID_PROJECT_FILES.filter(f => {
    const matchesCategory = categoryFilter === 'all' || f.category === categoryFilter;
    const matchesSearch = f.filename.toLowerCase().includes(searchFilter.toLowerCase()) || f.path.toLowerCase().includes(searchFilter.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#f8fafc] flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-400" />
            Android Studio Project Source Code Explorer
          </h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            Complete production-ready Kotlin, Jetpack Compose, Room DB, and NanoHTTPD Captive Server code.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          <span>{isZipping ? 'Packaging Project ZIP...' : 'Download Full Android Studio Project (.ZIP)'}</span>
        </button>
      </div>

      {/* Main Code Explorer Window */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
        
        {/* Left File Tree Sidebar (4 cols) */}
        <div className="lg:col-span-4 border-r border-[#334155] flex flex-col bg-[#0f172a]/60 max-h-[720px]">
          
          {/* Category Filter Chips */}
          <div className="p-3 border-b border-[#334155] space-y-2">
            <div className="flex items-center gap-2 bg-[#0f172a] px-2.5 py-1.5 rounded-lg border border-[#334155]">
              <Search className="w-3.5 h-3.5 text-[#94a3b8]" />
              <input
                type="text"
                placeholder="Search file name..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="bg-transparent text-xs text-[#f8fafc] placeholder-[#94a3b8] focus:outline-none w-full"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {[
                { id: 'all', label: 'All' },
                { id: 'ui', label: 'Compose UI' },
                { id: 'data', label: 'Room DB' },
                { id: 'server', label: 'Server' },
                { id: 'security', label: 'Security' },
                { id: 'config', label: 'Gradle/Manifest' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id as any)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                    categoryFilter === cat.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#1e293b] text-[#94a3b8] hover:text-[#f8fafc]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Files List */}
          <div className="overflow-y-auto flex-1 p-2 space-y-1">
            {filteredFiles.map(file => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium'
                      : 'hover:bg-[#1e293b]/60 text-[#f8fafc]'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-[#94a3b8]'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate text-xs">{file.filename}</div>
                    <div className="text-[10px] text-[#94a3b8] font-mono truncate">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Right Code Preview & Syntax Area (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-[#0f172a] max-h-[720px]">
          
          {/* File Header Bar */}
          <div className="p-3.5 bg-[#0f172a] border-b border-[#334155] flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#f8fafc] text-xs">{selectedFile.filename}</span>
                <span className="text-[10px] font-mono uppercase bg-[#1e293b] px-1.5 py-0.5 rounded text-[#94a3b8] border border-[#334155]">
                  {selectedFile.language}
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] mt-0.5">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] text-[#f8fafc] border border-[#334155] rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          {/* Code Viewer Body */}
          <div className="overflow-auto flex-1 p-4 font-mono text-xs text-slate-300 leading-relaxed bg-[#0a0f1d]">
            <pre className="whitespace-pre">{selectedFile.content}</pre>
          </div>

        </div>

      </div>

    </div>
  );
};
