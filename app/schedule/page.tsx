'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimetableStore } from '@/lib/store';
import { 
  Subject, Faculty, Division, SubjectAllocation, 
  TimetableEntry, Room, DAYS, TIME_SLOTS 
} from '@/lib/types';
import { 
  Loader2, Calendar, Users, X, Plus, Clock, MapPin, 
  AlertCircle, Wand2, Trash2 
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

// --- Page Components ---

/**
 * 1. Unscheduled Allocations List
 * This component lists all the "who teaches what" that haven't been scheduled yet.
 */
const UnscheduledList = ({ 
  allocations, 
  onSelect, 
  selectedId 
}: { 
  allocations: SubjectAllocation[], 
  onSelect: (alloc: SubjectAllocation) => void,
  selectedId: string | null
}) => {
  const { subjects, faculty, divisions } = useTimetableStore();

  if (allocations.length === 0) {
    return (
      <div className="p-4 text-center card">
        <AlertCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
        <h3 className="font-semibold text-white">All Mapped!</h3>
        <p className="text-sm text-gray-400">All allocations have been scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {allocations.map(alloc => {
        const subject = subjects.find(s => s.id === alloc.subjectId);
        const fac = faculty.find(f => f.id === alloc.facultyId);
        const div = divisions.find(d => d.id === alloc.divisionId);
        const batch = div?.batches.find(b => b.id === alloc.batchId);

        const title = `${subject?.code || 'Subj'}: ${fac?.initials || 'Fac'}`;
        const subtitle = alloc.type === 'THEORY' 
          ? `Div ${div?.name} (Theory)` 
          : `Batch ${batch?.name} (Lab)`;

        return (
          <div 
            key={alloc.id}
            onClick={() => onSelect(alloc)}
            className={`p-3 rounded-lg cursor-pointer border-2 ${
              selectedId === alloc.id
                ? 'bg-primary-500/20 border-primary-500' 
                : 'bg-white/5 border-transparent hover:border-white/20'
            }`}
          >
            <h4 className="font-semibold text-white">{title}</h4>
            <p className="text-sm text-gray-400">{subtitle}</p>
          </div>
        );
      })}
    </div>
  );
};

/**
 * 2. Manual Scheduling Modal
 * This modal pops up when you click an empty slot in the grid.
 */
const ManualScheduleModal = ({
  isOpen,
  onClose,
  day,
  timeSlot,
  division,
  unscheduledAllocations
}: {
  isOpen: boolean,
  onClose: () => void,
  day: string,
  timeSlot: typeof TIME_SLOTS[0],
  division: Division,
  unscheduledAllocations: SubjectAllocation[]
}) => {
  const store = useTimetableStore();
  const [selectedAllocId, setSelectedAllocId] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter allocations to only show those relevant to this division
  const relevantAllocations = useMemo(() => {
    return unscheduledAllocations.filter(alloc => alloc.divisionId === division.id);
  }, [unscheduledAllocations, division.id]);

  // Find available rooms for this exact time slot
  const availableRooms = useMemo(() => {
    const scheduledRoomIds = new Set(
      store.timetable
        .filter(entry => entry.day === day && entry.startTime === timeSlot.start)
        .map(entry => entry.room.id)
    );
    return store.rooms.filter(room => !scheduledRoomIds.has(room.id));
  }, [store.rooms, store.timetable, day, timeSlot.start]);

  useEffect(() => {
    if (isOpen) {
      setSelectedAllocId(relevantAllocations[0]?.id || '');
      setSelectedRoomId('');
    }
  }, [isOpen, relevantAllocations]);

  const handleSubmit = async () => {
    if (!selectedAllocId || !selectedRoomId) {
      toast.error('Please select an allocation and a room.');
      return;
    }
    setIsSubmitting(true);

    const allocation = store.allocations.find(a => a.id === selectedAllocId);
    const room = store.rooms.find(r => r.id === selectedRoomId);
    const subject = store.subjects.find(s => s.id === allocation?.subjectId);
    const faculty = store.faculty.find(f => f.id === allocation?.facultyId);
    const batch = division.batches.find(b => b.id === allocation?.batchId);

    if (!allocation || !room || !subject || !faculty || !division) {
      toast.error('Error: Could not find all data for scheduling.');
      setIsSubmitting(false);
      return;
    }

    const newEntry: Omit<TimetableEntry, 'id'> = {
      allocationId: allocation.id,
      day,
      startTime: timeSlot.start,
      endTime: timeSlot.end,
      subject,
      faculty,
      room,
      division,
      batch: batch || undefined,
      type: allocation.type,
    };

    const success = await store.createTimetableEntry(newEntry);
    if (success) {
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manually Schedule Slot">
      <div className="space-y-4">
        <div className="flex justify-between text-lg">
          <span className="text-white font-semibold">{day}</span>
          <span className="text-primary-400 font-semibold">{timeSlot.label}</span>
        </div>
        
        <div>
          <label className="label">Allocation to Schedule</label>
          <select 
            className="input-field" 
            value={selectedAllocId} 
            onChange={(e) => setSelectedAllocId(e.target.value)}
          >
            <option value="">-- Select Allocation --</option>
            {relevantAllocations.map(alloc => {
              const subject = store.subjects.find(s => s.id === alloc.subjectId);
              const fac = store.faculty.find(f => f.id === alloc.facultyId);
              const batch = division.batches.find(b => b.id === alloc.batchId);
              const title = `${subject?.code || 'Subj'}: ${fac?.initials || 'Fac'} (${alloc.type === 'THEORY' ? 'Theory' : 'Lab ' + batch?.name})`;
              return <option key={alloc.id} value={alloc.id}>{title}</option>;
            })}
          </select>
          {relevantAllocations.length === 0 && (
            <p className="text-xs text-yellow-400 mt-1">No unscheduled allocations found for this division.</p>
          )}
        </div>

        <div>
          <label className="label">Available Room</label>
          <select 
            className="input-field" 
            value={selectedRoomId} 
            onChange={(e) => setSelectedRoomId(e.target.value)}
          >
            <option value="">-- Select Room --</option>
            {availableRooms.map(room => (
              <option key={room.id} value={room.id}>{room.roomNumber} ({room.category})</option>
            ))}
          </select>
          {availableRooms.length === 0 && (
            <p className="text-xs text-red-400 mt-1">No rooms are available at this time slot.</p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <button type="button" onClick={handleSubmit} className="btn-primary flex-1" disabled={isSubmitting || !selectedAllocId || !selectedRoomId}>
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Schedule'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};

/**
 * 3. The Main Page
 */
export default function SchedulePage() {
  const store = useTimetableStore();
  const { isInitialized, fetchInitialData } = store;

  const [selectedDivisionId, setSelectedDivisionId] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, day: '', timeSlot: TIME_SLOTS[0] });

  // --- Fetch Data ---
  useEffect(() => {
    if (!isInitialized) {
      fetchInitialData();
    }
    if (!selectedDivisionId && store.divisions.length > 0) {
      setSelectedDivisionId(store.divisions[0].id);
    }
  }, [isInitialized, fetchInitialData, selectedDivisionId, store.divisions]);

  // --- Memoized Data ---

  // Get all allocations that are NOT yet in the timetable
  const unscheduledAllocations = useMemo(() => {
    const scheduledAllocationIds = new Set(store.timetable.map(entry => entry.allocationId));
    return store.allocations.filter(alloc => !scheduledAllocationIds.has(alloc.id));
  }, [store.allocations, store.timetable]);

  const selectedDivision = useMemo(() => {
    return store.divisions.find(d => d.id === selectedDivisionId);
  }, [selectedDivisionId, store.divisions]);

  // Create a fast-lookup map for the grid
  // Key: "day-startTime", Value: TimetableEntry[]
  const gridEntries = useMemo(() => {
    const map = new Map<string, TimetableEntry[]>();
    if (!selectedDivision) return map;

    store.timetable
      .filter(entry => entry.division.id === selectedDivision.id)
      .forEach(entry => {
        const key = `${entry.day}-${entry.startTime}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(entry);
      });
    return map;
  }, [selectedDivision, store.timetable]);

  // --- Handlers ---
  const openScheduleModal = (day: string, timeSlot: typeof TIME_SLOTS[0]) => {
    setModalState({ isOpen: true, day, timeSlot });
  };

  const handleAutoSchedule = async () => {
    toast.loading('Auto-scheduling...', { id: 'auto-toast' });
    let scheduledCount = 0;
    
    // Simple greedy algorithm
    for (const alloc of unscheduledAllocations) {
      if (alloc.divisionId !== selectedDivisionId) continue; // Only schedule for selected division

      const subject = store.subjects.find(s => s.id === alloc.subjectId);
      const faculty = store.faculty.find(f => f.id === alloc.facultyId);
      const division = store.divisions.find(d => d.id === alloc.divisionId);
      const batch = division?.batches.find(b => b.id === alloc.batchId);
      
      if (!subject || !faculty || !division) continue;

      let scheduled = false;
      for (const day of DAYS) {
        if (scheduled) break;
        for (const slot of TIME_SLOTS.filter(s => s.start !== '12:00')) { // Skip break
          
          // Find an available room
          const roomType = alloc.type === 'PRACTICAL' ? 'LAB' : 'CLASSROOM';
          const availableRoom = store.rooms.find(room => {
            if (room.category !== roomType) return false;
            // Check if room is busy
            return !store.timetable.some(e => e.day === day && e.startTime === slot.start && e.room.id === room.id);
          });

          if (availableRoom) {
            // Room found, now try to schedule (API will do final conflict check)
            const newEntry: Omit<TimetableEntry, 'id'> = {
              allocationId: alloc.id,
              day,
              startTime: slot.start,
              endTime: slot.end,
              subject,
              faculty,
              room: availableRoom,
              division,
              batch: batch || undefined,
              type: alloc.type,
            };
            
            const success = await store.createTimetableEntry(newEntry);
            if (success) {
              scheduled = true;
              scheduledCount++;
              break; // Slot found, move to next allocation
            }
          }
        }
      }
    }
    toast.success(`Auto-scheduled ${scheduledCount} new slots!`, { id: 'auto-toast' });
  };
  
  const handleUnschedule = async (entry: TimetableEntry) => {
    if (confirm(`Unschedule ${entry.subject.code} from this slot?`)) {
      await store.deleteTimetableEntry(entry.id);
    }
  };

  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
        <p className="text-xl text-gray-400 ml-4">Loading Scheduler...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6">
        
        {/* --- Main Content: Timetable Grid --- */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Schedule Timetable</h1>
              <p className="text-gray-400">Click a slot to schedule manually, or use the auto-scheduler.</p>
            </div>
          </div>

          <div className="card flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="label">Select Division to Schedule</label>
              <select 
                className="input-field" 
                value={selectedDivisionId}
                onChange={(e) => setSelectedDivisionId(e.target.value)}
              >
                {store.divisions.map(div => (
                  <option key={div.id} value={div.id}>
                    {div.department} - {div.year} - Division {div.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 md:self-end">
               <button 
                className="btn-primary w-full flex items-center justify-center gap-2"
                onClick={handleAutoSchedule}
              >
                <Wand2 className="w-5 h-5" />
                Auto-Schedule Division
              </button>
            </div>
          </div>

          {/* --- The Grid --- */}
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-2 py-3 text-left text-primary-400 font-semibold w-24">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="px-2 py-3 text-left text-primary-400 font-semibold">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map(slot => (
                  <tr key={slot.start} className="border-b border-white/5">
                    <td className="px-2 py-2 font-semibold text-white whitespace-nowrap align-top h-24">
                      {slot.label}
                    </td>
                    
                    {slot.start === '12:00' ? (
                      <td colSpan={DAYS.length} className="text-center text-gray-500 font-bold bg-white/5">
                        LUNCH BREAK
                      </td>
                    ) : (
                      DAYS.map(day => {
                        const entries = gridEntries.get(`${day}-${slot.start}`) || [];
                        return (
                          <td key={day} className="px-2 py-2 align-top h-24 border-l border-white/5">
                            <AnimatePresence>
                              {entries.length === 0 && (
                                <motion.div 
                                  onClick={() => openScheduleModal(day, slot)}
                                  className="h-full w-full flex items-center justify-center text-gray-600 hover:bg-white/10 rounded-lg cursor-pointer"
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                >
                                  <Plus className="w-5 h-5" />
                                </motion.div>
                              )}
                              
                              <div className="space-y-2">
                                {entries.map(entry => (
                                  <motion.div
                                    key={entry.id}
                                    className={`p-2 rounded-lg text-sm ${
                                      entry.type === 'PRACTICAL'
                                        ? 'bg-purple-500/20 border border-purple-500/30'
                                        : 'bg-primary-500/20 border-primary-500/30'
                                    } relative group`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.8, opacity: 0 }}
                                  >
                                    <button
                                      onClick={() => handleUnschedule(entry)}
                                      className="absolute top-1 right-1 p-1 bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="w-3 h-3 text-red-400" />
                                    </button>
                                    <div className="font-semibold text-white mb-1">
                                      {entry.subject.code}
                                    </div>
                                    <div className="text-xs text-gray-300">
                                      {entry.room.roomNumber} • {entry.faculty.initials}
                                    </div>
                                    {entry.batch && (
                                      <div className="text-xs text-gray-400 mt-1">
                                        Batch: {entry.batch.name}
                                      </div>
                                    )}
                                  </motion.div>
                                ))}
                              </div>
                            </AnimatePresence>
                          </td>
                        );
                      })
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Sidebar: Unscheduled Allocations --- */}
        <div className="w-full lg:w-96 flex-shrink-0 space-y-4">
          <h2 className="text-2xl font-bold text-white mb-6">Unscheduled</h2>
          <div className="card max-h-[80vh] overflow-y-auto">
            <UnscheduledList 
              allocations={unscheduledAllocations}
              onSelect={() => {}} // We don't need this functionality for now
              selectedId={null}
            />
          </div>
        </div>
      </div>

      {/* --- Modal --- */}
      {modalState.isOpen && selectedDivision && (
        <ManualScheduleModal 
          isOpen={modalState.isOpen}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
          day={modalState.day}
          timeSlot={modalState.timeSlot}
          division={selectedDivision}
          unscheduledAllocations={unscheduledAllocations}
        />
      )}
    </>
  );
}