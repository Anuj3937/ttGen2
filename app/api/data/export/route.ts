import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// GET /api/data/export
// Fetches all data from all collections for export
export async function GET(request: NextRequest) {
  try {
    const collections = ['subjects', 'divisions', 'faculty', 'rooms', 'allocations'];
    const exportData: { [key: string]: any[] } = {};

    for (const collName of collections) {
      const querySnapshot = await getDocs(collection(db, collName));
      const data: any[] = [];
      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      exportData[collName] = data;
    }

    // Add metadata
    const exportFile = {
      version: '2.0-firestore',
      timestamp: new Date().toISOString(),
      data: exportData,
    };

    return NextResponse.json(exportFile);
  } catch (error: any) {
    console.error('Error exporting data: ', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}