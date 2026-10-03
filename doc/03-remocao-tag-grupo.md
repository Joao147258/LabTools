# Manual 03 — Procedimento para Remoção ou Depreciação de Tag ou Grupo

Este manual descreve o procedimento seguro para descontinuar, remover ou reclassificar uma tag XML ou uma categoria semântica inteira sem causar regressões, quebras de tipos ou falhas nos testes automatizados do **LabTool**.

---

## 1. Princípio de Segurança e Impacto

> [!WARNING]
> A remoção de uma categoria de domínio afeta múltiplos arquivos de contrato e de aplicação. Siga a ordem recomendada para que o compilador TypeScript auxilie na identificação de referências pendentes.

```text
1. Reclassificar Tags Dependentes
        ↓
2. Remover dos Catálogos e Classificadores
        ↓
3. Remover das Funções de Política e Apresentação
        ↓
4. Remover do Tipo de Domínio (Union Type)
        ↓
5. Atualizar Suíte de Testes e Validar Gates
```

---

## 2. Procedimento de Remoção de uma Tag XML

### 2.1. Remoção no XML Privacy
1. Abra [`src/features/xml-privacy/catalog/sensitive-tags.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/catalog/sensitive-tags.ts).
2. Localize a chave no objeto `SENSITIVE_TAGS` e remova a entrada.
3. Se houver alguma heurística de regex em `classifyTag()` que capture essa tag por prefixo/sufixo, remova ou ajuste a condição.
4. *Resultado esperado*: A tag passará a ser tratada como categoria `OUTRO` com ação sugerida `PRESERVE`.

### 2.2. Remoção no XML Comparator
1. Abra [`src/features/xml-comparator/catalog/export-sensitive-fields.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/catalog/export-sensitive-fields.ts).
2. Remova a entrada correspondente do objeto `EXPORT_SENSITIVE_FIELDS`.
3. Abra [`src/features/xml-comparator/application/diff-classifier.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/application/diff-classifier.ts).
4. Remova a tag do conjunto onde estava registrada (`FISCAL_PRIMARY_FIELDS`, `LOCATION_PRIMARY_FIELDS`, `DOCUMENT_CONTEXTUAL_FIELDS`, `TOMADOR_CADASTRAL_FIELDS`, `EXPLICIT_TOMADOR_TAGS`, etc.).
5. *Resultado esperado*: A tag passará a ser tratada pela regra padrão de fallback do comparador (divergência principal de valor `VALUE_DIFF`).

---

## 3. Procedimento de Remoção de uma Categoria / Grupo Semântico

Caso uma categoria precise ser extinta (ex.: fusão de duas categorias ou descontinuação):

### 3.1. Reclassificar Tags Existentes
Antes de remover o tipo, abra os catálogos e reclassifique todas as tags que utilizavam a categoria que será removida:
- [`src/features/xml-privacy/catalog/sensitive-tags.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/catalog/sensitive-tags.ts)
- [`src/features/xml-comparator/catalog/export-sensitive-fields.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/catalog/export-sensitive-fields.ts)

### 3.2. Remover das Políticas de Seleção e Sanitização
1. No Privacy ([`sensitive-tags.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/catalog/sensitive-tags.ts)):
   - Remova a categoria da lista `DEFAULT_SELECTED_CATEGORIES`.
2. No Comparator ([`export-sensitive-fields.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/catalog/export-sensitive-fields.ts)):
   - Remova a categoria da cláusula `switch` em `shouldSanitizeByDefault()`.

### 3.3. Remover da Apresentação
1. Abra [`src/features/xml-privacy/presentation/XmlFieldsTable.tsx`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/presentation/XmlFieldsTable.tsx).
2. Remova o caso correspondente na função `getCategoryBadgeStyle()`.

### 3.4. Remover dos Tipos de Domínio
1. No Privacy: remova do union `FieldCategory` em [`src/features/xml-privacy/domain/sanitization.types.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/domain/sanitization.types.ts).
2. No Comparator: remova do union `ComparisonFieldCategory` em [`src/features/xml-comparator/domain/export.types.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/domain/export.types.ts).

---

## 4. Checklist de Verificação de Impacto

Execute o checklist antes de finalizar a remoção:

- [ ] Todas as tags pertencentes à categoria foram migradas ou removidas dos catálogos.
- [ ] Nenhuma heurística de fallback referencia a categoria excluída.
- [ ] O `DEFAULT_SELECTED_CATEGORIES` não contém itens inexistentes.
- [ ] Os testes unitários que testavam a tag/categoria foram atualizados ou removidos.
- [ ] `npx tsc --noEmit` executa com **zero erros**.
- [ ] `npm test` executa com **100% de aprovação**.

---

## 5. Exemplo de Validação via Terminal

Na pasta `labtool/`, execute:

```bash
# Verificar erros de compilação TypeScript
npx tsc --noEmit

# Rodar todos os testes automatizados
npm test
```
