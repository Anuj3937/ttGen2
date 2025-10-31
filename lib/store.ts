import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Subject, Division, Faculty, Room, GeneratedTimetable, TimetableEntry } from './types';

interface TimetableStore {
  subjects: Subject[];
  divisions: Division[];
  faculty: Faculty[];
  rooms: Room[];
  generatedTimetable: GeneratedTimetable | null;
  
  // Subject actions
  addSubject: (subject: Subject) => void;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  
  // Division actions
  addDivision: (division: Division) => void;
  updateDivision: (id: string, division: Partial<Division>) => void;
  deleteDivision: (id: string) => void;
  
  // Faculty actions
  addFaculty: (faculty: Faculty) => void;
  updateFaculty: (id: string, faculty: Partial<Faculty>) => void;
  deleteFaculty: (id: string) => void;
  
  // Room actions
  addRoom: (room: Room) => void;
  updateRoom: (id: string, room: Partial<Room>) => void;
  deleteRoom: (id: string) => void;
  
  // Timetable actions
  setGeneratedTimetable: (timetable: GeneratedTimetable) => void;
  updateTimetableEntry: (entryId: string, updates: Partial<TimetableEntry>) => void;
  
  // Utility
  clearAll: () => void;
}

export const useTimetableStore = create<TimetableStore>()(
  persist(
    (set, get) => ({
      subjects: [],
      divisions: [],
      faculty: [],
      rooms: [],
      generatedTimetable: null,
      
      addSubject: (subject) => set((state) => ({ 
        subjects: [...state.subjects, subject] 
      })),
      
      updateSubject: (id, updates) => set((state) => ({
        subjects: state.subjects.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      
      deleteSubject: (id) => set((state) => ({
        subjects: state.subjects.filter(s => s.id !== id)
      })),
      
      addDivision: (division) => set((state) => ({
        divisions: [...state.divisions, division]
      })),
      
      updateDivision: (id, updates) => set((state) => ({
        divisions: state.divisions.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      
      deleteDivision: (id) => set((state) => ({
        divisions: state.divisions.filter(d => d.id !== id)
      })),
      
      addFaculty: (faculty) => set((state) => ({
        faculty: [...state.faculty, faculty]
      })),
      
      updateFaculty: (id, updates) => set((state) => ({
        faculty: state.faculty.map(f => f.id === id ? { ...f, ...updates } : f)
      })),
      
      deleteFaculty: (id) => set((state) => ({
        faculty: state.faculty.filter(f => f.id !== id)
      })),
      
      addRoom: (room) => set((state) => ({
        rooms: [...state.rooms, room]
      })),
      
      updateRoom: (id, updates) => set((state) => ({
        rooms: state.rooms.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      deleteRoom: (id) => set((state) => ({
        rooms: state.rooms.filter(r => r.id !== id)
      })),
      
      setGeneratedTimetable: (timetable) => set({ generatedTimetable: timetable }),
      
      updateTimetableEntry: (entryId, updates) => set((state) => {
        if (!state.generatedTimetable) return state;
        
        const updateEntries = (entries: TimetableEntry[]) =>
          entries.map(e => e.id === entryId ? { ...e, ...updates } : e);
        
        return {
          generatedTimetable: {
            ...state.generatedTimetable,
            divisionWise: Object.fromEntries(
              Object.entries(state.generatedTimetable.divisionWise).map(
                ([key, entries]) => [key, updateEntries(entries)]
              )
            ),
            facultyWise: Object.fromEntries(
              Object.entries(state.generatedTimetable.facultyWise).map(
                ([key, entries]) => [key, updateEntries(entries)]
              )
            ),
            roomWise: Object.fromEntries(
              Object.entries(state.generatedTimetable.roomWise).map(
                ([key, entries]) => [key, updateEntries(entries)]
              )
            ),
          }
        };
      }),
      
      clearAll: () => set({
        subjects: [],
        divisions: [],
        faculty: [],
        rooms: [],
        generatedTimetable: null,
      }),
    }),
    {
      name: 'timetable-storage',
    }
  )
);
