'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Building2, Beaker, Upload, Loader2 } from 'lucide-react';
import { useTimetableStore } from '@/lib/store';
import { Room } from '@/lib/types';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { ImportRooms } from '@/components/ImportRooms';

export default function RoomsPage() {
  const { 
    rooms, 
    addRoom, 
    updateRoom, 
    deleteRoom,
    fetchInitialData,
    isInitialized,
    isLoading
  } = useTimetableStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    roomNumber: '',
    category: 'CLASSROOM' as 'CLASSROOM' | 'LAB',
    capacity: 60,
    department: '',
  });

  // --- NEW: Fetch data on component mount ---
  useEffect(() => {
    if (!isInitialized) {
      fetchInitialData();
    }
  }, [isInitialized, fetchInitialData]);
  // ------------------------------------------

  const departments = ['CE', 'IT', 'MECH', 'EE', 'CIVIL', 'General'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const roomData: Omit<Room, 'id'> = {
      roomNumber: formData.roomNumber,
      category: formData.category,
      capacity: Number(formData.capacity),
      department: formData.department || undefined,
    };

    if (editingRoom) {
      await updateRoom(editingRoom.id, roomData);
    } else {
      await addRoom(roomData);
    }

    setIsSubmitting(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      category: 'CLASSROOM',
      capacity: 60,
      department: '',
    });
    setEditingRoom(null);
    setIsModalOpen(false);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      roomNumber: room.roomNumber,
      category: room.category,
      capacity: room.capacity,
      department: room.department || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this room?')) {
      await deleteRoom(id);
    }
  };

  if (!isInitialized && isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="w-12 h-12 text-primary-400 animate-spin" />
      </div>
    );
  }

  const classrooms = rooms.filter(r => r.category === 'CLASSROOM');
  const labs = rooms.filter(r => r.category === 'LAB');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Room Management</h1>
          <p className="text-gray-400">Configure classrooms and laboratories</p>
        </div>
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
            onClick={() => { setEditingRoom(null); setIsModalOpen(true); }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            <span>Add Room</span>
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* ... (Your stats JSX remains unchanged) ... */}
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Total Rooms</div>
          <div className="text-3xl font-bold text-white">{rooms.length}</div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Classrooms</div>
          <div className="text-3xl font-bold text-white">{classrooms.length}</div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Labs</div>
          <div className="text-3xl font-bold text-white">{labs.length}</div>
        </div>
        <div className="card">
          <div className="text-primary-400 text-sm font-medium mb-1">Total Capacity</div>
          <div className="text-3xl font-bold text-white">
            {rooms.reduce((sum, r) => sum + r.capacity, 0)}
          </div>
        </div>
      </div>

      {/* Classrooms Section */}
      <div className="space-y-4">
        {/* ... (Your classrooms JSX remains unchanged) ... */}
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Building2 className="w-6 h-6 text-primary-400" />
          <span>Classrooms ({classrooms.length})</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {classrooms.map((room, index) => (
            <motion.div
              key={room.id}
              className="card group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{room.roomNumber}</h3>
                    <p className="text-xs text-gray-400">{room.department || 'General'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Capacity:</span>
                  <span className="text-white font-medium">{room.capacity} students</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="flex-1 px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
                >
                  <Edit className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Labs Section */}
      <div className="space-y-4">
        {/* ... (Your labs JSX remains unchanged) ... */}
        <h2 className="text-2xl font-bold text-white flex items-center space-x-2">
          <Beaker className="w-6 h-6 text-purple-400" />
          <span>Laboratories ({labs.length})</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {labs.map((room, index) => (
            <motion.div
              key={room.id}
              className="card group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Beaker className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{room.roomNumber}</h3>
                    <p className="text-xs text-gray-400">{room.department || 'General'}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Capacity:</span>
                  <span className="text-white font-medium">{room.capacity} students</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(room)}
                  className="flex-1 px-3 py-2 bg-primary-500/20 text-primary-400 rounded-lg hover:bg-primary-500/30 transition-colors"
                >
                  <Edit className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => handleDelete(room.id)}
                  className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {rooms.length === 0 && !isLoading && (
        <div className="card text-center py-12">
          {/* ... (Your no data message JSX remains unchanged) ... */}
           <Building2 className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No rooms added yet</h3>
          <p className="text-gray-500 mb-4">Start by adding your first room</p>
          <button
            onClick={() => { setEditingRoom(null); setIsModalOpen(true); }}
            className="btn-primary mx-auto"
          >
            Add Room
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={resetForm}
        title={editingRoom ? 'Edit Room' : 'Add New Room'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ... (Your form fields JSX remains unchanged) ... */}
           <div>
            <label className="label">Room Number *</label>
            <input
              type="text"
              className="input-field"
              value={formData.roomNumber}
              onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
              required
              placeholder="e.g., 504, Lab-A1"
            />
          </div>

          <div>
            <label className="label">Category *</label>
            <select
              className="input-field"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as 'CLASSROOM' | 'LAB' })}
              required
            >
              <option value="CLASSROOM">Classroom</option>
              <option value="LAB">Laboratory</option>
            </select>
          </div>

          <div>
            <label className="label">Capacity *</label>
            <input
              type="number"
              className="input-field"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
              min="1"
              max="200"
              required
            />
          </div>

          <div>
            <label className="label">Department (Optional)</label>
            <select
              className="input-field"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            >
              <option value="">General/Shared</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button 
              type="submit" 
              className="btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                editingRoom ? 'Update Room' : 'Add Room'
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Import Rooms Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Import Rooms from CSV"
        size="lg"
      >
        <ImportRooms onClose={() => setIsImportModalOpen(false)} />
      </Modal>
    </div>
  );
}