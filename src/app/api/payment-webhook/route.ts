import { NextResponse } from 'next/server';
import { db, runFirestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body || !body.userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const userId = body.userId;

    // Persist paid status in mock database
    const g = globalThis as any;
    if (!g.mockDb) g.mockDb = {};
    if (!g.mockDb[userId]) {
      g.mockDb[userId] = { status: 'paid', updatedAt: new Date() };
    } else {
      g.mockDb[userId].status = 'paid';
      g.mockDb[userId].updatedAt = new Date();
    }

    try {
      // Persist paid status in Firestore (idempotent & supports out-of-order/duplicate requests)
      const userDocRef = doc(db, 'users', userId);
      await runFirestore(setDoc(userDocRef, {
        status: 'paid',
        updatedAt: new Date()
      }, { merge: true }));
    } catch (e) {
      console.warn('Firestore webhook write failed/skipped, using mockDb:', e);
    }

    return NextResponse.json({ updated: true });
  } catch (error: any) {
    console.error('Webhook API Error:', error);
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }
}
