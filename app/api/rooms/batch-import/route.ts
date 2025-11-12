import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Room } from '@/lib/types';

// POST /api/rooms/batch-import
// Imports an array of new rooms into Firestore
export async function POST(request: NextRequest) {
  try {
    const roomsToImport = (await request.json()) as Omit<Room, 'id'>[];

    if (!Array.isArray(roomsToImport) || roomsToImport.length === 0) {
      return NextResponse.json({ error: 'No rooms to import' }, { status: 400 });
    }

    const batch = writeBatch(db);
    const roomsCollection = collection(db, 'rooms');
    const importedRooms: Room[] = [];

    roomsToImport.forEach((roomData) => {
      const docRef = doc(roomsCollection); 
      batch.set(docRef, roomData);
      
      importedRooms.push({
        id: docRef.id,
        ...roomData,
      });
    });

    await batch.commit();

    return NextResponse.json(
      { 
        message: `Successfully imported ${importedRooms.length} rooms.`,
        importedRooms: importedRooms,
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error batch importing rooms: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}