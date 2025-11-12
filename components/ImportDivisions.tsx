'use client';

import { useState } from 'react';
import { useTimetableStore } from '@/lib/store';
import { Division, Batch } from '@/lib/types';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { Loader2, Upload } from 'lucide-react';

interface ImportDivisionsProps {
  onClose: () => void;
}

// This interface matches a row in your Department_Batch_Structure.csv
interface DivisionCSVRow {
  Department: string;
  Year: string;
  DivisionName: string;
  BatchCount: string; // This is actually the batch number (1, 2, 3)
  StudentsPerBatch: string;
}

export const ImportDivisions: React.FC<ImportDivisionsProps> = ({ onClose }) => {
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
    toast.loading('Importing divisions...', { id: 'import-div' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          // Use a Map to group batches into divisions
          const divisionMap = new Map<string, Omit<Division, 'id'>>();
          
          for (const row of results.data as DivisionCSVRow[]) {
            const dept = (row['Department'] || '').trim().toUpperCase();
            const year = (row['Year'] || '').trim().toUpperCase();
            const divName = (row['DivisionName'] || '').trim().toUpperCase();
            const batchNumber = (row['BatchCount'] || '').trim(); // This is '1', '2', '3'
            const studentCount = Number(row['StudentsPerBatch']) || 0;

            if (!dept || !year || !divName || !batchNumber || studentCount === 0) {
              console.warn('Skipping invalid row:', row);
              continue;
            }

            const divisionKey = `${dept}-${year}-${divName}`;

            // Create the new batch
            const newBatch: Batch = {
              id: `batch-${divName}${batchNumber}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
              name: `${divName}${batchNumber}`, // e.g., A1, A2, A3
              studentCount: studentCount,
              electiveChoices: {},
              minorStudents: [],
            };

            // Check if we already started this division
            if (divisionMap.has(divisionKey)) {
              // Add batch to existing division
              divisionMap.get(divisionKey)!.batches.push(newBatch);
            } else {
              // Create a new division
              const newDivision: Omit<Division, 'id'> = {
                department: dept,
                year: year,
                name: divName,
                batches: [newBatch], // Add the first batch
              };
              divisionMap.set(divisionKey, newDivision);
            }
          }
          
          const newDivisions = Array.from(divisionMap.values());

          if (newDivisions.length === 0) {
            toast.error('No valid divisions found to import.', { id: 'import-div' });
            setIsImporting(false);
            return;
          }

          // --- NEW: Call the batch-import API ---
          const response = await fetch('/api/divisions/batch-import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDivisions),
          });

          if (!response.ok) {
            throw new Error('Failed to save divisions to database');
          }

          const { importedDivisions } = await response.json();
          
          // --- NEW: Update the local store state ---
          store.setState((state) => ({
            divisions: [...state.divisions, ...importedDivisions],
          }));
          
          setIsImporting(false);
          toast.success(`Successfully imported ${importedDivisions.length} divisions!`, { id: 'import-div' });
          onClose();

        } catch (error: any) {
          setIsImporting(false);
          toast.error(`Import failed: ${error.message}`, { id: 'import-div' });
        }
      },
      error: (error: any) => {
        setIsImporting(false);
        toast.error(`CSV Parsing Error: ${error.message}`, { id: 'import-div' });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* File Upload */}
      <div>
        <label className="label">Upload Divisions Structure CSV</label>
        <label
          htmlFor="file-upload-div"
          className="relative block w-full p-6 text-center glass rounded-lg border-2 border-dashed border-white/20 cursor-pointer hover:bg-white/5"
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <span className="text-primary-400 font-semibold">
            {file ? file.name : 'Click to upload a .csv file'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            Columns: 'Department', 'Year', 'DivisionName', 'BatchCount' (1, 2, 3...), 'StudentsPerBatch'
          </p>
          <input
            id="file-upload-div"
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