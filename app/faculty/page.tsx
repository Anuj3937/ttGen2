'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
// UPDATED: Import Upload and Modal
import { Plus, Edit, Trash2, UserCircle, Award, Upload } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { Faculty } from '@/lib/types';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { ImportFaculty } from '@/components/ImportFaculty';

export default function FacultyPage() {
  const { faculty, subjects, addFaculty, updateFaculty, deleteFaculty } = useTimetableStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);

  // NEW: State for import modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    initials: '',
    designation: '',
    maxWorkload: 20,
    subjects: [] as string[],
  });

  const designations = ['Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'TA'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const facultyData: Faculty = {
      id: editingFaculty?.id || `faculty-${Date.now()}`,
      name: formData.name,
      initials: formData.initials,
      designation: formData.designation,
      maxWorkload: Number(formData.maxWorkload),
      currentWorkload: editingFaculty?.currentWorkload || 0,
      subjects: formData.subjects,
      preferences: {},
    };

    if (editingFaculty) {
      updateFaculty(editingFaculty.id, facultyData);
      toast.success('Faculty updated successfully!');
    } else {
      addFaculty(facultyData);
      toast.success('Faculty added successfully!');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      initials: '',
      designation: '',
      maxWorkload: 20,
      subjects: [],
    });
    setEditingFaculty(null);
    setIsModalOpen(false);
  };

  const handleEdit = (faculty: Faculty) => {
    setEditingFaculty(faculty);
    setFormData({
      name: faculty.name,
      initials: faculty.initials,
      designation: faculty.designation,
      maxWorkload: faculty.maxWorkload,
      subjects: faculty.subjects,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this faculty member?')) {
      deleteFaculty(id);
      toast.success('Faculty deleted successfully!');
    }
  };

  const toggleSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subjectId)
        ? prev.subjects.filter(id => id !== subjectId)
        : [...prev.subjects, subjectId],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Faculty Management</h1>
          <p className="text-gray-400">Manage faculty members and their workload</p>
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
            <span>Add Faculty</span>
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... (stats cards remain the same) ... */}
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Total Faculty</div>
          <div className="text-3xl font-bold text-white">{faculty.length}</div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Professors</div>
          <div className="text-3xl font-bold text-white">
            {faculty.filter(f => f.designation === 'Professor').length}
          </div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Avg Workload</div>
          <div className="text-3xl font-bold text-white">
            {faculty.length > 0
              ? Math.round(faculty.reduce((sum, f) => sum + f.maxWorkload, 0) / faculty.length)
              : 0}h
          </div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Available Hours</div>
          <div className="text-3xl font-bold text-white">
            {faculty.reduce((sum, f) => sum + (f.maxWorkload - (f.currentWorkload || 0)), 0)}h
          </div>
        </div>
      </div>

      {/* Faculty List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculty.map((member, index) => {
          const workloadPercentage = (member.currentWorkload / member.maxWorkload) * 100;
          
          return (
            <motion.div
              key={member.id}
              className="card group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                    <UserCircle className="w-7 h-7 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{member.name}</h3>
                    <p className="text-sm text-gray-400">{member.initials}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-yellow-400">{member.designation.split(' ')[0]}</span>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Workload</span>
                    <span className="text-white font-medium">
                      {member.currentWorkload || 0}/{member.maxWorkload}h
                    </span>
                  </div>
                  <div className="w-full bg-dark-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        workloadPercentage >= 90
                          ? 'bg-red-500'
                          : workloadPercentage >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(workloadPercentage, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-400">Subjects ({member.subjects.length})</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.subjects.slice(0, 3).map(subjectId => {
                      const subject = subjects.find(s => s.id === subjectId);
                      return subject ? (
                        <span key={subjectId} className="px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded text-xs">
                          {subject.code}
                        </span>
                      ) : null;
                    })}
                    {member.subjects.length > 3 && (
                      <span className="px-2 py-0.5 bg-white/10 text-gray-400 rounded text-xs">
                        +{member.subjects.length - 3}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(member)}
                  className="flex-1 px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(member.id)}
                  className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {faculty.length === 0 && (
        <div className="card text-center py-12">
          {/* ... (no data message) ... */}
        </div>
      )}

      {/* UPDATED: Add/Edit Modal (now uses Modal component) */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input
                type="text"
                className="input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Dr. John Smith"
              />
            </div>

            <div>
              <label className="label">Initials *</label>
              <input
                type="text"
                className="input-field"
                value={formData.initials}
                onChange={(e) => setFormData({ ...formData, initials: e.target.value })}
                required
                placeholder="e.g., JDS"
              />
            </div>

            <div>
              <label className="label">Designation *</label>
              <select
                className="input-field"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                required
              >
                <option value="">Select Designation</option>
                {designations.map(deg => (
                  <option key={deg} value={deg}>{deg}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Max Weekly Workload (hours) *</label>
              <input
                type="number"
                className="input-field"
                value={formData.maxWorkload}
                onChange={(e) => setFormData({ ...formData, maxWorkload: Number(e.target.value) })}
                min="1"
                max="40"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Can Teach Subjects *</label>
            <div className="max-h-48 overflow-y-auto space-y-2 p-4 glass rounded-lg">
              {subjects.length === 0 ? (
                <p className="text-gray-500 text-sm">No subjects available. Please add subjects first.</p>
              ) : (
                subjects.map(subject => (
                  <label
                    key={subject.id}
                    className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.subjects.includes(subject.id)}
                      onChange={() => toggleSubject(subject.id)}
                      className="w-4 h-4 text-primary-500 bg-dark-700 border-gray-600 rounded focus:ring-primary-500"
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium">{subject.name}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        ({subject.code} - {subject.department} {subject.year})
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingFaculty ? 'Update Faculty' : 'Add Faculty'}
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

      {/* NEW: Import Faculty Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Faculty from CSV"
        size="lg"
      >
        <ImportFaculty onClose={() => setIsImportModalOpen(false)} />
      </Modal>
    </div>
  );
}