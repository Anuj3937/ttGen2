'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, AlertCircle, CheckCircle, Loader2, Download } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import TimetableGenerator from '@/lib/timetableGenerator';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import * as XLSX from 'xlsx';

export default function GeneratePage() {
  const router = useRouter();
  const { subjects, divisions, faculty, rooms, setGeneratedTimetable } = useTimetableStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const validateData = (): boolean => {
    const errors: string[] = [];

    if (subjects.length === 0) {
      errors.push('No subjects added. Please add at least one subject.');
    }

    if (divisions.length === 0) {
      errors.push('No divisions added. Please add at least one division.');
    }

    if (faculty.length === 0) {
      errors.push('No faculty members added. Please add at least one faculty member.');
    }

    if (rooms.length === 0) {
      errors.push('No rooms added. Please add at least one room.');
    }

    // Check if faculty can teach subjects
    const facultySubjects = new Set(faculty.flatMap(f => f.subjects));
    const subjectIds = new Set(subjects.map(s => s.id));
    const uncoveredSubjects = Array.from(subjectIds).filter(id => !facultySubjects.has(id));
    
    if (uncoveredSubjects.length > 0) {
      const uncoveredNames = uncoveredSubjects
        .map(id => subjects.find(s => s.id === id)?.name)
        .join(', ');
      errors.push(`No faculty assigned to teach: ${uncoveredNames}`);
    }

    // Check room capacity
    const hasClassrooms = rooms.some(r => r.category === 'CLASSROOM');
    const hasLabs = rooms.some(r => r.category === 'LAB');
    
    if (!hasClassrooms) {
      errors.push('No classrooms available. Please add at least one classroom.');
    }
    
    if (!hasLabs && subjects.some(s => s.practicalHours > 0)) {
      errors.push('Practical subjects exist but no labs available.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleGenerate = async () => {
    if (!validateData()) {
      toast.error('Please fix validation errors before generating');
      return;
    }

    setIsGenerating(true);
    toast.loading('Generating timetable...', { id: 'generate' });

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const generator = new TimetableGenerator(subjects, divisions, faculty, rooms);
      const timetable = generator.generate();

      setGeneratedTimetable(timetable);
      
      toast.success('Timetable generated successfully!', { id: 'generate' });
      
      // Navigate to view page after short delay
      setTimeout(() => {
        router.push('/view');
      }, 1000);
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate timetable', { id: 'generate' });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportSummaryToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Timetable Generation Summary'],
      [''],
      ['Category', 'Count'],
      ['Total Subjects', subjects.length],
      ['Total Divisions', divisions.length],
      ['Total Batches', divisions.reduce((sum, d) => sum + d.batches.length, 0)],
      ['Total Faculty', faculty.length],
      ['Total Rooms', rooms.length],
      ['Classrooms', rooms.filter(r => r.category === 'CLASSROOM').length],
      ['Laboratories', rooms.filter(r => r.category === 'LAB').length],
    ];

    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');

    // Subjects sheet
    const subjectsData = [
      ['Subject Name', 'Code', 'Department', 'Year', 'Theory Hours', 'Practical Hours', 'Type'],
      ...subjects.map(s => [s.name, s.code, s.department, s.year, s.theoryHours, s.practicalHours, s.type])
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(subjectsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Subjects');

    // Faculty sheet
    const facultyData = [
      ['Name', 'Initials', 'Designation', 'Max Workload', 'Subjects Count'],
      ...faculty.map(f => [f.name, f.initials, f.designation, f.maxWorkload, f.subjects.length])
    ];
    const ws3 = XLSX.utils.aoa_to_sheet(facultyData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Faculty');

    XLSX.writeFile(wb, 'timetable-summary.xlsx');
    toast.success('Summary exported to Excel!');
  };

  const totalTheoryHours = subjects.reduce((sum, s) => sum + s.theoryHours, 0);
  const totalPracticalHours = subjects.reduce((sum, s) => sum + s.practicalHours, 0);
  const totalFacultyCapacity = faculty.reduce((sum, f) => sum + f.maxWorkload, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Generate Timetable</h1>
          <p className="text-gray-400">Review data and generate optimized timetables</p>
        </div>
        <motion.button
          className="btn-secondary flex items-center space-x-2"
          onClick={exportSummaryToExcel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Download className="w-5 h-5" />
          <span>Export Summary</span>
        </motion.button>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <motion.div
          className="card border-red-500/50 bg-red-500/10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400 mb-2">Validation Errors</h3>
              <ul className="space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-red-300 text-sm">• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Data Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Subjects</div>
          <div className="text-3xl font-bold text-white mb-2">{subjects.length}</div>
          <div className="text-xs text-gray-400">
            {totalTheoryHours}h theory • {totalPracticalHours}h practical
          </div>
        </div>

        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Divisions</div>
          <div className="text-3xl font-bold text-white mb-2">{divisions.length}</div>
          <div className="text-xs text-gray-400">
            {divisions.reduce((sum, d) => sum + d.batches.length, 0)} batches total
          </div>
        </div>

        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Faculty</div>
          <div className="text-3xl font-bold text-white mb-2">{faculty.length}</div>
          <div className="text-xs text-gray-400">
            {totalFacultyCapacity}h total capacity
          </div>
        </div>

        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Rooms</div>
          <div className="text-3xl font-bold text-white mb-2">{rooms.length}</div>
          <div className="text-xs text-gray-400">
            {rooms.filter(r => r.category === 'CLASSROOM').length} classrooms •{' '}
            {rooms.filter(r => r.category === 'LAB').length} labs
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects Breakdown */}
        <div className="card">
          <h3 className="text-xl font-semibold text-white mb-4">Subjects Breakdown</h3>
          <div className="space-y-3">
            {['CORE', 'LAB', 'DLO', 'ILO', 'MINOR'].map(type => {
              const count = subjects.filter(s => s.type === type).length;
              if (count === 0) return null;
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-gray-400">{type}</span>
                  <span className="text-white font-semibold">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department Distribution */}
        <div className="card">
          <h3 className="text-xl font-semibold text-white mb-4">Department Distribution</h3>
          <div className="space-y-3">
            {Array.from(new Set(divisions.map(d => d.department))).map(dept => {
              const deptDivisions = divisions.filter(d => d.department === dept);
              return (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-gray-400">{dept}</span>
                  <span className="text-white font-semibold">
                    {deptDivisions.length} divisions
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Generation Button */}
      <div className="card text-center py-12">
        {validationErrors.length === 0 ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Ready to Generate!</h3>
            <p className="text-gray-400 mb-6">
              All data is validated and ready for timetable generation
            </p>
          </>
        ) : (
          <>
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-white mb-2">Fix Errors First</h3>
            <p className="text-gray-400 mb-6">
              Please resolve the validation errors above before generating
            </p>
          </>
        )}

        <motion.button
          className={`btn-primary mx-auto flex items-center space-x-2 ${
            validationErrors.length > 0 || isGenerating ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={handleGenerate}
          disabled={validationErrors.length > 0 || isGenerating}
          whileHover={validationErrors.length === 0 && !isGenerating ? { scale: 1.05 } : {}}
          whileTap={validationErrors.length === 0 && !isGenerating ? { scale: 0.95 } : {}}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Timetable</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
