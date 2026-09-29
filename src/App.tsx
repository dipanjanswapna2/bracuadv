/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CoursePlan, BotSettings } from './types/advising';
import { DEFAULT_PLANNED_COURSES, INITIAL_STUDENT_INFO } from './data/sampleCourses';
import { Navbar } from './components/Navbar';
import { CoursePlanner } from './components/CoursePlanner';
import { PortalSimulator } from './components/PortalSimulator';
import { ScheduleGrid } from './components/ScheduleGrid';
import { ExtensionDownloadModal } from './components/ExtensionDownloadModal';
import { GuideModal } from './components/GuideModal';
import { soundNotifier } from './utils/audioAlert';
import {
  Sparkles,
  Bot,
  Layers,
  Calendar,
  Download,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from 'lucide-react';

const STORAGE_KEY_COURSES = 'bracu_advising_courses_v2';
const STORAGE_KEY_SETTINGS = 'bracu_advising_settings_v2';

export default function App() {
  // Load courses from localStorage or default
  const [courses, setCourses] = useState<CoursePlan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_COURSES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_PLANNED_COURSES;
  });

  // Load settings from localStorage or default
  const [settings, setSettings] = useState<BotSettings>(() => {
    const defaults: BotSettings = {
      autoStartOnPageLoad: false,
      pollingIntervalMs: 400,
      autoConfirmAdvising: false,
      soundAlerts: true,
      notifyOnFallback: true,
      targetPhase: 'self-registration',
      retryUntilSuccess: true,
      maxRetriesPerCourse: 50,
      simulateHumanDelay: true,
      studentId: INITIAL_STUDENT_INFO.studentId,
      studentName: INITIAL_STUDENT_INFO.name,
    };
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...defaults, ...JSON.parse(saved) };
    } catch {}
    return defaults;
  });

  const [activeTab, setActiveTab] = useState<'planner' | 'simulator' | 'schedule'>('planner');
  const [botRunning, setBotRunning] = useState<boolean>(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COURSES, JSON.stringify(courses));
    } catch {}
  }, [courses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  const handleUpdateSettings = (partial: Partial<BotSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const handleToggleBot = () => {
    if (!botRunning) {
      if (settings.soundAlerts) soundNotifier.playSuccess();
      // If user starts bot from planner or schedule, switch to simulator tab so they can watch!
      if (activeTab !== 'simulator') {
        setActiveTab('simulator');
      }
      setBotRunning(true);
    } else {
      setBotRunning(false);
    }
  };

  const lockedCount = courses.filter((c) => c.status === 'locked').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
        onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
        onOpenGuideModal={() => setIsGuideModalOpen(true)}
        botRunning={botRunning}
        onToggleBot={handleToggleBot}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalCourses={courses.length}
        lockedCourses={lockedCount}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Phase Notice Bar */}
        <div className="mb-6 bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-slate-900/50 border border-blue-500/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <span className="font-semibold text-white">Active Advising Target: </span>
              <span className="text-blue-300 font-mono">
                {settings.targetPhase === 'self-registration'
                  ? 'https://connect.bracu.ac.bd/student/advising/self-registration'
                  : settings.targetPhase === 'phase-one'
                  ? 'https://connect.bracu.ac.bd/student/advising/phase-one'
                  : 'https://connect.bracu.ac.bd/student/advising/phase-two'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsGuideModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 font-medium underline flex items-center gap-1"
            >
              <span>কীভাবে চালাবেন (নির্দেশনা)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Priority Matrix Planner */}
        {activeTab === 'planner' && (
          <CoursePlanner
            courses={courses}
            onUpdateCourses={setCourses}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {/* Tab 2: Interactive BRACU Connect Portal Simulator */}
        {activeTab === 'simulator' && (
          <PortalSimulator
            plannedCourses={courses}
            onUpdatePlannedCourses={setCourses}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            botRunning={botRunning}
            onToggleBot={handleToggleBot}
            onOpenDownloadModal={() => setIsDownloadModalOpen(true)}
          />
        )}

        {/* Tab 3: Class Routine & Conflict Matrix */}
        {activeTab === 'schedule' && <ScheduleGrid courses={courses} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>BRAC University Connect Auto Advising Suite &bull; Student Lifecycle Management</span>
          </div>
          <div>
            <span>Applicable for Self Registration &bull; Pre-Registration Phase 1 &amp; Phase 2</span>
          </div>
        </div>
      </footer>

      {/* Download & Scripts Modal */}
      <ExtensionDownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        courses={courses}
        settings={settings}
      />

      {/* Guide Modal */}
      <GuideModal isOpen={isGuideModalOpen} onClose={() => setIsGuideModalOpen(false)} />
    </div>
  );
}
