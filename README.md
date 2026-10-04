# 🧪 LabTool

> **Suíte técnica e modular para processamento local de documentos XML fiscais, privacidade de dados e comparação estrutural.**

---

## 📌 Visão Geral

O **LabTool** é uma plataforma de engenharia voltada para a manipulação, inspeção, anonimização e comparação profunda de documentos fiscais eletrônicos brasileiros (**NF-e, NFS-e, CT-e**).

Projetado sob a premissa de **privacidade absoluta** e **processamento 100% local (client-side)**, nenhuma informação sensível ou documento fiscal é transmitido para a internet ou para servidores de terceiros.

```text
               ┌─────────────────────────────────────────────────────┐
               │                  LABTOOL WORKSPACE                  │
               └──────────────────────────┬──────────────────────────┘
                                          │
        ┌─────────────────────────────────┼─────────────────────────────────┐
        ▼                                 ▼                                 ▼
┌───────────────┐                 ┌───────────────┐                 ┌───────────────┐
│  XML Privacy  │                 │ XML Comparator│                 │ CNPJ Intel.   │
│ (Higienização)│                 │(Diff Semântico│                 │ (Validação de │
│  & LGPD Mask  │                 │  & Relatório) │                 │  Documentos)  │
└───────────────┘                 └───────────────┘                 └───────────────┘
```

---

## 🚀 Módulos e Funcionalidades

### 1. 🛡️ XML Privacy (`/xml-privacy`)
Motor dedicado à inspeção e anonimização de dados pessoais (PII) e fiscais sensíveis para homologação segura e testes.
- **Parsing Defensivo**: Proteção contra ataques XXE (`<!DOCTYPE`, `<!ENTITY`) e limitação segura de payload (20MB).
- **Catálogo Declarativo**: 13 categorias de dados sensíveis (`DOCUMENTO`, `CONTATO`, `ENDERECO`, `VALORES`, `CHAVE_ACESSO`, etc.) com regras de normalização de tags.
- **Inspeção Recursiva**: Mapeamento determinístico de nós com posições estruturais indexadas (`position: number[]`).
- **Anonimização Determinística**: Substituição consistente via `ReplacementGenerator` (`[CPF_001]`, `[CNPJ_001]`), preservando correlações entre nós.
- **Text Scrubbing**: Sanitização inteligente com expressões regulares ordenadas em campos de texto livre (E-mails, CNPJs, CPFs e Telefones).
- **Remoção de Assinaturas Digitais**: Remoção segura de blocos `<Signature>` (XMLDSig) para evitar inconsistências de integridade pós-mutação.

### 2. ⚖️ XML Comparator (`/xml-comparator`)
Motor de análise comparativa estrutural e semântica entre dois documentos XML (ex.: *XML Aprovado vs XML Rejeitado* ou *Versão A vs Versão B*).
- **Árvore Normalizada de Nós**: Representação limpa em nós (`XmlNode`) com identificação hierárquica e normalização de atributos e namespaces.
- **Alinhamento Estrutural LCS**: Algoritmo de pareamento estrutural que preserva contexto entre elementos irmãos.
- **Classificador Semântico de Divergências**: Hierarquia em 8 níveis de precedência (Tributos primários, localizações fiscais, tomador, prestador e metadados contextuais).
- **Visualização Espelhada (Side-by-Side)**: Painel duplo sincronizado com destaque visual e navegação interativa entre divergências.
- **Exportação de Relatório Markdown**: Geração de laudo pericial técnico em Markdown com sanitização de campos confidenciais.

### 3. 🏢 CNPJ Intelligence
Módulo de inteligência cadastral e validação documental.
- Normalização estrita para 14 dígitos numéricos.
- Validação algorítmica de Dígitos Verificadores (DV módulo 11).
- Portas e contratos desacoplados para provedores cadastrais.

---

## 🏛️ Padrão Arquitetural (Clean Architecture)

O LabTool adota um **Monólito Modular** desacoplado, onde cada feature é dividida em quatro camadas estritas:

```text
Presentation (UI / Componentes React / Hooks)
       │
       ▼
Application (Casos de Uso / Motores de Diff e Sanitização / Parsers)
       │
       ▼
Domain (Entidades / Tipos Puros / Contratos de Invariantes)

Infrastructure / Catalog ──► Adaptadores e Catálogos Declarativos
```

### Regras de Isolamento:
- **Motores Independentes**: O `xml-comparator` não depende do `xml-privacy` e vice-versa.
- **Domínio Puro**: O diretório `domain/` não possui dependências de bibliotecas de terceiros ou frameworks de UI.
- **Zero I/O Externo**: Toda a manipulação de DOM ocorre no navegador através do `DOMParser` e serializadores nativos.

---

## 🎨 Design System (Catppuccin Mocha)

A interface do LabTool adota a paleta técnica escura **Catppuccin Mocha**:

