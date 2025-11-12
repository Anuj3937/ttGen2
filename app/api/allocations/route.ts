import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, runTransaction } from 'firebase/firestore';
import { SubjectAllocation, Faculty } from '@/lib/types';

// GET /api/allocations
// Fetches all allocations from Firestore
export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await getDocs(collection(db, 'allocations'));
    const allocations: SubjectAllocation[] = [];
    querySnapshot.forEach((doc) => {
      allocations.push({ id: doc.id, ...doc.data() } as SubjectAllocation);
    });
    return NextResponse.json(allocations);
  } catch (error: any) {
    console.error('Error fetching allocations: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/allocations
// Creates a new allocation AND updates the faculty's workload in a transaction
export async function POST(request: NextRequest) {
  try {
    const allocationData = (await request.json()) as Omit<SubjectAllocation, 'id'>;

    if (!allocationData.facultyId || !allocationData.hours) {
      return NextResponse.json({ error: 'Missing facultyId or hours' }, { status: 400 });
    }

    const facultyRef = doc(db, 'faculty', allocationData.facultyId);
    const allocationRef = doc(collection(db, 'allocations'));

    let newAllocation: SubjectAllocation | null = null;

    // Run as a transaction
    await runTransaction(db, async (transaction) => {
      const facultyDoc = await transaction.get(facultyRef);
      if (!facultyDoc.exists()) {
        throw new Error('Faculty not found');
      }

      const facultyData = facultyDoc.data() as Faculty;
      const newWorkload = (facultyData.currentWorkload || 0) + allocationData.hours;

      if (newWorkload > facultyData.maxWorkload) {
        throw new Error(`Faculty workload limit exceeded (${newWorkload}h > ${facultyData.maxWorkload}h)`);
      }

      // 1. Update the faculty's workload
      transaction.update(facultyRef, { currentWorkload: newWorkload });

      // 2. Create the new allocation
      newAllocation = {
        id: allocationRef.id,
        ...allocationData,
      };
      transaction.set(allocationRef, allocationData);
    });

    return NextResponse.json(newAllocation, { status: 201 });

  } catch (error: any)
  {
    console.error('Error creating allocation: ', error);
    // Send back the specific error message (e.g., "Faculty workload limit exceeded")
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}