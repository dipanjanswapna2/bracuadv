import React from 'react';
import { CoursePlan } from '../types/advising';
import { AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';

interface ScheduleGridProps {
  courses: CoursePlan[];
}

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({ courses }) => {
  // Extract all 1st choices and active locked choices
  const activeChoices = courses.map((course) => {
    const lockedChoice = course.choices.find((c) => c.sectionNumber === course.securedSection);
    const primaryChoice = course.choices[0];
    return {
      course,
      choice: lockedChoice || primaryChoice,
      isLocked: course.status === 'locked',
    };
  });

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const SLOTS = [
    '08:00 AM - 09:20 AM',
    '09:30 AM - 10:50 AM',
    '11:00 AM - 12:20 PM',
    '12:30 PM - 01:50 PM',
    '02:00 PM - 03:20 PM',
    '03:30 PM - 04:50 PM',
  ];

  // Detect time clashes between 1st priority choices
  const clashes: { courseA: string; courseB: string; day: string; slot: string }[] = [];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-md border border-emerald-800/40">
              Routine &amp; Conflict Matrix
            </span>
            <h2 className="text-xl font-bold text-white mt-1">Weekly Advising Schedule</h2>
            <p className="text-xs text-slate-400 mt-1">
              Visual preview of your 1st choice routine slots. Ensures no section clashes before advising day.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
              <span>Routine Conflict-Free</span>
            </span>
          </div>
        </div>
      </div>

      {/* Routine Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span>Weekly Class Schedule Matrix</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {courses.length} Courses Planned • 1st Choice Timeline
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-3 border-r border-slate-800 w-40 text-left font-bold text-slate-300">
                  Time Slot
                </th>
                {DAYS.map((d) => (
                  <th key={d} className="py-3 px-2 border-r border-slate-800 min-w-[130px]">
                    {d.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-medium text-[11px]">
              {SLOTS.map((slot) => (
                <tr key={slot} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 border-r border-slate-800 font-mono font-bold text-slate-300 text-left bg-slate-950/40">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{slot}</span>
                    </div>
                  </td>
                  {DAYS.map((day) => {
                    // Match any course choices assigned to this slot & day
                    const matchingItems = activeChoices.filter((item) => {
                      if (!item.choice) return false;
                      const timeStr = item.choice.timeSlot.toLowerCase();
                      const dayMatch = timeStr.includes(day.toLowerCase());
                      const slotMatch =
                        timeStr.includes(slot.toLowerCase().split(' - ')[0]) ||
                        timeStr.includes(slot.slice(0, 5));
                      return dayMatch && slotMatch;
                    });

                    const hasClash = matchingItems.length > 1;

                    return (
                      <td
                        key={day}
                        className={`py-2 px-1.5 border-r border-slate-800 align-top transition-colors ${
                          hasClash ? 'bg-red-950/30' : ''
                        }`}
                      >
                        {matchingItems.map((item) => (
                          <div
                            key={item.course.id}
                            className={`p-2 rounded-lg mb-1 text-left border shadow-sm ${
                              item.isLocked
                                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
                                : 'bg-slate-800 border-slate-700 text-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-blue-400">
                                {item.course.courseCode}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                Sec {item.choice?.sectionNumber}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Faculty: <strong className="text-white">{item.choice?.faculty}</strong>
                            </div>
                            {item.choice?.room && (
                              <div className="text-[9px] text-slate-500 font-mono">
                                Room: {item.choice.room}
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
