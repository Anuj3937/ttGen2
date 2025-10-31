'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { Subject, SubjectType } from '@/lib/types';
import toast from 'react-hot-toast';

export default function SubjectsPage() {
  const { subjects, addSubject, updateSubject, deleteSubject } = useTimetableStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    year: '',
    theoryHours: 0,
    practicalHours: 0,
    type: 'CORE' as SubjectType,
    electives: '',
  });

  const departments = ['CE', 'IT', 'MECH', 'EE', 'CIVIL'];
  const years = ['FE', 'SE', 'TE', 'BE'];
  const subjectTypes: SubjectType[] = ['CORE', 'LAB', 'DLO', 'ILO', 'MINOR'];

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
      theoryHours: Number(formData.theoryHours),
      practicalHours: Number(formData.practicalHours),
      type: formData.type,
      electives: (formData.type === 'DLO' || formData.type === 'ILO') ? electivesArray : undefined,
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
      theoryHours: 0,
      practicalHours: 0,
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
      theoryHours: subject.theoryHours,
      practicalHours: subject.practicalHours,
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="text-primary-400 text-sm font-medium mb-1">Electives</div>
          <div className="text-3xl font-bold text-white">
            {subjects.filter(s => s.type === 'DLO' || s.type === 'ILO').length}
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
                <span className="text-white font-medium">{subject.department} - {subject.year}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Theory Hours:</span>
                <span className="text-white font-medium">{subject.theoryHours}h/week</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Practical Hours:</span>
                <span className="text-white font-medium">{subject.practicalHours}h/week</span>
              </div>
              {subject.electives && (
                <div className="text-sm">
                  <span className="text-gray-400">Electives:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {subject.electives.map((elective, i) => (
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
          <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No subjects added yet</h3>
          <p className="text-gray-500 mb-4">Start by adding your first subject</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary mx-auto"
          >
            Add Subject
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="glass-dark rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </h2>

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

                {(formData.type === 'DLO' || formData.type === 'ILO') && (
                  <div className="md:col-span-2">
                    <label className="label">Elective Options (comma-separated)</label>
                    <input
                      type="text"
                      className="input-field"
                      value={formData.electives}
                      onChange={(e) => setFormData({ ...formData, electives: e.target.value })}
                      placeholder="e.g., Machine Learning, Cloud Computing, IoT"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter elective choices separated by commas
                    </p>
                  </div>
                )}
              </div>

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
          </motion.div>
        </div>
      )}
    </div>
  );
}
