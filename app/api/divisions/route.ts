import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { Division } from '@/lib/types';

// GET /api/divisions
// Fetches all divisions from Firestore
export async function GET(request: NextRequest) {
  try {
    const querySnapshot = await getDocs(collection(db, 'divisions'));
    const divisions: Division[] = [];
    querySnapshot.forEach((doc) => {
      divisions.push({ id: doc.id, ...doc.data() } as Division);
    });
    return NextResponse.json(divisions);
  } catch (error: any) {
    console.error('Error fetching divisions: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/divisions
// Creates a new division in Firestore
export async function POST(request: NextRequest) {
  try {
    const divisionData = (await request.json()) as Omit<Division, 'id'>;

    const docRef = await addDoc(collection(db, 'divisions'), divisionData);

    const newDivision: Division = {
      id: docRef.id,
      ...divisionData,
    };
    
    return NextResponse.json(newDivision, { status: 201 });
  } catch (error: any) {
    console.error('Error creating division: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}