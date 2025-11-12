'use client';

import { useState } from 'react';
import { useTimetableStore } from '@/lib/store';
import { Faculty } from '@/lib/types';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { Loader2, Upload } from 'lucide-react';

interface ImportFacultyProps {
  onClose: () => void;
}

interface FacultyCSVRow {
  Faculty_Name: string;
  Faculty_Code: string;
  Designation: string;
  MaxWorkload: string;
}

export const ImportFaculty: React.FC<ImportFacultyProps> = ({ onClose }) => {
  // We don't need to call the hook here anymore
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
    toast.loading('Importing faculty...', { id: 'import-faculty' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const newFacultyList: Omit<Faculty, 'id' | 'currentWorkload'>[] = [];

          for (const row of results.data as FacultyCSVRow[]) {
            const facultyName = (row['Faculty_Name'] || '').trim();
            const facultyCode = (row['Faculty_Code'] || '').trim();

            if (facultyName && facultyCode) {
              const newFaculty: Omit<Faculty, 'id' | 'currentWorkload'> = {
                name: facultyName,
                initials: facultyCode,
                designation: (row['Designation'] || 'Assistant Professor').trim(),
                maxWorkload: Number(row['MaxWorkload']) || 20,
                subjects: [],
                preferences: {},
              };
              newFacultyList.push(newFaculty);
            }
          }
          
          if (newFacultyList.length === 0) {
             toast.error('No valid faculty members found to import.', { id: 'import-faculty' });
             setIsImporting(false);
             return;
          }

          const response = await fetch('/api/faculty/batch-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newFacultyList),
          });

          if (!response.ok) {
            throw new Error('Failed to save faculty to database');
          }

          const { importedFaculty } = await response.json();

          // --- *** THE FIX IS HERE *** ---
          // Call useTimetableStore.setState directly, not store.setState
          useTimetableStore.setState((state) => ({
            faculty: [...state.faculty, ...importedFaculty],
          }));
          // ------------------------------

          setIsImporting(false);
          toast.success(`Successfully imported ${importedFaculty.length} faculty members!`, { id: 'import-faculty' });
          onClose();

        } catch (error: any) {
          setIsImporting(false);
          toast.error(`Import failed: ${error.message}`, { id: 'import-faculty' });
        }
      },
      error: (error: any) => {
        setIsImporting(false);
        toast.error(`CSV Parsing Error: ${error.message}`, { id: 'import-faculty' });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* ... (Your JSX remains unchanged) ... */}
      <div>
        <label className="label">Upload Faculty Data CSV</label>
        <label
          htmlFor="file-upload-faculty"
          className="relative block w-full p-6 text-center glass rounded-lg border-2 border-dashed border-white/20 cursor-pointer hover:bg-white/5"
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <span className="text-primary-400 font-semibold">
            {file ? file.name : 'Click to upload a .csv file'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            Columns: 'Faculty_Name', 'Faculty_Code', 'Designation', 'MaxWorkload'
          </p>
          <input
            id="file-upload-faculty"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
      </div>

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