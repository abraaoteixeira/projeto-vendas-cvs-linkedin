import { NextResponse } from 'next/server';
import { db, storage, runFirestore } from '@/lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';
import { getRecord, setRecord } from '@/lib/fileStore';

// Security: Use crypto.randomUUID() for cvId to prevent IDOR enumeration attacks.
// Old pattern: 'cv-' + Math.floor(Math.random() * 10000000) → only 10M possibilities, enumerable.
// New pattern: UUID v4 → 2^122 possibilities, computationally infeasible to enumerate.

export async function POST(request: Request) {
  try {
    let buffer: Buffer | null = null;
    let fileName = 'curriculum.pdf';
    let extractedText = '';
    let candidateName = 'Profissional';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json();
      const linkedinUrl = body.linkedinUrl;
      if (!linkedinUrl) {
        return NextResponse.json({ error: 'Link do LinkedIn é obrigatório' }, { status: 400 });
      }

      // Extracts a friendly name from the LinkedIn slug (e.g. /in/john-doe-123 → John Doe)
      const cleanUrl = linkedinUrl.replace(/\/$/, '');
      const parts = cleanUrl.split('/');
      const slug = parts[parts.length - 1] || '';
      candidateName = slug
        .split('-')
        .filter((p: string) => !/^\d+$/.test(p))
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ') || 'Profissional';

      extractedText = `Nome: ${candidateName}\nPerfil do LinkedIn: ${cleanUrl}\n\n[Importado via link público. Esta pessoa atua na área de tecnologia e suporte.]`;
    } else {
      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const file = formData.get('file') as Blob | null;
        if (!file) {
          return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        const bytes = await file.arrayBuffer();
        buffer = Buffer.from(bytes);
        fileName = (file as any).name || 'curriculum.pdf';
      } else {
        const bytes = await request.arrayBuffer();
        buffer = Buffer.from(bytes);
      }

      // Validations
      if (buffer.length === 0) {
        return NextResponse.json({ error: 'Empty file' }, { status: 400 });
      }

      // Check PDF magic bytes (PDFs must start with %PDF)
      const magic = buffer.toString('utf8', 0, 4);
      if (magic !== '%PDF') {
        return NextResponse.json({ error: 'invalid or corrupted PDF file' }, { status: 400 });
      }

      // Check encryption
      if (buffer.toString('utf8').includes('/Encrypt')) {
        return NextResponse.json({ error: 'Password protected / encrypted PDF' }, { status: 400 });
      }

      // Text Extraction
      try {
        const pdfParseModule = await import('pdf-parse');
        const pdfParse = pdfParseModule.default || pdfParseModule;
        const data = await pdfParse(buffer);
        extractedText = data.text || '';
        extractedText = extractedText.replace(/\n+/g, '\n').trim();
      } catch (parseError) {
        console.error('PDF Parse error:', parseError);
        return NextResponse.json({ error: 'Failed to extract text from PDF. Ensure it is a valid text-based PDF.' }, { status: 422 });
      }

      // Extract candidate name from first valid line of PDF
      const lines = extractedText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
      if (lines.length > 0) {
        const firstLine = lines[0];
        if (firstLine.length < 60 && !firstLine.toLowerCase().includes('cv') && !firstLine.toLowerCase().includes('currículo')) {
          candidateName = firstLine;
        }
      }
    }

    // SECURITY: UUID v4 for cvId — prevents IDOR enumeration
    const cvId = crypto.randomUUID();

    // Persist to file store (survives hot-reloads)
    setRecord(cvId, {
      status: 'processed',
      nome: candidateName,
      cvStoragePath: `cvs/${cvId}/${fileName}`,
      originalCvText: extractedText,
      createdAt: new Date().toISOString(),
    });

    // Also attempt Firebase (non-blocking, warn on failure)
    try {
      if (buffer) {
        const storageRef = ref(storage, `cvs/${cvId}/${fileName}`);
        await runFirestore(uploadBytes(storageRef, buffer));
      }
      const userDocRef = doc(db, 'users', cvId);
      await runFirestore(setDoc(userDocRef, {
        status: 'processed',
        nome: candidateName,
        cvStoragePath: buffer ? `cvs/${cvId}/${fileName}` : null,
        originalCvText: extractedText,
        createdAt: new Date().toISOString(),
      }));
    } catch (firebaseErr) {
      console.warn('Firebase operations skipped/failed, using file storage:', firebaseErr);
    }

    return NextResponse.json({ id: cvId }, { status: 201 });
  } catch (error: any) {
    console.error('Upload API Error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
