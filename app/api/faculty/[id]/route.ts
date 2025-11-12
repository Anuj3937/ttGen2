import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Faculty } from '@/lib/types';

interface Params {
  params: { id: string };
}

// GET /api/faculty/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'faculty', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    const faculty: Faculty = { id: docSnap.id, ...docSnap.data() } as Faculty;
    return NextResponse.json(faculty);
  } catch (error: any) {
    console.error('Error fetching faculty: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/faculty/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const updateData = (await request.json()) as Partial<Faculty>;
    
    delete updateData.id; 

    const docRef = doc(db, 'faculty', id);
    await updateDoc(docRef, updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error('Error updating faculty: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/faculty/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'faculty', id);
    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Faculty deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting faculty: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}