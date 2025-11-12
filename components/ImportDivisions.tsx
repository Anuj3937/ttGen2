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

export const ImportDivisions: React.FC<ImportDivisionsProps> = ({ onClose }) => {
  const { addDivision } = useTimetableStore();
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
      complete: (results) => {
        try {
          const newDivisions: Division[] = [];

          for (const row of results.data as any[]) {
            const divName = (row['DivisionName'] || '').trim().toUpperCase();
            const batchCount = Number(row['BatchCount']) || 0;
            const studentsPerBatch = Number(row['StudentsPerBatch']) || 0;

            // Create batches based on count
            const batches: Batch[] = [];
            for (let i = 1; i <= batchCount; i++) {
              batches.push({
                id: `batch-${divName}${i}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
                name: `${divName}${i}`, // e.g., A1, A2, A3
                studentCount: studentsPerBatch,
                electiveChoices: {},
                minorStudents: [],
              });
            }

            const newDivision: Division = {
              id: `division-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              department: (row['Department'] || '').trim().toUpperCase(),
              year: (row['Year'] || '').trim().toUpperCase(),
              name: divName,
              batches: batches,
            };

            // Basic validation
            if (newDivision.department && newDivision.year && newDivision.name && batches.length > 0) {
              newDivisions.push(newDivision);
            }
          }
          
          // Add all new divisions to the store
          newDivisions.forEach(div => addDivision(div));
          
          setIsImporting(false);
          toast.success(`Successfully imported ${newDivisions.length} divisions!`, { id: 'import-div' });
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
            Columns: 'Department', 'Year', 'DivisionName', 'BatchCount', 'StudentsPerBatch'
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