import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Division } from '@/lib/types';

// POST /api/divisions/batch-import
// Imports an array of new divisions into Firestore
export async function POST(request: NextRequest) {
  try {
    const divisionsToImport = (await request.json()) as Omit<Division, 'id'>[];

    if (!Array.isArray(divisionsToImport) || divisionsToImport.length === 0) {
      return NextResponse.json({ error: 'No divisions to import' }, { status: 400 });
    }

    const batch = writeBatch(db);
    const divisionsCollection = collection(db, 'divisions');
    const importedDivisions: Division[] = [];

    divisionsToImport.forEach((divisionData) => {
      const docRef = doc(divisionsCollection); 
      batch.set(docRef, divisionData);
      
      importedDivisions.push({
        id: docRef.id,
        ...divisionData,
      });
    });

    await batch.commit();

    return NextResponse.json(
      { 
        message: `Successfully imported ${importedDivisions.length} divisions.`,
        importedDivisions: importedDivisions,
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error batch importing divisions: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}