'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimetableStore } from '@/lib/store';
import { Subject, Faculty, Division, SubjectAllocation, Batch } from '@/lib/types';
import { Loader2, User, BookOpen, Users, Check, X, ArrowRight, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Reusable Components ---

// Column Component
const Column = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <motion.div 
    className="flex-1 min-w-[300px] card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
  >
    <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
    <div className="space-y-3">{children}</div>
  </motion.div>
);

// ListItem Component
const ListItem = ({ 
  title, 
  subtitle, 
  onClick, 
  isSelected, 
  badge,
  badgeColor = 'bg-primary-500/20 text-primary-400'
}: { 
  title: string, 
  subtitle: string, 
  onClick: () => void, 
  isSelected: boolean,
  badge?: string,
  badgeColor?: string
}) => (
  <motion.div
    className={`p-4 rounded-lg cursor-pointer border-2 ${
      isSelected 
        ? 'bg-primary-500/20 border-primary-500' 
        : 'bg-white/5 border-transparent hover:border-white/20'
    }`}
    onClick={onClick}
    whileTap={{ scale: 0.98 }}
  >
    <div className="flex justify-between items-center">
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
      {badge && (
        <span className={`px-2 py-1 text-xs font-medium rounded ${badgeColor}`}>
          {badge}
        </span>
      )}
    </div>
  </motion.div>
);

