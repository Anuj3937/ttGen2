import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';
import { Subject } from '@/lib/types';

// GET /api/subjects
// Fetches all subjects from Firestore
export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await getDocs(collection(db, 'subjects'));
    const subjects: Subject[] = [];
    querySnapshot.forEach((doc) => {
      // Combine doc id and data into a single object
      subjects.push({ id: doc.id, ...doc.data() } as Subject);
    });
    return NextResponse.json(subjects);
  } catch (error: any) {
    console.error('Error fetching subjects: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/subjects
// Creates a new subject in Firestore
export async function POST(request: NextRequest) {
  try {
    const subjectData = (await request.json()) as Omit<Subject, 'id'>;

    // Use addDoc to let Firestore generate an ID
    const docRef = await addDoc(collection(db, 'subjects'), subjectData);

    // Return the newly created subject with its Firestore-generated ID
    const newSubject: Subject = {
      id: docRef.id,
      ...subjectData,
    };
    
    return NextResponse.json(newSubject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subject: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}