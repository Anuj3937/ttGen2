'use client';

import { useState } from 'react';
import { useTimetableStore } from '@/lib/store';
import { Room } from '@/lib/types';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { Loader2, Upload } from 'lucide-react';

interface ImportRoomsProps {
  onClose: () => void;
}

// This interface matches a row in your Room_Allocation_Structure.csv
interface RoomCSVRow {
  RoomNumber: string;
  Category: string;
  Capacity: string;
  Department?: string; // Department is optional
}

export const ImportRooms: React.FC<ImportRoomsProps> = ({ onClose }) => {
  const store = useTimetableStore();
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    if (!file) {
      toast.error('Please select a file first.');
      return;
    }

    setIsImporting(true);
    toast.loading('Importing rooms...', { id: 'import-room' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const newRooms: Omit<Room, 'id'>[] = [];

          for (const row of results.data as RoomCSVRow[]) {
            const category = (row['Category'] || '').trim().toUpperCase();
            if (category !== 'CLASSROOM' && category !== 'LAB') {
              console.warn('Skipping invalid row, category must be CLASSROOM or LAB:', row);
              continue; // Skip invalid row
            }

            const newRoom: Omit<Room, 'id'> = {
              roomNumber: (row['RoomNumber'] || '').trim(),
              category: category as 'CLASSROOM' | 'LAB',
              capacity: Number(row['Capacity']) || (category === 'LAB' ? 20 : 60), // Default capacity
              department: (row['Department'] || '').trim() || undefined, // Set to undefined if empty
            };

            // Basic validation
            if (newRoom.roomNumber && newRoom.capacity > 0) {
              newRooms.push(newRoom);
            }
          }
          
          if (newRooms.length === 0) {
            toast.error('No valid rooms found to import.', { id: 'import-room' });
            setIsImporting(false);
            return;
          }
          
          // --- NEW: Call the batch-import API ---
          const response = await fetch('/api/rooms/batch-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRooms),
          });

          if (!response.ok) {
            throw new Error('Failed to save rooms to database');
          }

          const { importedRooms } = await response.json();
          
          // --- NEW: Update the local store state ---
          store.setState((state) => ({
            rooms: [...state.rooms, ...importedRooms],
          }));

          setIsImporting(false);
          toast.success(`Successfully imported ${importedRooms.length} rooms!`, { id: 'import-room' });
          onClose();

        } catch (error: any) {
          setIsImporting(false);
          toast.error(`Import failed: ${error.message}`, { id: 'import-room' });
        }
      },
      error: (error: any) => {
        setIsImporting(false);
        toast.error(`CSV Parsing Error: ${error.message}`, { id: 'import-room' });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <label className="label">Upload Rooms Data CSV</label>
        <label
          htmlFor="file-upload-room"
          className="relative block w-full p-6 text-center glass rounded-lg border-2 border-dashed border-white/20 cursor-pointer hover:bg-white/5"
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <span className="text-primary-400 font-semibold">
            {file ? file.name : 'Click to upload a .csv file'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            Columns: 'RoomNumber', 'Category', 'Capacity', 'Department' (optional)
          </D>
          <input
            id="file-upload-room"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <button
          type="button"
          onClick={handleImport}
          className="btn-primary flex-1"
          disabled={!file || isImporting}
        >
          {isImporting ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Process and Import'
          )}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};