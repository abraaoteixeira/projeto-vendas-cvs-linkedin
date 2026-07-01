---
name: Network Local Analysis
description: Triggers when the user asks about their local network, gateway, DNS, or ISP settings, or mentions "think locally". Instructs the agent to proactively run PowerShell commands to audit the user's actual network environment before answering.
---

# Network Local Analysis Protocol

Quando o usuário pedir para você analisar a rede dele, o gateway (GW), DNS, provedor (ISP), ou disser para "pensar localmente" ("think locally"), **NÃO dê apenas uma explicação teórica**. Você DEVE auditar ativamente a pilha de rede da máquina dele no terminal.

## Ações Obrigatórias:
1. Rode `ipconfig /all` no terminal para encontrar os adaptadores ativos, o Gateway Padrão real, e os servidores DNS atribuídos via DHCP.
2. Rode `Get-NetRoute -DestinationPrefix "0.0.0.0/0"` no PowerShell para confirmar a rota de saída padrão (default route) e o IP exato do roteador.
3. Se a dúvida for sobre o DNS da operadora ou vazamento de rota, rode um `nslookup` local ou um `tracert -d -h 3 8.8.8.8` para rastrear os primeiros saltos do pacote (verificando se o Gateway é "preguiçoso" ou se a rede está atrás de um CGNAT da operadora).
4. Analise os resultados desses comandos para dar uma resposta 100% factual e hiper-personalizada, baseada no ambiente real do usuário.
5. Como o usuário é um Analista de Redes, comunique-se usando termos técnicos avançados de infraestrutura.
