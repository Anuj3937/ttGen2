import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

interface Params {
  params: { id: string };
}

// DELETE /api/timetable/[id]
// Deletes a single timetable entry
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'timetable', id);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Timetable entry deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting timetable entry: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}