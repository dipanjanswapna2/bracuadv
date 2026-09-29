export type AdvisingPhase = 'self-registration' | 'phase-one' | 'phase-two' | 'wish-list';

export interface SectionChoice {
  id: string;
  priority: number; // 1, 2, 3... (unlimited priority ranking)
  sectionNumber: string; // e.g., "05", "13", "03"
  faculty: string; // e.g., "AVB", "TSM", "FIC", "TBA"
  timeSlot: string; // e.g., "Sun/Tue 02:00 PM - 03:20 PM"
  room?: string; // e.g., "09A-04C"
  labSectionNumber?: string; // e.g., "16" for CSE111L
  labFaculty?: string; // e.g., "TBA"
  minSeatsRequired: number; // usually 1
  note?: string;
}

export interface CoursePlan {
  id: string;
  courseCode: string; // e.g., "CSE230"
  courseName: string; // e.g., "Discrete Mathematics"
  credits: number;
  hasLab: boolean;
  labCode?: string; // e.g., "CSE111L"
  labCredits?: number;
  choices: SectionChoice[]; // Priority choices (unlimited fallback chain)
  status: 'idle' | 'searching' | 'locked' | 'failed';
  securedSection?: string;
  securedFaculty?: string;
  currentAttemptChoice?: number;
}

export interface BotSettings {
  autoStartOnPageLoad: boolean;
  pollingIntervalMs: number; // 200ms - 2000ms
  autoConfirmAdvising: boolean; // dangerous: only if user enables
  soundAlerts: boolean;
  notifyOnFallback: boolean;
  targetPhase: AdvisingPhase;
  retryUntilSuccess: boolean;
  maxRetriesPerCourse: number;
  simulateHumanDelay: boolean;
  studentId: string;
  studentName: string;
}

export interface PortalRow {
  rowId: string;
  courseCode: string;
  sectionNumber: string;
  availableSeats: number;
  faculty: string;
  rawString: string; // e.g., "CSE230-[05](0)-AVB"
  prerequisite: string;
  courseEquivalences: string;
  credits: number;
  scheduleDays: string[]; // ['Sun', 'Tue']
  scheduleTime: string; // '2:00 PM - 3:20 PM'
  room: string;
  isLab?: boolean;
  parentCourseCode?: string;
}

export interface SelectedSection {
  rowId: string;
  courseCode: string;
  sectionNumber: string;
  faculty: string;
  rawString: string; // e.g., "CSE230-[13] -BDAS"
  credits: number;
  scheduleDays: string[];
  scheduleTime: string;
  room: string;
  isLab?: boolean;
}

export interface BotLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'action';
  message: string;
  courseCode?: string;
  choicePriority?: number;
}
