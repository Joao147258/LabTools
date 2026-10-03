# AGENTS.md — Governança e Roteamento de Agentes no Workspace WorkTools2

> **Repositório Operacional**: `.` (Workspace WorkTools2)  
> **Escopo**: Aplicação **LabTool** e suas ferramentas modais.  
> **Regra Mandatória**: O agente opera com confinamento estrito e isolamento local dentro deste workspace.  
> **Arquivo Mestre de Regras**: [`GEMINI.md`](./GEMINI.md)

---

## 1. Confinamento Estrito

O agente deve atuar **exclusivamente dentro da raiz deste workspace (`.`)**.  
É expressamente proibido ler, modificar ou navegar para qualquer pasta fora desta árvore.

---

## 2. Agente Orquestrador do LabTool

O comportamento detalhado de engenharia, ciclo de vida e orquestração da construção do LabTool é governado por:
- [`labtool/agent.md`](./labtool/agent.md) — **Orquestrador Local de Construção**.

Ele orienta o agente a:
- Seguir a ordem e critérios do [`LabTool Guia de Construção.md`](./LabTool%20Guia%20de%20Constru%C3%A7%C3%A3o.md);
- Carregar sob demanda apenas as skills necessárias para cada etapa;
- Preservar o isolamento e independência entre os motores das ferramentas;
- Utilizar testes unitários e de integração como evidência formal de comportamento.

---

## 3. Mapa de Skills e Responsabilidades

| Skill | Localização | Papel Principal |
|---|---|---|
| **Architecture** | [`labtool/.agents/skills/architecture/SKILL.md`](./labtool/.agents/skills/architecture/SKILL.md) | Diretrizes de monólito modular, fronteiras entre features e Clean Architecture. |
| **XML Privacy** | [`labtool/.agents/skills/xml-privacy/SKILL.md`](./labtool/.agents/skills/xml-privacy/SKILL.md) | Motor de parsing defensivo, catálogo declarativo, inspeção e sanitização de XMLs. |
| **XML Comparator** | [`labtool/.agents/skills/xml-comparator/SKILL.md`](./labtool/.agents/skills/xml-comparator/SKILL.md) | Motor de comparação estrutural de XML, árvore de nós normalizada e cálculo de diff. |
| **CNPJ Intelligence** | [`labtool/.agents/skills/cnpj-intelligence/SKILL.md`](./labtool/.agents/skills/cnpj-intelligence/SKILL.md) | Domínio de CNPJ, normalização numérica, validação de DV e contratos de gateway. |
| **Testing** | [`labtool/.agents/skills/testing/SKILL.md`](./labtool/.agents/skills/testing/SKILL.md) | Testes unitários, de integração e quality gates com Vitest. |
| **Scripts & Automation** | [`labtool/.agents/skills/scripts-automation/SKILL.md`](./labtool/.agents/skills/scripts-automation/SKILL.md) | Scripts de suporte, runners, automações e setups locais. |

---

## 4. Diretriz de Execução e Ordem de Autoridade

Todas as decisões e implementações técnicas devem seguir o fluxo:
1. Respeitar o [`GEMINI.md`](./GEMINI.md) (governança mestre e isolamento do workspace);
2. Consultar o [`labtool/agent.md`](./labtool/agent.md) (regras operacionais do orquestrador);
3. Seguir a sequência do [`LabTool Guia de Construção.md`](./LabTool%20Guia%20de%20Constru%C3%A7%C3%A3o.md);
4. Aplicar os tokens e regras visuais do [`labtool/DESIGN.md`](./labtool/DESIGN.md);
5. Carregar as skills correspondentes em `labtool/.agents/skills/`;
6. Executar os testes via `npm test` antes de considerar qualquer tarefa finalizada.
