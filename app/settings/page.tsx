'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Download, 
  Upload, 
  Trash2, 
  Save,
  Sparkles,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import { useEnhancedStore } from '@/lib/enhancedStore';
import { useTimetableStore } from '@/lib/store';
import { downloadJSON, uploadJSON } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const {
    theme,
    autoSave,
    aiAssistEnabled,
    notificationsEnabled,
    updateSettings,
    exportAllData,
    importAllData,
    clearAllData,
  } = useEnhancedStore();

  const { subjects, divisions, faculty, rooms } = useTimetableStore();

  const handleExport = () => {
    try {
      const data = exportAllData();
      downloadJSON(JSON.parse(data), `timetable-backup-${Date.now()}.json`);
      toast.success('Data exported successfully!');
    } catch (error) {
      toast.error('Export failed');
    }
  };

  const handleImport = async () => {
    try {
      const data = await uploadJSON();
      importAllData(JSON.stringify(data));
      toast.success('Data imported successfully!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message || 'Import failed');
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        'Are you sure you want to clear all data? This action cannot be undone.'
      )
    ) {
      clearAllData();
      toast.success('All data cleared');
      window.location.reload();
    }
  };

  const dataStats = {
    subjects: subjects.length,
    divisions: divisions.length,
    faculty: faculty.length,
    rooms: rooms.length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Manage your application preferences and data</p>
      </div>

      {/* Data Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(dataStats).map(([key, value]) => (
          <div key={key} className="card">
            <div className="text-primary-400 text-sm font-medium mb-1 capitalize">
              {key}
            </div>
            <div className="text-3xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Preferences */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
          <SettingsIcon className="w-6 h-6 text-primary-400" />
          <span>Preferences</span>
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              {theme === 'dark' ? (
                <Moon className="w-5 h-5 text-primary-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-400" />
              )}
              <div>
                <div className="font-semibold text-white">Theme</div>
                <div className="text-sm text-gray-400">
                  Choose your preferred theme
                </div>
              </div>
            </div>
            <select
              className="input-field w-32"
              value={theme}
              onChange={(e) => updateSettings({ theme: e.target.value as any })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <Save className="w-5 h-5 text-primary-400" />
              <div>
                <div className="font-semibold text-white">Auto Save</div>
                <div className="text-sm text-gray-400">
                  Automatically save changes
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoSave}
                onChange={(e) => updateSettings({ autoSave: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <div>
                <div className="font-semibold text-white">AI Assistance</div>
                <div className="text-sm text-gray-400">
                  Enable AI-powered optimization
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={aiAssistEnabled}
                onChange={(e) => updateSettings({ aiAssistEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-primary-400" />
              <div>
                <div className="font-semibold text-white">Notifications</div>
                <div className="text-sm text-gray-400">
                  Receive update notifications
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:ring-4 peer-focus:ring-primary-500/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-6">Data Management</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            className="p-6 bg-primary-500/20 border border-primary-500/30 rounded-lg hover:bg-primary-500/30 transition-all flex flex-col items-center space-y-3"
            onClick={handleExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Download className="w-8 h-8 text-primary-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Export Data</div>
              <div className="text-sm text-gray-400">Download backup</div>
            </div>
          </motion.button>

          <motion.button
            className="p-6 bg-green-500/20 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all flex flex-col items-center space-y-3"
            onClick={handleImport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Upload className="w-8 h-8 text-green-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Import Data</div>
              <div className="text-sm text-gray-400">Restore backup</div>
            </div>
          </motion.button>

          <motion.button
            className="p-6 bg-red-500/20 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all flex flex-col items-center space-y-3"
            onClick={handleClearAll}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Trash2 className="w-8 h-8 text-red-400" />
            <div className="text-center">
              <div className="font-semibold text-white">Clear All</div>
              <div className="text-sm text-gray-400">Delete everything</div>
            </div>
          </motion.button>
        </div>
      </div>

      {/* About */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-4">About</h2>
        <div className="space-y-2 text-gray-400">
          <p>
            <span className="font-semibold text-white">Version:</span> 1.0.0
          </p>
          <p>
            <span className="font-semibold text-white">Built with:</span> Next.js 14,
            TypeScript, Tailwind CSS, Framer Motion
          </p>
          <p>
            <span className="font-semibold text-white">Features:</span> AI-powered
            timetable generation, multi-view displays, conflict resolution
          </p>
        </div>
      </div>
    </div>
  );
}
