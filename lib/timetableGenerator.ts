import {
  Subject,
  Division,
  Faculty,
  Room,
  TimetableEntry,
  GeneratedTimetable,
  DepartmentLoad,
  TimeSlot,
  DAYS,
  TIME_SLOTS,
  Batch,
} from './types';

interface Slot {
  day: string;
  startTime: string;
  endTime: string;
  duration: number;
}

class TimetableGenerator {
  private subjects: Subject[];
  private divisions: Division[];
  private faculty: Faculty[];
  private rooms: Room[];
  private timetableEntries: TimetableEntry[];
  private facultySchedule: Map<string, Set<string>>; // facultyId -> Set of "day-time" strings
  private roomSchedule: Map<string, Set<string>>; // roomId -> Set of "day-time" strings
  private divisionSchedule: Map<string, Set<string>>; // divisionId -> Set of "day-time" strings
  private batchSchedule: Map<string, Set<string>>; // batchId -> Set of "day-time" strings

  constructor(
    subjects: Subject[],
    divisions: Division[],
    faculty: Faculty[],
    rooms: Room[]
  ) {
    this.subjects = subjects;
    this.divisions = divisions;
    this.faculty = faculty;
    this.rooms = rooms;
    this.timetableEntries = [];
    this.facultySchedule = new Map();
    this.roomSchedule = new Map();
    this.divisionSchedule = new Map();
    this.batchSchedule = new Map();
  }

  private createSlotKey(day: string, time: string): string {
    return `${day}-${time}`;
  }

  private isSlotAvailable(
    facultyId: string,
    roomId: string,
    divisionId: string,
    batchId: string | undefined,
    day: string,
    startTime: string,
    duration: number = 1
  ): boolean {
    // Check all time slots covered by this entry
    const timeSlots = this.getTimeSlots(startTime, duration);
    
    for (const time of timeSlots) {
      const slotKey = this.createSlotKey(day, time);
      
      // Check faculty availability
      if (this.facultySchedule.get(facultyId)?.has(slotKey)) {
        return false;
      }
      
      // Check room availability
      if (this.roomSchedule.get(roomId)?.has(slotKey)) {
        return false;
      }
      
      // Check division availability (for core theory classes)
      if (!batchId && this.divisionSchedule.get(divisionId)?.has(slotKey)) {
        return false;
      }
      
      // Check batch availability (for practicals OR elective/minor theory)
      if (batchId && this.batchSchedule.get(batchId)?.has(slotKey)) {
        return false;
      }
    }
    
    return true;
  }

  private getTimeSlots(startTime: string, duration: number): string[] {
    const slots: string[] = [];
    const timeIndex = TIME_SLOTS.findIndex(t => t.start === startTime);
    
    for (let i = 0; i < duration; i++) {
      if (timeIndex + i < TIME_SLOTS.length) {
        // Skip break time
        if (TIME_SLOTS[timeIndex + i].start !== '12:00') {
          slots.push(TIME_SLOTS[timeIndex + i].start);
        }
      }
    }
    
    return slots;
  }

  private markSlotAsOccupied(
    facultyId: string,
    roomId: string,
    divisionId: string,
    batchId: string | undefined,
    day: string,
    startTime: string,
    duration: number = 1
  ): void {
    const timeSlots = this.getTimeSlots(startTime, duration);
    
    for (const time of timeSlots) {
      const slotKey = this.createSlotKey(day, time);
      
      // Mark faculty as occupied
      if (!this.facultySchedule.has(facultyId)) {
        this.facultySchedule.set(facultyId, new Set());
      }
      this.facultySchedule.get(facultyId)!.add(slotKey);
      
      // Mark room as occupied
      if (!this.roomSchedule.has(roomId)) {
        this.roomSchedule.set(roomId, new Set());
      }
      this.roomSchedule.get(roomId)!.add(slotKey);
      
      // Mark division as occupied (for core theory)
      if (!batchId) {
        if (!this.divisionSchedule.has(divisionId)) {
          this.divisionSchedule.set(divisionId, new Set());
        }
        this.divisionSchedule.get(divisionId)!.add(slotKey);
      }
      
      // Mark batch as occupied (for practicals OR elective/minor theory)
      if (batchId) {
        if (!this.batchSchedule.has(batchId)) {
          this.batchSchedule.set(batchId, new Set());
        }
        this.batchSchedule.get(batchId)!.add(slotKey);
      }
    }
  }

