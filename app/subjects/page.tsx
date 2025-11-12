'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
// UPDATED: Import Upload icon and Modal
import { Plus, Edit, Trash2, BookOpen, Upload } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { Subject, SubjectType } from '@/lib/types';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal'; // Import Modal
import { ImportSubjects } from '@/components/ImportSubjects'; // Import new component

export default function SubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useTimetableStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  // NEW: State for the import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    year: '',
    semester: '', // Added semester
    theoryHours: 0,
    practicalHours: 0,
    tutorialHours: 0, // Added tutorial
    type: 'CORE' as SubjectType,
    electives: '',
  });

  const departments = ['CE', 'IT', 'MECH', 'EE', 'CIVIL'];
  const years = ['FE', 'SE', 'TE', 'BE'];
  const subjectTypes: SubjectType[] = ['CORE', 'LAB', 'DLO', 'ILO', 'MINOR'];
  // NEW: Semesters list for the form
  const semesters = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const electivesArray = formData.electives
      ? formData.electives.split(',').map(e => e.trim())
      : undefined;

    const subjectData: Subject = {
      id: editingSubject?.id || `subject-${Date.now()}`,
      name: formData.name,
      code: formData.code,
      department: formData.department,
      year: formData.year,
      semester: formData.semester, // Added
      theoryHours: Number(formData.theoryHours),
      practicalHours: Number(formData.practicalHours),
      tutorialHours: Number(formData.tutorialHours), // Added
      type: formData.type,
      electives: (formData.type === 'DLO' || formData.type === 'ILO' || formData.type === 'MINOR') ? electivesArray : undefined,
    };

    if (editingSubject) {
      updateSubject(editingSubject.id, subjectData);
      toast.success('Subject updated successfully!');
    } else {
      addSubject(subjectData);
      toast.success('Subject added successfully!');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      department: '',
      year: '',
      semester: '', // Added
      theoryHours: 0,
      practicalHours: 0,
      tutorialHours: 0, // Added
      type: 'CORE',
      electives: '',
    });
    setEditingSubject(null);
    setIsModalOpen(false);
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      department: subject.department,
      year: subject.year,
      semester: subject.semester, // Added
      theoryHours: subject.theoryHours,
      practicalHours: subject.practicalHours,
      tutorialHours: subject.tutorialHours, // Added
      type: subject.type,
      electives: subject.electives?.join(', ') || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subject?')) {
      deleteSubject(id);
      toast.success('Subject deleted successfully!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Subject Management</h1>
          <p className="text-gray-400">Manage subjects with theory and practical hours</p>
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
            <span>Add Subject</span>
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... (stats cards remain the same) ... */}
         <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Total Subjects</div>
          <div className="text-3xl font-bold text-white">{subjects.length}</div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Core Subjects</div>
          <div className="text-3xl font-bold text-white">
            {subjects.filter(s => s.type === 'CORE').length}
          </div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Labs</div>
          <div className="text-3xl font-bold text-white">
            {subjects.filter(s => s.type === 'LAB').length}
          </div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Electives/Minors</div>
          <div className="text-3xl font-bold text-white">
            {subjects.filter(s => s.type === 'DLO' || s.type === 'ILO' || s.type === 'MINOR').length}
          </div>
        </div>
      </div>

      {/* Subjects List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((subject, index) => (
          <motion.div
            key={subject.id}
            className="card group hover:border-primary-500/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{subject.name}</h3>
                  <p className="text-sm text-gray-400">{subject.code}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                subject.type === 'CORE' ? 'bg-blue-500/20 text-blue-400' :
                subject.type === 'LAB' ? 'bg-purple-500/20 text-purple-400' :
                subject.type === 'MINOR' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {subject.type}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Department:</span>
                <span className="text-white font-medium">{subject.department} - {subject.year} (Sem {subject.semester})</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Theory:</span>
                <span className="text-white font-medium">{subject.theoryHours}h/week</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Practical:</span>
                <span className="text-white font-medium">{subject.practicalHours}h/week</span>
              </div>
              {subject.electives && (
                <div className="text-sm">
                  <span className="text-gray-400">Electives:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {subject.electives.length === 0 ? (
                       <span className="text-gray-500 text-xs italic">No choices added</span>
                    ) : subject.electives.map((elective, i) => (
                      <span key={i} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded text-xs">
                        {elective}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(subject)}
                className="flex-1 px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors flex items-center justify-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(subject.id)}
                className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="card text-center py-12">
          {/* ... (no data message) ... */}
        </div>
      )}

      {/* Add/Edit Subject Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={resetForm}
          title={editingSubject ? 'Edit Subject' : 'Add New Subject'}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Subject Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Data Structures & Algorithms"
                />
              </div>

              <div>
                <label className="label">Subject Code *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="e.g., DSA"
                />
              </div>

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
                <label className="label">Semester *</label>
                <select
                  className="input-field"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                  required
                >
                  <option value="">Select Semester</option>
                  {semesters.map(sem => (
                    <option key={sem} value={sem}>{sem}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="label">Subject Type *</label>
                <select
                  className="input-field"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as SubjectType })}
                  required
                >
                  {subjectTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Theory Hours/Week *</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.theoryHours}
                  onChange={(e) => setFormData({ ...formData, theoryHours: Number(e.target.value) })}
                  min="0"
                  max="10"
                  required
                />
              </div>

              <div>
                <label className="label">Practical Hours/Week *</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.practicalHours}
                  onChange={(e) => setFormData({ ...formData, practicalHours: Number(e.target.value) })}
                  min="0"
                  max="10"
                  required
                />
              </div>

              <div>
                <label className="label">Tutorial Hours/Week</label>
                <input
                  type="number"
                  className="input-field"
                  value={formData.tutorialHours}
                  onChange={(e) => setFormData({ ...formData, tutorialHours: Number(e.target.value) })}
                  min="0"
                  max="10"
                />
              </div>
            </div>

            {(formData.type === 'DLO' || formData.type === 'ILO' || formData.type === 'MINOR') && (
              <div>
                <label className="label">Elective Options (comma-separated)</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.electives}
                  onChange={(e) => setFormData({ ...formData, electives: e.target.value })}
                  placeholder="e.g., Machine Learning, Cloud Computing, IoT"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter elective choices separated by commas (e.g., CI, IDS)
                </p>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                {editingSubject ? 'Update Subject' : 'Add Subject'}
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

      {/* NEW: Import Subjects Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Subjects from CSV"
        size="lg"
      >
        <ImportSubjects onClose={() => setIsImportModalOpen(false)} />
      </Modal>
    </div>
  );
}