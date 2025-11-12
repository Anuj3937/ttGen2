import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { Subject } from '@/lib/types';

// POST /api/subjects/batch-import
// Imports an array of new subjects into Firestore
export async function POST(request: NextRequest) {
  try {
    const subjectsToImport = (await request.json()) as Omit<Subject, 'id'>[];

    if (!Array.isArray(subjectsToImport) || subjectsToImport.length === 0) {
      return NextResponse.json({ error: 'No subjects to import' }, { status: 400 });
    }

    const batch = writeBatch(db);
    const subjectsCollection = collection(db, 'subjects');
    const importedSubjects: Subject[] = [];

    subjectsToImport.forEach((subjectData) => {
      // Let Firestore generate a new unique ID for each doc
      const docRef = doc(subjectsCollection); 
      batch.set(docRef, subjectData);
      
      // Prepare the object to be returned to the client
      importedSubjects.push({
        id: docRef.id,
        ...subjectData,
      });
    });

    await batch.commit();

    return NextResponse.json(
      { 
        message: `Successfully imported ${importedSubjects.length} subjects.`,
        importedSubjects: importedSubjects,
      }, 
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error batch importing subjects: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}