  private findAvailableSlot(
    facultyId: string,
    roomId: string,
    divisionId: string,
    batchId: string | undefined,
    duration: number = 1,
    preferEarly: boolean = false
  ): Slot | null {
    const days = [...DAYS];
    const availableSlots = TIME_SLOTS.filter(slot => slot.start !== '12:00');
    
    // For minors, prefer early morning or late evening
    if (preferEarly) {
      for (const day of days) {
        // Try early morning slot (9:00)
        if (this.isSlotAvailable(facultyId, roomId, divisionId, batchId, day, '09:00', duration)) {
          return { day, startTime: '09:00', endTime: this.getEndTime('09:00', duration), duration };
        }
        // Try late slots (after 15:00)
        for (let i = availableSlots.length - 1; i >= 0; i--) {
          const slot = availableSlots[i];
          if (slot.start >= '15:00' && 
              this.isSlotAvailable(facultyId, roomId, divisionId, batchId, day, slot.start, duration)) {
            return { day, startTime: slot.start, endTime: this.getEndTime(slot.start, duration), duration };
          }
        }
      }
    }
    
    // Normal slot finding
    for (const day of days) {
      for (const slot of availableSlots) {
        if (this.isSlotAvailable(facultyId, roomId, divisionId, batchId, day, slot.start, duration)) {
          return { day, startTime: slot.start, endTime: this.getEndTime(slot.start, duration), duration };
        }
      }
    }
    
    return null;
  }

  private getEndTime(startTime: string, duration: number): string {
    const startIndex = TIME_SLOTS.findIndex(t => t.start === startTime);
    let endIndex = startIndex + duration;
    
    // Adjust for break time
    const breakIndex = TIME_SLOTS.findIndex(t => t.start === '12:00');
    if (startIndex < breakIndex && endIndex > breakIndex) {
      endIndex += 1; // Skip break
    }
    
    if (endIndex < TIME_SLOTS.length) {
      return TIME_SLOTS[endIndex].start;
    }
    return TIME_SLOTS[TIME_SLOTS.length - 1].end;
  }

  private calculateDepartmentLoad(department: string, year: string): DepartmentLoad {
    const relevantSubjects = this.subjects.filter(
      s => s.department === department && s.year === year && s.type !== 'MINOR'
    );
    
    const relevantDivisions = this.divisions.filter(
      d => d.department === department && d.year === year
    );
    
    let totalTheoryHours = 0;
    let totalPracticalHours = 0;
    
    relevantSubjects.forEach(subject => {
      const divisionCount = relevantDivisions.length;
      totalTheoryHours += subject.theoryHours * divisionCount;
      
      // Practicals are per batch
      relevantDivisions.forEach(division => {
        totalPracticalHours += subject.practicalHours * division.batches.length;
      });
    });
    
    const allocatedEntries = this.timetableEntries.filter(
      entry => entry.division.department === department && entry.division.year === year
    );
    
    let allocatedTheoryHours = 0;
    let allocatedPracticalHours = 0;
    
    allocatedEntries.forEach(entry => {
      if (entry.type === 'THEORY') {
        const duration = this.getTimeSlots(entry.startTime, 1).length;
        allocatedTheoryHours += duration;
      } else {
        const duration = this.getTimeSlots(entry.startTime, 1).length;
        allocatedPracticalHours += duration;
      }
    });
    
    return {
      department,
      year,
      totalTheoryHours,
      totalPracticalHours,
      allocatedTheoryHours,
      allocatedPracticalHours,
      remainingTheoryHours: totalTheoryHours - allocatedTheoryHours,
      remainingPracticalHours: totalPracticalHours - allocatedPracticalHours,
      unassignedSubjects: relevantSubjects.filter(subject => {
        const isAssigned = allocatedEntries.some(entry => entry.subject.id === subject.id);
        return !isAssigned;
      }),
    };
  }

