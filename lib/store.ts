import { create } from 'zustand';
import { Subject, Division, Faculty, Room, GeneratedTimetable, TimetableEntry } from './types';
import toast from 'react-hot-toast';

// Define a new state to track loading
interface AppState {
  isLoading: boolean;
  isInitialized: boolean;
  fetchInitialData: () => Promise<void>; 
}

interface TimetableStore extends AppState {
  subjects: Subject[];
  divisions: Division[];
  faculty: Faculty[];
  rooms: Room[];
  generatedTimetable: GeneratedTimetable | null;
  
  // Subject actions (async)
  addSubject: (subject: Omit<Subject, 'id'>) => Promise<void>;
  updateSubject: (id: string, subject: Partial<Subject>) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
  
  // Division actions (async)
  addDivision: (division: Omit<Division, 'id'>) => Promise<void>;
  updateDivision: (id: string, division: Partial<Division>) => Promise<void>;
  deleteDivision: (id: string) => Promise<void>;
  
  // Faculty actions (async)
  addFaculty: (faculty: Omit<Faculty, 'id'>) => Promise<void>;
  updateFaculty: (id: string, faculty: Partial<Faculty>) => Promise<void>;
  deleteFaculty: (id: string) => Promise<void>;
  
  // Room actions (now async)
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  
  // Timetable actions
  setGeneratedTimetable: (timetable: GeneratedTimetable) => void;
  updateTimetableEntry: (entryId: string, updates: Partial<TimetableEntry>) => void;
  
  // Utility
  clearAll: () => void; // This will need to be updated to clear Firestore
}

export const useTimetableStore = create<TimetableStore>()(
    (set, get) => ({
      subjects: [],
      divisions: [],
      faculty: [],
      rooms: [],
      generatedTimetable: null,
      isLoading: false,
      isInitialized: false,

      // --- FINALIZED INITIALIZATION ---
      fetchInitialData: async () => {
        if (get().isInitialized) return; 
        
        set({ isLoading: true });
        try {
          const [subjectsRes, divisionsRes, facultyRes, roomsRes] = await Promise.all([
             fetch('/api/subjects'),
             fetch('/api/divisions'),
             fetch('/api/faculty'),
             fetch('/api/rooms'),
          ]);

          if (!subjectsRes.ok || !divisionsRes.ok || !facultyRes.ok || !roomsRes.ok) {
            console.error('Fetch errors:', {
              subjects: subjectsRes.status,
              divisions: divisionsRes.status,
              faculty: facultyRes.status,
              rooms: roomsRes.status,
            });
            throw new Error('Failed to fetch initial data');
          }

          const subjects = await subjectsRes.json();
          const divisions = await divisionsRes.json(); 
          const faculty = await facultyRes.json();
          const rooms = await roomsRes.json();

          set({ 
            subjects: subjects || [],
            divisions: divisions || [], 
            faculty: faculty || [],
            rooms: rooms || [],
            isLoading: false, 
            isInitialized: true 
          });
          
        } catch (error: any) {
          console.error("Failed to fetch initial data:", error);
          set({ isLoading: false });
          toast.error(`Failed to load data: ${error.message}`);
        }
      },
      
      // --- SUBJECT ACTIONS ---
      addSubject: async (subjectData) => {
        try {
          const response = await fetch('/api/subjects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subjectData),
          });
          if (!response.ok) throw new Error('Failed to add subject');
          const newSubject = await response.json();
          set((state) => ({ subjects: [...state.subjects, newSubject] }));
          toast.success('Subject added successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to add subject');
        }
      },
      updateSubject: async (id, updates) => {
         try {
          const response = await fetch(`/api/subjects/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update subject');
          const updatedSubject = await response.json();
          set((state) => ({
            subjects: state.subjects.map(s => s.id === id ? { ...s, ...updatedSubject } : s)
          }));
          toast.success('Subject updated successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to update subject');
        }
      },
      deleteSubject: async (id) => {
        try {
          const response = await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete subject');
          set((state) => ({ subjects: state.subjects.filter(s => s.id !== id) }));
          toast.success('Subject deleted successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to delete subject');
        }
      },
      
      // --- DIVISION ACTIONS ---
      addDivision: async (divisionData) => {
        try {
          const response = await fetch('/api/divisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(divisionData),
          });
          if (!response.ok) throw new Error('Failed to add division');
          const newDivision = await response.json();
          set((state) => ({ divisions: [...state.divisions, newDivision] }));
          toast.success('Division added successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to add division');
        }
      },
      updateDivision: async (id, updates) => {
         try {
          const response = await fetch(`/api/divisions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update division');
          const updatedDivision = await response.json();
          set((state) => ({
            divisions: state.divisions.map(d => d.id === id ? { ...d, ...updatedDivision } : d)
          }));
        } catch (error) {
          console.error(error);
          toast.error('Failed to update division');
          throw error;
        }
      },
      deleteDivision: async (id) => {
        try {
          const response = await fetch(`/api/divisions/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete division');
          set((state) => ({ divisions: state.divisions.filter(d => d.id !== id) }));
          toast.success('Division deleted successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to delete division');
        }
      },
      
      // --- FACULTY ACTIONS ---
      addFaculty: async (facultyData) => {
        try {
          const response = await fetch('/api/faculty', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(facultyData),
          });
          if (!response.ok) throw new Error('Failed to add faculty');
          const newFaculty = await response.json();
          set((state) => ({ faculty: [...state.faculty, newFaculty] }));
          toast.success('Faculty added successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to add faculty');
        }
      },
      updateFaculty: async (id, updates) => {
         try {
          const response = await fetch(`/api/faculty/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update faculty');
          const updatedFaculty = await response.json();
          set((state) => ({
            faculty: state.faculty.map(f => f.id === id ? { ...f, ...updatedFaculty } : f)
          }));
          toast.success('Faculty updated successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to update faculty');
        }
      },
      deleteFaculty: async (id) => {
        try {
          const response = await fetch(`/api/faculty/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete faculty');
          set((state) => ({ faculty: state.faculty.filter(f => f.id !== id) }));
          toast.success('Faculty deleted successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to delete faculty');
        }
      },
      
      // --- NEW REFACTORED ROOM ACTIONS ---
      addRoom: async (roomData) => {
        try {
          const response = await fetch('/api/rooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData),
          });
          if (!response.ok) throw new Error('Failed to add room');
          const newRoom = await response.json();
          set((state) => ({ rooms: [...state.rooms, newRoom] }));
          toast.success('Room added successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to add room');
        }
      },
      updateRoom: async (id, updates) => {
         try {
          const response = await fetch(`/api/rooms/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!response.ok) throw new Error('Failed to update room');
          const updatedRoom = await response.json();
          set((state) => ({
            rooms: state.rooms.map(r => r.id === id ? { ...r, ...updatedRoom } : r)
          }));
          toast.success('Room updated successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to update room');
        }
      },
      deleteRoom: async (id) => {
        try {
          const response = await fetch(`/api/rooms/${id}`, { method: 'DELETE' });
          if (!response.ok) throw new Error('Failed to delete room');
          set((state) => ({ rooms: state.rooms.filter(r => r.id !== id) }));
          toast.success('Room deleted successfully!');
        } catch (error) {
          console.error(error);
          toast.error('Failed to delete room');
        }
      },
      
      // --- TIMETABLE (still client-side) ---
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
      
      // TODO: This should call an API to clear collections in Firestore
      clearAll: () => set({
        subjects: [],
        divisions: [],
        faculty: [],
        rooms: [],
        generatedTimetable: null,
        isInitialized: true, // Reset to re-fetch
      }),
    })
);