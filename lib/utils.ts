import { Subject, Division, Faculty, Room, TimetableEntry } from './types';

export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const calculateDepartmentLoad = (
  subjects: Subject[],
  divisions: Division[],
  department: string,
  year: string
) => {
  const relevantSubjects = subjects.filter(
    s => s.department === department && s.year === year
  );

  const relevantDivisions = divisions.filter(
    d => d.department === department && d.year === year
  );

  let totalTheoryHours = 0;
  let totalPracticalHours = 0;

  relevantSubjects.forEach(subject => {
    const divisionCount = relevantDivisions.length;
    totalTheoryHours += subject.theoryHours * divisionCount;

    relevantDivisions.forEach(division => {
      totalPracticalHours += subject.practicalHours * division.batches.length;
    });
  });

  return {
    totalTheoryHours,
    totalPracticalHours,
    totalHours: totalTheoryHours + totalPracticalHours,
  };
};

export const validateFacultyWorkload = (
  faculty: Faculty[],
  entries: TimetableEntry[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  faculty.forEach(f => {
    const facultyEntries = entries.filter(e => e.faculty.id === f.id);
    const totalHours = facultyEntries.reduce((sum, e) => {
      const duration = calculateDuration(e.startTime, e.endTime);
      return sum + duration;
    }, 0);

    if (totalHours > f.maxWorkload) {
      errors.push(
        `${f.name} is overloaded: ${totalHours}h assigned vs ${f.maxWorkload}h max`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const calculateDuration = (startTime: string, endTime: string): number => {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return (endMinutes - startMinutes) / 60;
};

export const detectConflicts = (entries: TimetableEntry[]): string[] => {
  const conflicts: string[] = [];
  const slots = new Map<string, TimetableEntry[]>();

  entries.forEach(entry => {
    const key = `${entry.day}-${entry.startTime}`;
    if (!slots.has(key)) {
      slots.set(key, []);
    }
    slots.get(key)!.push(entry);
  });

  slots.forEach((entries, key) => {
    // Check faculty conflicts
    const facultyMap = new Map<string, TimetableEntry[]>();
    entries.forEach(e => {
      if (!facultyMap.has(e.faculty.id)) {
        facultyMap.set(e.faculty.id, []);
      }
      facultyMap.get(e.faculty.id)!.push(e);
    });

    facultyMap.forEach((entries, facultyId) => {
      if (entries.length > 1) {
        const faculty = entries[0].faculty;
        conflicts.push(
          `Faculty ${faculty.name} has ${entries.length} classes at ${key}`
        );
      }
    });

    // Check room conflicts
    const roomMap = new Map<string, TimetableEntry[]>();
    entries.forEach(e => {
      if (!roomMap.has(e.room.id)) {
        roomMap.set(e.room.id, []);
      }
      roomMap.get(e.room.id)!.push(e);
    });

    roomMap.forEach((entries, roomId) => {
      if (entries.length > 1) {
        const room = entries[0].room;
        conflicts.push(
          `Room ${room.roomNumber} has ${entries.length} classes at ${key}`
        );
      }
    });
  });

  return conflicts;
};

export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
};

export const formatTime = (time: string): string => {
  const [hour, min] = time.split(':').map(Number);
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${min.toString().padStart(2, '0')} ${period}`;
};

export const exportToPDF = async (element: HTMLElement, filename: string) => {
  // Dynamic import for client-side only
  const html2canvas = (await import('html2canvas')).default;
  const jsPDF = (await import('jspdf')).default;

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 10;

  pdf.addImage(
    imgData,
    'PNG',
    imgX,
    imgY,
    imgWidth * ratio,
    imgHeight * ratio
  );

  pdf.save(filename);
};

export const colorBySubjectType = (type: string): string => {
  const colors: { [key: string]: string } = {
    CORE: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    LAB: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    DLO: 'bg-green-500/20 border-green-500/30 text-green-400',
    ILO: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    MINOR: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
  };
  return colors[type] || 'bg-gray-500/20 border-gray-500/30 text-gray-400';
};

export const downloadJSON = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const uploadJSON = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event: any) => {
        try {
          const data = JSON.parse(event.target.result);
          resolve(data);
        } catch (error) {
          reject(new Error('Invalid JSON file'));
        }
      };
      reader.readAsText(file);
    };

    input.click();
  });
};
