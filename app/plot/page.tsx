'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTimetableStore } from '@/lib/store';
import { Subject, Faculty, Division, SubjectAllocation, Batch } from '@/lib/types';
import { Loader2, User, BookOpen, Users, Check, X, ArrowRight, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

// --- Reusable Components (Unchanged) ---

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
  const { 
    isInitialized, 
    fetchInitialData, 
    subjects, 
    divisions, 
    faculty, 
    allocations,
    createAllocation,
    deleteAllocation
  } = store;

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

  // --- Memoized Selectors (Unchanged) ---

  const departmentYears = useMemo(() => {
    const pairs = new Set(divisions.map(d => `${d.department}-${d.year}`));
    return Array.from(pairs).sort();
  }, [divisions]);

  const subjectsInDept = useMemo(() => {
    if (!selectedDeptYear) return [];
    const [dept, year] = selectedDeptYear.split('-');
    return subjects.filter(s => s.department === dept && s.year === year);
  }, [selectedDeptYear, subjects]);

  const divisionsForSubject = useMemo(() => {
    if (!selectedSubject) return [];
    return divisions.filter(d => 
      d.department === selectedSubject.department && d.year === selectedSubject.year
    );
  }, [selectedSubject, divisions]);

  const eligibleFaculty = useMemo(() => {
    if (!selectedSubject) return [];
    return faculty.filter(f => 
      f.subjects.includes(selectedSubject.id) &&
      f.currentWorkload < f.maxWorkload
    ).sort((a,b) => (b.maxWorkload - b.currentWorkload) - (a.maxWorkload - a.currentWorkload)); // Show faculty with most hours first
  }, [selectedSubject, faculty]);

  
  // --- *** REFACTORED LOAD CALCULATION (THE FIX) *** ---

  // 1. Create a reusable helper function
  const getSubjectLoad = (subject: Subject | null) => {
    if (!subject) {
      return { totalLoad: { theory: 0, practical: 0 }, assignedLoad: { theory: 0, practical: 0 }};
    }

    const relevantDivisions = divisions.filter(d => 
      d.department === subject.department && d.year === subject.year
    );
    const numDivisions = relevantDivisions.length;
    const numBatches = relevantDivisions.reduce((sum, div) => sum + div.batches.length, 0);

    const totalLoad = {
      theory: subject.theoryHours * numDivisions,
      practical: subject.practicalHours * numBatches
    };

    const assignedAllocations = allocations.filter(a => a.subjectId === subject.id);
    const assignedLoad = {
      theory: assignedAllocations
        .filter(a => a.type === 'THEORY')
        .reduce((sum, a) => sum + a.hours, 0),
      practical: assignedAllocations
        .filter(a => a.type === 'PRACTICAL')
        .reduce((sum, a) => sum + a.hours, 0),
    };

    return { totalLoad, assignedLoad };
  };

  // 2. Use the helper function for the "Selected Subject" load (Column 2)
  const { totalLoad, assignedLoad } = useMemo(() => {
    return getSubjectLoad(selectedSubject);
  }, [selectedSubject, divisions, allocations]);

  // --- (End of Fix) ---


  // --- UI Event Handlers (Unchanged) ---

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

  // --- CORE LOGIC: Handle Mapping (Unchanged) ---
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

    const remainingWorkload = selectedFaculty.maxWorkload - selectedFaculty.currentWorkload;
    if (totalHoursToAssign > remainingWorkload) {
      toast.error(`Cannot assign ${totalHoursToAssign}h. Faculty only has ${remainingWorkload}h remaining.`);
      setIsSubmitting(false);
      return;
    }

    let allSucceeded = true;
    for (const alloc of allocationsToCreate) {
      const success = await createAllocation(alloc);
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
    const allocSubject = subjects.find(s => s.id === allocation.subjectId);
    const allocFaculty = faculty.find(f => f.id === allocation.facultyId);
    
    if (confirm(`Remove ${allocSubject?.code} from ${allocFaculty?.name}?`)) {
      await deleteAllocation(allocation);
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
          <div className="pt-6 mt-6 border-t border-white/10 space-y-2 max-h-[60vh] overflow-y-auto">
            {subjectsInDept.length === 0 && (
              <p className="text-gray-500">No subjects found for {selectedDeptYear}.</p>
            )}
            
            {/* --- *** THIS IS THE FIXED MAP LOOP *** --- */}
            {subjectsInDept.map(subject => {
              // 1. Calculate load for *this* subject in the loop
              const { totalLoad: subjTotal, assignedLoad: subjAssigned } = getSubjectLoad(subject);
              
              // 2. Determine badge
              const isTheoryDone = subjTotal.theory === 0 || subjAssigned.theory >= subjTotal.theory;
              const isPracticalDone = subjTotal.practical === 0 || subjAssigned.practical >= subjTotal.practical;
              
              let badge = '';
              let badgeColor = '';
              if (isTheoryDone && isPracticalDone) {
                badge = 'Done';
                badgeColor = 'bg-green-500/20 text-green-400';
              } else if (subjAssigned.theory > 0 || subjAssigned.practical > 0) {
                badge = 'Partial';
                badgeColor = 'bg-yellow-500/20 text-yellow-400';
              }

              // 3. Render the item
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
            {/* --- (End of Fix) --- */}

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
                  <span className={`font-medium ${totalLoad.theory > 0 && assignedLoad.theory >= totalLoad.theory ? 'text-green-400' : 'text-white'}`}>
                    {assignedLoad.theory} / {totalLoad.theory}h
                  </span>
                </div>
                 <div className="flex justify-between">
                  <span className="text-gray-400">Practical Load:</span>
                  <span className={`font-medium ${totalLoad.practical > 0 && assignedLoad.practical >= totalLoad.practical ? 'text-green-400' : 'text-white'}`}>
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
            
            <div className="max-h-[60vh] overflow-y-auto space-y-2">
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
            </div>
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
                  className={`flex-1 p-2 rounded ${assignmentType === 'THEORY' ? 'bg-primary-500 text-white' : 'text-gray-400'} disabled:opacity-50`}
                  onClick={() => setAssignmentType('THEORY')}
                  disabled={selectedSubject.theoryHours === 0}
                >
                  Theory ({selectedSubject.theoryHours}h)
                </button>
                <button 
                  className={`flex-1 p-2 rounded ${assignmentType === 'PRACTICAL' ? 'bg-primary-500 text-white' : 'text-gray-400'} disabled:opacity-50`}
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
                    const existingAlloc = allocations.find(a => 
                      a.subjectId === selectedSubject.id && 
                      a.type === 'THEORY' && 
                      a.divisionId === div.id
                    );
                    const isAllocated = !!existingAlloc;
                    
                    return (
                      <div key={div.id} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                        <label 
                          htmlFor={`div-${div.id}`} 
                          className={`font-medium ${isAllocated ? 'text-gray-500 line-through' : 'text-white cursor-pointer'}`}
                        >
                          Division {div.name}
                        </label>
                        {isAllocated ? (
                          <button onClick={() => handleUnmap(existingAlloc)} className="text-xs text-red-400 font-medium flex items-center gap-1">
                            ({faculty.find(f => f.id === existingAlloc.facultyId)?.initials}) <X className="w-3 h-3"/>
                          </button>
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
                  divisionsForSubject.map(div => {
                    const unassignedBatches = getUnassignedBatches(div);
                    return (
                      <div key={div.id}>
                        <h4 className="text-sm font-semibold text-primary-400 mb-2">Division {div.name}</h4>
                        <div className="space-y-2 pl-4">
                          {unassignedBatches.length === 0 && (
                            <p className="text-xs text-gray-500">All batches for this div are mapped.</p>
                          )}
                          {unassignedBatches.map(batch => (
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
                    );
                  })
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

            {/* --- Display Current Allocations for this Faculty --- */}
            <div className="pt-6 mt-6 border-t border-white/10 space-y-2 max-h-48 overflow-y-auto">
              <h4 className="text-lg text-white font-semibold mb-2">
                {selectedFaculty.initials}'s Mappings
              </h4>
              {allocations
                .filter(a => a.facultyId === selectedFaculty.id)
                .map(alloc => {
                  const div = divisions.find(d => d.id === alloc.divisionId);
                  const batch = div?.batches.find(b => b.id === alloc.batchId);
                  const subject = subjects.find(s => s.id === alloc.subjectId);
                  return (
                    <div key={alloc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <span className="text-white font-medium">
                          {subject?.code}: {alloc.type === 'THEORY' ? `Div ${div?.name}` : `Batch ${batch?.name}`}
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