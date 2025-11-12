'use client';

import { useState } from 'react';
import { useTimetableStore } from '@/lib/store';
import { Subject, SubjectType } from '@/lib/types';
import toast from 'react-hot-toast';
import Papa from 'papaparse';
import { Loader2, Upload } from 'lucide-react';

type SemesterType = 'ODD' | 'EVEN';

// Helper function to generate a subject code from a name
const generateCode = (name: string): string => {
  if (name.length <= 6) return name.toUpperCase(); // For names like "DLO5"
  
  const parts = name.split(' ');
  if (parts.length > 1) {
    return parts.map(part => part[0]).join('').toUpperCase(); // "Object Oriented Programming" -> "OOP"
  }
  
  return name.substring(0, 5).toUpperCase(); // Default fallback
};

// Helper function to guess the subject type
const inferSubjectType = (row: any): SubjectType => {
  const name = (row['Course Name'] || '').toLowerCase();
  
  if (name.includes('lab') || name.includes('project')) return 'LAB';
  if (name.startsWith('dlo')) return 'DLO';
  if (name.startsWith('ilo')) return 'ILO';
  if (name.startsWith('minor')) return 'MINOR';
  if (Number(row['Practical Hours']) > 0) return 'LAB'; // Fallback for practicals
  
  return 'CORE';
};

interface ImportSubjectsProps {
  onClose: () => void;
}

export const ImportSubjects: React.FC<ImportSubjectsProps> = ({ onClose }) => {
  const { addSubject } = useTimetableStore();
  const [file, setFile] = useState<File | null>(null);
  const [semesterType, setSemesterType] = useState<SemesterType>('ODD');
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
    toast.loading('Importing subjects...', { id: 'import' });

    const oddSemesters = ['I', 'III', 'V', 'VII'];
    const evenSemesters = ['II', 'IV', 'VI', 'VIII'];
    const semestersToImport = semesterType === 'ODD' ? oddSemesters : evenSemesters;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          let importedCount = 0;
          const newSubjects: Subject[] = [];

          for (const row of results.data as any[]) {
            const semester = (row['Semester'] || '').trim();
            if (semestersToImport.includes(semester)) {
              
              const subjectType = inferSubjectType(row);
              
              const newSubject: Subject = {
                id: `subject-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: row['Course Name'],
                code: generateCode(row['Course Name']), // Auto-generate a code
                department: row['Department'],
                year: row['Year'],
                semester: semester,
                theoryHours: Number(row['Theory Hours']) || 0,
                practicalHours: Number(row['Practical Hours']) || 0,
                tutorialHours: Number(row['Tutorial Hours']) || 0,
                type: subjectType,
                electives: (subjectType === 'DLO' || subjectType === 'ILO' || subjectType === 'MINOR') ? [] : undefined,
              };

              // Basic validation
              if (newSubject.name && newSubject.department && newSubject.year && newSubject.semester) {
                newSubjects.push(newSubject);
              }
            }
          }
          
          // Add all new subjects to the store at once
          newSubjects.forEach(subject => addSubject(subject));
          
          setIsImporting(false);
          toast.success(`Successfully imported ${newSubjects.length} subjects!`, { id: 'import' });
          onClose();

        } catch (error: any) {
          setIsImporting(false);
          toast.error(`Import failed: ${error.message}`, { id: 'import' });
        }
      },
      error: (error: any) => {
        setIsImporting(false);
        toast.error(`CSV Parsing Error: ${error.message}`, { id: 'import' });
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Semester Type Selector */}
      <div>
        <label className="label">Select Semester Type to Import</label>
        <div className="flex gap-4">
          <label className="flex-1 p-4 glass rounded-lg cursor-pointer border-2 has-[:checked]:border-primary-500">
            <input
              type="radio"
              name="semesterType"
              value="ODD"
              checked={semesterType === 'ODD'}
              onChange={() => setSemesterType('ODD')}
              className="sr-only"
            />
            <span className="font-semibold text-white">Odd Semesters</span>
            <span className="block text-sm text-gray-400">(e.g., III, V, VII)</span>
          </label>
          <label className="flex-1 p-4 glass rounded-lg cursor-pointer border-2 has-[:checked]:border-primary-500">
            <input
              type="radio"
              name="semesterType"
              value="EVEN"
              checked={semesterType === 'EVEN'}
              onChange={() => setSemesterType('EVEN')}
              className="sr-only"
            />
            <span className="font-semibold text-white">Even Semesters</span>
            <span className="block text-sm text-gray-400">(e.g., IV, VI, VIII)</span>
          </label>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label className="label">Upload Course Structure CSV</label>
        <label
          htmlFor="file-upload"
          className="relative block w-full p-6 text-center glass rounded-lg border-2 border-dashed border-white/20 cursor-pointer hover:bg-white/5"
        >
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <span className="text-primary-400 font-semibold">
            {file ? file.name : 'Click to upload a .csv file'}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            Must contain columns: 'Course Name', 'Department', 'Year', 'Semester', 'Theory Hours', 'Practical Hours'
          </p>
          <input
            id="file-upload"
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