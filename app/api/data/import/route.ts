import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

// POST /api/data/import
// Wipes existing data and imports from a JSON backup
export async function POST(request: NextRequest) {
  try {
    const importFile = await request.json();

    if (importFile?.version !== '2.0-firestore' || !importFile.data) {
      return NextResponse.json({ error: 'Invalid import file format.' }, { status: 400 });
    }

    const { data } = importFile;
    const collections = ['subjects', 'divisions', 'faculty', 'rooms', 'allocations'];
    
    // NOTE: This is a destructive import. It does not delete old data first.
    // A more robust solution would first wipe all collections, but that's a dangerous operation.
    // For now, we will just write/overwrite based on IDs.
    
    const batch = writeBatch(db);
    let count = 0;

    for (const collName of collections) {
      if (data[collName]) {
        for (const item of data[collName]) {
          if (item.id) {
            const docRef = doc(db, collName, item.id); // Use the existing ID
            const { id, ...itemData } = item; // Remove ID from the data object
            batch.set(docRef, itemData);
            count++;
          }
        }
      }
    }

    await batch.commit();

    return NextResponse.json({ message: `Successfully imported ${count} documents.` });

  } catch (error: any) {
    console.error('Error importing data: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}