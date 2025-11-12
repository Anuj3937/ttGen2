import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Room } from '@/lib/types';

interface Params {
  params: { id: string };
}

// GET /api/rooms/[id]
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'rooms', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const room: Room = { id: docSnap.id, ...docSnap.data() } as Room;
    return NextResponse.json(room);
  } catch (error: any) {
    console.error('Error fetching room: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/rooms/[id]
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const updateData = (await request.json()) as Partial<Room>;
    
    delete updateData.id; 

    const docRef = doc(db, 'rooms', id);
    await updateDoc(docRef, updateData);

    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    console.error('Error updating room: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/rooms/[id]
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = params;
    const docRef = doc(db, 'rooms', id);
    await deleteDoc(docRef);

    return NextResponse.json({ message: 'Room deleted successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error deleting room: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}