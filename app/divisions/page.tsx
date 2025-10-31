'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Users, UserPlus } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { Division, Batch } from '@/lib/types';
import toast from 'react-hot-toast';

export default function DivisionsPage() {
  const { divisions, addDivision, updateDivision, deleteDivision } = useTimetableStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Division | null>(null);
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
        electiveChoices: {},
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Division Management</h1>
          <p className="text-gray-400">Configure divisions and batches for each department</p>
        </div>
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
                  onClick={() => handleEdit(division)}
                  className="px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(division.id)}
                  className="px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            className="glass-dark rounded-2xl p-6 max-w-lg w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
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
                />
                <p className="text-xs text-gray-500 mt-1">
                  Batches will be named {formData.name}1, {formData.name}2, etc.
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
          </motion.div>
        </div>
      )}
    </div>
  );
}
