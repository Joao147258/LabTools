# AGENTS.md — Governança, Limites e Especificações do Workspace LabTool

> **Repositório Operacional**: `.` (Workspace WorkTools2)  
> **Papel do Workspace**: Desenvolvimento, evolução e sustentação do **LabTool** (Monólito Modular Next.js).  
> **Estado de Governança**: `WORKSPACE_BOUND_STRICT`  
> **Documento Soberano**: Este arquivo define as regras obrigatórias de isolamento, fronteiras e especificações do projeto.

---

## 1. Regra Fundamental de Confinamento de Workspace (Isolamento Estrito)

> [!IMPORTANT]
> **CONFINAMENTO OBRIGATÓRIO NO DIRETÓRIO ATUAL:**  
> O agente deve operar **EXCLUSIVAMENTE** dentro da raiz deste workspace (`.`).  
> 
> 1. **Proibido navegar para fora**: É terminantemente proibido executar comandos `cd`, listar arquivos, ler ou modificar qualquer diretório fora deste workspace (`.`).
> 2. **Proibido carregar contexto externo**: Não consultar códigos legados externos, agents de outros repositórios ou arquiteturas de terceiros. A autoridade da verdade técnica reside 100% neste workspace.
> 3. **Regra de Portabilidade**: É expressamente proibido escrever caminhos absolutos específicos da máquina do desenvolvedor (como `/home/...`, `C:\...`) no código-fonte, imports, scripts ou testes. Utilize sempre caminhos relativos à raiz do projeto (`./src/`, `./tests/`, `./.agents/skills/`).

---

## 2. Visão Geral e Natureza do Produto (LabTool)

O **LabTool** é uma plataforma técnica e modular para processamento local de arquivos XML fiscais, privacidade de dados, comparação estrutural e inteligência cadastral.

### Princípios de Produto:
1. **Processamento 100% Local (Client-Side)**: Nenhuma informação sensível ou arquivo XML é transmitido para a internet ou para servidores externos.
2. **Ferramenta Técnica Sóbria**: A interface prioriza a inspeção e manipulação eficiente de dados técnicos, sem dashboards decorativos ou ornamentos supérfluos.
3. **Monólito Modular**: Uma única aplicação Next.js estruturada por features desacopladas com motores independentes.

---

## 3. Agente Orquestrador do LabTool

O comportamento detalhado de engenharia, ciclo de vida e orquestração da construção do LabTool é governado por:
- [`labtool/agent.md`](./labtool/agent.md) — **Orquestrador Local de Construção**.

Ele orienta o agente a:
- Seguir a ordem e critérios do [`LabTool Guia de Construção.md`](./LabTool%20Guia%20de%20Constru%C3%A7%C3%A3o.md);
- Carregar sob demanda apenas as skills necessárias para cada etapa;
- Preservar o isolamento e independência entre os motores das ferramentas;
- Utilizar testes unitários e de integração como evidência formal de comportamento.

---

## 4. Mapa de Skills e Responsabilidades

| Skill | Localização | Papel Principal |
|---|---|---|
| **Architecture** | [`labtool/.agents/skills/architecture/SKILL.md`](./labtool/.agents/skills/architecture/SKILL.md) | Diretrizes de monólito modular, fronteiras entre features e Clean Architecture. |
| **XML Privacy** | [`labtool/.agents/skills/xml-privacy/SKILL.md`](./labtool/.agents/skills/xml-privacy/SKILL.md) | Motor de parsing defensivo, catálogo declarativo, inspeção e sanitização de XMLs. |
| **XML Comparator** | [`labtool/.agents/skills/xml-comparator/SKILL.md`](./labtool/.agents/skills/xml-comparator/SKILL.md) | Motor de comparação estrutural de XML, árvore de nós normalizada e cálculo de diff. |
| **CNPJ Intelligence** | [`labtool/.agents/skills/cnpj-intelligence/SKILL.md`](./labtool/.agents/skills/cnpj-intelligence/SKILL.md) | Domínio de CNPJ, normalização numérica, validação de DV e contratos de gateway. |
| **Testing** | [`labtool/.agents/skills/testing/SKILL.md`](./labtool/.agents/skills/testing/SKILL.md) | Testes unitários, de integração e quality gates com Vitest. |
| **Scripts & Automation** | [`labtool/.agents/skills/scripts-automation/SKILL.md`](./labtool/.agents/skills/scripts-automation/SKILL.md) | Scripts de suporte, runners, automações e setups locais. |

