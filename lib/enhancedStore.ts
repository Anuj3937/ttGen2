import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useTimetableStore } from './store'; // We still need this for clearAll

interface AppSettings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  aiAssistEnabled: boolean;
  notificationsEnabled: boolean;
}

interface EnhancedStore extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
  // These are now async
  exportAllData: () => Promise<any>; 
  importAllData: (data: string) => Promise<void>;
  clearAllData: () => void;
}

export const useEnhancedStore = create<EnhancedStore>()(
  persist(
    (set, get) => ({
      // Keep settings in localStorage
      theme: 'dark',
      autoSave: true,
      aiAssistEnabled: true,
      notificationsEnabled: true,

      updateSettings: (settings) => set(settings),

      // REFACTORED exportAllData
      exportAllData: async () => {
        const response = await fetch('/api/data/export');
        if (!response.ok) {
          throw new Error('Failed to export data from server.');
        }
        const exportData = await response.json();
        
        // We still add the local settings to the file
        const enhancedData = get();
        exportData.settings = {
          theme: enhancedData.theme,
          autoSave: enhancedData.autoSave,
          aiAssistEnabled: enhancedData.aiAssistEnabled,
          notificationsEnabled: enhancedData.notificationsEnabled,
        };

        return exportData;
      },

      // REFACTORED importAllData
      importAllData: async (data) => {
        try {
          const parsed = JSON.parse(data);

          if (parsed.data) {
            // Send the data portion to the API to be imported
            const response = await fetch('/api/data/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed),
            });

            if (!response.ok) {
              const { error } = await response.json();
              throw new Error(error || 'Import failed on server.');
            }
          }

          if (parsed.settings) {
            set(parsed.settings);
          }
          
          // Clear local store and force re-fetch
          useTimetableStore.getState().clearAll(); 

        } catch (error: any) {
          console.error('Import error:', error);
          throw new Error(error.message || 'Invalid import data');
        }
      },

      clearAllData: () => {
        // This should also call an API to clear Firestore data
        // For now, it just clears the local store and settings
        useTimetableStore.getState().clearAll();
        set({
          theme: 'dark',
          autoSave: true,
          aiAssistEnabled: true,
          notificationsEnabled: true,
        });
      },
    }),
    {
      name: 'enhanced-settings', // Only settings are persisted here now
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ // Only persist settings, not functions
        theme: state.theme,
        autoSave: state.autoSave,
        aiAssistEnabled: state.aiAssistEnabled,
        notificationsEnabled: state.notificationsEnabled,
      }),
    }
  )
);