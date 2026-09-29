import React, { useState, useEffect, useRef } from 'react';
import {
  CoursePlan,
  PortalRow,
  SelectedSection,
  BotSettings,
  BotLog,
} from '../types/advising';
import {
  INITIAL_STUDENT_INFO,
  MOCK_AVAILABLE_PORTAL_ROWS,
  INITIAL_SELECTED_SECTIONS,
} from '../data/sampleCourses';
import { soundNotifier } from '../utils/audioAlert';
import confetti from 'canvas-confetti';
import {
  Search,
  Bell,
  Eye,
  PlusCircle,
  MinusCircle,
  Printer,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Zap,
  Sliders,
  Sparkles,
  Terminal,
} from 'lucide-react';

interface PortalSimulatorProps {
  plannedCourses: CoursePlan[];
  onUpdatePlannedCourses: (courses: CoursePlan[]) => void;
  settings: BotSettings;
  onUpdateSettings: (settings: Partial<BotSettings>) => void;
  botRunning: boolean;
  onToggleBot: () => void;
  onOpenDownloadModal: () => void;
}

export const PortalSimulator: React.FC<PortalSimulatorProps> = ({
  plannedCourses,
  onUpdatePlannedCourses,
  settings,
  onUpdateSettings,
  botRunning,
  onToggleBot,
  onOpenDownloadModal,
}) => {
  const [quickFilter, setQuickFilter] = useState('');
  const [availableRows, setAvailableRows] = useState<PortalRow[]>(MOCK_AVAILABLE_PORTAL_ROWS);
  const [selectedSections, setSelectedSections] = useState<SelectedSection[]>(INITIAL_SELECTED_SECTIONS);
  const [logs, setLogs] = useState<BotLog[]>([]);
  const [isBotMinimized, setIsBotMinimized] = useState(false);
  const [activeCourseDetailsModal, setActiveCourseDetailsModal] = useState<PortalRow | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmedAdvisingState, setConfirmedAdvisingState] = useState(false);

  // Calculate credits taken
  const creditTaken = selectedSections.reduce((sum, item) => sum + item.credits, 0);

  // Helper log function
  const addLog = (type: BotLog['type'], message: string, courseCode?: string, choicePriority?: number) => {
    const newLog: BotLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
      courseCode,
      choicePriority,
    };
    setLogs((prev) => [newLog, ...prev.slice(0, 49)]);
  };

  // Bot Auto Runner Loop
  useEffect(() => {
    if (!botRunning) return;

    let timeoutId: NodeJS.Timeout;

    const executeBotStep = async () => {
      // Check which courses are not yet locked
      const pendingCourses = plannedCourses.filter((c) => c.status !== 'locked');

      if (pendingCourses.length === 0) {
        addLog('success', '🎉 ALL COURSES SECURED! Entire routine locked in schedule.');
        if (settings.soundAlerts) soundNotifier.playSuccess();
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });

        if (settings.autoConfirmAdvising && !confirmedAdvisingState) {
          addLog('action', '⚡ Auto Confirm Advising: Triggering Confirm button...');
          setConfirmedAdvisingState(true);
          setShowConfirmModal(true);
        }

        onToggleBot();
        return;
      }

      // Pick the first pending course
      const currentTarget = pendingCourses[0];
      addLog('info', `Scanning portal for ${currentTarget.courseCode}...`, currentTarget.courseCode);

      // Auto type in quick filter to emulate typing
      setQuickFilter(currentTarget.courseCode.toLowerCase());

      // Give a tiny simulated delay for table filtering
      await new Promise((r) => setTimeout(r, 220));

      // Filter available rows for this course
      const matchingRows = availableRows.filter(
        (r) => r.courseCode.toUpperCase() === currentTarget.courseCode.toUpperCase()
      );

      // Iterate through user's prioritized choices (1st to 6th choice)
      let secured = false;
      const sortedChoices = [...currentTarget.choices].sort((a, b) => a.priority - b.priority);

      for (const choice of sortedChoices) {
        const targetSec = choice.sectionNumber.padStart(2, '0');
        addLog(
          'info',
          `Evaluating Choice #${choice.priority}: ${currentTarget.courseCode} Sec ${targetSec} (${choice.faculty})`,
          currentTarget.courseCode,
          choice.priority
        );

        const targetRow = matchingRows.find(
          (r) =>
            r.sectionNumber.padStart(2, '0') === targetSec &&
            (!choice.faculty || choice.faculty === 'ANY' || r.faculty.toUpperCase() === choice.faculty.toUpperCase())
        );

        if (!targetRow) {
          addLog(
            'warning',
            `Section ${targetSec} (${choice.faculty}) not found in available list. Moving to next choice.`,
            currentTarget.courseCode
          );
          continue;
        }

        // Check seat availability!
        if (targetRow.availableSeats <= 0) {
          addLog(
            'warning',
            `Choice #${choice.priority} Sec ${targetSec} (${choice.faculty}) has ${targetRow.availableSeats} seats (FULL). Falling back to next priority!`,
            currentTarget.courseCode,
            choice.priority
          );
          if (settings.soundAlerts) soundNotifier.playFallback();
          continue; // Fall back to next priority choice!
        }

        // Available seats > 0! Lock slot!
        addLog(
          'action',
          `🔥 SEAT AVAILABLE! Choice #${choice.priority} Sec ${targetSec} has ${targetRow.availableSeats} seat(s). Clicking Green [+] button!`,
          currentTarget.courseCode,
          choice.priority
        );

        // Deduct 1 seat in mock data
        setAvailableRows((prev) =>
          prev.map((r) =>
            r.rowId === targetRow.rowId ? { ...r, availableSeats: r.availableSeats - 1 } : r
          )
        );

        // Add to selected sections
        const newSelected: SelectedSection = {
          rowId: 'sec-' + Date.now(),
          courseCode: targetRow.courseCode,
          sectionNumber: targetRow.sectionNumber,
          faculty: targetRow.faculty,
          rawString: `${targetRow.courseCode}-[${targetRow.sectionNumber}] -${targetRow.faculty}`,
          credits: targetRow.credits,
          scheduleDays: targetRow.scheduleDays,
          scheduleTime: targetRow.scheduleTime,
          room: targetRow.room,
          isLab: targetRow.isLab,
        };

        setSelectedSections((prev) => [...prev, newSelected]);

        // If co-requisite lab exists, auto-add lab too!
        if (currentTarget.hasLab && choice.labSectionNumber) {
          const labCode = currentTarget.labCode || `${currentTarget.courseCode}L`;
          const labSec = choice.labSectionNumber.padStart(2, '0');
          const labRow = availableRows.find(
            (r) => r.courseCode === labCode && r.sectionNumber === labSec
          );
          if (labRow) {
            setSelectedSections((prev) => [
              ...prev,
              {
                rowId: 'sec-lab-' + Date.now(),
                courseCode: labRow.courseCode,
                sectionNumber: labRow.sectionNumber,
                faculty: labRow.faculty,
                rawString: `${labRow.courseCode}-[${labRow.sectionNumber}] -${labRow.faculty}`,
                credits: labRow.credits,
                scheduleDays: labRow.scheduleDays,
                scheduleTime: labRow.scheduleTime,
                room: labRow.room,
                isLab: true,
              },
            ]);
            addLog(
              'success',
              `Auto-locked linked lab ${labCode} Sec ${labSec}!`,
              labCode
            );
          }
        }

        // Update planned course status to locked
        onUpdatePlannedCourses(
          plannedCourses.map((c) =>
            c.id === currentTarget.id
              ? {
                  ...c,
                  status: 'locked',
                  securedSection: targetSec,
                  securedFaculty: targetRow.faculty,
                }
              : c
          )
        );

        if (settings.soundAlerts) soundNotifier.playSuccess();
        secured = true;
        addLog(
          'success',
          `✅ LOCKED ${currentTarget.courseCode} Sec ${targetSec} (${targetRow.faculty}) via Priority #${choice.priority}!`,
          currentTarget.courseCode,
          choice.priority
        );
        break;
      }

      if (!secured) {
        addLog(
          'warning',
          `All choices for ${currentTarget.courseCode} are currently full (0 seats). Retrying next poll cycle...`,
          currentTarget.courseCode
        );
      }

      // Schedule next polling tick
      timeoutId = setTimeout(executeBotStep, settings.pollingIntervalMs);
    };

    timeoutId = setTimeout(executeBotStep, 400);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [botRunning, availableRows, plannedCourses, settings]);

  // Drop course from selected list
  const handleDropSection = (rowId: string) => {
    const dropped = selectedSections.find((s) => s.rowId === rowId);
    if (!dropped) return;

    setSelectedSections((prev) => prev.filter((s) => s.rowId !== rowId));

    // Release plan status
    onUpdatePlannedCourses(
      plannedCourses.map((c) =>
        c.courseCode === dropped.courseCode
          ? { ...c, status: 'idle', securedSection: undefined, securedFaculty: undefined }
          : c
      )
    );

    // Increase seat back in available
    setAvailableRows((prev) =>
      prev.map((r) =>
        r.courseCode === dropped.courseCode && r.sectionNumber === dropped.sectionNumber
          ? { ...r, availableSeats: r.availableSeats + 1 }
          : r
      )
    );

    addLog('info', `Dropped ${dropped.rawString} from selected sections.`, dropped.courseCode);
  };

  // Manual Add Section
  const handleManualAddSection = (row: PortalRow) => {
    if (row.availableSeats <= 0) {
      alert(`Cannot select section: Available seats is ${row.availableSeats}.`);
      return;
    }

    // Add to selected
    setSelectedSections((prev) => [
      ...prev,
      {
        rowId: 'sec-' + Date.now(),
        courseCode: row.courseCode,
        sectionNumber: row.sectionNumber,
        faculty: row.faculty,
        rawString: `${row.courseCode}-[${row.sectionNumber}] -${row.faculty}`,
        credits: row.credits,
        scheduleDays: row.scheduleDays,
        scheduleTime: row.scheduleTime,
        room: row.room,
        isLab: row.isLab,
      },
    ]);

    // Decrease seat
    setAvailableRows((prev) =>
      prev.map((r) =>
        r.rowId === row.rowId ? { ...r, availableSeats: r.availableSeats - 1 } : r
      )
    );

    // Mark plan as locked if it matches
    onUpdatePlannedCourses(
      plannedCourses.map((c) =>
        c.courseCode === row.courseCode
          ? { ...c, status: 'locked', securedSection: row.sectionNumber, securedFaculty: row.faculty }
          : c
      )
    );

    if (settings.soundAlerts) soundNotifier.playSuccess();
    addLog('action', `Manual Click: Added ${row.rawString}`, row.courseCode);
  };

  // Simulation test tools: Drop Choice 1 seat to 0 to test fallback!
  const handleTestSimulateSeatFull = () => {
    setAvailableRows((prev) =>
      prev.map((r) =>
        r.courseCode === 'CSE230' && r.sectionNumber === '05'
          ? { ...r, availableSeats: 0 }
          : r
      )
    );
    addLog('warning', 'SIMULATION: Set CSE230 Sec 05 (AVB) to 0 seats to test fallback!');
  };

  const handleTestSimulateSeatOpen = () => {
    setAvailableRows((prev) =>
      prev.map((r) =>
        r.courseCode === 'CSE230' && (r.sectionNumber === '04' || r.sectionNumber === '08')
          ? { ...r, availableSeats: 3 }
          : r
      )
    );
    addLog('success', 'SIMULATION: Opened 3 seats in CSE230 Sec 04 (TSM) and Sec 08 (TBA)!');
  };

  // Filtered rows
  const filteredAvailableRows = availableRows.filter((row) => {
    if (!quickFilter.trim()) return true;
    const q = quickFilter.toLowerCase();
    return (
      row.rawString.toLowerCase().includes(q) ||
      row.courseCode.toLowerCase().includes(q) ||
      row.faculty.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Simulation Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-200">
            Live Interactive Portal Simulator (connect.bracu.ac.bd)
          </span>
          <span className="text-xs text-slate-500 hidden sm:inline">•</span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Matches official USIS Angular + AG-Grid advising portal
          </span>
        </div>

        {/* Test Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTestSimulateSeatFull}
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-all"
            title="Sets CSE230 Choice 1 to 0 seats"
          >
            Simulate 0 Seats on 1st Choice
          </button>
          <button
            onClick={handleTestSimulateSeatOpen}
            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium transition-all"
            title="Opens 3 seats on 2nd choice"
          >
            Open Seats on Fallback Choice
          </button>
          <button
            onClick={() => {
              setAvailableRows(MOCK_AVAILABLE_PORTAL_ROWS);
              setSelectedSections(INITIAL_SELECTED_SECTIONS);
              onUpdatePlannedCourses(
                plannedCourses.map((c) => ({
                  ...c,
                  status: 'idle',
                  securedSection: undefined,
                  securedFaculty: undefined,
                }))
              );
              setConfirmedAdvisingState(false);
              addLog('info', 'Reset simulator to initial state.');
            }}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition-all flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Simulated BRACU Connect Portal Frame */}
      <div className="bg-[#f5f8fa] text-slate-800 rounded-2xl border border-slate-300/80 shadow-2xl overflow-hidden relative">
        {/* Portal Top Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white font-serif font-black text-sm shadow-sm">
                B
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-blue-900 text-xs block">BRAC UNIVERSITY</span>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold font-mono border border-blue-200">
                    SLMS
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-semibold uppercase">
                  Student Lifecycle Management System (New USIS)
                </span>
              </div>
            </div>
            <span className="text-gray-300 hidden md:inline">|</span>
            <div className="hidden md:flex items-center gap-1 text-xs text-gray-500">
              <span>Student</span>
              <span>/</span>
              <span className="font-semibold text-gray-800">
                {settings.targetPhase === 'self-registration'
                  ? 'Self Registration'
                  : settings.targetPhase === 'phase-one'
                  ? 'Pre-Registration Phase One'
                  : 'Pre-Registration Phase Two'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick search button */}
            <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-lg border border-gray-200 text-xs text-gray-500">
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
              <kbd className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-300 ml-2 font-mono">
                Ctrl K
              </kbd>
            </div>
            <button className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                DP
              </div>
              <span className="text-xs font-semibold text-gray-700 hidden sm:inline">
                Dipanjan Swapna Prangon
              </span>
            </div>
          </div>
        </div>

        {/* Portal Main Advising Content */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* Advising Toolbar */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <h1 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
              Advising for CSE (UNDERGRADUATE ) -{' '}
              {settings.targetPhase === 'self-registration'
                ? 'Self Registration'
                : settings.targetPhase === 'phase-one'
                ? 'Pre-Registration Phase One'
                : 'Pre-Registration Phase Two'}
            </h1>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm transition-all">
                <span>Actions</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  setConfirmedAdvisingState(true);
                  setShowConfirmModal(true);
                }}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 ${
                  confirmedAdvisingState
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Advising</span>
              </button>
            </div>
          </div>

          {/* Student Info Card & Warning Banner */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4 shadow-sm">
            {/* Auto progress warning banner from screenshot */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs font-medium text-amber-900 leading-relaxed">
                Your progress is saved automatically. Please click the &apos;Confirm Advising&apos; button only
                when you are certain that no further changes are needed in your self-registration.
              </p>
            </div>

            {/* Student metadata row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
              <div>
                <h3 className="text-base font-bold text-gray-900">{INITIAL_STUDENT_INFO.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>CSE</span>
                  <span>•</span>
                  <span>ID: {INITIAL_STUDENT_INFO.studentId}</span>
                  <span>•</span>
                  <span>{INITIAL_STUDENT_INFO.currentSemester}</span>
                  <span>•</span>
                  <span className="font-semibold text-gray-800">
                    Target: {INITIAL_STUDENT_INFO.upcomingSemester}
                  </span>
                  <span>•</span>
                  <span className="font-bold text-blue-600">CGPA: {INITIAL_STUDENT_INFO.cgpa}</span>
                </div>
              </div>

              {/* Credit stats boxes */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <div className="border border-dashed border-gray-300 rounded-lg px-3 py-2 text-center bg-gray-50">
                  <div className="font-bold text-gray-900 text-sm">
                    {INITIAL_STUDENT_INFO.totalCredit}
                  </div>
                  <div className="text-[10px] text-gray-500">Total Credit</div>
                </div>
                <div className="border border-dashed border-gray-300 rounded-lg px-3 py-2 text-center bg-gray-50">
                  <div className="font-bold text-gray-900 text-sm">
                    {INITIAL_STUDENT_INFO.completedCredit}
                  </div>
                  <div className="text-[10px] text-gray-500">Completed</div>
                </div>
                <div className="border border-dashed border-gray-300 rounded-lg px-3 py-2 text-center bg-gray-50">
                  <div className="font-bold text-gray-900 text-sm">
                    {INITIAL_STUDENT_INFO.creditLimit}
                  </div>
                  <div className="text-[10px] text-gray-500">Credit Limit</div>
                </div>
                <div className="border border-dashed border-emerald-300 rounded-lg px-3 py-2 text-center bg-emerald-50">
                  <div className="font-bold text-emerald-700 text-sm">{creditTaken}</div>
                  <div className="text-[10px] font-semibold text-emerald-700">Credit Taken</div>
                </div>
              </div>
            </div>
          </div>

          {/* Advising Panel (Available Courses vs Selected Sections) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 7 Columns: Available Courses AG-Grid */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              {/* Card Header & Quick filter */}
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-xs sm:text-sm text-gray-800">Available Courses</h2>

                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <div className="relative w-full sm:w-56">
                    <input
                      type="text"
                      placeholder="Quick filter..."
                      value={quickFilter}
                      onChange={(e) => setQuickFilter(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg pl-3 pr-8 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {quickFilter && (
                      <button
                        onClick={() => setQuickFilter('')}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {filteredAvailableRows.length} rows
                  </span>
                </div>
              </div>

              {/* AG-Grid Mock Table */}
              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f0f3f6] text-gray-600 font-semibold text-[11px] uppercase tracking-wider sticky top-0 border-b border-gray-300">
                    <tr>
                      <th className="py-2.5 px-3">COURSE NAME</th>
                      <th className="py-2.5 px-3">PRE REQUISITE</th>
                      <th className="py-2.5 px-3">COURSE EQUIVALENCES</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono text-[12px]">
                    {filteredAvailableRows.map((row) => {
                      const isSeatEmpty = row.availableSeats <= 0;
                      return (
                        <tr
                          key={row.rowId}
                          className={`hover:bg-blue-50/50 transition-colors ${
                            isSeatEmpty ? 'bg-red-50/20' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-semibold text-gray-900 whitespace-nowrap">
                            <span className="font-mono">{row.rawString}</span>
                            {isSeatEmpty && (
                              <span className="ml-2 text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                                0 SEATS
                              </span>
                            )}
                            {row.availableSeats > 0 && (
                              <span className="ml-2 text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                                {row.availableSeats} SEAT{row.availableSeats > 1 ? 'S' : ''}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-gray-600 font-sans">{row.prerequisite}</td>
                          <td className="py-2.5 px-3 text-gray-600 font-sans">
                            {row.courseEquivalences}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View detail icon button */}
                              <button
                                onClick={() => setActiveCourseDetailsModal(row)}
                                className="p-1 text-blue-600 hover:bg-blue-100 rounded-md transition-all"
                                title="View Course Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {/* Green plus add button */}
                              <button
                                onClick={() => handleManualAddSection(row)}
                                disabled={isSeatEmpty}
                                className={`p-1 rounded-md transition-all ${
                                  isSeatEmpty
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-emerald-600 hover:bg-emerald-100'
                                }`}
                                title={isSeatEmpty ? 'No seats available' : 'Add Section'}
                              >
                                <PlusCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right 5 Columns: Selected Sections AG-Grid */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
              <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h2 className="font-bold text-xs sm:text-sm text-gray-800">Selected Sections</h2>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {selectedSections.length} Enrolled ({creditTaken} Cr)
                </span>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f0f3f6] text-gray-600 font-semibold text-[11px] uppercase tracking-wider sticky top-0 border-b border-gray-300">
                    <tr>
                      <th className="py-2.5 px-3">COURSE NAME</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono text-[12px]">
                    {selectedSections.map((sec) => (
                      <tr key={sec.rowId} className="hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 text-gray-900 whitespace-nowrap">
                          <span className="font-semibold">{sec.rawString}</span>
                          {sec.isLab && (
                            <span className="ml-1.5 text-[9px] font-sans font-semibold bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded">
                              LAB
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDropSection(sec.rowId)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-all"
                              title="Drop Section"
                            >
                              <MinusCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {selectedSections.length === 0 && (
                      <tr>
                        <td colSpan={2} className="py-8 text-center text-gray-400 font-sans text-xs">
                          No sections selected yet. Start the auto-bot or select from Available Courses.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Schedule Visualization Table from User Screenshots */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                <span>Class Schedule</span>
                <span className="text-xs font-normal text-gray-500">
                  (Weekly Routine Matrix &amp; Slot Verification)
                </span>
              </h2>
              <button
                onClick={() => window.print()}
                className="p-1.5 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Print Schedule"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-center text-xs border-collapse divide-y divide-gray-200">
                <thead className="bg-gray-100 text-gray-700 font-bold text-[11px] uppercase">
                  <tr>
                    <th className="py-2.5 px-2 border-r border-gray-200 w-36">Time / Day</th>
                    {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map(
                      (day) => (
                        <th key={day} className="py-2.5 px-2 border-r border-gray-200 min-w-[120px]">
                          {day}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 font-medium text-[11px]">
                  {[
                    '8:00 AM - 9:20 AM',
                    '9:30 AM - 10:50 AM',
                    '11:00 AM - 12:20 PM',
                    '2:00 PM - 3:20 PM',
                    '2:00 PM - 4:50 PM',
                    '3:30 PM - 4:50 PM',
                  ].map((slot) => (
                    <tr key={slot} className="hover:bg-blue-50/20">
                      <td className="py-2 px-2 border-r border-gray-200 font-bold text-gray-700 bg-gray-50">
                        {slot}
                      </td>
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => {
                        // Find matching selected sections in this slot and day
                        const matches = selectedSections.filter(
                          (s) => s.scheduleTime === slot && s.scheduleDays.includes(d)
                        );

                        return (
                          <td key={d} className="py-2 px-1 border-r border-gray-200 align-top">
                            {matches.map((m) => (
                              <div
                                key={m.rowId}
                                className={`text-[10px] p-1.5 rounded mb-1 font-semibold leading-tight shadow-xs ${
                                  m.isLab
                                    ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                                    : 'bg-blue-100 text-blue-900 border border-blue-200'
                                }`}
                              >
                                {m.courseCode} -{m.sectionNumber} -{m.faculty}
                                <span className="block text-[9px] text-gray-500 font-normal">
                                  {m.room}
                                </span>
                              </div>
                            ))}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Floating Auto Advising Bot HUD Pinned inside Portal Simulator */}
        <div
          className={`fixed sm:absolute bottom-4 right-4 z-30 transition-all duration-300 w-[92vw] sm:w-96 shadow-2xl rounded-2xl border ${
            botRunning
              ? 'border-emerald-500 shadow-emerald-500/20 bg-slate-950 text-slate-100'
              : 'border-slate-800 bg-slate-900 text-slate-100'
          }`}
        >
          {/* HUD Header */}
          <div className="p-3 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  botRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
                }`}
              ></span>
              <span className="font-extrabold text-xs text-white">BRACU Advising Bot HUD</span>
              <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                {settings.targetPhase}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsBotMinimized(!isBotMinimized)}
                className="p-1 text-slate-400 hover:text-white text-xs font-mono"
              >
                {isBotMinimized ? '▲' : '▼'}
              </button>
            </div>
          </div>

          {/* HUD Body */}
          {!isBotMinimized && (
            <div className="p-3 space-y-3 text-xs">
              {/* Bot status row */}
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-400 text-[11px] block">Status</span>
                  <span
                    className={`font-bold ${
                      botRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'
                    }`}
                  >
                    {botRunning ? 'ACTIVE SCANNING' : 'IDLE / READY'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] block">Secured</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {plannedCourses.filter((c) => c.status === 'locked').length}/
                    {plannedCourses.length} Courses
                  </span>
                </div>
              </div>

              {/* Start / Stop Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onToggleBot}
                  className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all shadow-md ${
                    botRunning
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {botRunning ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Robot</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Start Auto Advising Bot</span>
                    </>
                  )}
                </button>

                <button
                  onClick={onOpenDownloadModal}
                  className="px-3 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-xl font-semibold transition-all"
                  title="Export to Real Browser"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Planned Course Progress Pills */}
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {plannedCourses.map((c) => (
                  <div
                    key={c.id}
                    className={`p-1.5 rounded-lg border flex items-center justify-between text-[11px] ${
                      c.status === 'locked'
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-bold">{c.courseCode}</span>
                    <span>
                      {c.status === 'locked'
                        ? `Sec ${c.securedSection} (${c.securedFaculty}) ✓`
                        : `${c.choices.length} choices ready`}
                    </span>
                  </div>
                ))}
              </div>

              {/* Live Terminal Logs */}
              <div className="bg-black/90 p-2.5 rounded-xl border border-slate-800 font-mono text-[10px] space-y-1">
                <div className="text-slate-500 text-[9px] flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    LIVE ACTION CONSOLE
                  </span>
                  <span>{settings.pollingIntervalMs}ms loop</span>
                </div>
                <div className="max-h-24 overflow-y-auto space-y-1">
                  {logs.slice(0, 10).map((l) => (
                    <div
                      key={l.id}
                      className={`leading-tight ${
                        l.type === 'success'
                          ? 'text-emerald-400 font-semibold'
                          : l.type === 'action'
                          ? 'text-cyan-300'
                          : l.type === 'warning'
                          ? 'text-amber-400'
                          : l.type === 'error'
                          ? 'text-red-400'
                          : 'text-slate-400'
                      }`}
                    >
                      <span className="text-slate-600">[{l.timestamp}]</span> {l.message}
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div className="text-slate-600">Bot is idle. Click Start to begin simulation.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Course Details Modal (from user's Webpack Angular inspection) */}
      {activeCourseDetailsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Course Details</h3>
              <button
                onClick={() => setActiveCourseDetailsModal(null)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-gray-700">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400 font-semibold">Course Code:</span>
                <span className="col-span-2 font-mono font-bold text-gray-900">
                  {activeCourseDetailsModal.courseCode}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400 font-semibold">Section &amp; Faculty:</span>
                <span className="col-span-2 font-semibold">
                  Section {activeCourseDetailsModal.sectionNumber} ({activeCourseDetailsModal.faculty})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400 font-semibold">Credits:</span>
                <span className="col-span-2">{activeCourseDetailsModal.credits} Credit</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400 font-semibold">Available Seats:</span>
                <span className="col-span-2 font-bold text-emerald-600">
                  {activeCourseDetailsModal.availableSeats} Seats
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400 font-semibold">Schedule:</span>
                <span className="col-span-2">
                  {activeCourseDetailsModal.scheduleDays.join('/')}{' '}
                  {activeCourseDetailsModal.scheduleTime} ({activeCourseDetailsModal.room})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-400 font-semibold">Prerequisites:</span>
                <span className="col-span-2">{activeCourseDetailsModal.prerequisite}</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setActiveCourseDetailsModal(null)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Advising Popup Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Advising Confirmed!</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Your self-registration schedule with {selectedSections.length} sections ({creditTaken} credits)
              has been successfully submitted to BRAC University advising portal.
            </p>
            <div className="pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
