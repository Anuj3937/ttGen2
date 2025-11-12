'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
// UPDATED: Added Upload icon
import { Plus, Edit, Trash2, Users, UserPlus, ClipboardList, X, Upload } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { Division, Batch, Subject } from '@/lib/types';
import toast from 'react-hot-toast';
// UPDATED: Import Modal and new ImportDivisions component
import { Modal } from '@/components/ui/Modal';
import { ImportDivisions } from '@/components/ImportDivisions';

export default function DivisionsPage() {
  const { divisions, addDivision, updateDivision, deleteDivision, subjects } = useTimetableStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
  
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);

  // NEW: State for the import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    department: '',
    year: '',
    name: '',
    batchCount: 3,
    studentCountPerBatch: 20,
  });

  const departments = ['CE', 'IT', 'MECH', 'EE', 'CIVIL'];
  const years = ['FE', 'SE', 'TE', 'BE'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const batches: Batch[] = [];
    for (let i = 1; i <= formData.batchCount; i++) {
      batches.push({
        id: `batch-${formData.name}${i}-${Date.now()}`,
        name: `${formData.name}${i}`,
        studentCount: formData.studentCountPerBatch,
        electiveChoices: {}, // Initialize empty
        minorStudents: [],
      });
    }

    const divisionData: Division = {
      id: editingDivision?.id || `division-${Date.now()}`,
      department: formData.department,
      year: formData.year,
      name: formData.name,
      batches,
    };

    if (editingDivision) {
      // Preserve existing batch choices when editing
      const existingBatches = editingDivision.batches.map((b, i) => ({
        ...batches[i],
        id: b.id, // Keep old ID
        name: b.name, // Keep old name
        electiveChoices: b.electiveChoices || {},
        minorStudents: b.minorStudents || [],
      }));
      divisionData.batches = existingBatches;
      
      updateDivision(editingDivision.id, divisionData);
      toast.success('Division updated successfully!');
    } else {
      addDivision(divisionData);
      toast.success('Division added successfully!');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      department: '',
      year: '',
      name: '',
      batchCount: 3,
      studentCountPerBatch: 20,
    });
    setEditingDivision(null);
    setIsModalOpen(false);
  };

  const handleEdit = (division: Division) => {
    setEditingDivision(division);
    setFormData({
      department: division.department,
      year: division.year,
      name: division.name,
      batchCount: division.batches.length,
      studentCountPerBatch: division.batches[0]?.studentCount || 20,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this division?')) {
      deleteDivision(id);
      toast.success('Division deleted successfully!');
    }
  };

  const handleOpenAssignModal = (division: Division) => {
    setSelectedDivision(division);
    setIsAssignModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Division Management</h1>
          <p className="text-gray-400">Configure divisions and batches for each department</p>
        </div>
        {/* UPDATED: Added Import Button */}
        <div className="flex gap-4">
          <motion.button
            className="btn-secondary flex items-center space-x-2"
            onClick={() => setIsImportModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Upload className="w-5 h-5" />
            <span>Import from CSV</span>
          </motion.button>
          <motion.button
            className="btn-primary flex items-center space-x-2"
            onClick={() => setIsModalOpen(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Add Division</span>
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Total Divisions</div>
          <div className="text-3xl font-bold text-white">{divisions.length}</div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Total Batches</div>
          <div className="text-3xl font-bold text-white">
            {divisions.reduce((sum, d) => sum + d.batches.length, 0)}
          </div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Total Students</div>
          <div className="text-3xl font-bold text-white">
            {divisions.reduce((sum, d) => 
              sum + d.batches.reduce((bSum, b) => bSum + b.studentCount, 0), 0
            )}
          </div>
        </div>
      </div>

      {/* Divisions List */}
      <div className="space-y-4">
        {divisions.map((division, index) => (
          <motion.div
            key={division.id}
            className="card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {division.department} - {division.year} - Division {division.name}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {division.batches.length} batches • {' '}
                    {division.batches.reduce((sum, b) => sum + b.studentCount, 0)} students
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleOpenAssignModal(division)}
                  className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                  title="Assign Electives"
                >
                  <ClipboardList className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(division)}
                  className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
                  title="Edit Division"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(division.id)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                  title="Delete Division"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {division.batches.map((batch) => (
                <div
                  key={batch.id}
                  className="p-3 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <UserPlus className="w-4 h-4 text-primary-400" />
                    <span className="font-semibold text-white">{batch.name}</span>
                  </div>
                  <p className="text-xs text-gray-400">{batch.studentCount} students</p>
                  <div className="mt-2 space-y-1">
                    {Object.entries(batch.electiveChoices || {}).map(([subjectId, choice]) => {
                      const subj = subjects.find(s => s.id === subjectId);
                      return (
                        <div key={subjectId} className="text-xs">
                          <span className="text-gray-500">{subj?.code || 'Subj'}: </span>
                          <span className="text-primary-300 font-medium">{choice}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {divisions.length === 0 && (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No divisions added yet</h3>
          <p className="text-gray-500 mb-4">Start by adding your first division</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary mx-auto"
          >
            Add Division
          </button>
        </div>
      )}

      {/* Modal for Add/Edit Division */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={editingDivision ? 'Edit Division' : 'Add New Division'}
          size="lg"
        >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingDivision ? 'Edit Division' : 'Add New Division'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Department *</label>
                <select
                  className="input-field"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Year *</label>
                <select
                  className="input-field"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  required
                >
                  <option value="">Select Year</option>
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Division Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                  required
                  placeholder="e.g., A, B, C"
                  maxLength={1}
                />
              </div>

              <div>
                <label className="label">Number of Batches *</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.batchCount}
                  onChange={(e) => setFormData({ ...formData, batchCount: Number(e.target.value) })}
                  min="1"
                  max="10"
                  required
                  disabled={!!editingDivision} // Disable if editing
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingDivision ? 'Batch count cannot be changed after creation.' : `Batches will be named ${formData.name}1, ${formData.name}2, etc.`}
                </p>
              </div>

              <div>
                <label className="label">Students per Batch *</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.studentCountPerBatch}
                  onChange={(e) => setFormData({ ...formData, studentCountPerBatch: Number(e.target.value) })}
                  min="1"
                  max="100"
                  required
                  disabled={!!editingDivision} // Disable if editing
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary flex-1">
                  {editingDivision ? 'Update Division' : 'Add Division'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* Modal for Assigning Electives */}
      {isAssignModalOpen && selectedDivision && (
        <AssignElectivesModal
          division={selectedDivision}
          onClose={() => setIsAssignModalOpen(false)}
        />
      )}

      {/* NEW: Import Divisions Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Divisions from CSV"
        size="lg"
      >
        <ImportDivisions onClose={() => setIsImportModalOpen(false)} />
      </Modal>
    </div>
  );
}

// Assign Electives Modal Component
interface AssignElectivesModalProps {
  division: Division;
  onClose: () => void;
}

function AssignElectivesModal({ division, onClose }: AssignElectivesModalProps) {
  const { subjects, updateDivision } = useTimetableStore();
  
  const [choices, setChoices] = useState<{ [batchId: string]: { [subjectId: string]: string } }>({});

  const electiveSubjects = subjects.filter(
    s => s.department === division.department &&
         s.year === division.year &&
         (s.type === 'DLO' || s.type === 'ILO' || s.type === 'MINOR') &&
         s.electives && s.electives.length > 0
  );

  useEffect(() => {
    const initialChoices: { [batchId: string]: { [subjectId: string]: string } } = {};
    division.batches.forEach(batch => {
      initialChoices[batch.id] = {};
      electiveSubjects.forEach(subject => {
        initialChoices[batch.id][subject.id] = batch.electiveChoices?.[subject.id] || '';
      });
    });
    setChoices(initialChoices);
  }, [division, electiveSubjects]);

  const handleChoiceChange = (batchId: string, subjectId: string, value: string) => {
    setChoices(prev => ({
      ...prev,
      [batchId]: {
        ...prev[batchId],
        [subjectId]: value,
      },
    }));
  };

  const handleSave = () => {
    const updatedBatches = division.batches.map(batch => ({
      ...batch,
      electiveChoices: choices[batch.id] || {},
    }));
    
    updateDivision(division.id, { batches: updatedBatches });
    toast.success('Elective choices saved!');
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Assign Electives for ${division.department} ${division.year} - Div ${division.name}`}
      size="xl"
    >
      <div className="space-y-6">
        {electiveSubjects.length === 0 ? (
          <p className="text-gray-400 text-center py-8">
            No elective or minor subjects with choices found for {division.department} {division.year}.
            <br />
            Please add them in the 'Subjects' page first.
          </p>
        ) : (
          electiveSubjects.map(subject => (
            <div key={subject.id} className="card p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                {subject.name} ({subject.code})
              </h3>
              <div className="space-y-2">
                {division.batches.map(batch => (
                  <div key={batch.id} className="flex items-center justify-between">
                    <label className="text-gray-300 font-medium">{batch.name}</label>
                    <select
                      className="input-field w-1/2"
                      value={choices[batch.id]?.[subject.id] || ''}
                      onChange={(e) => handleChoiceChange(batch.id, subject.id, e.target.value)}
                    >
                      <option value="">Select Choice</option>
                      {subject.electives?.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex space-x-3 pt-6">
        <button type="button" onClick={handleSave} className="btn-primary flex-1" disabled={electiveSubjects.length === 0}>
          Save Choices
        </button>
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary flex-1"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}