---

## 5. Estrutura Canônica do Workspace

```text
./ (Raiz do Workspace WorkTools2)
│
├── AGENTS.md                          → Este arquivo (Governança, limites e roteamento de agentes)
├── LabTool Guia de Construção.md      → Guia mestre da sequência incremental de construção
│
└── labtool/                           → Aplicação Next.js (TypeScript, Tailwind/CSS Modules, Vitest)
    ├── package.json                   → Scripts, dependências e runners de teste
    ├── tsconfig.json                  → Configuração do compilador TypeScript
    ├── vitest.config.mts              → Configuração do executor de testes Vitest
    ├── DESIGN.md                      → Design System canônico (Catppuccin Mocha Dark Theme)
    ├── agent.md                       → Orquestrador local de construção
    │
    ├── .agents/skills/                → Base de conhecimento operacional e skills locais
    │   ├── architecture/              → Princípios arquiteturais, monólito modular e camadas
    │   ├── xml-privacy/               → Motor de inspeção, catálogo de tags e sanitização
    │   ├── xml-comparator/            → Motor de diff estrutural e árvore normalizada de nós
    │   ├── cnpj-intelligence/         → Domínio cadastral de CNPJ, normalização e validação
    │   ├── testing/                   → Testes como evidência e proteção de invariantes
    │   └── scripts-automation/        → Automações, scripts shell e quality gates
    │
    ├── src/
    │   ├── app/                       → Rotas Next.js App Router (/, /xml-privacy, /xml-comparator)
    │   ├── features/                  → Módulos e motores das ferramentas
    │   │   ├── xml-privacy/           → Privacy Engine (domain, catalog, application, presentation)
    │   │   ├── xml-comparator/        → Comparator Engine (domain, application, presentation)
    │   │   └── cnpj-intelligence/     → CNPJ Flow (domain, application, infrastructure, presentation)
    │   └── shared/                    → Componentes e utilitários compartilhados
    │
    └── tests/                         → Suíte abrangente de testes unitários e de integração
        └── features/
            ├── xml-privacy/
            ├── xml-comparator/
            └── cnpj-intelligence/
```

---

## 6. Especificações das Features e Motores Independentes

Cada ferramenta possui seu próprio motor, fluxo de execução e regras de domínio:

```text
XML Privacy              XML Comparator              CNPJ Intelligence
     ↓                         ↓                             ↓
Privacy Engine          Comparator Engine                CNPJ Flow
(Inspeção & Sanitização) (Diff Estrutural & Árvore)     (Domínio & Validação)
```

- **Isolamento de Motores**: O `xml-comparator` não depende da implementação do `xml-privacy`, e vice-versa. Formato comum (XML) não implica responsabilidade compartilhada.

---

### 6.1. XML Privacy (`src/features/xml-privacy/`)
- **Propósito**: Anonimizar e mascarar PIIs e dados fiscais sensíveis em XMLs para compartilhamento seguro e testes.
- **Filosofia Central**:
  > *Inspector descobre. Catalog classifica. Usuário decide. Sanitizer executa. Parser protege. Text Scrub sanitiza conteúdo livre. Domain define contratos.*
- **Camadas & Contratos**:
  - `domain/sanitization.types.ts`: Interfaces `XmlField`, `SanitizationResult`, `SanitizationSummary`, `FieldCategory` (13 categorias), `SanitizationAction` (`PRESERVE`, `REPLACE`, `SCRUB_TEXT`, `REMOVE_SUBTREE`).
  - `catalog/sensitive-tags.ts`: Dicionário `SENSITIVE_TAGS` de tags fiscais conhecidas (NFe, CTe, NFSe), normalização de tags e classificação declarativa.
  - `application/xml-parser.ts`: Guards de segurança (limite de 20MB, bloqueio rigoroso de XXE `<!DOCTYPE` e `<!ENTITY`) e parsing `DOMParser`.
  - `application/xml-inspector.ts`: Percurso recursivo de nós DOM, rastreamento posicional determinístico (`position: number[]`) e priorização de listagem.
  - `application/text-scrub.ts`: Anonimização regex ordenada (E-mail -> CNPJ -> CPF -> Telefones) em strings de texto livre.
  - `application/xml-sanitizer.ts`: Aplicação determinística de mutações via `ReplacementGenerator` (`[CPF_001]`), remoção de `<Signature>` e serialização de saída.
  - `presentation/`: Workspace React com dropzone, tabela com busca/filtros, toggle de campos e preview do XML higienizado.

