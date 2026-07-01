async function testLinkedin() {
  console.log("=== INICIANDO TESTE DO FLUXO DE LINKEDIN URL ===");

  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ linkedinUrl: "https://www.linkedin.com/in/abraao-teixeira-silva-123/" })
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to upload URL: ${response.status} - ${text}`);
    }

    const data = await response.json();
    console.log("Success! Generated ID:", data.id);
    
    // Now let's fetch profile-rebuild to check the name
    const profileRes = await fetch(`http://localhost:3000/api/profile-rebuild?cvId=${data.id}`);
    if (!profileRes.ok) {
      throw new Error("Failed to fetch profile rebuild");
    }
    const profile = await profileRes.json();
    console.log("Profile Name extracted:", profile.nome);
    console.log("Profile text:", profile.original_cv_text);
    
    if (profile.nome !== "Abraao Teixeira Silva") {
      throw new Error(`Expected 'Abraao Teixeira Silva' but got '${profile.nome}'`);
    }

    console.log("\n=============================================");
    console.log("🎉 TESTE DO LINKEDIN PASSOU 100%!");
    console.log("=============================================");
  } catch (err) {
    console.error("❌ TESTE FALHOU!");
    console.error(err.message);
    process.exit(1);
  }
}

testLinkedin();