| Token Visual | Cor / Variável | Finalidade no LabTool |
|---|---|---|
| **Crust** | `#11111b` | Canvas de fundo e backdrop da aplicação |
| **Mantle** | `#181825` | Barras de navegação, sidebars e toolbars |
| **Base** | `#1e1e2e` | Painéis centrais, editores e superfícies de código |
| **Surface0 / Surface1** | `#313244` / `#45475a` | Cards de upload, tabelas e divisores de linha |
| **Text / Subtext** | `#cdd6f4` / `#bac2de` | Tipografia técnica e rótulos de dados |
| **Blue Accent** | `#89b4fa` | Destaques primários, seleções e botões de ação |
| **Green** | `#a6e3a1` | Sucesso, nós XML idênticos e validações aprovadas |
| **Red** | `#f38ba8` | Erros, divergências de remoção e alertas de validação |
| **Yellow** | `#f9e2af` | Divergências de atributos, tags modificadas e avisos |
| **Mauve** | `#cba6f7` | Nós selecionados e indicadores de foco |

---

## 🛠️ Instalação e Execução

### Pré-requisitos:
- **Node.js** `>= 20.0.0`
- **npm** `>= 10.0.0`

### 1. Clonar o repositório:
```bash
git clone git@github.com:Joao147258/LabTools.git
cd LabTools
```

### 2. Instalar as dependências:
```bash
cd labtool
npm install
```

### 3. Iniciar o servidor de desenvolvimento:
```bash
npm run dev
```
Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## 🧪 Testes e Quality Gates

O LabTool utiliza o **Vitest** com ambiente `jsdom` para cobertura abrangente de testes unitários e de integração:

```bash
# Executar toda a suíte de testes (181 testes automatizados)
npm test

# Executar testes em modo watch (desenvolvimento contínuo)
npm run test:watch

# Executar pipeline de validação completa (Tipagem + Lint + Testes + Build)
npm run validate

# Executar varredura de segurança de contexto e vazamento de dados
npm run scan:context
```

---

## 📁 Estrutura de Diretórios

```text
LabTools/
│
├── AGENTS.md                          → Governança mestre do workspace e limites arquiteturais
├── LabTool Guia de Construção.md      → Guia incremental de desenvolvimento
├── README.md                          → Este arquivo (Apresentação geral e instruções)
│
├── doc/                               → Manuais operacionais e guias passo a passo
│   ├── README.md                      → Índice de documentação técnica
│   ├── 01-adicao-nova-tag.md          → Como cadastrar novas tags nos catálogos
│   ├── 02-adicao-novo-grupo-categoria.md → Como criar novas categorias semânticas
│   ├── 03-remocao-tag-grupo.md        → Como descontinuar tags e categorias
│   ├── 04-alteracao-regras-sanitizacao.md → Como customizar regras do Privacy Engine
│   ├── 05-alteracao-regras-classificacao-diff.md → Regras semânticas do Comparator
│   └── 06-quality-gates-e-testes.md   → Padrões de testes e homologação
│
└── labtool/                           → Aplicação Next.js (App Router, React 19, TypeScript)
    ├── src/
    │   ├── app/                       → Rotas App Router (/, /xml-privacy, /xml-comparator)
    │   ├── features/
    │   │   ├── xml-privacy/           → Motor de Inspeção e Sanitização de XML
    │   │   ├── xml-comparator/        → Motor de Comparação Estrutural e Diff
    │   │   └── cnpj-intelligence/     → Domínio e Validação de CNPJ
    │   └── shared/                    → Componentes de UI e utilitários compartilhados
    └── tests/                         → Suíte automatizada de testes
```

---

## 📚 Manuais de Engenharia

Para entender detalhadamente como estender os motores ou adicionar suporte a novas notas fiscais:
- [01. Adição de Nova Tag](doc/01-adicao-nova-tag.md)
- [02. Adição de Novo Grupo / Categoria](doc/02-adicao-novo-grupo-categoria.md)
- [03. Remoção de Tag ou Grupo](doc/03-remocao-tag-grupo.md)
- [04. Alteração de Regras de Sanitização](doc/04-alteracao-regras-sanitizacao.md)
- [05. Alteração de Regras no Comparador](doc/05-alteracao-regras-classificacao-diff.md)
- [06. Quality Gates e Testes](doc/06-quality-gates-e-testes.md)

---

## 🔒 Segurança e Privacidade

- **Zero Telemetria de Dados de Arquivos**: O conteúdo dos XMLs processados existe apenas na memória volátil do navegador (`DOMParser`).
- **Nenhum Envio de Rede**: Nenhuma requisição contendo dados dos arquivos é emitida para a internet.
- **Armazenamento Local**: A ferramenta não persiste os XMLs enviados em bancos de dados ou `localStorage`.

---

## 📄 Licença

Este projeto é desenvolvido para fins operacionais técnicos e testes de engenharia.