  // UPDATED: Added 'batch' argument
  private scheduleTheoryClass(
    subject: Subject,
    division: Division,
    hoursNeeded: number,
    batch: Batch | undefined = undefined // ADDED THIS ARGUMENT
  ): boolean {
    const availableFaculty = this.faculty.filter(f => 
      f.subjects.includes(subject.id) && f.currentWorkload < f.maxWorkload
    );
    
    if (availableFaculty.length === 0) return false;
    
    const availableRooms = this.rooms.filter(r => r.category === 'CLASSROOM');
    if (availableRooms.length === 0) return false;
    
    let hoursScheduled = 0;
    
    while (hoursScheduled < hoursNeeded) {
      const faculty = availableFaculty[0];
      const room = availableRooms[0];
      
      // UPDATED: Pass batch?.id to findAvailableSlot
      const slot = this.findAvailableSlot(
        faculty.id,
        room.id,
        division.id,
        batch?.id, // UPDATED
        1,
        subject.type === 'MINOR'
      );
      
      if (!slot) break;
      
      const entry: TimetableEntry = {
        id: `entry-${Date.now()}-${Math.random()}`,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject,
        faculty,
        room,
        division,
        batch: batch, // UPDATED
        type: 'THEORY',
      };
      
      this.timetableEntries.push(entry);
      // UPDATED: Pass batch?.id to markSlotAsOccupied
      this.markSlotAsOccupied(faculty.id, room.id, division.id, batch?.id, slot.day, slot.startTime, slot.duration);
      
      faculty.currentWorkload += slot.duration;
      hoursScheduled += slot.duration;
    }
    
    return hoursScheduled === hoursNeeded;
  }

  private schedulePracticalClass(
    subject: Subject,
    division: Division,
    batch: any,
    hoursNeeded: number
  ): boolean {
    const availableFaculty = this.faculty.filter(f => 
      f.subjects.includes(subject.id) && f.currentWorkload < f.maxWorkload
    );
    
    if (availableFaculty.length === 0) return false;
    
    const availableLabs = this.rooms.filter(r => r.category === 'LAB');
    if (availableLabs.length === 0) return false;
    
    let hoursScheduled = 0;
    
    while (hoursScheduled < hoursNeeded) {
      const faculty = availableFaculty[0];
      const lab = availableLabs[0];
      
      // Practicals usually need 2-hour slots
      const duration = Math.min(2, hoursNeeded - hoursScheduled);
      
      const slot = this.findAvailableSlot(
        faculty.id,
        lab.id,
        division.id,
        batch.id,
        duration,
        false
      );
      
      if (!slot) break;
      
      const entry: TimetableEntry = {
        id: `entry-${Date.now()}-${Math.random()}`,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject,
        faculty,
        room: lab,
        division,
        batch,
        type: 'PRACTICAL',
      };
      
      this.timetableEntries.push(entry);
      this.markSlotAsOccupied(faculty.id, lab.id, division.id, batch.id, slot.day, slot.startTime, slot.duration);
      
      faculty.currentWorkload += slot.duration;
      hoursScheduled += slot.duration;
    }
    
    return hoursScheduled === hoursNeeded;
  }