// --- Main Page Component ---
export default function PlotPage() {
  const store = useTimetableStore();
  const { isInitialized, fetchInitialData, subjects, divisions, faculty, allocations } = store;

  // --- Local UI State ---
  const [selectedDeptYear, setSelectedDeptYear] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  const [assignmentType, setAssignmentType] = useState<'THEORY' | 'PRACTICAL'>('THEORY');
  const [selectedDivs, setSelectedDivs] = useState<Set<string>>(new Set());
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());

  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Fetch Data ---
  useEffect(() => {
    if (!isInitialized) {
      fetchInitialData();
    }
  }, [isInitialized, fetchInitialData]);

  // --- Memoized Selectors (for performance) ---

  // Get unique "Department-Year" pairs (e.g., "CE-SE")
  const departmentYears = useMemo(() => {
    const pairs = new Set(divisions.map(d => `${d.department}-${d.year}`));
    return Array.from(pairs);
  }, [divisions]);

  // Get subjects for the selected department-year
  const subjectsInDept = useMemo(() => {
    if (!selectedDeptYear) return [];
    const [dept, year] = selectedDeptYear.split('-');
    return subjects.filter(s => s.department === dept && s.year === year);
  }, [selectedDeptYear, subjects]);

  // Get divisions and batches for the selected subject
  const divisionsForSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return divisions.filter(d => 
      d.department === selectedSubject.department && d.year === selectedSubject.year
    );
  }, [selectedSubject, divisions]);

  // Get eligible faculty for the selected subject
  const eligibleFaculty = useMemo(() => {
    if (!selectedSubject) return [];
    return faculty.filter(f => 
      f.subjects.includes(selectedSubject.id) &&
      f.currentWorkload < f.maxWorkload
    );
  }, [selectedSubject, faculty]);

  // --- Load Calculation Logic ---
  const { totalLoad, assignedLoad } = useMemo(() => {
    if (!selectedSubject) return { totalLoad: { theory: 0, practical: 0 }, assignedLoad: { theory: 0, practical: 0 }};

    const relevantDivisions = divisions.filter(d => 
      d.department === selectedSubject.department && d.year === selectedSubject.year
    );
    const numDivisions = relevantDivisions.length;
    const numBatches = relevantDivisions.reduce((sum, div) => sum + div.batches.length, 0);

    const totalLoad = {
      theory: selectedSubject.theoryHours * numDivisions,
      practical: selectedSubject.practicalHours * numBatches
    };

    const assignedAllocations = allocations.filter(a => a.subjectId === selectedSubject.id);
    const assignedLoad = {
      theory: assignedAllocations
        .filter(a => a.type === 'THEORY')
        .reduce((sum, a) => sum + a.hours, 0),
      practical: assignedAllocations
        .filter(a => a.type === 'PRACTICAL')
        .reduce((sum, a) => sum + a.hours, 0),
    };

    return { totalLoad, assignedLoad };
  }, [selectedSubject, divisions, allocations]);

  // --- UI Event Handlers ---

  const handleSelectDeptYear = (key: string) => {
    setSelectedDeptYear(key);
    setSelectedSubject(null);
    setSelectedFaculty(null);
  };

  const handleSelectSubject = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedFaculty(null);
    setAssignmentType(subject.theoryHours > 0 ? 'THEORY' : 'PRACTICAL');
    setSelectedDivs(new Set());
    setSelectedBatches(new Set());
  };

  const handleSelectFaculty = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
  };

  const toggleDivision = (divId: string) => {
    const newSet = new Set(selectedDivs);
    if (newSet.has(divId)) newSet.delete(divId);
    else newSet.add(divId);
    setSelectedDivs(newSet);
  };

  const toggleBatch = (batchId: string) => {
    const newSet = new Set(selectedBatches);
    if (newSet.has(batchId)) newSet.delete(batchId);
    else newSet.add(batchId);
    setSelectedBatches(newSet);
  };

  const getUnassignedBatches = (division: Division) => {
    return division.batches.filter(batch => 
      !allocations.some(a => 
        a.subjectId === selectedSubject?.id && 
        a.type === 'PRACTICAL' && 
        a.batchId === batch.id
      )
    );
  };

  // --- CORE LOGIC: Handle Mapping ---
  const handleMapFaculty = async () => {
    if (!selectedSubject || !selectedFaculty) return;
    setIsSubmitting(true);

    const allocationsToCreate: Omit<SubjectAllocation, 'id'>[] = [];
    let totalHoursToAssign = 0;

    if (assignmentType === 'THEORY') {
      totalHoursToAssign = selectedDivs.size * selectedSubject.theoryHours;
      selectedDivs.forEach(divId => {
        allocationsToCreate.push({
          subjectId: selectedSubject.id,
          facultyId: selectedFaculty.id,
          divisionId: divId,
          type: 'THEORY',
          hours: selectedSubject.theoryHours,
        });
      });
    } else { // PRACTICAL
      totalHoursToAssign = selectedBatches.size * selectedSubject.practicalHours;
      selectedBatches.forEach(batchId => {
        const batch = divisionsForSubject.flatMap(d => d.batches).find(b => b.id === batchId);
        const division = divisionsForSubject.find(d => d.batches.includes(batch!));
        if (batch && division) {
          allocationsToCreate.push({
            subjectId: selectedSubject.id,
            facultyId: selectedFaculty.id,
            divisionId: division.id,
            batchId: batch.id,
            type: 'PRACTICAL',
            hours: selectedSubject.practicalHours,
          });
        }
      });
    }

    // Workload check
    const remainingWorkload = selectedFaculty.maxWorkload - selectedFaculty.currentWorkload;
    if (totalHoursToAssign > remainingWorkload) {
      toast.error(`Cannot assign ${totalHoursToAssign}h. Faculty only has ${remainingWorkload}h remaining.`);
      setIsSubmitting(false);
      return;
    }

    // Create all allocations
    let allSucceeded = true;
    for (const alloc of allocationsToCreate) {
      const success = await store.createAllocation(alloc);
      if (!success) allSucceeded = false;
    }

    if (allSucceeded) {
      toast.success(`Mapped ${totalHoursToAssign}h to ${selectedFaculty.name}`);
      setSelectedDivs(new Set());
      setSelectedBatches(new Set());
    }
    
    setIsSubmitting(false);
  };

  const handleUnmap = async (allocation: SubjectAllocation) => {
    if (confirm(`Remove ${allocations.find(a => a.id === allocation.id) ? (subjects.find(s => s.id === allocation.subjectId)?.code) : ''} from ${faculty.find(f => f.id === allocation.facultyId)?.name}?`)) {
      await store.deleteAllocation(allocation);
    }
  };

  // --- Render ---
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
        <p className="text-xl text-gray-400 ml-4">Loading all data from Firestore...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* --- COLUMN 1: Department & Subjects --- */}
      <Column title="1. Select Subject">
        <div className="space-y-2">
          {departmentYears.map(key => {
            const [dept, year] = key.split('-');
            return (
              <ListItem
                key={key}
                title={`${dept} - ${year}`}
                subtitle="Select Department & Year"
                onClick={() => handleSelectDeptYear(key)}
                isSelected={selectedDeptYear === key}
              />
            );
          })}
        </div>

        {selectedDeptYear && (
          <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
            {subjectsInDept.length === 0 && (
              <p className="text-gray-500">No subjects found for {selectedDeptYear}.</p>
            )}
            {subjectsInDept.map(subject => {
              const { totalLoad, assignedLoad } = (selectedSubject?.id === subject.id) 
                ? { totalLoad, assignedLoad } 
                : { 
                    totalLoad: { theory: 0, practical: 0 }, 
                    assignedLoad: { theory: 0, practical: 0 } 
                  };
              
              const isTheoryDone = assignedLoad.theory >= totalLoad.theory;
              const isPracticalDone = assignedLoad.practical >= totalLoad.practical;
              
              let badge = '';
              let badgeColor = '';
              if (isTheoryDone && isPracticalDone) {
                badge = 'Done';
                badgeColor = 'bg-green-500/20 text-green-400';
              } else if (assignedLoad.theory > 0 || assignedLoad.practical > 0) {
                badge = 'Partial';
                badgeColor = 'bg-yellow-500/20 text-yellow-400';
              }

              return (
                <ListItem
                  key={subject.id}
                  title={subject.name}
                  subtitle={subject.code}
                  onClick={() => handleSelectSubject(subject)}
                  isSelected={selectedSubject?.id === subject.id}
                  badge={badge}
                  badgeColor={badgeColor}
                />
              );
            })}
          </div>
        )}
      </Column>

      {/* --- COLUMN 2: Eligible Faculty --- */}
      <AnimatePresence>
        {selectedSubject && (
          <Column title="2. Select Faculty">
            <div className="card p-4">
              <h4 className="font-semibold text-white mb-3">{selectedSubject.name} Load</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Theory Load:</span>
                  <span className={`font-medium ${assignedLoad.theory >= totalLoad.theory ? 'text-green-400' : 'text-white'}`}>
                    {assignedLoad.theory} / {totalLoad.theory}h
                  </span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-gray-400">Practical Load:</span>
                  <span className={`font-medium ${assignedLoad.practical >= totalLoad.practical ? 'text-green-400' : 'text-white'}`}>
                    {assignedLoad.practical} / {totalLoad.practical}h
                  </span>
                </div>
              </div>
            </div>

            {eligibleFaculty.length === 0 && (
              <div className="p-4 rounded-lg bg-yellow-500/10 text-yellow-300 text-sm flex items-center gap-3">
                <AlertTriangle className="w-4 h-4" />
                No eligible faculty. Check if faculty are assigned this subject and have free hours.
              </div>
            )}
            
            {eligibleFaculty.map(faculty => (
              <ListItem
                key={faculty.id}
                title={faculty.name}
                subtitle={`${faculty.designation} (${faculty.initials})`}
                onClick={() => handleSelectFaculty(faculty)}
                isSelected={selectedFaculty?.id === faculty.id}
                badge={`${faculty.maxWorkload - faculty.currentWorkload}h Left`}
              />
            ))}
          </Column>
        )}
      </AnimatePresence>

      {/* --- COLUMN 3: Assignment Panel --- */}
      <AnimatePresence>
        {selectedSubject && selectedFaculty && (
          <Column title="3. Map Assignment">
            <div className="card p-4 sticky top-20">
              <div className="flex items-center gap-3 mb-4">
                <BookOpen className="w-5 h-5 text-primary-400" />
                <span className="text-white font-medium">{selectedSubject.name}</span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <User className="w-5 h-5 text-primary-400" />
                <span className="text-white font-medium">{selectedFaculty.name}</span>
                <span className="text-sm text-gray-400">({selectedFaculty.maxWorkload - selectedFaculty.currentWorkload}h remaining)</span>
              </div>

              {/* Toggle Theory/Practical */}
              <div className="flex rounded-lg bg-dark-800 p-1 mb-4">
                <button 
                  className={`flex-1 p-2 rounded ${assignmentType === 'THEORY' ? 'bg-primary-500 text-white' : 'text-gray-400'}`}
                  onClick={() => setAssignmentType('THEORY')}
                  disabled={selectedSubject.theoryHours === 0}
                >
                  Theory ({selectedSubject.theoryHours}h)
                </button>
                <button 
                  className={`flex-1 p-2 rounded ${assignmentType === 'PRACTICAL' ? 'bg-primary-500 text-white' : 'text-gray-400'}`}
                  onClick={() => setAssignmentType('PRACTICAL')}
                  disabled={selectedSubject.practicalHours === 0}
                >
                  Practical ({selectedSubject.practicalHours}h)
                </button>
              </div>

              {/* Checkbox List */}
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {assignmentType === 'THEORY' ? (
                  // --- THEORY ASSIGNMENT ---
                  divisionsForSubject.map(div => {
                    const isAllocated = allocations.some(a => 
                      a.subjectId === selectedSubject.id && 
                      a.type === 'THEORY' && 
                      a.divisionId === div.id
                    );
                    return (
                      <div key={div.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                        <label 
                          htmlFor={`div-${div.id}`} 
                          className={`font-medium ${isAllocated ? 'text-gray-500 line-through' : 'text-white cursor-pointer'}`}
                        >
                          Division {div.name}
                        </label>
                        {isAllocated ? (
                          <span className="text-xs text-green-400 font-medium">
                            Mapped ({faculty.find(f => f.id === allocations.find(a => a.divisionId === div.id && a.subjectId === selectedSubject.id)?.facultyId)?.initials})
                          </span>
                        ) : (
                          <input 
                            id={`div-${div.id}`}
                            type="checkbox"
                            checked={selectedDivs.has(div.id)}
                            onChange={() => toggleDivision(div.id)}
                            className="w-5 h-5 text-primary-500 bg-dark-900 border-gray-600 rounded focus:ring-primary-500"
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  // --- PRACTICAL ASSIGNMENT ---
                  divisionsForSubject.map(div => (
                    <div key={div.id}>
                      <h4 className="text-sm font-semibold text-primary-400 mb-2">Division {div.name}</h4>
                      <div className="space-y-2 pl-4">
                        {getUnassignedBatches(div).length === 0 && (
                          <p className="text-xs text-gray-500">All batches mapped.</p>
                        )}
                        {getUnassignedBatches(div).map(batch => (
                          <div key={batch.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                            <label htmlFor={`batch-${batch.id}`} className="font-medium text-white cursor-pointer">
                              Batch {batch.name}
                            </label>
                            <input 
                              id={`batch-${batch.id}`}
                              type="checkbox"
                              checked={selectedBatches.has(batch.id)}
                              onChange={() => toggleBatch(batch.id)}
                              className="w-5 h-5 text-primary-500 bg-dark-900 border-gray-600 rounded focus:ring-primary-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button 
                className="btn-primary w-full mt-6"
                onClick={handleMapFaculty}
                disabled={isSubmitting || (assignmentType === 'THEORY' ? selectedDivs.size === 0 : selectedBatches.size === 0)}
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Map Assignment'}
              </button>
            </div>

            {/* --- Display Current Allocations --- */}
            <div className="pt-6 mt-6 border-t border-white/10 space-y-2">
              <h4 className="text-lg text-white font-semibold mb-2">Current Mappings</h4>
              {allocations
                .filter(a => a.subjectId === selectedSubject.id && a.facultyId === selectedFaculty.id)
                .map(alloc => {
                  const divName = divisions.find(d => d.id === alloc.divisionId)?.name;
                  const batchName = divisions.flatMap(d => d.batches).find(b => b.id === alloc.batchId)?.name;
                  return (
                    <div key={alloc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-white font-medium">
                          {alloc.type === 'THEORY' ? `Div ${divName} (Theory)` : `Batch ${batchName} (Lab)`}
                        </span>
                        <span className="text-gray-400 text-sm"> — {alloc.hours}h</span>
                      </div>
                      <button onClick={() => handleUnmap(alloc)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
            </div>

          </Column>
        )}
      </AnimatePresence>
    </div>
  );
}