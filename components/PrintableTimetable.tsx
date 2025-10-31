'use client';

import React, { forwardRef } from 'react';
import { TimetableEntry, DAYS } from '@/lib/types';
import { formatTime } from '@/lib/utils';

interface PrintableTimetableProps {
  entries: TimetableEntry[];
  title: string;
  subtitle?: string;
}

const PrintableTimetable = forwardRef<HTMLDivElement, PrintableTimetableProps>(
  ({ entries, title, subtitle }, ref) => {
    const organizeEntries = () => {
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

    const organized = organizeEntries();
    const timeSlots = Array.from(
      new Set(entries.map(e => e.startTime))
    ).sort();

    return (
      <div ref={ref} className="p-8 bg-white text-black">
        {/* Header */}
        <div className="mb-6 text-center border-b-2 border-gray-800 pb-4">
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          {subtitle && (
            <p className="text-lg text-gray-600">{subtitle}</p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Timetable */}
        <table className="w-full border-collapse border-2 border-gray-800">
          <thead>
            <tr className="bg-gray-200">
              <th className="border-2 border-gray-800 px-3 py-2 text-left font-bold">
                Time
              </th>
              {DAYS.map(day => (
                <th key={day} className="border-2 border-gray-800 px-3 py-2 text-center font-bold">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time}>
                <td className="border-2 border-gray-800 px-3 py-2 font-semibold whitespace-nowrap">
                  {formatTime(time)}
                </td>
                {DAYS.map(day => {
                  const dayEntries = organized[day]?.[time] || [];
                  return (
                    <td key={day} className="border-2 border-gray-800 px-3 py-2 align-top">
                      {dayEntries.map((entry, idx) => (
                        <div
                          key={idx}
                          className="mb-2 last:mb-0 p-2 border border-gray-300 rounded"
                        >
                          <div className="font-semibold text-sm">
                            {entry.subject.code}
                          </div>
                          <div className="text-xs text-gray-600">
                            {entry.room.roomNumber} • {entry.faculty.initials}
                          </div>
                          {entry.batch && (
                            <div className="text-xs text-gray-500 mt-1">
                              {entry.batch.name}
                            </div>
                          )}
                        </div>
                      ))}
                      {dayEntries.length === 0 && (
                        <div className="text-center text-gray-400">-</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Note: This is a computer-generated timetable.</p>
        </div>
      </div>
    );
  }
);

PrintableTimetable.displayName = 'PrintableTimetable';

export default PrintableTimetable;
