# Guia de Engenharia e Funcionamento — XML Comparator

> **Módulo**: `src/features/xml-comparator/`  
> **Rota Next.js**: `/xml-comparator`  
> **Papel**: Motor de Comparação Estrutural, Semântica e Visual de Documentos XML Fiscais com Visualizador Espelhado e Exportação Sanitizada.

---

## 1. Visão Geral e Propósito

O **XML Comparator** é a ferramenta do LabTool especializada na comparação estrutural profunda entre dois documentos XML (normalmente um **XML Aprovado/Homologado** contra um **XML Rejeitado/Em Falha**, ou duas versões de um layout fiscal).

### Por Que Foi Criado?

- **Depuração de Rejeições Fiscais**: Identificar cirurgicamente as diferenças estruturais, atributos ausentes, divergências de tags ou discrepâncias de valores que causam a rejeição de notas fiscais pela SEFAZ ou Prefeituras.
- **Separação Semântica Inteligente**: Distinguir diferenças cadastrais contextuais (como CNPJ/endereço do tomador, data de emissão, número de DPS) de divergências fiscais determinantes (CST, CFOP, alíquotas, valores, município de prestação).
- **Visualizador Espelhado Sincronizado**: Proporcionar uma visão paralela lado a lado (Side-by-Side) com sincronização posicional precisa.
- **Exportação de Relatórios Sanitizados**: Gerar relatórios técnicos detalhados em Markdown sem expor dados confidenciais de contribuintes.
- **Privacidade Soberana**: 100% executado no navegador do usuário (Client-Side), sem envio de dados a servidores.

---

## 2. A Filosofia Central de Engenharia

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Parser constrói árvore posicional determinística (ComparatorXmlNode).      │
│  Differ detecta discrepâncias estruturais, atributos e valores textuais.    │
│  Classifier separa divergências fiscais principais de contextuais.         │
│  Mirrored Engine alinha linhas espelhadas para navegação lado a lado.       │
│  Sanitizer higieniza cópias em memória para exportação segura em Markdown.  │
│  Domain define os contratos puros de equivalência e exportação.             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Arquitetura Modular em Camadas

O módulo segue rigorosamente o padrão Clean Architecture e o desacoplamento de recursos:

```text
src/features/xml-comparator/
├── domain/                         → Tipos puros, interfaces e contratos de comparação
│   ├── index.ts
│   ├── comparison.types.ts         (DiffKind, XmlComparisonDiff, XmlComparisonSummary, etc.)
│   └── export.types.ts             (ComparisonFieldCategory, SanitizedExportDocument, etc.)
│
├── catalog/                        → Dicionário de sensibilidade para anonimização de exportação
│   ├── index.ts
│   └── export-sensitive-fields.ts  (Mapeamento de tags para pseudonimização no relatório)
│
├── application/                    → Motores de parsing, diff, classificação e exportação
│   ├── index.ts
│   ├── comparator-parser.ts        (Parsing DOM, árvore ComparatorXmlNode, guards XXE)
│   ├── diff-classifier.ts          (Classificador semântico: Principal vs Contextual)
│   ├── diff-context.ts             (Resolução de contexto e linhas circundantes)
│   ├── xml-differ.ts               (Algoritmo recursivo de comparação profunda)
│   ├── export-sanitizer.ts         (Pseudonimização consistente em memória para exportação)
│   └── markdown-exporter.ts        (Gerador de relatório técnico em Markdown)
│
└── presentation/                   → Interface React (Design System Catppuccin Mocha)
    ├── index.ts
    ├── XmlComparatorView.tsx       (Container principal e orquestrador de estado)
    ├── ComparatorUploadArea.tsx    (Upload dual: XML Aprovado vs XML Rejeitado + Erro opcional)
    ├── ComparatorSummary.tsx       (Cards de métricas e status de equivalência)
    ├── ComparatorDiffDetails.tsx   (Lista interativa e filtrável de divergências)
    ├── MirroredXmlViewer.tsx       (Visualizador lado a lado com scroll sincronizado)
    ├── MirroredXmlRow.tsx          (Linha atômica espelhada com realce visual)
    ├── ComparatorXmlPanel.tsx      (Painel individual de visualização de código)
    └── mirrored-rows.ts            (Algoritmo de pareamento e alinhamento de linhas)
```

---

## 4. Tipos Semânticos de Divergência (`DiffKind`)

O motor classifica cada discrepância encontrada em uma das 6 categorias fundamentais:

```typescript
export type DiffKind =
  | "ONLY_IN_APPROVED"   // Elemento presente apenas no XML aprovado
  | "ONLY_IN_REJECTED"   // Elemento presente apenas no XML rejeitado
  | "VALUE_DIFF"         // Valores textuais divergentes em campo fiscal/operacional principal
  | "ATTRIBUTE_DIFF"     // Divergência em atributo de elemento (ex: versao, nItem)
  | "STRUCTURE_DIFF"     // Tag divergente ou incompatibilidade container vs folha
  | "CONTEXTUAL_DIFF";   // Divergência secundária (dados do tomador ou protocolo do documento)
```

---

## 5. Regras de Precedência na Classificação Semântica

O arquivo `application/diff-classifier.ts` aplica uma hierarquia estrita de 8 níveis para garantir que detalhes irrelevantes não ocultem causas reais de rejeição:

