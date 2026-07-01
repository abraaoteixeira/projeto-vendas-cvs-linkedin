const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('abraao_cv.pdf'));

doc.fontSize(20).text('Abraão Teixeira da Silva', { align: 'center' });
doc.moveDown();

doc.fontSize(12).text(`Idade: 19 Anos
Contato: (47) 99737 8438
Email: abraaoteixeira0101@gmail.com
www.linkedin.com/in/abraaoteixeira/`);
doc.moveDown();

doc.fontSize(14).text('FORMAÇÃO ACADÊMICA', { underline: true });
doc.fontSize(12).text(`- Técnico em Informática - IFC (Instituto Federal Catarinense)
- Tecnologia em Redes de Computadores - IFC (Instituto Federal Catarinense) - 2024 a 2027 em andamento`);
doc.moveDown();

doc.fontSize(14).text('EXPERIÊNCIA PROFISSIONAL', { underline: true });
doc.fontSize(12).text(`HavanLabs - Havan S.A
Cargo: Analista de Suporte TI - I
Atuação (Analista de Infraestrutura e Suporte Técnico)

Principal atividades:
- Fornecer Suporte Técnico para Filiais: relacionadas a sistemas operacionais Windows, Linux, dúvidas e problemas dos Usuários, configuração de ramais Fisicos e Digitais.
- Gerenciamento de Usuários: Administrar contas corporativas, Active Directory e Microsoft 365.
- Executar análises e Monitoramento da rede, utilizando as ferramentas Grafana e Zabbix, Unifi Controller, Cisco DNA center.
- Resolver problemas técnicos, que incluem questões de liberação de portas, instalação e manutenção de pontos de acesso (APs), configuração de switches de camada 2 (L2).
- Realizar a montagem de hacks e braquets da infraestrutura de TI da Havan nas lojas, crimpagem de cabos de rede (RJ45 e KeyStone), instalação de APs (Access Points) e formatação e configuração de computadores.`);
doc.moveDown();

doc.fontSize(14).text('CERTIFICAÇÕES E CURSOS', { underline: true });
doc.fontSize(12).text(`- Competências em: Office 360 e Google WorkSpace (Word, Excel, Google Docs e Google Sheets);
- Linguagens de Programação: C, Python e JavaScript.

Cursos:
- Cisco - Defesa de Redes - 2025
- Google - Suporte Técnico - 2024
- Google Cloud Plataform - 2024
- 4Linux - Linux Administration - 2022
- Associate Ethical Hacker - IBSEC - 2022`);

doc.end();
console.log("PDF abraao_cv.pdf gerado com sucesso.");
