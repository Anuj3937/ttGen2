'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, User, Building, Download, Loader2, AlertCircle } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { TimetableEntry, DAYS, TIME_SLOTS } from '@/lib/types';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

type ViewMode = 'division' | 'faculty' | 'room';

export default function ViewPage() {
  const { 
    timetable, // <-- Use the new source of truth
    faculty, 
    rooms, 
    divisions, 
    isInitialized, 
    fetchInitialData 
  } = useTimetableStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('division');
  const [selectedEntity, setSelectedEntity] = useState<string>('');

  // --- Fetch Data ---
  useEffect(() => {
    if (!isInitialized) {
      fetchInitialData();
    }
  }, [isInitialized, fetchInitialData]);

  // --- Re-build the data structures for the view ---
  const generatedTimetable = useMemo(() => {
    if (!isInitialized || timetable.length === 0) return null;

    const divisionWise: { [key: string]: TimetableEntry[] } = {};
    const facultyWise: { [key: string]: TimetableEntry[] } = {};
    const roomWise: { [key: string]: TimetableEntry[] } = {};

    timetable.forEach(entry => {
      // Division Key
      const divKey = `${entry.division.department}-${entry.division.year}-${entry.division.name}`;
      if (!divisionWise[divKey]) divisionWise[divKey] = [];
      divisionWise[divKey].push(entry);

      // Faculty Key
      const facKey = entry.faculty.id;
      if (!facultyWise[facKey]) facultyWise[facKey] = [];
      facultyWise[facKey].push(entry);

      // Room Key
      const roomKey = entry.room.id;
      if (!roomWise[roomKey]) roomWise[roomKey] = [];
      roomWise[roomKey].push(entry);
    });

    return { divisionWise, facultyWise, roomWise };

  }, [timetable, isInitialized]);

  // --- Loading State ---
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
      </div>
    );
  }

  // --- No Data State ---
  if (!generatedTimetable || timetable.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Timetable Scheduled</h2>
        <p className="text-gray-400 mb-6">Please schedule your timetable first</p>
        <a href="/schedule" className="btn-primary">
          Go to Schedule Page
        </a>
      </div>
    );
  }

  // --- Page Functions ---
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
    DAYS.forEach(day => { organized[day] = {}; });

    entries.forEach(entry => {
      if (!organized[entry.day]) organized[entry.day] = {};
      if (!organized[entry.day][entry.startTime]) organized[entry.day][entry.startTime] = [];
      organized[entry.day][entry.startTime].push(entry);
    });
    return organized;
  };

  const exportToExcel = () => {
    if (!selectedEntity) {
      toast.error('Please select a view to export.');
      return;
    }
    
    const wb = XLSX.utils.book_new();
    const organized = organizeEntriesByDayAndTime();
    const wsData: any[][] = [['Time', ...DAYS]];
    
    // Use the global TIME_SLOTS to ensure all rows are present
    TIME_SLOTS.forEach(slot => {
      if (slot.start === '12:00') {
        wsData.push([slot.label, 'LUNCH', '', '', '', '', '']); // Span across
        return;
      }
      
      const row = [slot.label];
      DAYS.forEach(day => {
        const entries = organized[day]?.[slot.start] || [];
        const cellContent = entries.map(e => 
          `${e.subject.code} - ${e.faculty.initials} - ${e.room.roomNumber}${e.batch ? ` (${e.batch.name})` : ''}`
        ).join('\n');
        row.push(cellContent || '-'); // Add '-' for empty slots
      });
      wsData.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, selectedEntity.substring(0, 30)); // Sheet names have 31 char limit

    XLSX.writeFile(wb, `timetable-${viewMode}-${selectedEntity}.xlsx`);
    toast.success('Timetable exported to Excel!');
  };

  const entities = getEntitiesByMode();
  const organized = organizeEntriesByDayAndTime();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">View Timetable</h1>
          <p className="text-gray-400">View your manually scheduled timetables</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
                      const entries = organized[day]?.[slot.start] || [];
                      return (
                        <td key={day} className="px-2 py-2 align-top h-24 border-l border-white/5">
                          <div className="space-y-2">
                            {entries.map((entry, idx) => (
                              <motion.div
                                key={entry.id}
                                className={`p-2 rounded-lg text-sm ${
                                  entry.type === 'PRACTICAL'
                                    ? 'bg-purple-500/20 border border-purple-500/30'
                                    : 'bg-primary-500/20 border border-primary-500/30'
                                }`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
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
                              </motion.div>
                            ))}
                            {entries.length === 0 && (
                              <div className="text-gray-600 text-sm h-full w-full"></div>
                            )}
                          </div>
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
    </div>
  );
}