import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Room } from '@/lib/types';

// GET /api/rooms
// Fetches all rooms from Firestore
export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await getDocs(collection(db, 'rooms'));
    const rooms: Room[] = [];
    querySnapshot.forEach((doc) => {
      rooms.push({ id: doc.id, ...doc.data() } as Room);
    });
    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('Error fetching rooms: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/rooms
// Creates a new room in Firestore
export async function POST(request: NextRequest) {
  try {
    const roomData = (await request.json()) as Omit<Room, 'id'>;

    const docRef = await addDoc(collection(db, 'rooms'), roomData);

    const newRoom: Room = {
      id: docRef.id,
      ...roomData,
    };
    
    return NextResponse.json(newRoom, { status: 201 });
  } catch (error: any) {
    console.error('Error creating room: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}