---

### 6.2. XML Comparator (`src/features/xml-comparator/`)
- **Propósito**: Comparação estrutural profunda entre dois documentos XML (Aprovado vs Rejeitado / Versão A vs Versão B).
- **Mecanismos**:
  - Parsing comparativo em árvore normalizada de nós (`XmlNode`).
  - Algoritmo de diff estrutural: identificação de nós adicionados, removidos, alterações de tags, atributos e valores de texto.
  - Contexto semântico de nós pais e irmãos para visualização precisa.
  - Exportação de relatório em Markdown sanitizado.

---

### 6.3. CNPJ Intelligence (`src/features/cnpj-intelligence/`)
- **Propósito**: Consulta, validação e normalização de cadastros de pessoas jurídicas (CNPJ).
- **Mecanismos**:
  - Normalização estrita para 14 dígitos numéricos.
  - Validação algorítmica de dígitos verificadores (DV).
  - Contratos de gateway e mappers para provedores de dados cadastrais.
  - Isolamento entre regras de domínio e chamadas de infraestrutura.

---

## 7. Padrão Arquitetural em Camadas (Clean Architecture)

```text
Presentation (UI / React)
       │
       ▼
Application (Use Cases / Engines / Services)
       │
       ▼
Domain (Types / Interfaces / Invariantes Puros)

Infrastructure / Catalog ──► Domain & Application Ports
```

### Regras das Camadas:
1. **Domain**: Contém apenas tipos, interfaces e regras invariantes puras. **Zero dependências** de UI, bibliotecas de terceiros ou frameworks.
2. **Application**: Orquestra casos de uso, transformações e lógica de negócio. Não conhece detalhes de React ou UI.
3. **Infrastructure**: Implementa adaptadores externos, I/O, gateways e parsers.
4. **Presentation**: Componentes React, hooks, estado visual e orquestração de interação do usuário.

---

## 8. Design System Canônico ([`DESIGN.md`](./labtool/DESIGN.md))

Todas as interfaces devem seguir rigorosamente o Design System:
- **Tema Base**: **Catppuccin Mocha** (Dark Theme).
- **Paleta de Cores**:
  - Fundo Canvas/Backdrop: `--color-crust` (`#11111b`)
  - Fundo Shell/Toolbars: `--color-mantle` (`#181825`)
  - Fundo Workspace/Editores: `--color-base` (`#1e1e2e`)
  - Superfícies/Cards: `--color-surface0` (`#313244`)
  - Bordas/Divisores: `--color-surface1` (`#45475a`) / `--color-surface2` (`#585b70`)
  - Texto Primário: `--color-text` (`#cdd6f4`)
  - Texto Secundário: `--color-subtext1` (`#bac2de`)
  - Destaque Primário: `--color-blue` (`#89b4fa`)
  - Sucesso/Catalog: `--color-green` (`#a6e3a1`)
  - Atenção/Domain: `--color-yellow` (`#f9e2af`)
  - Erro/Destrutivo: `--color-red` (`#f38ba8`)
  - Contratos/PII: `--color-peach` (`#fab387`)
- **Tipografia**: Geist (UI geral) e JetBrains Mono (Código, nós XML, XPath e diffs).
- **Geometria**: Não-pill (cantos sóbrios de 2px a 12px), grid base de 4px.

---

## 9. Ciclo de Construção e Ordem de Autoridade

### Ciclo de Desenvolvimento:
```text
CONCEITO ──► MODELO ──► CONTRATO ──► REGRA ──► IMPLEMENTAÇÃO ──► TESTE ──► APRESENTAÇÃO
```

### Ordem de Autoridade para Decisões:
1. **Solicitação explícita da tarefa atual**;
2. **`AGENTS.md` / `labtool/agent.md`** (este arquivo e o orquestrador);
3. **`LabTool Guia de Construção.md`**;
4. **`DESIGN.md`**;
5. **Skill específica da feature** (`labtool/.agents/skills/<feature>/SKILL.md`);
6. **Código e testes existentes consolidados**.

---

## 10. Quality Gates e Verificação Obrigatória

Antes de concluir qualquer modificação no código:
1. Executar os testes automatizados da feature afetada e garantir 100% de aprovação:
   ```bash
   npm test
   ```
2. Garantir conformidade de tipagem TypeScript e validação de contexto:
   ```bash
   npm run validate
   ```
3. Não deixar código morto, arquivos temporários ou alterações fora do escopo.