  public generate(): GeneratedTimetable {
    // Reset schedules
    this.timetableEntries = [];
    this.facultySchedule.clear();
    this.roomSchedule.clear();
    this.divisionSchedule.clear();
    this.batchSchedule.clear();
    
    // Reset faculty workloads
    this.faculty.forEach(f => f.currentWorkload = 0);
    
    // Schedule all subjects for all divisions
    for (const division of this.divisions) {
      const divisionSubjects = this.subjects.filter(
        s => s.department === division.department && s.year === division.year
      );
      
      // First, schedule core subjects and labs
      const coreAndLabSubjects = divisionSubjects.filter(s => s.type === 'CORE' || s.type === 'LAB');
      
      for (const subject of coreAndLabSubjects) {
        // Schedule theory hours (for the whole division, no batch)
        if (subject.theoryHours > 0) {
          this.scheduleTheoryClass(subject, division, subject.theoryHours, undefined);
        }
        
        // Schedule practical hours for each batch
        if (subject.practicalHours > 0) {
          for (const batch of division.batches) {
            this.schedulePracticalClass(subject, division, batch, subject.practicalHours);
          }
        }
      }
      
      // UPDATED: Schedule electives (DLO/ILO) AND MINORS together
      const electiveSubjects = divisionSubjects.filter(s => s.type === 'DLO' || s.type === 'ILO' || s.type === 'MINOR');
      
      for (const subject of electiveSubjects) {
        // Group batches by elective choice
        const batchesByChoice = new Map<string, any[]>();
        
        division.batches.forEach(batch => {
          const choice = batch.electiveChoices?.[subject.id];
          if (choice) {
            if (!batchesByChoice.has(choice)) {
              batchesByChoice.set(choice, []);
            }
            batchesByChoice.get(choice)!.push(batch);
          }
        });
        
        // Schedule for each elective group
        batchesByChoice.forEach((batches, choice) => {
          if (subject.theoryHours > 0) {
            // For electives, schedule theory for each batch group
            batches.forEach(batch => {
              // UPDATED: Pass the batch to scheduleTheoryClass
              this.scheduleTheoryClass(subject, division, subject.theoryHours, batch);
            });
          }
          
          if (subject.practicalHours > 0) {
            batches.forEach(batch => {
              this.schedulePracticalClass(subject, division, batch, subject.practicalHours);
            });
          }
        });
      }
      
      // DELETED: The old, separate scheduling loop for MINORs is removed.
    }
    
    // Organize timetables by division, faculty, and room
    const divisionWise: { [key: string]: TimetableEntry[] } = {};
    const facultyWise: { [key: string]: TimetableEntry[] } = {};
    const roomWise: { [key: string]: TimetableEntry[] } = {};
    
    this.timetableEntries.forEach(entry => {
      const divisionKey = `${entry.division.department}-${entry.division.year}-${entry.division.name}`;
      if (!divisionWise[divisionKey]) divisionWise[divisionKey] = [];
      divisionWise[divisionKey].push(entry);
      
      if (!facultyWise[entry.faculty.id]) facultyWise[entry.faculty.id] = [];
      facultyWise[entry.faculty.id].push(entry);
      
      if (!roomWise[entry.room.id]) roomWise[entry.room.id] = [];
      roomWise[entry.room.id].push(entry);
    });
    
    // Calculate department loads
    const departmentYearPairs = new Set<string>();
    this.divisions.forEach(d => departmentYearPairs.add(`${d.department}-${d.year}`));
    
    const departmentLoads: DepartmentLoad[] = Array.from(departmentYearPairs).map(pair => {
      const [dept, year] = pair.split('-');
      return this.calculateDepartmentLoad(dept, year);
    });
    
    // Find remaining faculty capacity
    const remainingFaculty = this.faculty.filter(f => f.currentWorkload < f.maxWorkload);
    
    // Find vacant room slots
    const vacantRooms = this.rooms.map(room => {
      const vacantSlots: TimeSlot[] = [];
      
      DAYS.forEach(day => {
        TIME_SLOTS.forEach(slot => {
          if (slot.start === '12:00') return; // Skip break
          
          const slotKey = this.createSlotKey(day, slot.start);
          if (!this.roomSchedule.get(room.id)?.has(slotKey)) {
            vacantSlots.push({
              day,
              startTime: slot.start,
              endTime: slot.end,
              duration: 1,
            });
          }
        });
      });
      
      return { room, vacantSlots };
    }).filter(r => r.vacantSlots.length > 0);
    
    return {
      divisionWise,
      facultyWise,
      roomWise,
      departmentLoads,
      remainingFaculty,
      vacantRooms,
    };
  }
}

export default TimetableGenerator;