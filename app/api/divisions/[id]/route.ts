import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Division } from '@/lib/types';

interface Params {
  params: { id: string };
}

// GET /api/divisions/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'divisions', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Division not found' }, { status: 404 });
    }

    const division: Division = { id: docSnap.id, ...docSnap.data() } as Division;
    return NextResponse.json(division);
  } catch (error: any) {
    console.error('Error fetching division: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/divisions/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const updateData = (await request.json()) as Partial<Division>;
    
    delete updateData.id; 

    const docRef = doc(db, 'divisions', id);
    await updateDoc(docRef, updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error('Error updating division: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/divisions/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'divisions', id);
    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Division deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting division: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}