import React, { useState } from 'react';
import { CoursePlan, SectionChoice, BotSettings } from '../types/advising';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Download,
  Upload,
  Settings,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Clock,
  User,
  FileSpreadsheet,
  FileDown,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { DEFAULT_PLANNED_COURSES, BRACU_COURSE_CATALOG, lookupCourseInfo } from '../data/sampleCourses';

interface CoursePlannerProps {
  courses: CoursePlan[];
  onUpdateCourses: (courses: CoursePlan[]) => void;
  settings: BotSettings;
  onUpdateSettings: (settings: Partial<BotSettings>) => void;
}

// RFC 4180 compliant CSV parser
function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(currentVal.trim());
      if (row.some((cell) => cell.length > 0)) {
        lines.push(row);
      }
      row = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal.length > 0 || row.length > 0) {
    row.push(currentVal.trim());
    if (row.some((cell) => cell.length > 0)) {
      lines.push(row);
    }
  }

  return lines;
}

export const CoursePlanner: React.FC<CoursePlannerProps> = ({
  courses,
  onUpdateCourses,
  settings,
  onUpdateSettings,
}) => {
  const [expandedCourseId, setExpandedCourseId] = useState<string | null>(courses[0]?.id || null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState<boolean>(false);
  const [csvNotice, setCsvNotice] = useState<string | null>(null);
  const [quickCatalogCode, setQuickCatalogCode] = useState<string>('');

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
          faculty: 'ANK',
          timeSlot: 'Sun/Tue 08:00 AM - 09:20 AM',
          labSectionNumber: '01',
          minSeatsRequired: 1,
          note: 'Primary preferred section',
        },
        {
          id: 'c-' + Date.now() + '-2',
          priority: 2,
          sectionNumber: '02',
          faculty: 'DSR',
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

  const handleAddFromCatalog = (code: string) => {
    if (!code) return;
    const info = lookupCourseInfo(code);
    const newId = 'plan-' + Date.now();
    const newCourse: CoursePlan = {
      id: newId,
      courseCode: info.code,
      courseName: info.name,
      credits: info.credits,
      hasLab: info.hasLab,
      labCode: info.labCode,
      labCredits: info.labCredits,
      status: 'idle',
      choices: [
        {
          id: 'c-' + Date.now() + '-1',
          priority: 1,
          sectionNumber: '01',
          faculty: 'TBA',
          timeSlot: 'Sun/Tue 08:00 AM - 09:20 AM',
          labSectionNumber: info.hasLab ? '01' : undefined,
          minSeatsRequired: 1,
          note: '1st Preference',
        },
        {
          id: 'c-' + Date.now() + '-2',
          priority: 2,
          sectionNumber: '02',
          faculty: 'TBA',
          timeSlot: 'Mon/Wed 09:30 AM - 10:50 AM',
          labSectionNumber: info.hasLab ? '02' : undefined,
          minSeatsRequired: 1,
          note: '2nd Choice Fallback',
        },
      ],
    };
    onUpdateCourses([...courses, newCourse]);
    setExpandedCourseId(newId);
    setQuickCatalogCode('');
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

  const getPriorityOrdinal = (n: number) => {
    const suffixes = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  };

  // CSV EXPORT IMPLEMENTATION
  const handleExportCSV = () => {
    const headers = [
      'Course Code',
      'Course Title',
      'Credits',
      'Has Lab',
      'Priority',
      'Section',
      'Faculty',
      'Time Slot',
      'Room',
      'Lab Section',
      'Min Seats',
      'Notes',
    ];

    const rows: string[] = [headers.join(',')];

    courses.forEach((course) => {
      course.choices.forEach((choice) => {
        const row = [
          course.courseCode,
          `"${(course.courseName || '').replace(/"/g, '""')}"`,
          course.credits,
          course.hasLab ? 'Yes' : 'No',
          choice.priority,
          `"${choice.sectionNumber.padStart(2, '0')}"`,
          `"${choice.faculty || 'TBA'}"`,
          `"${(choice.timeSlot || '').replace(/"/g, '""')}"`,
          `"${choice.room || ''}"`,
          `"${choice.labSectionNumber || ''}"`,
          choice.minSeatsRequired || 1,
          `"${(choice.note || '').replace(/"/g, '""')}"`,
        ];
        rows.push(row.join(','));
      });
    });

    const csvContent = rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bracu-advising-priority-list-${settings.targetPhase}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setCsvNotice(`Priority list exported successfully as CSV! (${courses.length} courses)`);
    setTimeout(() => setCsvNotice(null), 4500);
  };

  // CSV IMPORT IMPLEMENTATION
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text || !text.trim()) {
          alert('CSV file is empty.');
          return;
        }

        const lines = parseCSV(text);
        if (lines.length === 0) {
          alert('Could not find any readable rows in the CSV file.');
          return;
        }

        // Determine column indexes from header or first row
        const firstRow = lines[0].map((h) => h.toLowerCase().trim().replace(/['"]/g, ''));
        let hasHeader = true;

        let colCourseCode = firstRow.findIndex(
          (h) => h === 'course code' || h === 'course' || h === 'coursecode' || h === 'code'
        );
        let colSection = firstRow.findIndex(
          (h) => h === 'section' || h === 'section number' || h === 'sec' || h === 'section_number'
        );
        let colPriority = firstRow.findIndex(
          (h) => h === 'priority' || h === 'rank' || h === 'choice' || h === 'choice_number'
        );
        let colFaculty = firstRow.findIndex(
          (h) => h === 'faculty' || h === 'instructor' || h === 'teacher'
        );
        let colTimeSlot = firstRow.findIndex(
          (h) => h === 'time slot' || h === 'timeslot' || h === 'time' || h === 'slot'
        );
        let colRoom = firstRow.findIndex((h) => h === 'room' || h === 'classroom');
        let colLabSec = firstRow.findIndex(
          (h) => h === 'lab section' || h === 'lab sec' || h === 'lab_section'
        );
        let colTitle = firstRow.findIndex(
          (h) => h === 'course title' || h === 'title' || h === 'course name' || h === 'name'
        );
        let colCredits = firstRow.findIndex(
          (h) => h === 'credits' || h === 'credit'
        );
        let colHasLab = firstRow.findIndex(
          (h) => h === 'has lab' || h === 'haslab' || h === 'lab'
        );
        let colMinSeats = firstRow.findIndex(
          (h) => h === 'min seats' || h === 'min_seats' || h === 'minseats'
        );
        let colNotes = firstRow.findIndex(
          (h) => h === 'notes' || h === 'note' || h === 'comment'
        );

        // If no header matches, check if row 0 is already data (e.g. "CSE230,05")
        if (colCourseCode === -1 || colSection === -1) {
          const sample0 = lines[0][0]?.toUpperCase().replace(/[^A-Z0-9]/g, '') || '';
          const sample1 = lines[0][1]?.replace(/[^0-9]/g, '') || '';
          const isRow0Data = /^[A-Z]{3}\d{3}/.test(sample0) && sample1.length > 0;

          if (isRow0Data) {
            hasHeader = false;
            colCourseCode = 0;
            colSection = 1;
            colFaculty = lines[0][2] ? 2 : -1;
            colTimeSlot = lines[0][3] ? 3 : -1;
          } else {
            alert(
              "CSV must contain at least 'Course Code' and 'Section' columns.\nExample header: Course Code,Section"
            );
            return;
          }
        }

        const dataRows = hasHeader ? lines.slice(1) : lines;
        if (dataRows.length === 0) {
          alert('No course records found in CSV.');
          return;
        }

        // Group rows by Course Code to construct fallback priority chains
        interface CsvItem {
          courseCode: string;
          section: string;
          priority?: number;
          faculty?: string;
          timeSlot?: string;
          room?: string;
          labSection?: string;
          title?: string;
          credits?: number;
          hasLab?: boolean;
          minSeats?: number;
          notes?: string;
        }

        const parsedItems: CsvItem[] = [];

        for (const row of dataRows) {
          const rawCode = row[colCourseCode]?.trim().toUpperCase().replace(/\s+/g, '');
          const rawSec = row[colSection]?.trim().replace(/^0+/, '');

          if (!rawCode) continue;

          // Normalize section e.g. "5" -> "05", "13" -> "13"
          const sec = (rawSec || '01').padStart(2, '0');
          const prio = colPriority !== -1 && row[colPriority] ? parseInt(row[colPriority], 10) : undefined;
          const fac = colFaculty !== -1 ? row[colFaculty]?.trim().toUpperCase() : undefined;
          const slot = colTimeSlot !== -1 ? row[colTimeSlot]?.trim() : undefined;
          const room = colRoom !== -1 ? row[colRoom]?.trim() : undefined;
          const labSec = colLabSec !== -1 ? row[colLabSec]?.trim() : undefined;
          const title = colTitle !== -1 ? row[colTitle]?.trim() : undefined;
          const cred = colCredits !== -1 && row[colCredits] ? parseInt(row[colCredits], 10) : undefined;
          const labBool =
            colHasLab !== -1 && row[colHasLab]
              ? row[colHasLab].toLowerCase().startsWith('y') || row[colHasLab].toLowerCase() === 'true'
              : undefined;
          const seats = colMinSeats !== -1 && row[colMinSeats] ? parseInt(row[colMinSeats], 10) : 1;
          const notes = colNotes !== -1 ? row[colNotes]?.trim() : undefined;

          parsedItems.push({
            courseCode: rawCode,
            section: sec,
            priority: isNaN(prio as number) ? undefined : prio,
            faculty: fac || 'TBA',
            timeSlot: slot || 'Sun/Tue 08:00 AM - 09:20 AM',
            room: room || '',
            labSection: labSec,
            title,
            credits: isNaN(cred as number) ? undefined : cred,
            hasLab: labBool,
            minSeats: isNaN(seats) ? 1 : seats,
            notes,
          });
        }

        if (parsedItems.length === 0) {
          alert('Could not parse any valid course rows from the CSV file.');
          return;
        }

        // Group by course code
        const courseMap = new Map<string, CsvItem[]>();
        parsedItems.forEach((item) => {
          if (!courseMap.has(item.courseCode)) {
            courseMap.set(item.courseCode, []);
          }
          courseMap.get(item.courseCode)!.push(item);
        });

        const newCourses: CoursePlan[] = [];

        courseMap.forEach((items, code) => {
          // Look up metadata from real BRACU course catalog
          const catalogInfo = lookupCourseInfo(code);

          // Sort items by explicit priority if given, otherwise order of appearance in CSV
          items.sort((a, b) => {
            if (a.priority !== undefined && b.priority !== undefined) {
              return a.priority - b.priority;
            }
            return 0;
          });

          const choices: SectionChoice[] = items.map((item, idx) => {
            const priorityNum = item.priority || idx + 1;
            return {
              id: `choice-${Date.now()}-${code}-${idx}`,
              priority: priorityNum,
              sectionNumber: item.section,
              faculty: item.faculty || 'TBA',
              timeSlot: item.timeSlot || 'Sun/Tue 08:00 AM - 09:20 AM',
              room: item.room || '',
              labSectionNumber: item.labSection || (catalogInfo.hasLab ? item.section : undefined),
              minSeatsRequired: item.minSeats || 1,
              note:
                item.notes ||
                (priorityNum === 1
                  ? 'Primary preferred section'
                  : `${getPriorityOrdinal(priorityNum)} Choice Fallback`),
            };
          });

          // Ensure unique priorities 1..N
          choices.forEach((ch, idx) => {
            ch.priority = idx + 1;
          });

          const customTitle = items[0].title;
          const customCredits = items[0].credits;
          const customHasLab = items[0].hasLab;

          newCourses.push({
            id: `plan-${code.toLowerCase()}-${Date.now()}`,
            courseCode: code,
            courseName: customTitle || catalogInfo.name,
            credits: customCredits !== undefined ? customCredits : catalogInfo.credits,
            hasLab: customHasLab !== undefined ? customHasLab : catalogInfo.hasLab,
            labCode: catalogInfo.labCode,
            labCredits: catalogInfo.labCredits,
            status: 'idle',
            choices,
          });
        });

        onUpdateCourses(newCourses);
        if (newCourses.length > 0) {
          setExpandedCourseId(newCourses[0].id);
        }

        const totalChoices = newCourses.reduce((sum, c) => sum + c.choices.length, 0);
        setCsvNotice(
          `Successfully imported ${newCourses.length} courses with ${totalChoices} priority choices from CSV!`
        );
        setTimeout(() => setCsvNotice(null), 5000);
      } catch (err: unknown) {
        console.error('Error importing CSV:', err);
        alert('Failed to parse CSV file. Please verify the format and try again.');
      }
    };

    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDownloadSampleCSV = () => {
    const sample = [
      'Course Code,Section,Priority,Faculty,Time Slot,Room,Lab Section,Min Seats,Notes',
      'CSE230,05,1,AVB,Sun/Tue 11:00 AM - 12:20 PM,09A-04C,,1,Primary Choice',
      'CSE230,08,2,TBA,Sun/Tue 03:30 PM - 04:50 PM,12A-09C,,1,2nd Fallback Choice',
      'CSE230,10,3,YND,Thu/Sat 03:30 PM - 04:50 PM,08C-12A,,1,3rd Fallback Choice',
      'CSE220,01,1,SKS,Sun/Tue 08:00 AM - 09:20 AM,UB2-02C,01,1,1st Choice with Lab Sec 01',
      'CSE220,02,2,AHR,Mon/Wed 09:30 AM - 10:50 AM,UB2-03D,02,1,2nd Choice with Lab Sec 02',
      'MAT215,01,1,KBA,Sun/Tue 09:30 AM - 10:50 AM,09H-12C,,1,1st Choice',
      'MAT215,02,2,KBA,Mon/Wed 11:00 AM - 12:20 PM,09H-12C,,1,2nd Choice Fallback',
      'PHY112,01,1,MSR,Sun/Tue 12:30 PM - 01:50 PM,UB3-01A,01,1,1st Choice',
      'PHY112,02,2,AFA,Mon/Wed 02:00 PM - 03:20 PM,UB3-02B,02,1,2nd Choice',
      'ENG102,04,1,SHN,Thu/Sat 08:00 AM - 09:20 AM,UB1-08A,,1,1st Choice',
      'ENG102,07,2,NZM,Mon/Wed 03:30 PM - 04:50 PM,UB1-09B,,1,2nd Choice Fallback',
    ].join('\r\n');

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-bracu-priority-list.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // JSON Export & Import
  const handleExportJSON = () => {
    const data = {
      version: '2.5.0',
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
          setCsvNotice('Routine successfully loaded from JSON configuration!');
          setTimeout(() => setCsvNotice(null), 4000);
        } else {
          alert('Invalid JSON file format.');
        }
      } catch {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice Banner */}
      {csvNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 px-4 py-3 rounded-xl flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{csvNotice}</span>
          </div>
          <button
            onClick={() => setCsvNotice(null)}
            className="text-xs text-emerald-400 hover:text-white ml-3"
          >
            ✕
          </button>
        </div>
      )}

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
              যদি ১ম চয়েসে সীট ০ (0) দেখায়, রোবট স্বয়ংক্রিয়ভাবে ২য়, ৩য়, ৪র্থ বা পরবর্তী যেকোনো চয়েসে বুক করার চেষ্টা করবে। কোনো চয়েসের লিমিট নেই—CSV ফাইল থেকে ইমপোর্ট বা এক্সপোর্ট করতে পারেন।
            </p>
          </div>

          {/* Action Tools: CSV Import/Export, JSON, Settings */}
          <div className="flex flex-wrap items-center gap-2">
            {/* CSV Import */}
            <label className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import CSV</span>
              <input type="file" accept=".csv,text/csv" onChange={handleImportCSV} className="hidden" />
            </label>

            {/* CSV Export */}
            <button
              onClick={handleExportCSV}
              className="px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold rounded-xl border border-emerald-500/40 transition-all flex items-center gap-1.5 shadow-xs"
              title="Download current priority list as structured CSV"
            >
              <FileDown className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export as CSV</span>
            </button>

            {/* Load Default Preset */}
            <button
              onClick={() => {
                onUpdateCourses(DEFAULT_PLANNED_COURSES);
                setCsvNotice('Loaded standard BRACU CSE advising routine preset.');
                setTimeout(() => setCsvNotice(null), 3000);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
              title="Reset to CSE Typical Routine"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Preset</span>
            </button>

            {/* Export JSON */}
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
              title="Export complete config with settings as JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span>Export JSON</span>
            </button>

            {/* Import JSON */}
            <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            {/* Engine Settings */}
            <button
              onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bot Settings</span>
            </button>
          </div>
        </div>

        {/* Quick Helper Bar for CSV Specs & Quick Add from Catalog */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">Quick Add Course:</span>
            <select
              value={quickCatalogCode}
              onChange={(e) => {
                setQuickCatalogCode(e.target.value);
                handleAddFromCatalog(e.target.value);
              }}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:border-blue-500 outline-none"
            >
              <option value="">Select from BRACU Catalog...</option>
              {Object.values(BRACU_COURSE_CATALOG).map((cat) => (
                <option key={cat.code} value={cat.code}>
                  {cat.code} - {cat.name} ({cat.credits} cr{cat.hasLab ? ' + Lab' : ''})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadSampleCSV}
              className="text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 text-[11px]"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Download Sample CSV Template</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-[11px] text-slate-400">
              CSV Format: <code className="text-emerald-300 font-mono">Course Code, Section</code>
            </span>
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
                        onChange={(e) => {
                          const val = e.target.value.toUpperCase().trim();
                          const info = lookupCourseInfo(val);
                          handleUpdateCourse(course.id, {
                            courseCode: val,
                            courseName: course.courseName === 'Operating Systems' || !course.courseName ? info.name : course.courseName,
                            hasLab: info.hasLab,
                            labCode: info.labCode,
                            labCredits: info.labCredits,
                          });
                        }}
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
