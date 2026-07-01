import { db } from '../../src/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

/**
 * Resets the Firestore database state when running on local emulators.
 * It uses the Firebase Emulator REST API for fast cleanup, falling back
 * to programmatic batch deletion if needed.
 */
export async function cleanDatabase() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project';

  // 1. Clear Firestore Emulator database
  try {
    const firestoreUrl = `http://127.0.0.1:8080/emulator/v1/projects/${projectId}/databases/(default)/documents`;
    const response = await fetch(firestoreUrl, {
      method: 'DELETE',
    });
    if (!response.ok) {
      console.warn(`Failed to clear Firestore emulator via HTTP: ${response.statusText}`);
      throw new Error('HTTP clear failed');
    }
  } catch (error) {
    console.warn('Error clearing Firestore emulator via HTTP, executing manual collection deletion...');
    const targetCollections = ['profiles', 'users', 'cvs', 'rebuilds'];
    for (const colName of targetCollections) {
      try {
        const querySnapshot = await getDocs(collection(db, colName));
        const deletePromises = querySnapshot.docs.map((docSnap) => 
          deleteDoc(doc(db, colName, docSnap.id))
        );
        await Promise.all(deletePromises);
      } catch (e) {
        // Suppress errors for missing collections or rules blockages
      }
    }
  }

  // 2. Clear Storage Emulator if active
  try {
    const storageUrl = `http://127.0.0.1:9199/emulator/v1/projects/${projectId}/buckets`;
    const response = await fetch(storageUrl, {
      method: 'DELETE',
    });
    if (!response.ok) {
      console.warn(`Failed to clear Storage emulator via HTTP: ${response.statusText}`);
    }
  } catch (error) {
    // Suppress Storage cleanup errors since it's mock/emulator dependent
  }
}
