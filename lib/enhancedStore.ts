import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useTimetableStore } from './store';

interface AppSettings {
  theme: 'light' | 'dark';
  autoSave: boolean;
  aiAssistEnabled: boolean;
  notificationsEnabled: boolean;
}

interface EnhancedStore extends AppSettings {
  updateSettings: (settings: Partial<AppSettings>) => void;
  exportAllData: () => string;
  importAllData: (data: string) => void;
  clearAllData: () => void;
}

export const useEnhancedStore = create<EnhancedStore>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      autoSave: true,
      aiAssistEnabled: true,
      notificationsEnabled: true,

      updateSettings: (settings) => set(settings),

      exportAllData: () => {
        const timetableData = useTimetableStore.getState();
        const enhancedData = get();

        const exportData = {
          version: '1.0',
          timestamp: new Date().toISOString(),
          timetableData: {
            subjects: timetableData.subjects,
            divisions: timetableData.divisions,
            faculty: timetableData.faculty,
            rooms: timetableData.rooms,
            generatedTimetable: timetableData.generatedTimetable,
          },
          settings: {
            theme: enhancedData.theme,
            autoSave: enhancedData.autoSave,
            aiAssistEnabled: enhancedData.aiAssistEnabled,
            notificationsEnabled: enhancedData.notificationsEnabled,
          },
        };

        return JSON.stringify(exportData, null, 2);
      },

      importAllData: (data) => {
        try {
          const parsed = JSON.parse(data);

          if (parsed.timetableData) {
            const timetableStore = useTimetableStore.getState();
            
            // Import subjects
            parsed.timetableData.subjects?.forEach((subject: any) => {
              timetableStore.addSubject(subject);
            });

            // Import divisions
            parsed.timetableData.divisions?.forEach((division: any) => {
              timetableStore.addDivision(division);
            });

            // Import faculty
            parsed.timetableData.faculty?.forEach((faculty: any) => {
              timetableStore.addFaculty(faculty);
            });

            // Import rooms
            parsed.timetableData.rooms?.forEach((room: any) => {
              timetableStore.addRoom(room);
            });

            // Import generated timetable
            if (parsed.timetableData.generatedTimetable) {
              timetableStore.setGeneratedTimetable(parsed.timetableData.generatedTimetable);
            }
          }

          if (parsed.settings) {
            set(parsed.settings);
          }
        } catch (error) {
          console.error('Import error:', error);
          throw new Error('Invalid import data');
        }
      },

      clearAllData: () => {
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
      name: 'enhanced-settings',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
