import { test, expect } from '@playwright/test';

test('Persona flow - Abraão Teixeira da Silva', async ({ page }) => {
  // Increase test timeout if AI processing takes a long time
  test.setTimeout(120000);

  // Acessar a página inicial
  await page.goto('http://localhost:3000/');
  
  // Encontrar o botão/link para ir para /upload (assumindo que há um botão "Começar" ou "Upload")
  // Se for um link <a> com href='/upload':
  await page.click('a[href="/upload"], button:has-text("Começar"), button:has-text("Upload")');
  
  // Aguardar estar na página de upload
  await page.waitForURL('**/upload');

  // Fazer o upload do arquivo
  // Assume there is an input type="file"
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('abraao_cv.pdf');

  // Encontrar o botão de continuar (poderia ser "Analisar Currículo", "Continuar", etc.)
  // Assumimos um botão que é habilitado após o upload.
  await page.waitForTimeout(1000); // Dar um tempo pra UI atualizar
  const continueButton = page.locator('button:has-text("Continuar"), button:has-text("Próximo"), button:has-text("Analisar")');
  if (await continueButton.isVisible()) {
    await continueButton.click();
  }

  // Selecionar "Outro"
  await page.waitForSelector('text=Outro', { timeout: 10000 });
  await page.click('text=Outro');

  // Preencher a caixa de texto
  const otherInput = page.locator('input[type="text"], textarea').first();
  await otherInput.fill('Engenheiro de Redes e DevOps Júnior');

  // Clicar em Continuar / Gerar Perfil
  await page.click('button:has-text("Continuar"), button:has-text("Gerar"), button:has-text("Próximo")');

  // Aguardar a tela /loading (ela deve redirecionar sozinha para /mockup)
  console.log('Esperando o processamento da IA... isso pode levar algum tempo.');
  await page.waitForURL('**/mockup*', { timeout: 100000, waitUntil: 'commit' });
  await page.waitForTimeout(3000); // Dar um tempo extra para renderizar tudo
  console.log('Chegou na tela de mockup!');

  // Extrair as seções de Título Sugerido e Nova Bio (Sobre)
  // Como não sabemos os seletores exatos, vamos procurar por textos
  
  // Tentar encontrar o título sugerido
  // Geralmente está em um heading ou logo após a palavra "Título"
  const mockupContent = await page.evaluate(() => {
    return document.body.innerText;
  });
  
  console.log('================= CONTEÚDO EXTRAÍDO =================');
  
  // Vamos tentar extrair pelo DOM para ficar mais limpo se possível
  try {
    const titles = await page.locator('h1, h2, h3, h4, p').allInnerTexts();
    console.log("Todos os textos para análise:");
    console.log(titles.join('\n'));
  } catch (e) {
    console.log("Erro ao extrair textos específicos", e);
  }

  console.log('CONTEÚDO BRUTO DO BODY:');
  console.log(mockupContent);
  console.log('=====================================================');
});
