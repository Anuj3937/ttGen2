import { create } from 'zustand';
import { Subject, Division, Faculty, Room, GeneratedTimetable, TimetableEntry, SubjectAllocation } from './types';
import toast from 'react-hot-toast';

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
  allocations: SubjectAllocation[];
  timetable: TimetableEntry[]; // The final scheduled entries
  generatedTimetable: GeneratedTimetable | null; // Deprecated, but kept for now
  
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
  
  // Room actions (async)
  addRoom: (room: Omit<Room, 'id'>) => Promise<void>;
  updateRoom: (id: string, room: Partial<Room>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;

  // Allocation actions
  createAllocation: (allocation: Omit<SubjectAllocation, 'id'>) => Promise<boolean>;
  deleteAllocation: (allocation: SubjectAllocation) => Promise<boolean>;
  
  // Timetable actions
  createTimetableEntry: (entry: Omit<TimetableEntry, 'id'>) => Promise<boolean>;
  deleteTimetableEntry: (id: string) => Promise<boolean>;
  
  // Deprecated actions
  setGeneratedTimetable: (timetable: GeneratedTimetable) => void;
  updateTimetableEntry: (entryId: string, updates: Partial<TimetableEntry>) => void;
  
  // Utility
  clearAll: () => void; 
}

export const useTimetableStore = create<TimetableStore>()(
    (set, get) => ({
      subjects: [],
      divisions: [],
      faculty: [],
      rooms: [],
      allocations: [],
      timetable: [], 
      generatedTimetable: null, // Keep for old `view` page logic if needed
      isLoading: false,
      isInitialized: false,

      fetchInitialData: async () => {
        if (get().isInitialized) return; 
        set({ isLoading: true });
        try {
          const [subjectsRes, divisionsRes, facultyRes, roomsRes, allocationsRes, timetableRes] = await Promise.all([
             fetch('/api/subjects'),
             fetch('/api/divisions'),
             fetch('/api/faculty'),
             fetch('/api/rooms'),
             fetch('/api/allocations'),
             fetch('/api/timetable'),
          ]);

          if (!subjectsRes.ok || !divisionsRes.ok || !facultyRes.ok || !roomsRes.ok || !allocationsRes.ok || !timetableRes.ok) {
            throw new Error('Failed to fetch initial data');
          }

          const subjects = await subjectsRes.json();
          const divisions = await divisionsRes.json(); 
          const faculty = await facultyRes.json();
          const rooms = await roomsRes.json();
          const allocations = await allocationsRes.json();
          const timetable = await timetableRes.json();

          set({ 
            subjects: subjects || [],
            divisions: divisions || [], 
            faculty: faculty || [],
            rooms: rooms || [],
            allocations: allocations || [],
            timetable: timetable || [],
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

      // --- ROOM ACTIONS ---
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

      // --- ALLOCATION ACTIONS ---
      createAllocation: async (allocationData) => {
        try {
          const response = await fetch('/api/allocations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(allocationData),
          });
          if (!response.ok) { const { error } = await response.json(); throw new Error(error || 'Failed to create allocation'); }
          const newAllocation = await response.json();
          set((state) => ({
            allocations: [...state.allocations, newAllocation],
            faculty: state.faculty.map(f => f.id === newAllocation.facultyId ? { ...f, currentWorkload: (f.currentWorkload || 0) + newAllocation.hours } : f)
          }));
          toast.success('Faculty mapped successfully!');
          return true;
        } catch (error: any) {
          console.error(error);
          toast.error(error.message);
          return false;
        }
      },
      deleteAllocation: async (allocation) => {
        try {
          const response = await fetch(`/api/allocations/${allocation.id}`, { method: 'DELETE' });
          if (!response.ok) { const { error } = await response.json(); throw new Error(error || 'Failed to delete allocation'); }
          set((state) => ({
            allocations: state.allocations.filter(a => a.id !== allocation.id),
            faculty: state.faculty.map(f => f.id === allocation.facultyId ? { ...f, currentWorkload: Math.max(0, (f.currentWorkload || 0) - allocation.hours) } : f)
          }));
          toast.success('Allocation removed!');
          return true;
        } catch (error: any) {
          console.error(error);
          toast.error(error.message);
          return false;
        }
      },
      
      // --- TIMETABLE ACTIONS ---
      createTimetableEntry: async (entryData) => {
        try {
          const response = await fetch('/api/timetable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(entryData),
          });
          if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || 'Failed to create entry');
          }
          const newEntry = await response.json();
          set((state) => ({
            timetable: [...state.timetable, newEntry]
          }));
          toast.success('Slot scheduled!');
          return true;
        } catch (error: any) {
          console.error(error);
          toast.error(error.message, { duration: 4000 });
          return false;
        }
      },
      deleteTimetableEntry: async (id) => {
         try {
          const response = await fetch(`/api/timetable/${id}`, { method: 'DELETE' });
          if (!response.ok) {
            const { error } = await response.json();
            throw new Error(error || 'Failed to delete entry');
          }
          set((state) => ({
            timetable: state.timetable.filter(e => e.id !== id)
          }));
          toast.success('Slot unscheduled!');
          return true;
        } catch (error: any) {
          console.error(error);
          toast.error(error.message);
          return false;
        }
      },
      
      // --- DEPRECATED ---
      setGeneratedTimetable: (timetable) => set({ generatedTimetable: timetable }),
      updateTimetableEntry: (entryId, updates) => { 
        console.warn('updateTimetableEntry is deprecated');
      },
      
      // --- UTILITY ---
      clearAll: () => {
        // TODO: This should call an API to clear collections in Firestore
        set({
          subjects: [],
          divisions: [],
          faculty: [],
          rooms: [],
          allocations: [],
          timetable: [],
          generatedTimetable: null,
          isInitialized: false, 
        });
        toast.success('Local data cleared. Re-fetching from server...');
        get().fetchInitialData();
      },
    })
);