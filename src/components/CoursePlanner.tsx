import React, { useState } from 'react';
import { CoursePlan, SectionChoice, BotSettings } from '../types/advising';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  Download,
  Upload,
  Settings,
  ShieldCheck,
  Volume2,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Clock,
  User,
} from 'lucide-react';
import { DEFAULT_PLANNED_COURSES } from '../data/sampleCourses';

interface CoursePlannerProps {
  courses: CoursePlan[];
  onUpdateCourses: (courses: CoursePlan[]) => void;
  settings: BotSettings;
  onUpdateSettings: (settings: Partial<BotSettings>) => void;
}

export const CoursePlanner: React.FC<CoursePlannerProps> = ({
  courses,
  onUpdateCourses,
  settings,
  onUpdateSettings,
}) => {
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(courses[0]?.id || null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);

  // Add new course (supports 4 to 6+ courses)
  const handleAddCourse = () => {
    const newId = 'plan-' + Date.now();
    const newCourse: CoursePlan = {
      id: newId,
      courseCode: 'CSE321',
      courseName: 'Operating Systems',
      credits: 3,
      hasLab: true,
      labCode: 'CSE321L',
      labCredits: 1,
      status: 'idle',
      choices: [
        {
          id: 'c-' + Date.now() + '-1',
          priority: 1,
          sectionNumber: '01',
          faculty: 'TBA',
          timeSlot: 'Sun/Tue 08:00 AM - 09:20 AM',
          labSectionNumber: '01',
          minSeatsRequired: 1,
          note: 'Primary preferred section',
        },
        {
          id: 'c-' + Date.now() + '-2',
          priority: 2,
          sectionNumber: '02',
          faculty: 'TBA',
          timeSlot: 'Mon/Wed 09:30 AM - 10:50 AM',
          labSectionNumber: '02',
          minSeatsRequired: 1,
          note: '2nd Choice Fallback',
        },
      ],
    };
    onUpdateCourses([...courses, newCourse]);
    setExpandedCourseId(newId);
  };

  const handleDeleteCourse = (id: string) => {
    if (courses.length <= 1) {
      alert('You need at least 1 planned course in the advising queue.');
      return;
    }
    onUpdateCourses(courses.filter((c) => c.id !== id));
  };

  const handleUpdateCourse = (id: string, updates: Partial<CoursePlan>) => {
    onUpdateCourses(courses.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  // Re-order courses serial by serial
  const handleMoveCourse = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= courses.length) return;

    const list = [...courses];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;
    onUpdateCourses(list);
  };

  // Add choice to course (unlimited priority choices)
  const handleAddChoice = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const nextPriority = course.choices.length + 1;
    const newChoice: SectionChoice = {
      id: `choice-${Date.now()}`,
      priority: nextPriority,
      sectionNumber: String(nextPriority).padStart(2, '0'),
      faculty: 'TBA',
      timeSlot: 'Sun/Tue 02:00 PM - 03:20 PM',
      minSeatsRequired: 1,
      note: `${getPriorityOrdinal(nextPriority)} Choice Fallback`,
    };

    handleUpdateCourse(courseId, {
      choices: [...course.choices, newChoice],
    });
  };

  const handleDeleteChoice = (courseId: string, choiceId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    if (course.choices.length <= 1) {
      alert('Each course must have at least 1 priority choice.');
      return;
    }

    const filtered = course.choices.filter((ch) => ch.id !== choiceId);
    // Re-index priorities 1..N
    const reindexed = filtered.map((ch, idx) => ({ ...ch, priority: idx + 1 }));
    handleUpdateCourse(courseId, { choices: reindexed });
  };

  const handleMoveChoice = (courseId: string, index: number, direction: 'up' | 'down') => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= course.choices.length) return;

    const list = [...course.choices];
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Re-index priorities
    const reindexed = list.map((ch, idx) => ({ ...ch, priority: idx + 1 }));
    handleUpdateCourse(courseId, { choices: reindexed });
  };

  const handleUpdateChoiceField = (
    courseId: string,
    choiceId: string,
    field: keyof SectionChoice,
    value: string | number
  ) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;

    const updated = course.choices.map((ch) => {
      if (ch.id === choiceId) {
        return { ...ch, [field]: value };
      }
      return ch;
    });

    handleUpdateCourse(courseId, { choices: updated });
  };

  // Helper for priority suffix
  const getPriorityOrdinal = (n: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // Export & Import
  const handleExportJSON = () => {
    const data = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      settings,
      courses,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bracu-advising-routine-${settings.targetPhase}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.courses && Array.isArray(parsed.courses)) {
          onUpdateCourses(parsed.courses);
          if (parsed.settings) {
            onUpdateSettings(parsed.settings);
          }
          alert('Routine successfully loaded from JSON configuration!');
        } else {
          alert('Invalid JSON file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner & Quick Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded-md border border-blue-800/40">
                Rule Matrix
              </span>
              <span className="text-xs text-slate-400">
                Supports 4 to 6+ Courses with Unlimited Fallback Priority Choices (#1, #2, #3, #4...)
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Course &amp; Section Priority Queue
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              যদি ১ম চয়েসে সীট ০ (0) দেখায়, রোবট স্বয়ংক্রিয়ভাবে ২য়, ৩য়, ৪র্থ বা পরবর্তী যেকোনো চয়েসে বুক করার চেষ্টা করবে। কোনো চয়েসের লিমিট নেই—যত ইচ্ছা ব্যাকআপ চয়েস যুক্ত করতে পারবেন।
            </p>
          </div>

          {/* Action Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onUpdateCourses(DEFAULT_PLANNED_COURSES)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
              title="Reset to CSE Typical Routine"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Preset</span>
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export Config</span>
            </button>

            <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import Config</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bot Engine Settings</span>
            </button>
          </div>
        </div>

        {/* Engine Settings Drawer */}
        {showSettingsDrawer && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 p-4 rounded-xl">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Polling Speed (Scan Delay)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="200"
                  max="1500"
                  step="50"
                  value={settings.pollingIntervalMs}
                  onChange={(e) => onUpdateSettings({ pollingIntervalMs: Number(e.target.value) })}
                  className="w-full accent-blue-500"
                />
                <span className="text-xs font-mono font-bold text-blue-400 min-w-[50px]">
                  {settings.pollingIntervalMs}ms
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Recommended: 300ms - 500ms during advising rush.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoConfirmAdvising}
                  onChange={(e) => onUpdateSettings({ autoConfirmAdvising: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="font-semibold text-amber-300">Auto Confirm Advising</span>
              </label>
              <p className="text-[11px] text-slate-400">
                Warning: Automatically clicks &quot;Confirm Advising&quot; green button once all courses are locked.
              </p>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.soundAlerts}
                  onChange={(e) => onUpdateSettings({ soundAlerts: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Audio Alert on Seat Secure &amp; Fallback</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.autoStartOnPageLoad}
                  onChange={(e) => onUpdateSettings({ autoStartOnPageLoad: e.target.checked })}
                  className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Auto-start when entering portal</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Course List Cards */}
      <div className="space-y-4">
        {courses.map((course, courseIndex) => {
          const isExpanded = expandedCourseId === course.id;

          return (
            <div
              key={course.id}
              className={`bg-slate-900 border rounded-2xl transition-all duration-200 overflow-hidden ${
                course.status === 'locked'
                  ? 'border-emerald-500/50 bg-emerald-950/10'
                  : isExpanded
                  ? 'border-blue-600/60 shadow-lg shadow-blue-500/5'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedCourseId(isExpanded ? null : course.id)}
                className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none bg-slate-900/80"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <div className="flex flex-col">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCourse(courseIndex, 'up');
                        }}
                        disabled={courseIndex === 0}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                        title="Move Course Priority Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveCourse(courseIndex, 'down');
                        }}
                        disabled={courseIndex === courses.length - 1}
                        className="p-1 text-slate-400 hover:text-white disabled:opacity-20 transition-colors"
                        title="Move Course Priority Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-9 h-9 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 font-bold text-xs flex flex-col items-center justify-center font-mono shadow-xs">
                      <span className="text-[9px] uppercase font-sans text-slate-500 font-normal">Ser</span>
                      <span>#{courseIndex + 1}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-white tracking-wide">
                        {course.courseCode}
                      </span>
                      <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                      <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                        {course.courseName}
                      </span>
                      {course.hasLab && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded flex items-center gap-1">
                          <FlaskConical className="w-3 h-3" />
                          Lab Linked
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-slate-400 font-mono">
                        {course.choices.length} Sections in Serial Queue
                      </span>
                      {course.status === 'locked' && (
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          • Locked Sec {course.securedSection} ({course.securedFaculty})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Priority preview pills */}
                <div className="flex items-center gap-2">
                  <div className="hidden md:flex items-center gap-1">
                    {course.choices.map((ch) => (
                      <span
                        key={ch.id}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                          course.securedSection === ch.sectionNumber
                            ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        #{ch.priority}: {ch.sectionNumber}({ch.faculty})
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Card Body - Choices Matrix */}
              {isExpanded && (
                <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/40 space-y-4">
                  {/* Basic Course Meta Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Course Code
                      </label>
                      <input
                        type="text"
                        value={course.courseCode}
                        onChange={(e) =>
                          handleUpdateCourse(course.id, {
                            courseCode: e.target.value.toUpperCase().trim(),
                          })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono uppercase focus:border-blue-500 outline-none"
                        placeholder="e.g. CSE230"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Course Title
                      </label>
                      <input
                        type="text"
                        value={course.courseName}
                        onChange={(e) =>
                          handleUpdateCourse(course.id, { courseName: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                        placeholder="e.g. Discrete Math"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-400 block mb-1">
                        Credits
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        value={course.credits}
                        onChange={(e) =>
                          handleUpdateCourse(course.id, { credits: Number(e.target.value) })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={course.hasLab}
                          onChange={(e) =>
                            handleUpdateCourse(course.id, {
                              hasLab: e.target.checked,
                              labCode: e.target.checked
                                ? course.labCode || `${course.courseCode}L`
                                : undefined,
                            })
                          }
                          className="rounded border-slate-700 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="font-medium">Has Co-requisite Lab</span>
                      </label>
                    </div>
                  </div>

                  {/* Priority Choices List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Section Choices (Fallback Priority Queue)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          (Top is tried first, if 0 seats -&gt; immediately falls back to next)
                        </span>
                      </div>
                      <button
                        onClick={() => handleAddChoice(course.id)}
                        className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Choice #{course.choices.length + 1}</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {course.choices.map((choice, choiceIndex) => (
                        <div
                          key={choice.id}
                          className={`p-3 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                            choice.priority === 1
                              ? 'bg-slate-900 border-blue-500/30 shadow-sm'
                              : 'bg-slate-900/60 border-slate-800'
                          }`}
                        >
                          {/* Priority Badge */}
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-1 rounded-md text-xs font-bold font-mono ${
                                choice.priority === 1
                                  ? 'bg-blue-600 text-white shadow-sm'
                                  : choice.priority === 2
                                  ? 'bg-indigo-600 text-white'
                                  : choice.priority === 3
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-slate-700 text-slate-300'
                              }`}
                            >
                              Choice #{choice.priority}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">
                              {choice.priority === 1 ? '★ 1st Preference' : '↳ Fallback'}
                            </span>
                          </div>

                          {/* Fields */}
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            {/* Section Number */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Section:</span>
                              <input
                                type="text"
                                value={choice.sectionNumber}
                                onChange={(e) =>
                                  handleUpdateChoiceField(
                                    course.id,
                                    choice.id,
                                    'sectionNumber',
                                    e.target.value.trim()
                                  )
                                }
                                placeholder="05"
                                className="w-14 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-center font-mono font-bold text-white focus:border-blue-500 outline-none"
                              />
                            </div>

                            {/* Faculty Initials */}
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-400">Faculty:</span>
                              <input
                                type="text"
                                value={choice.faculty}
                                onChange={(e) =>
                                  handleUpdateChoiceField(
                                    course.id,
                                    choice.id,
                                    'faculty',
                                    e.target.value.toUpperCase().trim()
                                  )
                                }
                                placeholder="AVB"
                                className="w-16 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-center font-mono font-bold text-white uppercase focus:border-blue-500 outline-none"
                              />
                            </div>

                            {/* Time Slot */}
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-400">Slot:</span>
                              <input
                                type="text"
                                value={choice.timeSlot}
                                onChange={(e) =>
                                  handleUpdateChoiceField(
                                    course.id,
                                    choice.id,
                                    'timeSlot',
                                    e.target.value
                                  )
                                }
                                placeholder="Sun/Tue 11:00 AM - 12:20 PM"
                                className="w-44 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-slate-300 focus:border-blue-500 outline-none"
                              />
                            </div>

                            {/* Lab Section if course has lab */}
                            {course.hasLab && (
                              <div className="flex items-center gap-1.5">
                                <FlaskConical className="w-3.5 h-3.5 text-indigo-400" />
                                <span className="text-slate-400">Lab Sec:</span>
                                <input
                                  type="text"
                                  value={choice.labSectionNumber || choice.sectionNumber}
                                  onChange={(e) =>
                                    handleUpdateChoiceField(
                                      course.id,
                                      choice.id,
                                      'labSectionNumber',
                                      e.target.value.trim()
                                    )
                                  }
                                  placeholder="16"
                                  className="w-14 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-center font-mono font-bold text-indigo-300 focus:border-indigo-500 outline-none"
                                />
                              </div>
                            )}

                            {/* Min seats */}
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">Min Seat:</span>
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={choice.minSeatsRequired}
                                onChange={(e) =>
                                  handleUpdateChoiceField(
                                    course.id,
                                    choice.id,
                                    'minSeatsRequired',
                                    Number(e.target.value)
                                  )
                                }
                                className="w-12 bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-center font-mono text-white focus:border-blue-500 outline-none"
                              />
                            </div>
                          </div>

                          {/* Reordering and Actions */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleMoveChoice(course.id, choiceIndex, 'up')}
                              disabled={choiceIndex === 0}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                              title="Move Priority Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveChoice(course.id, choiceIndex, 'down')}
                              disabled={choiceIndex === course.choices.length - 1}
                              className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                              title="Move Priority Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteChoice(course.id, choice.id)}
                              className="p-1 text-slate-400 hover:text-red-400 transition-colors ml-1"
                              title="Remove Choice"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Course Button */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={handleAddCourse}
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Another Course ({courses.length} Courses in Serial Queue &bull; Unlimited)</span>
        </button>
      </div>
    </div>
  );
};
