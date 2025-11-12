import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc, runTransaction } from 'firebase/firestore';
import { SubjectAllocation, Faculty } from '@/lib/types';

interface Params {
  params: { id: string };
}

// DELETE /api/allocations/[id]
// Deletes an allocation AND updates the faculty's workload in a transaction
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const allocationRef = doc(db, 'allocations', id);

    await runTransaction(db, async (transaction) => {
      const allocationDoc = await transaction.get(allocationRef);
      if (!allocationDoc.exists()) {
        throw new Error('Allocation not found');
      }

      const allocationData = allocationDoc.data() as SubjectAllocation;
      const facultyRef = doc(db, 'faculty', allocationData.facultyId);
      
      const facultyDoc = await transaction.get(facultyRef);
      if (facultyDoc.exists()) {
        const facultyData = facultyDoc.data() as Faculty;
        const newWorkload = Math.max(0, (facultyData.currentWorkload || 0) - allocationData.hours);
        
        // 1. Update (decrement) the faculty's workload
        transaction.update(facultyRef, { currentWorkload: newWorkload });
      }

      // 2. Delete the allocation
      transaction.delete(allocationRef);
    });

    return NextResponse.json({ message: 'Allocation deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting allocation: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}