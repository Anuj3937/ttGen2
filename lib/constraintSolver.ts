import { Subject, Division, Faculty, Room, TimetableEntry, DAYS, TIME_SLOTS } from './types';

interface Constraint {
  type: string;
  check: (entry: TimetableEntry, allEntries: TimetableEntry[]) => boolean;
  weight: number;
}

export class AdvancedConstraintSolver {
  private constraints: Constraint[] = [];

  constructor() {
    this.initializeConstraints();
  }

  private initializeConstraints() {
    // Hard Constraints (must be satisfied)
    this.addConstraint({
      type: 'NO_FACULTY_CONFLICT',
      check: (entry, allEntries) => {
        return !allEntries.some(
          e =>
            e.id !== entry.id &&
            e.faculty.id === entry.faculty.id &&
            e.day === entry.day &&
            e.startTime === entry.startTime
        );
      },
      weight: 100,
    });

    this.addConstraint({
      type: 'NO_ROOM_CONFLICT',
      check: (entry, allEntries) => {
        return !allEntries.some(
          e =>
            e.id !== entry.id &&
            e.room.id === entry.room.id &&
            e.day === entry.day &&
            e.startTime === entry.startTime
        );
      },
      weight: 100,
    });

    this.addConstraint({
      type: 'NO_DIVISION_CONFLICT',
      check: (entry, allEntries) => {
        if (entry.type === 'THEORY') {
          return !allEntries.some(
            e =>
              e.id !== entry.id &&
              e.type === 'THEORY' &&
              e.division.id === entry.division.id &&
              e.day === entry.day &&
              e.startTime === entry.startTime
          );
        }
        return true;
      },
      weight: 100,
    });

    this.addConstraint({
      type: 'NO_BATCH_CONFLICT',
      check: (entry, allEntries) => {
        if (entry.batch) {
          return !allEntries.some(
            e =>
              e.id !== entry.id &&
              e.batch?.id === entry.batch?.id &&
              e.day === entry.day &&
              e.startTime === entry.startTime
          );
        }
        return true;
      },
      weight: 100,
    });

    // Soft Constraints (preferred but not required)
    this.addConstraint({
      type: 'FACULTY_WORKLOAD_BALANCED',
      check: (entry, allEntries) => {
        const facultyEntries = allEntries.filter(
          e => e.faculty.id === entry.faculty.id
        );
        const workload = facultyEntries.length;
        return workload <= entry.faculty.maxWorkload;
      },
      weight: 50,
    });

    this.addConstraint({
      type: 'NO_GAPS_IN_SCHEDULE',
      check: (entry, allEntries) => {
        const divisionEntries = allEntries.filter(
          e =>
            e.division.id === entry.division.id &&
            e.day === entry.day &&
            !e.batch
        );

        if (divisionEntries.length <= 1) return true;

        const times = divisionEntries
          .map(e => TIME_SLOTS.findIndex(t => t.start === e.startTime))
          .sort((a, b) => a - b);

        for (let i = 0; i < times.length - 1; i++) {
          if (times[i + 1] - times[i] > 2) {
            return false; // Gap detected
          }
        }

        return true;
      },
      weight: 30,
    });

    this.addConstraint({
      type: 'THEORY_BEFORE_PRACTICAL',
      check: (entry, allEntries) => {
        if (entry.type === 'PRACTICAL') {
          const theoryEntry = allEntries.find(
            e =>
              e.type === 'THEORY' &&
              e.subject.id === entry.subject.id &&
              e.division.id === entry.division.id
          );

          if (theoryEntry) {
            const entryDayIndex = DAYS.indexOf(entry.day);
            const theoryDayIndex = DAYS.indexOf(theoryEntry.day);
            return theoryDayIndex <= entryDayIndex;
          }
        }
        return true;
      },
      weight: 20,
    });

    this.addConstraint({
      type: 'AVOID_LATE_SLOTS',
      check: (entry, allEntries) => {
        const timeIndex = TIME_SLOTS.findIndex(t => t.start === entry.startTime);
        return timeIndex < 6; // Avoid slots after 3 PM
      },
      weight: 10,
    });
  }

  addConstraint(constraint: Constraint) {
    this.constraints.push(constraint);
  }

  validateEntry(entry: TimetableEntry, allEntries: TimetableEntry[]): {
    isValid: boolean;
    score: number;
    violations: string[];
  } {
    let score = 0;
    const violations: string[] = [];

    this.constraints.forEach(constraint => {
      if (constraint.check(entry, allEntries)) {
        score += constraint.weight;
      } else {
        violations.push(constraint.type);
        if (constraint.weight === 100) {
          // Hard constraint violation
          score = 0;
        }
      }
    });

    return {
      isValid: violations.filter(v => {
        const constraint = this.constraints.find(c => c.type === v);
        return constraint?.weight === 100;
      }).length === 0,
      score,
      violations,
    };
  }

  optimizeSchedule(entries: TimetableEntry[]): TimetableEntry[] {
    // Simple optimization: sort entries by score
    const scoredEntries = entries.map(entry => ({
      entry,
      validation: this.validateEntry(entry, entries),
    }));

    return scoredEntries
      .sort((a, b) => b.validation.score - a.validation.score)
      .map(se => se.entry);
  }

  findBestSlot(
    subject: Subject,
    division: Division,
    faculty: Faculty,
    room: Room,
    batch: any | undefined,
    type: 'THEORY' | 'PRACTICAL',
    existingEntries: TimetableEntry[]
  ): { day: string; startTime: string } | null {
    const candidates: Array<{
      day: string;
      startTime: string;
      score: number;
    }> = [];

    for (const day of DAYS) {
      for (const slot of TIME_SLOTS) {
        if (slot.start === '12:00') continue; // Skip break

        const testEntry: TimetableEntry = {
          id: 'test',
          day,
          startTime: slot.start,
          endTime: slot.end,
          subject,
          faculty,
          room,
          division,
          batch,
          type,
        };

        const validation = this.validateEntry(testEntry, existingEntries);
        if (validation.isValid) {
          candidates.push({
            day,
            startTime: slot.start,
            score: validation.score,
          });
        }
      }
    }

    if (candidates.length === 0) return null;

    // Return the slot with highest score
    candidates.sort((a, b) => b.score - a.score);
    return candidates[0];
  }
}
