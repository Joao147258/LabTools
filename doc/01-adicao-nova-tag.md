# Manual 01 — Procedimento para Adição de Nova Tag XML

Este manual descreve o passo a passo detalhado para cadastrar e reconhecer uma nova tag XML no **LabTool**, tanto no motor de anonimização (**XML Privacy**) quanto no motor de comparação e exportação (**XML Comparator**).

---

## 1. Visão Geral e Responsabilidades

No LabTool, as tags XML são cadastradas de forma puramente declarativa nos catálogos de cada feature:

```text
Nova Tag XML
    │
    ├──► XML Privacy (src/features/xml-privacy/catalog/sensitive-tags.ts)
    │     └── Classificação em Categoria + Ação Sugerida (REPLACE / PRESERVE / SCRUB_TEXT / REMOVE_SUBTREE)
    │
    └──► XML Comparator (src/features/xml-comparator/)
          ├── Catálogo de Exportação (catalog/export-sensitive-fields.ts)
          └── Classificador Semântico de Diff (application/diff-classifier.ts)
```

> [!IMPORTANT]
> **Isolamento de Motores**: O `xml-privacy` e o `xml-comparator` são independentes. Adicionar uma tag no catálogo do Privacy não afeta automaticamente o Comparator. Atualize os locais apropriados de acordo com o caso de uso.

---

## 2. Passo a Passo: Adição no XML Privacy

### 2.1. Localização do Arquivo
O catálogo do XML Privacy fica em:
[`src/features/xml-privacy/catalog/sensitive-tags.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/catalog/sensitive-tags.ts).

### 2.2. Regra de Normalização
Ao buscar no catálogo, a função `normalizeTagName()` converte a tag para minúsculas e remove pontuações, underscores, hífens, dois-pontos e prefixos de atributos (`@`).

Exemplos de normalização:
- `<xMotivo>` ➔ `xmotivo`
- `<cLoc_Prestacao>` ➔ `clocprestacao`
- `<nfe:vISSQN>` ➔ `vissqn`
- `@Id` ➔ `id`

### 2.3. Cadastrando a Tag no Catálogo `SENSITIVE_TAGS`
Abra [`src/features/xml-privacy/catalog/sensitive-tags.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/catalog/sensitive-tags.ts) e adicione a nova chave na seção apropriada:

```typescript
// Exemplo: Adicionando uma nova tag de documento de identidade <rgEmitente>
export const SENSITIVE_TAGS = {
  // ... outras tags
  rgemitente: { category: "DOCUMENTO", suggestedAction: "REPLACE" },
  
  // Exemplo: Adicionando um novo campo de texto livre <observacoesInternas>
  observacoesinternas: { category: "TEXTO_LIVRE", suggestedAction: "SCRUB_TEXT" },

  // Exemplo: Adicionando uma nova tag de endereço <pontoReferencia>
  pontoreferencia: { category: "ENDERECO", suggestedAction: "PRESERVE" },
} as const satisfies Record<string, SensitiveTagDefinition>;
```

### 2.4. Ajustando Heurísticas de Fallback (Opcional)
Se a tag fizer parte de uma família com prefixo/sufixo comum (ex: `*rg`, `*identidade`), você pode estender a função `classifyTag()`:

```typescript
export function classifyTag(tagName: string): SensitiveTagDefinition {
  const directMatch = getTagDefinition(tagName);
  if (directMatch) {
    return directMatch;
  }

  const normalized = normalizeTagName(tagName);

  // Exemplo: Heurística para capturar sufixos
  if (normalized.endsWith("rg") || normalized.startsWith("rg")) {
    return { category: "DOCUMENTO", suggestedAction: "REPLACE" };
  }

  // ... demais heurísticas
}
```

---

## 3. Passo a Passo: Adição no XML Comparator

### 3.1. Localização dos Arquivos
1. **Catálogo de Sanitização de Exportação / Relatório Markdown**:
   [`src/features/xml-comparator/catalog/export-sensitive-fields.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/catalog/export-sensitive-fields.ts)
2. **Classificador Semântico de Divergências**:
   [`src/features/xml-comparator/application/diff-classifier.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/application/diff-classifier.ts)

### 3.2. Cadastrando no Catálogo de Exportação (`export-sensitive-fields.ts`)
Abra [`src/features/xml-comparator/catalog/export-sensitive-fields.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/catalog/export-sensitive-fields.ts) e adicione a tag com a respectiva ação (`MASK_TOKEN`, `PRESERVE`, `SCRUB_TEXT` ou `REMOVE`):

```typescript
export const EXPORT_SENSITIVE_FIELDS = {
  // ... outras tags
  rgemitente: { category: "DOCUMENTO", suggestedAction: "MASK_TOKEN" },
  pontoreferencia: { category: "ENDERECO", suggestedAction: "PRESERVE" },
} as const satisfies Record<string, ExportSensitiveFieldDefinition>;
```

### 3.3. Cadastrando no Classificador Semântico (`diff-classifier.ts`)
Se a nova tag puder aparecer em relatórios de comparação de XML, determine em qual conjunto de regras semânticas ela se enquadra:

- Se for um **campo fiscal / operacional principal** (tributos, alíquotas, serviços):
  Adicione em `FISCAL_PRIMARY_FIELDS`:
  ```typescript
  export const FISCAL_PRIMARY_FIELDS = new Set([
    // ...
    "novocodigotributario",
  ]);
  ```
- Se for uma **localização geográfica / jurisdição fiscal** que deva ser principal:
  Adicione em `LOCATION_PRIMARY_FIELDS`:
  ```typescript
  export const LOCATION_PRIMARY_FIELDS = new Set([
    // ...
    "codigoregiao",
  ]);
  ```
- Se for um **identificador documental técnico** (protocolo, número de controle):
  Adicione em `DOCUMENT_CONTEXTUAL_FIELDS`:
  ```typescript
  export const DOCUMENT_CONTEXTUAL_FIELDS = new Set([
    // ...
    "ncontrole",
  ]);
  ```
- Se for um **campo cadastral do tomador** (quando dentro do escopo do tomador):
  Adicione em `TOMADOR_CADASTRAL_FIELDS`:
  ```typescript
  export const TOMADOR_CADASTRAL_FIELDS = new Set([
    // ...
    "pontoreferencia",
  ]);
  ```

---

## 4. Testes e Validação

### 4.1. Escrevendo o Teste Unitário no XML Privacy
Adicione um teste em [`tests/features/xml-privacy/sensitive-tags.test.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/tests/features/xml-privacy/sensitive-tags.test.ts):

```typescript
it("deve classificar corretamente a nova tag cadastrada", () => {
  const def = classifyTag("rgEmitente");
  expect(def.category).toBe("DOCUMENTO");
  expect(def.suggestedAction).toBe("REPLACE");
});
```

### 4.2. Escrevendo o Teste Unitário no XML Comparator
Adicione um teste em [`tests/features/xml-comparator/diff-classifier.test.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/tests/features/xml-comparator/diff-classifier.test.ts):

```typescript
it("deve classificar a nova tag conforme a regra semântica", () => {
  expect(isContextualTag("pontoReferencia", "/NFSe/infDPS/toma/end/pontoReferencia")).toBe(true);
});
```

### 4.3. Executando os Quality Gates
Na pasta `labtool/`, execute:

```bash
npm test
npx tsc --noEmit
```
