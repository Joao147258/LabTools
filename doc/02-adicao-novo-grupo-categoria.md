# Manual 02 — Procedimento para Adição de Novo Grupo / Categoria Semântica

Este manual orienta o processo de criação de uma nova categoria semântica (`FieldCategory` / `ComparisonFieldCategory`) no modelo de domínio do **LabTool** e sua propagação em todas as camadas arquiteturais.

---

## 1. O que é uma Categoria Semântica?

Uma categoria semântica representa a natureza conceitual de uma informação dentro do documento XML (ex.: `FINANCEIRO`, `VEICULO`, `MEDICAMENTO`, `COMBUSTIVEL`). Ela permite:
1. Classificar tags de forma declarativa e desacoplada do algoritmo;
2. Agrupar campos para filtragem na UI através de chips visuais;
3. Definir políticas de seleção padrão e regras de mascaramento sintético (ex.: `[NOVO_GRUPO_001]`).

---

## 2. Passo a Passo Completo

### Passo 1: Atualizar o Tipo de Domínio no XML Privacy
No arquivo [`src/features/xml-privacy/domain/sanitization.types.ts`](../labtool/src/features/xml-privacy/domain/sanitization.types.ts), adicione a nova categoria ao tipo union `FieldCategory`:

```typescript
export type FieldCategory =
  | "CPF"
  | "CNPJ"
  | "DOCUMENTO"
  | "CREDENCIAIS"
  | "NOME"
  | "RAZAO_SOCIAL"
  | "CONTATO"
  | "INSCRICAO"
  | "ENDERECO"
  | "TEXTO_LIVRE"
  | "IDENTIFICADOR_DPS"
  | "ASSINATURA"
  | "NOVO_GRUPO" // <-- Nova categoria adicionada
  | "OUTRO";
```

---

### Passo 2: Atualizar o Tipo de Domínio no XML Comparator
No arquivo [`src/features/xml-comparator/domain/export.types.ts`](../labtool/src/features/xml-comparator/domain/export.types.ts), adicione a nova categoria ao tipo union `ComparisonFieldCategory`:

```typescript
export type ComparisonFieldCategory =
  | "CPF"
  | "CNPJ"
  | "NOME"
  | "RAZAO_SOCIAL"
  | "CONTATO"
  | "IDENTIFICADOR_DPS"
  | "DOCUMENTO"
  | "INSCRICAO"
  | "ENDERECO"
  | "TEXTO_LIVRE"
  | "ASSINATURA"
  | "NOVO_GRUPO" // <-- Nova categoria adicionada
  | "OUTRO";
```

---

### Passo 3: Cadastrar Tags no Catálogo do XML Privacy
No arquivo [`src/features/xml-privacy/catalog/sensitive-tags.ts`](../labtool/src/features/xml-privacy/catalog/sensitive-tags.ts):

1. Associe as tags desejadas à nova categoria:
   ```typescript
   export const SENSITIVE_TAGS = {
     // ...
     minhatag: { category: "NOVO_GRUPO", suggestedAction: "REPLACE" },
   } as const satisfies Record<string, SensitiveTagDefinition>;
   ```

2. Defina se a categoria deve vir **selecionada por padrão** no array `DEFAULT_SELECTED_CATEGORIES`:
   ```typescript
   export const DEFAULT_SELECTED_CATEGORIES: readonly FieldCategory[] = [
     "CPF",
     "CNPJ",
     "DOCUMENTO",
     "CREDENCIAIS",
     "NOME",
     "RAZAO_SOCIAL",
     "CONTATO",
     "TEXTO_LIVRE",
     "IDENTIFICADOR_DPS",
     "ASSINATURA",
     "NOVO_GRUPO", // <-- Incluir aqui se deve vir marcado por padrão
   ] as const;
   ```

---

### Passo 4: Atualizar a Política Padrão do XML Comparator
No arquivo [`src/features/xml-comparator/catalog/export-sensitive-fields.ts`](../labtool/src/features/xml-comparator/catalog/export-sensitive-fields.ts):

1. Associe as tags à nova categoria:
   ```typescript
   export const EXPORT_SENSITIVE_FIELDS = {
     // ...
     minhatag: { category: "NOVO_GRUPO", suggestedAction: "MASK_TOKEN" },
   } as const satisfies Record<string, ExportSensitiveFieldDefinition>;
   ```

2. Atualize a função `shouldSanitizeByDefault()`:
   ```typescript
   export function shouldSanitizeByDefault(category: ComparisonFieldCategory): boolean {
     switch (category) {
       case "ENDERECO":
       case "INSCRICAO":
       case "OUTRO":
         return false;
       case "CPF":
       case "CNPJ":
       case "NOME":
       case "RAZAO_SOCIAL":
       case "CONTATO":
       case "IDENTIFICADOR_DPS":
       case "DOCUMENTO":
       case "ASSINATURA":
       case "TEXTO_LIVRE":
       case "NOVO_GRUPO": // <-- Definir se a exportação deve sanitizar por padrão
         return true;
       default:
         return false;
     }
   }
   ```

---

### Passo 5: Adicionar o Estilo Visual do Badge na Apresentação
No arquivo [`src/features/xml-privacy/presentation/XmlFieldsTable.tsx`](../labtool/src/features/xml-privacy/presentation/XmlFieldsTable.tsx), adicione o estilo do badge para a nova categoria na função `getCategoryBadgeStyle()`:

```typescript
function getCategoryBadgeStyle(category: FieldCategory): { bg: string; color: string; border: string } {
  switch (category) {
    // ... casos existentes ...
    case "NOVO_GRUPO":
      return { 
        bg: "rgba(166, 227, 161, 0.15)", 
        color: "var(--color-green)", 
        border: "rgba(166, 227, 161, 0.3)" 
      };
    default:
      return { bg: "var(--color-surface1)", color: "var(--color-subtext0)", border: "var(--color-surface2)" };
  }
}
```

> [!TIP]
> Utilize as variáveis de cores do Design System Catppuccin Mocha definidas em [`DESIGN.md`](../labtool/DESIGN.md), tais como `var(--color-green)`, `var(--color-teal)`, `var(--color-maroon)`, `var(--color-mauve)`, etc.

---

## 3. Como Funciona a Substituição Sintética

O gerador de substituições determinístico `ReplacementGenerator` formata automaticamente o placeholder baseado no nome da categoria:
- Categoria `CPF` ➔ `[CPF_001]`, `[CPF_002]`
- Categoria `NOVO_GRUPO` ➔ `[NOVO_GRUPO_001]`, `[NOVO_GRUPO_002]`

A consistência é mantida durante todo o ciclo: o mesmo valor original sempre receberá o mesmo índice numérico dentro da mesma execução.

---

## 4. Quality Gates e Verificação

Após criar o novo grupo, valide a integridade executando na pasta `labtool/`:

```bash
# 1. Executar todos os testes
npm test

# 2. Verificar conformidade estrita de tipagem TypeScript
npx tsc --noEmit

# 3. Executar o linter
npm run lint
```
