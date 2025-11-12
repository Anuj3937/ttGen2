import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Faculty } from '@/lib/types';

// GET /api/faculty
// Fetches all faculty from Firestore
export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await getDocs(collection(db, 'faculty'));
    const faculty: Faculty[] = [];
    querySnapshot.forEach((doc) => {
      faculty.push({ id: doc.id, ...doc.data() } as Faculty);
    });
    return NextResponse.json(faculty);
  } catch (error: any) {
    console.error('Error fetching faculty: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/faculty
// Creates a new faculty member in Firestore
export async function POST(request: NextRequest) {
  try {
    const facultyData = (await request.json()) as Omit<Faculty, 'id'>;

    // Ensure currentWorkload is initialized
    const dataToSave = {
      ...facultyData,
      currentWorkload: facultyData.currentWorkload || 0,
    };

    const docRef = await addDoc(collection(db, 'faculty'), dataToSave);

    const newFaculty: Faculty = {
      id: docRef.id,
      ...dataToSave,
    };
    
    return NextResponse.json(newFaculty, { status: 201 });
  } catch (error: any) {
    console.error('Error creating faculty: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}