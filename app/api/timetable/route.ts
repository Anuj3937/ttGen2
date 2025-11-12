import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, runTransaction, query, where, getDoc } from 'firebase/firestore';
import { TimetableEntry, Faculty, Division, Room } from '@/lib/types';

// GET /api/timetable (Same as before)
export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await getDocs(collection(db, 'timetable'));
    const timetable: TimetableEntry[] = [];
    querySnapshot.forEach((doc) => {
      timetable.push({ id: doc.id, ...doc.data() } as TimetableEntry);
    });
    return NextResponse.json(timetable);
  } catch (error: any) {
    console.error('Error fetching timetable: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- UPDATED POST FUNCTION ---
// POST /api/timetable
// Creates a new timetable entry after checking for conflicts
export async function POST(request: NextRequest) {
  try {
    const entryData = (await request.json()) as Omit<TimetableEntry, 'id'>;

    const { day, startTime, faculty, room, allocationId } = entryData;

    const timetableRef = collection(db, 'timetable');
    
    // 1. Check if this *exact allocation* is already scheduled
    // This prevents scheduling "OS Theory for Div A" twice by mistake
    const allocConflictQuery = query(timetableRef,
      where('allocationId', '==', allocationId)
    );
    const allocConflictSnap = await getDocs(allocConflictQuery);
    if (!allocConflictSnap.empty) {
      throw new Error(`This allocation is already scheduled.`);
    }

    // 2. Check for Faculty Conflict
    const facultyConflictQuery = query(timetableRef,
      where('day', '==', day),
      where('startTime', '==', startTime),
      where('faculty.id', '==', faculty.id)
    );
    const facultyConflictSnap = await getDocs(facultyConflictQuery);
    if (!facultyConflictSnap.empty) {
      throw new Error(`Faculty ${faculty.initials} is already busy at this time.`);
    }

    // 3. Check for Room Conflict
    const roomConflictQuery = query(timetableRef,
      where('day', '==', day),
      where('startTime', '==', startTime),
      where('room.id', '==', room.id)
    );
    const roomConflictSnap = await getDocs(roomConflictQuery);
    if (!roomConflictSnap.empty) {
      throw new Error(`Room ${room.roomNumber} is already booked at this time.`);
    }
    
    // 4. Check for Division/Batch Conflict
    // (We can use allocationId to find the original allocation)
    const allocDoc = await getDoc(doc(db, 'allocations', allocationId));
    if (!allocDoc.exists()) throw new Error('Original allocation not found');
    
    const { batch, division } = allocDoc.data();

    if (batch && batch.id) {
      // It's a practical, check the BATCH
      const batchConflictQuery = query(timetableRef,
        where('day', '==', day),
        where('startTime', '==', startTime),
        where('batch.id', '==', batch.id)
      );
      const batchConflictSnap = await getDocs(batchConflictQuery);
      if (!batchConflictSnap.empty) {
        throw new Error(`Batch ${batch.name} is already busy at this time.`);
      }
    } else {
      // It's a theory class, check the whole DIVISION
      const divisionConflictQuery = query(timetableRef,
        where('day', '==', day),
        where('startTime', '==', startTime),
        where('division.id', '==', division.id),
        where('batch', '==', null)
      );
      const divisionConflictSnap = await getDocs(divisionConflictQuery);
      if (!divisionConflictSnap.empty) {
         throw new Error(`Division ${division.name} already has a theory class at this time.`);
      }
    }

    // All checks passed. Create the new entry.
    const docRef = await addDoc(timetableRef, entryData);
    const newEntry: TimetableEntry = {
      id: docRef.id,
      ...entryData,
    };
    
    return NextResponse.json(newEntry, { status: 201 });

  } catch (error: any) {
    console.error('Error creating timetable entry: ', error);
    return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
  }
}