```text
 1. Localização Fiscal (cMun, cMunFG, cUF, xPais, etc.)       ➔ SEMPRE PRINCIPAL (VALUE_DIFF)
 2. Escopo Emitente / Prestador (emit, prest, rem, etc.)      ➔ SEMPRE PRINCIPAL (VALUE_DIFF)
 3. Tributação / Alíquotas (cst, cfop, ncm, vServ, vISS, etc.) ➔ SEMPRE PRINCIPAL (VALUE_DIFF)
 4. Descrições Operacionais (xDescServ, xProd, infAdic, etc.) ➔ SEMPRE PRINCIPAL (VALUE_DIFF)
 5. Identificadores Documentais (serie, nDPS, nNFSe, dhEmi)   ➔ CONTEXTUAL (CONTEXTUAL_DIFF)
 6. Cadastrais no Escopo Tomador (CNPJ, xNome, CEP, rua)      ➔ CONTEXTUAL (CONTEXTUAL_DIFF)
 7. Tags Explícitas de Tomador (cnpjTomador, emailTomador)    ➔ CONTEXTUAL (CONTEXTUAL_DIFF)
 8. Qualquer Outro Elemento                                    ➔ PRINCIPAL (VALUE_DIFF)
```

---

## 6. Fluxo de Execução do Motor de Comparação

```text
  [XML Aprovado]           [XML Rejeitado]
        │                         │
        ▼                         ▼
 1. GUARDS DEFENSIVOS & PARSING (comparator-parser.ts)
    • Validação de tamanho (máx 2MB)
    • Bloqueio contra XXE (<!DOCTYPE / <!ENTITY)
    • DOMParser nativo → Construção de árvore ComparatorXmlNode
        │                         │
        └────────────┬────────────┘
                     ▼
 2. COMPARAÇÃO ESTRUTURAL DETERMINÍSTICA (xml-differ.ts)
    • Alinhamento por path posicional canônico (/NFSe[1]/infDPS[1]/...)
    • Comparação de tags e formato (folha vs container)
    • Comparação de atributos (diffAttributes)
    • Normalização de texto e comparação (normalizeForComparison)
                     │
                     ▼
 3. CLASSIFICAÇÃO SEMÂNTICA (diff-classifier.ts)
    • Atribuição de DiffKind
    • Separação de divergências principais e contextuais
                     │
                     ▼
 4. CONSOLIDAÇÃO DO RESUMO QUANTITATIVO (XmlComparisonSummary)
    • Total de diferenças principais vs contextuais
    • Flag identical e hasOnlyContextualDiffs
                     │
                     ▼
 5. VISUALIZAÇÃO ESPELHADA (mirrored-rows.ts & MirroredXmlViewer.tsx)
    • Pareamento de linhas estruturadas
    • Navegação sincronizada e realce com cores do Catppuccin Mocha
                     │
                     ▼
 6. EXPORTAÇÃO SANITIZADA EM MARKDOWN (export-sanitizer.ts & markdown-exporter.ts)
    • Anonimização consistente de dados PII em memória
    • Geração de relatório técnico estruturado para download
```

---

## 7. Visualizador Espelhado e Pareamento de Linhas

O componente `presentation/MirroredXmlViewer.tsx` utiliza o algoritmo `mirrored-rows.ts` para construir uma matriz bidimensional de linhas perfeitamente alinhadas:

- **Linhas Casadas**: Quando um elemento existe em ambos os documentos na mesma coordenada;
- **Linhas Vagas (Placeholders)**: Quando um nó existe exclusivamente em um dos documentos (`ONLY_IN_APPROVED` ou `ONLY_IN_REJECTED`), uma linha vazia neutra é inserida no painel oposto para manter a paridade vertical;
- **Sincronização de Scroll**: O rolamento de um painel movimenta suave e precisamente o outro lado;
- **Foco por Clique**: Clicar em um item na lista de divergências rola a visualização diretamente para a linha correspondente em ambos os painéis.

---

## 8. Exportação Segura de Relatórios em Markdown

Ao exportar o relatório de comparação:
1. `export-sanitizer.ts` executa uma varredura independente nos arquivos originais;
2. Substitui CNPJs, CPFs, nomes, e-mails e chaves por tokens determinísticos consistentes (`[CNPJ_001]`, `[CPF_001]`, etc.);
3. `markdown-exporter.ts` monta a tabela de divergências, métricas consolidadas, trechos de código XML e eventuais mensagens de erro de webservice anexadas;
4. O usuário faz o download de um arquivo `.md` pronto para documentação técnica ou abertura de chamado de suporte junto à SEFAZ/Prefeitura.

---

## 9. Suíte de Testes Automatizados

O XML Comparator possui cobertura completa validada via **Vitest**:

```bash
# Executar todos os testes do XML Comparator
npm test tests/features/xml-comparator
```

### Principais Testes da Suíte:

- `tests/features/xml-comparator/models-divergence.test.ts`: **Bateria de Testes com 64 Modelos Fiscais** — Executa comparações estruturais entre os modelos de XML em `XML_Models/`, validando a detecção exata de divergências e ausência de falsos positivos.
- `tests/features/xml-comparator/xml-differ.test.ts`: Valida a detecção de nós adicionados, removidos, alterados, estruturas inválidas e cálculo do resumo.
- `tests/features/xml-comparator/diff-classifier.test.ts`: Valida a ordem de precedência semântica e a distinção entre campos contextuais e fiscais principais.
- `tests/features/xml-comparator/comparator-parser.test.ts`: Valida guards XXE, construção da árvore `ComparatorXmlNode`, paths posicionais e contagem de nós.
- `tests/features/xml-comparator/export-sanitizer.test.ts`: Valida a anonimização de PII na exportação sem interferir na visualização da UI.
- `tests/features/xml-comparator/markdown-exporter.test.ts`: Valida a formatação e integridade dos relatórios Markdown gerados.
- `tests/features/xml-comparator/mirrored-comparison.test.tsx` e `presentation.test.tsx`: Validam a renderização da interface, alinhamento espelhado e filtros interativos.
