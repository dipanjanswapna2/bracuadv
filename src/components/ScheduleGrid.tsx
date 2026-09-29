import React, { useRef, useState } from 'react';
import { CoursePlan } from '../types/advising';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Download,
  Info,
  Layers,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface ScheduleGridProps {
  courses: CoursePlan[];
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ courses }) => {
  const [selectedPriorityLevel, setSelectedPriorityLevel] = useState<number>(1);
  const tableRef = useRef<HTMLDivElement>(null);

  // Extract choices matching the selected priority or locked status
  const activeChoices = courses.map((course) => {
    const lockedChoice = course.choices.find((c) => c.sectionNumber === course.securedSection);
    const targetChoice =
      course.choices.find((c) => c.priority === selectedPriorityLevel) ||
      course.choices[0];

    return {
      course,
      choice: course.status === 'locked' && lockedChoice ? lockedChoice : targetChoice,
      isLocked: course.status === 'locked',
    };
  });

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const SLOTS = [
    '08:00 AM - 09:20 AM',
    '09:30 AM - 10:50 AM',
    '11:00 AM - 12:20 PM',
    '12:30 PM - 01:50 PM',
    '02:00 PM - 03:20 PM',
    '03:30 PM - 04:50 PM',
    '05:00 PM - 06:20 PM',
  ];

  // Calculate total credits
  const totalCredits = courses.reduce(
    (sum, c) => sum + (c.credits || 0) + (c.hasLab ? c.labCredits || 0 : 0),
    0
  );

  // Conflict detection
  const conflicts: { courseA: string; courseB: string; day: string; slot: string }[] = [];
  DAYS.forEach((day) => {
    SLOTS.forEach((slot) => {
      const matchingItems = activeChoices.filter((item) => {
        if (!item.choice) return false;
        const timeStr = (item.choice.timeSlot || '').toLowerCase();
        const shortDay = day.substring(0, 3).toLowerCase();
        const dayMatch = timeStr.includes(day.toLowerCase()) || timeStr.includes(shortDay);
        const slotStart = slot.slice(0, 5);
        const slotMatch = timeStr.includes(slot.toLowerCase().split(' - ')[0]) || timeStr.includes(slotStart);
        return dayMatch && slotMatch;
      });

      if (matchingItems.length > 1) {
        for (let i = 0; i < matchingItems.length - 1; i++) {
          for (let j = i + 1; j < matchingItems.length; j++) {
            conflicts.push({
              courseA: `${matchingItems[i].course.courseCode} (Sec ${matchingItems[i].choice?.sectionNumber})`,
              courseB: `${matchingItems[j].course.courseCode} (Sec ${matchingItems[j].choice?.sectionNumber})`,
              day,
              slot,
            });
          }
        }
      }
    });
  });

  // Routine Image Downloader (Canvas generator replicating PrePreReg 2.0 routine download)
  const handleDownloadRoutineImage = () => {
    const canvas = document.createElement('canvas');
    const scale = 2; // high-dpi
    const width = 1200;
    const height = 750;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Header banner
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 20, width - 40, 70);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
    ctx.fillText('BRAC University - Weekly Class Routine & Schedule', 40, 50);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px system-ui, -apple-system, sans-serif';
    ctx.fillText(
      `Total Credits: ${totalCredits} | Priority: Choice #${selectedPriorityLevel} | Generated on ${new Date().toLocaleDateString()}`,
      40,
      72
    );

    // Grid Dimensions
    const startX = 20;
    const startY = 110;
    const colWidth = (width - 40 - 150) / 7;
    const rowHeight = (height - 130) / (SLOTS.length + 1);

    // Table Header
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(startX, startY, width - 40, rowHeight);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TIME / DAY', startX + 15, startY + rowHeight / 2 + 4);

    DAYS.forEach((day, colIdx) => {
      const x = startX + 150 + colIdx * colWidth;
      ctx.fillText(day.toUpperCase(), x + 10, startY + rowHeight / 2 + 4);
    });

    // Draw Slots and Cells
    SLOTS.forEach((slot, rowIdx) => {
      const y = startY + (rowIdx + 1) * rowHeight;

      // Slot label
      ctx.fillStyle = rowIdx % 2 === 0 ? '#1e293b' : '#0f172a';
      ctx.fillRect(startX, y, 150, rowHeight);
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(slot, startX + 10, y + rowHeight / 2 + 4);

      // Grid cells
      DAYS.forEach((day, colIdx) => {
        const x = startX + 150 + colIdx * colWidth;
        ctx.fillStyle = (rowIdx + colIdx) % 2 === 0 ? '#131d33' : '#0f172a';
        ctx.fillRect(x, y, colWidth, rowHeight);

        // Border
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, colWidth, rowHeight);

        // Find match
        const matchingItems = activeChoices.filter((item) => {
          if (!item.choice) return false;
          const timeStr = (item.choice.timeSlot || '').toLowerCase();
          const shortDay = day.substring(0, 3).toLowerCase();
          const dayMatch = timeStr.includes(day.toLowerCase()) || timeStr.includes(shortDay);
          const slotStart = slot.slice(0, 5);
          const slotMatch = timeStr.includes(slot.toLowerCase().split(' - ')[0]) || timeStr.includes(slotStart);
          return dayMatch && slotMatch;
        });

        if (matchingItems.length > 0) {
          matchingItems.forEach((item, i) => {
            const itemY = y + 4 + i * 28;
            ctx.fillStyle = item.isLocked ? '#065f46' : '#1e3a8a';
            ctx.fillRect(x + 3, itemY, colWidth - 6, 26);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px system-ui';
            ctx.fillText(`${item.course.courseCode} [${item.choice?.sectionNumber}]`, x + 6, itemY + 12);

            ctx.fillStyle = '#cbd5e1';
            ctx.font = '9px system-ui';
            ctx.fillText(`${item.choice?.faculty || 'TBA'} - ${item.choice?.room || ''}`, x + 6, itemY + 22);
          });
        }
      });
    });

    const base64image = canvas.toDataURL('image/png');
    const dlLink = document.createElement('a');
    dlLink.setAttribute('href', base64image);
    dlLink.setAttribute('download', `routine-choice-${selectedPriorityLevel}.png`);
    dlLink.click();
    dlLink.remove();
  };

  return (
    <div className="space-y-6">
      {/* PrePreReg 2.0 Inspired Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-800/40">
                PrePreReg 2.0 Live Routine Matrix
              </span>
              <span className="text-xs text-slate-400">
                Official BRAC University 7-Day &bull; 7-Time Slot Grid
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">Weekly Class Routine &amp; Conflict Matrix</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              সপ্তাহের ৭ দিনের ক্লাস শিডিউল সরাসরি যাচাই করুন। চয়েস ১, ২, ৩ এর প্রতিটি রুটিনে কোনো কনফ্লিক্ট বা একই টাইমে একাধিক ক্লাস পড়ে কিনা তা স্বয়ংক্রিয়ভাবে শনাক্ত হবে।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Switcher */}
            <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl p-1 text-xs">
              <span className="text-slate-400 px-2 font-medium">View Choice:</span>
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSelectedPriorityLevel(lvl)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    selectedPriorityLevel === lvl
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  #{lvl}
                </button>
              ))}
            </div>

            {/* Total Credits Pill */}
            <div className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
              <span className="text-slate-400">Total Credits:</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{totalCredits}</span>
            </div>

            {/* Download Routine Button */}
            <button
              onClick={handleDownloadRoutineImage}
              id="downloadTable"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              title="Download high-resolution routine image"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download the Routine (PNG)</span>
            </button>
          </div>
        </div>

        {/* Conflict / Warning alert container */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          {conflicts.length > 0 ? (
            <div className="bg-red-950/60 border border-red-500/40 rounded-xl p-3 flex items-start gap-3 text-xs text-red-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-red-300">Time Clash Detected ({conflicts.length}): </span>
                <span className="text-red-200">
                  {conflicts.map((c, i) => (
                    <span key={i} className="inline-block mr-3">
                      &bull; {c.courseA} clashes with {c.courseB} on {c.day} ({c.slot})
                    </span>
                  ))}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-3 py-2 rounded-xl">
              <CheckCircle className="w-4 h-4" />
              <span>
                Choice #{selectedPriorityLevel} routine is completely conflict-free! No overlapping classes detected.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Routine Table Container (matching PrePreReg HTML table specs) */}
      <div
        ref={tableRef}
        id="data_table"
        className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
      >
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>PrePreReg 2.0 Live Advising Routine Table</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {courses.length} Courses Planned &bull; Showing Priority #{selectedPriorityLevel}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse divide-y divide-slate-800">
            <thead className="bg-slate-950 text-slate-300 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 border-r border-slate-800 w-44 text-left font-bold text-slate-200">
                  Time / Day
                </th>
                {DAYS.map((d) => (
                  <th key={d} className="py-3 px-2 border-r border-slate-800 min-w-[130px] font-bold">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-[11px]">
              {SLOTS.map((slot, rowIndex) => (
                <tr key={slot} id={`row${rowIndex + 1}`} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 border-r border-slate-800 font-mono font-bold text-slate-200 text-left bg-slate-950/60">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{slot}</span>
                    </div>
                  </td>

                  {DAYS.map((day, colIndex) => {
                    const matchingItems = activeChoices.filter((item) => {
                      if (!item.choice) return false;
                      const timeStr = (item.choice.timeSlot || '').toLowerCase();
                      const shortDay = day.substring(0, 3).toLowerCase();
                      const dayMatch = timeStr.includes(day.toLowerCase()) || timeStr.includes(shortDay);
                      const slotStart = slot.slice(0, 5);
                      const slotMatch = timeStr.includes(slot.toLowerCase().split(' - ')[0]) || timeStr.includes(slotStart);
                      return dayMatch && slotMatch;
                    });

                    const hasClash = matchingItems.length > 1;

                    return (
                      <td
                        key={day}
                        id={`${rowIndex + 1}-${colIndex + 1}`}
                        className={`py-2 px-1.5 border-r border-slate-800 align-top transition-colors ${
                          hasClash ? 'bg-red-950/40' : ''
                        }`}
                      >
                        {matchingItems.map((item) => (
                          <div
                            key={item.course.id}
                            className={`p-2 rounded-xl mb-1 text-left border shadow-sm transition-all ${
                              item.isLocked
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                                : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-mono font-bold text-blue-400 text-xs">
                                {item.course.courseCode}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-400/10 px-1 rounded border border-amber-400/20">
                                Sec {item.choice?.sectionNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-300 mt-1 flex items-center justify-between">
                              <span>
                                Fac: <strong className="text-white font-mono">{item.choice?.faculty}</strong>
                              </span>
                              {item.choice?.room && (
                                <span className="text-slate-400 font-mono text-[9px]">
                                  {item.choice.room}
                                </span>
                              )}
                            </div>
                            {item.isLocked && (
                              <div className="text-[9px] font-semibold text-emerald-400 mt-1 flex items-center gap-1">
                                <CheckCircle className="w-2.5 h-2.5" />
                                <span>Locked in SLMS</span>
                              </div>
                            )}
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
  );
};
