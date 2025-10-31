export type SubjectType = 'CORE' | 'LAB' | 'DLO' | 'ILO' | 'MINOR';

export interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  year: string; // FE, SE, TE, BE
  theoryHours: number;
  practicalHours: number;
  type: SubjectType;
  electives?: string[]; // For DLO/ILO - list of elective options
}

export interface Division {
  id: string;
  department: string;
  year: string;
  name: string; // A, B, C, D, E
  batches: Batch[];
}

export interface Batch {
  id: string;
  name: string; // A1, A2, A3
  studentCount: number;
  electiveChoices?: { [subjectId: string]: string }; // For DLO/ILO
  minorStudents?: string[]; // List of student IDs who opted for minor
}

export interface Faculty {
  id: string;
  name: string;
  initials: string;
  designation: string;
  maxWorkload: number; // Maximum hours per week
  currentWorkload: number;
  subjects: string[]; // Subject IDs they can teach
  preferences?: {
    preferredDays?: string[];
    preferredSlots?: string[];
  };
}

export interface Room {
  id: string;
  roomNumber: string;
  category: 'CLASSROOM' | 'LAB';
  capacity: number;
  department?: string;
}

export interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
  duration: number; // in hours
}

export interface TimetableEntry {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  subject: Subject;
  faculty: Faculty;
  room: Room;
  division: Division;
  batch?: Batch; // For practicals
  type: 'THEORY' | 'PRACTICAL';
}

export interface DepartmentLoad {
  department: string;
  year: string;
  totalTheoryHours: number;
  totalPracticalHours: number;
  allocatedTheoryHours: number;
  allocatedPracticalHours: number;
  remainingTheoryHours: number;
  remainingPracticalHours: number;
  unassignedSubjects: Subject[];
}

export interface GeneratedTimetable {
  divisionWise: { [key: string]: TimetableEntry[] };
  facultyWise: { [key: string]: TimetableEntry[] };
  roomWise: { [key: string]: TimetableEntry[] };
  departmentLoads: DepartmentLoad[];
  remainingFaculty: Faculty[];
  vacantRooms: { room: Room; vacantSlots: TimeSlot[] }[];
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const TIME_SLOTS = [
  { start: '09:00', end: '10:00', label: '9:00-10:00' },
  { start: '10:00', end: '11:00', label: '10:00-11:00' },
  { start: '11:00', end: '12:00', label: '11:00-12:00' },
  { start: '12:00', end: '13:00', label: '12:00-1:00 (Break)' },
  { start: '13:00', end: '14:00', label: '1:00-2:00' },
  { start: '14:00', end: '15:00', label: '2:00-3:00' },
  { start: '15:00', end: '16:00', label: '3:00-4:00' },
  { start: '16:00', end: '17:00', label: '4:00-5:00' },
];
