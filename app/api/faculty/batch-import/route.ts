import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Faculty } from '@/lib/types';

// POST /api/faculty/batch-import
// Imports an array of new faculty into Firestore
export async function POST(request: NextRequest) {
  try {
    const facultyToImport = (await request.json()) as Omit<Faculty, 'id'>[];

    if (!Array.isArray(facultyToImport) || facultyToImport.length === 0) {
      return NextResponse.json({ error: 'No faculty to import' }, { status: 400 });
    }

    const batch = writeBatch(db);
    const facultyCollection = collection(db, 'faculty');
    const importedFaculty: Faculty[] = [];

    facultyToImport.forEach((facultyData) => {
      const docRef = doc(facultyCollection); 
      
      // Ensure currentWorkload is initialized
      const dataToSave = {
        ...facultyData,
        currentWorkload: 0,
        subjects: facultyData.subjects || [],
        preferences: facultyData.preferences || {},
      };
      
      batch.set(docRef, dataToSave);
      
      importedFaculty.push({
        id: docRef.id,
        ...dataToSave,
      });
    });

    await batch.commit();

    return NextResponse.json(
      { 
        message: `Successfully imported ${importedFaculty.length} faculty members.`,
        importedFaculty: importedFaculty,
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error batch importing faculty: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}