import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Subject } from '@/lib/types';

interface Params {
  params: { id: string };
}

// GET /api/subjects/[id]
// Fetches a single subject by ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'subjects', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    const subject: Subject = { id: docSnap.id, ...docSnap.data() } as Subject;
    return NextResponse.json(subject);
  } catch (error: any) {
    console.error('Error fetching subject: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/subjects/[id]
// Updates a single subject by ID
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const updateData = (await request.json()) as Partial<Subject>;
    
    // Remove 'id' from updateData if it exists, as we don't want to update the ID
    delete updateData.id; 

    const docRef = doc(db, 'subjects', id);
    await updateDoc(docRef, updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error('Error updating subject: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/subjects/[id]
// Deletes a single subject by ID
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'subjects', id);
    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Subject deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting subject: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}