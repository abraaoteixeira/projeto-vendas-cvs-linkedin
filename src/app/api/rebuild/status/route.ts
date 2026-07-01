export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db, runFirestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getRecord } from '@/lib/fileStore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cvId = searchParams.get('cvId');

    if (!cvId) {
      return NextResponse.json({ error: 'cvId is required' }, { status: 400 });
    }

    // 1. Check persistent file store first (survives hot-reloads)
    const fileDoc = getRecord(cvId);
    if (fileDoc) {
      return NextResponse.json({ status: fileDoc.status || 'processing' });
    }

    // 2. Fallback to Firestore
    try {
      const docRef = doc(db, 'users', cvId);
      const docSnap = await runFirestore(getDoc(docRef));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return NextResponse.json({ status: data.status || 'processing' });
      }
    } catch (e) {
      console.warn('Firestore read skipped/failed:', e);
    }

    return NextResponse.json({ status: 'failed', error: 'Document not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Status API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
