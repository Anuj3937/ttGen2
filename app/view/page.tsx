'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Building, Download, Edit3, Save, X, AlertCircle } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { TimetableEntry, DAYS } from '@/lib/types';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

type ViewMode = 'division' | 'faculty' | 'room';

export default function ViewPage() {
  const { generatedTimetable, subjects, faculty, rooms, divisions, updateTimetableEntry } = useTimetableStore();
  const [viewMode, setViewMode] = useState<ViewMode>('division');
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [showResourcesModal, setShowResourcesModal] = useState(false);

  if (!generatedTimetable) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Timetable Generated</h2>
        <p className="text-gray-400 mb-6">Please generate a timetable first</p>
        <a href="/generate" className="btn-primary">
          Go to Generate Page
        </a>
      </div>
    );
  }

  const getEntitiesByMode = () => {
    switch (viewMode) {
      case 'division':
        return Object.keys(generatedTimetable.divisionWise);
      case 'faculty':
        return Object.keys(generatedTimetable.facultyWise).map(id => {
          const f = faculty.find(fac => fac.id === id);
          return { id, name: f ? `${f.name} (${f.initials})` : id };
        });
      case 'room':
        return Object.keys(generatedTimetable.roomWise).map(id => {
          const r = rooms.find(room => room.id === id);
          return { id, name: r ? r.roomNumber : id };
        });
    }
  };

  const getTimetableEntries = (): TimetableEntry[] => {
    if (!selectedEntity) return [];

    switch (viewMode) {
      case 'division':
        return generatedTimetable.divisionWise[selectedEntity] || [];
      case 'faculty':
        return generatedTimetable.facultyWise[selectedEntity] || [];
      case 'room':
        return generatedTimetable.roomWise[selectedEntity] || [];
      default:
        return [];
    }
  };

  const organizeEntriesByDayAndTime = () => {
    const entries = getTimetableEntries();
    const organized: { [day: string]: { [time: string]: TimetableEntry[] } } = {};

    DAYS.forEach(day => {
      organized[day] = {};
    });

    entries.forEach(entry => {
      if (!organized[entry.day]) organized[entry.day] = {};
      if (!organized[entry.day][entry.startTime]) {
        organized[entry.day][entry.startTime] = [];
      }
      organized[entry.day][entry.startTime].push(entry);
    });

    return organized;
  };

  const handleSaveEdit = () => {
    if (editingEntry) {
      updateTimetableEntry(editingEntry.id, editingEntry);
      toast.success('Timetable updated successfully!');
      setEditingEntry(null);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const organized = organizeEntriesByDayAndTime();

    // Create worksheet data
    const wsData: any[][] = [['Time', ...DAYS]];
    
    const timeSlots = Array.from(
      new Set(
        getTimetableEntries().map(e => e.startTime)
      )
    ).sort();

    timeSlots.forEach(time => {
      const row = [time];
      DAYS.forEach(day => {
        const entries = organized[day]?.[time] || [];
        const cellContent = entries.map(e => 
          `${e.subject.code} - ${e.faculty.initials} - ${e.room.roomNumber}${e.batch ? ` (${e.batch.name})` : ''}`
        ).join('\n');
        row.push(cellContent);
      });
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, selectedEntity || 'Timetable');

    // Add remaining resources sheet
    const resourcesData = [
      ['Remaining Faculty Capacity'],
      ['Name', 'Current Load', 'Max Load', 'Available Hours'],
      ...generatedTimetable.remainingFaculty.map(f => [
        f.name,
        f.currentWorkload,
        f.maxWorkload,
        f.maxWorkload - f.currentWorkload
      ]),
      [],
      ['Vacant Room Slots'],
      ['Room', 'Vacant Slots Count'],
      ...generatedTimetable.vacantRooms.map(vr => [
        vr.room.roomNumber,
        vr.vacantSlots.length
      ]),
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(resourcesData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Resources');

    XLSX.writeFile(wb, `timetable-${selectedEntity || 'all'}.xlsx`);
    toast.success('Timetable exported to Excel!');
  };

  const entities = getEntitiesByMode();
  const organized = organizeEntriesByDayAndTime();
  const timeSlots = Array.from(
    new Set(getTimetableEntries().map(e => e.startTime))
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">View Timetable</h1>
          <p className="text-gray-400">View and edit generated timetables</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setShowResourcesModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Resources</span>
          </button>
          <button
            onClick={exportToExcel}
            className="btn-primary flex items-center space-x-2"
            disabled={!selectedEntity}
          >
            <Download className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { setViewMode('division'); setSelectedEntity(''); }}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            viewMode === 'division'
              ? 'bg-primary-500 text-white'
              : 'glass text-gray-300 hover:bg-white/10'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Division-wise</span>
        </button>
        <button
          onClick={() => { setViewMode('faculty'); setSelectedEntity(''); }}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            viewMode === 'faculty'
              ? 'bg-primary-500 text-white'
              : 'glass text-gray-300 hover:bg-white/10'
          }`}
        >
          <User className="w-5 h-5" />
          <span>Faculty-wise</span>
        </button>
        <button
          onClick={() => { setViewMode('room'); setSelectedEntity(''); }}
          className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
            viewMode === 'room'
              ? 'bg-primary-500 text-white'
              : 'glass text-gray-300 hover:bg-white/10'
          }`}
        >
          <Building className="w-5 h-5" />
          <span>Room-wise</span>
        </button>
      </div>

      {/* Entity Selector */}
      <div className="card">
        <label className="label mb-2">
          Select {viewMode === 'division' ? 'Division' : viewMode === 'faculty' ? 'Faculty' : 'Room'}
        </label>
        <select
          className="input-field"
          value={selectedEntity}
          onChange={(e) => setSelectedEntity(e.target.value)}
        >
          <option value="">-- Select --</option>
          {entities.map((entity: any) => (
            <option key={typeof entity === 'string' ? entity : entity.id} value={typeof entity === 'string' ? entity : entity.id}>
              {typeof entity === 'string' ? entity : entity.name}
            </option>
          ))}
        </select>
      </div>

      {/* Timetable Grid */}
      {selectedEntity && (
        <motion.div
          className="card overflow-x-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-4 py-3 text-left text-primary-400 font-semibold">Time</th>
                {DAYS.map(day => (
                  <th key={day} className="px-4 py-3 text-left text-primary-400 font-semibold">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(time => (
                <tr key={time} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">
                    {time}
                  </td>
                  {DAYS.map(day => {
                    const entries = organized[day]?.[time] || [];
                    return (
                      <td key={day} className="px-4 py-3 align-top">
                        <div className="space-y-2">
                          {entries.map((entry, idx) => (
                            <div
                              key={idx}
                              className={`p-3 rounded-lg text-sm ${
                                entry.type === 'PRACTICAL'
                                  ? 'bg-purple-500/20 border border-purple-500/30'
                                  : 'bg-primary-500/20 border border-primary-500/30'
                              } relative group`}
                            >
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
                              <button
                                onClick={() => setEditingEntry(entry)}
                                className="absolute top-2 right-2 p-1 bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Edit3 className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                          {entries.length === 0 && (
                            <div className="text-gray-600 text-sm text-center py-2">-</div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingEntry && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              className="glass-dark rounded-2xl p-6 max-w-lg w-full"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <h2 className="text-2xl font-bold text-white mb-6">Edit Entry</h2>

              <div className="space-y-4">
                <div>
                  <label className="label">Subject</label>
                  <select
                    className="input-field"
                    value={editingEntry.subject.id}
                    onChange={(e) => {
                      const subject = subjects.find(s => s.id === e.target.value);
                      if (subject) {
                        setEditingEntry({ ...editingEntry, subject });
                      }
                    }}
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Faculty</label>
                  <select
                    className="input-field"
                    value={editingEntry.faculty.id}
                    onChange={(e) => {
                      const fac = faculty.find(f => f.id === e.target.value);
                      if (fac) {
                        setEditingEntry({ ...editingEntry, faculty: fac });
                      }
                    }}
                  >
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.initials})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Room</label>
                  <select
                    className="input-field"
                    value={editingEntry.room.id}
                    onChange={(e) => {
                      const room = rooms.find(r => r.id === e.target.value);
                      if (room) {
                        setEditingEntry({ ...editingEntry, room });
                      }
                    }}
                  >
                    {rooms.filter(r => 
                      editingEntry.type === 'PRACTICAL' ? r.category === 'LAB' : r.category === 'CLASSROOM'
                    ).map(r => (
                      <option key={r.id} value={r.id}>{r.roomNumber}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Day</label>
                    <select
                      className="input-field"
                      value={editingEntry.day}
                      onChange={(e) => setEditingEntry({ ...editingEntry, day: e.target.value })}
                    >
                      {DAYS.map(day => (
                        <option key={day} value={day}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Start Time</label>
                    <select
                      className="input-field"
                      value={editingEntry.startTime}
                      onChange={(e) => setEditingEntry({ ...editingEntry, startTime: e.target.value })}
                    >
                      {timeSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={() => setEditingEntry(null)}
                  className="btn-secondary flex-1 flex items-center justify-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Resources Modal */}
      <AnimatePresence>
        {showResourcesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              className="glass-dark rounded-2xl p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Remaining Resources</h2>
                <button onClick={() => setShowResourcesModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Remaining Faculty */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Faculty with Available Hours</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2 text-left text-primary-400">Name</th>
                        <th className="px-4 py-2 text-left text-primary-400">Current Load</th>
                        <th className="px-4 py-2 text-left text-primary-400">Max Load</th>
                        <th className="px-4 py-2 text-left text-primary-400">Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generatedTimetable.remainingFaculty.map(f => (
                        <tr key={f.id} className="border-b border-white/5">
                          <td className="px-4 py-2 text-white">{f.name}</td>
                          <td className="px-4 py-2 text-gray-400">{f.currentWorkload}h</td>
                          <td className="px-4 py-2 text-gray-400">{f.maxWorkload}h</td>
                          <td className="px-4 py-2 text-green-400 font-semibold">
                            {f.maxWorkload - f.currentWorkload}h
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vacant Rooms */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-white mb-4">Rooms with Vacant Slots</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedTimetable.vacantRooms.map(vr => (
                    <div key={vr.room.id} className="p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white">{vr.room.roomNumber}</span>
                        <span className="text-sm text-primary-400">{vr.room.category}</span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {vr.vacantSlots.length} vacant slots available
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Department Loads */}
              <div>
                <h3 className="text-xl font-semibold text-white mb-4">Department Loads</h3>
                <div className="space-y-4">
                  {generatedTimetable.departmentLoads.map(load => (
                    <div key={`${load.department}-${load.year}`} className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-semibold text-white mb-3">
                        {load.department} - {load.year}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Theory Hours:</span>
                          <span className="text-white ml-2">
                            {load.allocatedTheoryHours}/{load.totalTheoryHours}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Practical Hours:</span>
                          <span className="text-white ml-2">
                            {load.allocatedPracticalHours}/{load.totalPracticalHours}
                          </span>
                        </div>
                      </div>
                      {load.unassignedSubjects.length > 0 && (
                        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded">
                          <div className="text-red-400 text-sm font-medium mb-1">
                            Unassigned Subjects:
                          </div>
                          <div className="text-red-300 text-sm">
                            {load.unassignedSubjects.map(s => s.name).join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
