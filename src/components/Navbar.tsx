import React from 'react';
import { BotSettings, AdvisingPhase } from '../types/advising';
import { Bot, Download, Code2, BookOpen, Sparkles, CheckCircle2, Play, Square } from 'lucide-react';

interface NavbarProps {
  settings: BotSettings;
  onUpdateSettings: (newSettings: Partial<BotSettings>) => void;
  onOpenDownloadModal: () => void;
  onOpenGuideModal: () => void;
  botRunning: boolean;
  onToggleBot: () => void;
  activeTab: 'planner' | 'simulator' | 'schedule';
  setActiveTab: (tab: 'planner' | 'simulator' | 'schedule') => void;
  totalCourses: number;
  lockedCourses: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  onUpdateSettings,
  onOpenDownloadModal,
  onOpenGuideModal,
  botRunning,
  onToggleBot,
  activeTab,
  setActiveTab,
  totalCourses,
  lockedCourses,
}) => {
  const phases: { id: AdvisingPhase; label: string; short: string }[] = [
    { id: 'self-registration', label: 'Self Registration', short: 'Self Reg' },
    { id: 'phase-one', label: 'Pre-Registration Phase One', short: 'Phase 1' },
    { id: 'phase-two', label: 'Pre-Registration Phase Two', short: 'Phase 2' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                BRACU Advising Bot
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                v2.4 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Auto-Choice, Smart Priority Fallback &amp; Slot Locking
            </p>
          </div>
        </div>

        {/* Phase Selector Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          {phases.map((p) => (
            <button
              key={p.id}
              onClick={() => onUpdateSettings({ targetPhase: p.id })}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                settings.targetPhase === p.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="sm:inline hidden">{p.label}</span>
              <span className="sm:hidden inline">{p.short}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Bot Toggle */}
          <button
            onClick={onToggleBot}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-md ${
              botRunning
                ? 'bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            {botRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Bot</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Simulator</span>
              </>
            )}
          </button>

          {/* Download Extension Suite */}
          <button
            onClick={onOpenDownloadModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Get Chrome Extension</span>
            <span className="md:hidden">Extension</span>
          </button>

          {/* Guide Modal */}
          <button
            onClick={onOpenGuideModal}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all border border-slate-700"
            title="Bangla & English Instructions"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Guide (বাংলা)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs & Status Indicator */}
      <div className="border-t border-slate-800/80 bg-slate-950/50 px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setActiveTab('planner')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'planner'
                ? 'bg-slate-800 text-blue-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Priority Matrix Planner ({totalCourses} Courses)
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'simulator'
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. BRACU Connect Live Simulator
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              activeTab === 'schedule'
                ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            3. Routine &amp; Clash Matrix
          </button>
        </div>

        {/* Real-time stats */}
        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Secured:</span>
            <span className="font-bold text-emerald-400">{lockedCourses}/{totalCourses}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-500">Portal target:</span>
            <span className="font-mono text-slate-300">connect.bracu.ac.bd</span>
          </div>
        </div>
      </div>
    </header>
  );
};
