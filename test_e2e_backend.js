const fs = require('fs');
const path = require('path');

async function runTest() {
  console.log("=== INICIANDO TESTE E2E DO BACKEND (KITCHEN) ===");

  const cvPath = path.join(__dirname, 'abraao_cv.pdf');
  if (!fs.existsSync(cvPath)) {
    console.error(`Erro: Arquivo PDF do currículo não encontrado em: ${cvPath}`);
    process.exit(1);
  }

  try {
    // 1. Upload do PDF
    console.log("\n[Passo 1] Enviando o currículo 'abraao_cv.pdf' para /api/upload...");
    const fileBuffer = fs.readFileSync(cvPath);
    
    // Simula FormData usando a API nativa do Node 18+ (Blob e FormData globais)
    const blob = new Blob([fileBuffer], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, 'abraao_cv.pdf');

    const uploadRes = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(`Falha no upload: ${uploadRes.status} - ${errText}`);
    }

    const uploadData = await uploadRes.json();
    const cvId = uploadData.id;
    console.log(`[Passo 1 OK] Upload realizado com sucesso! ID Gerado: ${cvId}`);

    // 2. Obter cargos sugeridos dinamicamente pela IA
    console.log(`\n[Passo 2] Solicitando cargos sugeridos para o ID ${cvId} em /api/suggested-roles...`);
    const rolesRes = await fetch(`http://localhost:3000/api/suggested-roles?cvId=${cvId}`);
    
    if (!rolesRes.ok) {
      const errText = await rolesRes.text();
      throw new Error(`Falha ao obter cargos sugeridos: ${rolesRes.status} - ${errText}`);
    }

    const rolesData = await rolesRes.json();
    console.log("[Passo 2 OK] Cargos sugeridos pela IA:");
    console.log(JSON.stringify(rolesData, null, 2));

    if (!rolesData.roles || rolesData.roles.length === 0) {
      throw new Error("Erro: A IA não retornou nenhum cargo sugerido.");
    }

    const selectedRole = rolesData.roles[0];
    console.log(`\nSelecionando o primeiro cargo para reconstrução: "${selectedRole}"`);

    // 3. Reconstruir Perfil (Primeiro passo do rebuild)
    console.log(`\n[Passo 3] Disparando reconstrução de perfil para o cargo "${selectedRole}"...`);
    const rebuildRes = await fetch('http://localhost:3000/api/rebuild/select-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ cvId, role: selectedRole })
    });

    if (!rebuildRes.ok) {
      const errText = await rebuildRes.text();
      throw new Error(`Falha no rebuild: ${rebuildRes.status} - ${errText}`);
    }

    const rebuildData = await rebuildRes.json();
    console.log("[Passo 3 OK] Resposta do Rebuild:");
    console.log(JSON.stringify(rebuildData, null, 2));

    // 4. Buscar perfil final (Pós-Pagamento / Dashboard)
    console.log(`\n[Passo 4] Buscando perfil reconstruído definitivo no banco (Dashboard) via /api/profile-rebuild...`);
    const profileRes = await fetch(`http://localhost:3000/api/profile-rebuild?cvId=${cvId}`);
    
    if (!profileRes.ok) {
      const errText = await profileRes.text();
      throw new Error(`Falha ao buscar perfil do banco: ${profileRes.status} - ${errText}`);
    }

    const profileData = await profileRes.json();
    console.log("[Passo 4 OK] Perfil recuperado com sucesso do Firebase:");
    console.log(JSON.stringify(profileData, null, 2));

    console.log("\n=============================================");
    console.log("🎉 TESTE CONCLUÍDO COM SUCESSO! A COZINHA ESTÁ FUNCIONANDO!");
    console.log("=============================================");

  } catch (error) {
    console.error("\n❌ O TESTE FALHOU!");
    console.error(error.message);
    process.exit(1);
  }
}

runTest();
