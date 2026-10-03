# LabTool — XML Comparator Skill

## Estado

DOMAIN_CONSOLIDATED

---

## Responsabilidade

Orientar o desenvolvimento, manutenção e evolução da ferramenta **XML Comparator** no LabTool.

A skill abrange o parsing comparativo de dois documentos XML, representação em árvores canônicas de nós, algoritmos de cálculo de diferenças estruturais e de valores, resolução de contexto visual, sanitização para exportação e geração de relatório Markdown.

---

## Escopo

Esta skill pertence exclusivamente à feature `xml-comparator` do LabTool (`src/features/xml-comparator/`).

O conteúdo evolui conforme cada etapa da ferramenta for modelada, implementada e comprovada por testes.

Não antecipar código, algoritmos ou contratos antes da respectiva fase de construção.

---

## Fluxo Conceitual do Motor

O fluxo de comparação e geração de relatório do XML Comparator segue a sequência:

```text
XML A ─┐
       ├─→ parsing
XML B ─┘
            ↓
         árvores (XmlTreeNode)
            ↓
         comparação
            ↓
         diferenças (XmlComparisonResult)
            ↓
          contexto
            ↓
sanitização de exportação
            ↓
         Markdown
```

1. **Parsing (XML A e XML B)**: Leitura independente e segura de ambos os documentos XML.
2. **Árvores**: Construção de árvores de nós normalizadas contendo caminhos semânticos (`XmlTreeNode`).
3. **Comparação**: Algoritmo determinístico de detecção de adições, remoções e alterações de valores e atributos.
4. **Diferenças**: Estruturação clara do conjunto de discrepâncias encontradas entre os dois documentos (`XmlComparisonDiff`, `XmlComparisonSummary`).
5. **Contexto**: Enriquecimento visual para exibição compreensível na interface.
6. **Sanitização de Exportação**: Mascaramento e proteção de dados sensíveis presentes nas diferenças antes da exportação externa.
7. **Markdown**: Formatação do relatório técnico final em Markdown para compartilhamento ou auditoria.

---

## Princípios Fundamentais

- **Motor Independente**: O XML Comparator possui seu próprio motor de comparação e parser, totalmente independente do motor do XML Privacy.
- **Sanitização Própria para Exportação**: A sanitização de dados no momento da exportação do relatório é uma responsabilidade interna do próprio Comparator, não dependendo do motor de sanitização do XML Privacy.
- **Processamento 100% Local**: Ambas as entradas XML são processadas exclusivamente no navegador do usuário, sem transmissão a servidores remotos.
- **Descrição de Diferenças sem Suposições Fiscais**: A comparação descreve com precisão as divergências estruturais e de dados existentes entre os dois arquivos; uma diferença detectada nunca deve ser rotulada automaticamente pelo motor como erro ou causa fiscal conclusiva.
- **Determinismo Absoluto**: O resultado da comparação entre dois XMLs sob os mesmos parâmetros deve ser sempre idêntico e reproduzível, sem uso de IA ou heurísticas opacas.
- **Independência de Apresentação**: A apresentação visual apenas exibe o resultado do diff; ela não define nem altera a semântica ou o cálculo das diferenças.

---

## Direção de Dependências

```text
Presentation
      ↓
Application
      ↓
Domain

Catalog
      ↓
Domain
```

O Domain não conhece Presentation, Application, DOM, React, APIs de I/O (File/Blob) ou a feature XML Privacy.

---

## Contratos Consolidados do Domain

### 1. `src/features/xml-comparator/domain/comparison.types.ts`
- **`DiffKind`**: Union type fechado (`"VALUE_DIFF" | "ATTRIBUTE_DIFF" | "ONLY_IN_APPROVED" | "ONLY_IN_REJECTED" | "STRUCTURE_DIFF" | "CONTEXTUAL_DIFF"`).
- **`AttributeDifference`**: Contrato para divergência de atributos (`name`, `approvedValue`, `rejectedValue`).
- **`XmlComparisonDiff`**: Representação de uma diferença identificada (`id`, `kind`, `path`, `approvedValue`, `rejectedValue`, `attributes?`, `detail?`).
- **`XmlComparisonSummary`**: Resumo quantitativo (`totalDiffs`, `contextualDiffs`, `attributeDiffs`, `structureDiffs`, `onlyInApproved`, `onlyInRejected`, `identical`, `hasOnlyContextualDiffs`).
- **`XmlComparisonResult`**: Contrato completo da saída do comparador (`diffs`, `summary`).

### 2. `src/features/xml-comparator/domain/xml-tree.types.ts`
- **`XmlTreeAttribute`**: Representação neutra de atributo XML (`name`, `value`, `namespaceUri`).
- **`XmlTreeNode`**: Estrutura neutra de nó XML na memória (`name`, `namespaceUri`, `value`, `attributes`, `children`, `path`).

### 3. `src/features/xml-comparator/domain/export.types.ts`
- **`ExportSensitiveCategory`**: Categorias de dados sensíveis na exportação (`CPF`, `CNPJ`, `DOCUMENTO`, `CREDENCIAIS`, `NOME`, `RAZAO_SOCIAL`, `CONTATO`, `INSCRICAO`, `ENDERECO`, `IDENTIFICADOR`, `ASSINATURA`, `TEXTO_LIVRE`, `OUTRO`).
- **`ExportSanitizationAction`**: Ações de proteção na exportação (`"PRESERVE" | "MASK_TOKEN" | "REPLACE" | "SCRUB_TEXT" | "REMOVE"`).
- **`ExportSanitizationOptions`**: Configurações declarativas para exportação sanitizada (`maskTokens?`, `scrubFreeText?`, `removeSignatures?`).

---

## Invariantes Confirmados do Domain

- **Identidade da Comparação**: Quando `summary.identical === true`, obrigatoriamente `summary.totalDiffs === 0`.
- **Diferenças Exclusivamente Contextuais**: Quando `summary.hasOnlyContextualDiffs === true`, obrigatoriamente `summary.identical === false` e `summary.contextualDiffs === summary.totalDiffs`.
- **Isolamento de DOM**: Nenhum contrato de `domain/` referencia classes do DOM (`Element`, `Node`, `XMLDocument`, `NamedNodeMap`, `NodeList`) ou APIs de navegador.
- **Neutralidade de Nós**: `XmlTreeNode.value` é preenchido com string normalizada apenas para elementos folha, sendo `null` para nós intermediários.
- **Desacoplamento do Privacy**: A feature XML Comparator não importa nem reutiliza tipos ou ações de domínio de `xml-privacy`.

---

## Decisões Técnicas Consolidadas

```text
Problema: Representar árvore XML e diferenças sem acoplamento com DOM do navegador
Decisão: Criar XmlTreeNode, XmlTreeAttribute e XmlComparisonDiff como interfaces TypeScript puras em domain/
Motivo: Manter o motor de comparação testável em qualquer runtime (Node.js/Vitest e browser) sem depender de jsdom ou DOM real
Consequência: A Application será responsável por converter o XML bruto / DOM em XmlTreeNode antes de comparar

Problema: Vocabulário de sanitização para exportação Markdown
Decisão: Criar ExportSensitiveCategory e ExportSanitizationAction isolados em domain/export.types.ts
Motivo: O comparador opera com mascaramento contextual consistente de tokens (MASK_TOKEN) e possui necessidades de proteção próprias para relatórios
Consequência: Independência total em relação à pipeline de sanitização destrutiva do XML Privacy
```
