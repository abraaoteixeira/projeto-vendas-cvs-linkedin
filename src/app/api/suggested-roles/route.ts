import { NextResponse } from 'next/server';
import { db, runFirestore } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cvId = searchParams.get('cvId');

    if (!cvId) {
      return NextResponse.json({ error: 'cvId is required' }, { status: 400 });
    }

    const g = globalThis as any;
    let cvText = '';

    if (g.mockDb?.[cvId]) {
      cvText = g.mockDb[cvId].originalCvText || '';
      
      // If already generated, return cached
      if (g.mockDb[cvId].suggestedRoles) {
        return NextResponse.json({ roles: g.mockDb[cvId].suggestedRoles });
      }
    } else {
      try {
        const docRef = doc(db, 'users', cvId);
        const docSnap = await runFirestore(getDoc(docRef));
        if (docSnap.exists()) {
          cvText = docSnap.data().originalCvText || '';
          if (docSnap.data().suggestedRoles) {
            return NextResponse.json({ roles: docSnap.data().suggestedRoles });
          }
        }
      } catch (e) {
        // ignore
      }
    }

    if (!cvText) {
      return NextResponse.json({ error: 'CV text not found' }, { status: 404 });
    }

    let suggestedRoles = ["Especialista na sua área", "Cargo de Liderança", "Cargo Estratégico"];

    if (process.env.NVIDIA_API_KEY) {
      try {
        const prompt = `Analise o currículo a seguir e retorne EXATAMENTE UM JSON VÁLIDO contendo um array de 3 strings com sugestões de cargos adequados (titles de emprego) para essa pessoa no LinkedIn. Seja criativo mas realista. Formato: {"roles": ["Cargo 1", "Cargo 2", "Cargo 3"]}. CURRÍCULO: ${cvText.substring(0, 3000)}`;
        
        const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`
          },
          body: JSON.stringify({
            model: 'meta/llama-3.1-70b-instruct',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.5,
            max_tokens: 300,
          })
        });

        if (res.ok) {
          const data = await res.json();
          let raw = data.choices[0].message.content ?? '{}';
          if (raw.includes('\`\`\`json')) raw = raw.split('\`\`\`json')[1].split('\`\`\`')[0].trim();
          else if (raw.includes('\`\`\`')) raw = raw.split('\`\`\`')[1].trim();
          
          const jsonStart = raw.indexOf('{');
          const jsonEnd = raw.lastIndexOf('}');
          if (jsonStart !== -1 && jsonEnd !== -1) {
            raw = raw.slice(jsonStart, jsonEnd + 1);
          }
          
          const parsed = JSON.parse(raw);
          if (parsed.roles && Array.isArray(parsed.roles)) {
            suggestedRoles = parsed.roles.slice(0, 3);
          }
        }
      } catch (e) {
        console.error("Erro gerando roles:", e);
      }
    }

    // Save to cache
    if (!g.mockDb) g.mockDb = {};
    if (!g.mockDb[cvId]) g.mockDb[cvId] = { originalCvText: cvText };
    g.mockDb[cvId].suggestedRoles = suggestedRoles;

    return NextResponse.json({ roles: suggestedRoles });
  } catch (error: any) {
    console.error('Suggested Roles API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
