import { NextRequest, NextResponse } from 'next/server';
import { db, collection, addDoc, doc, updateDoc } from '@/lib/firebase';

export async function POST(request: NextRequest) {
  try {
    const { timetable, metadata } = await request.json();

    const docRef = await addDoc(collection(db, 'timetables'), {
      timetable,
      metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: 'Timetable saved successfully' 
    });
  } catch (error: any) {
    console.error('Firebase Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, timetable, metadata } = await request.json();

    await updateDoc(doc(db, 'timetables', id), {
      timetable,
      metadata,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Timetable updated successfully' 
    });
  } catch (error: any) {
    console.error('Firebase Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
