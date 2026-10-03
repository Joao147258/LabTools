# Manual 04 — Alteração de Regras e Políticas de Sanitização

Este manual orienta como modificar as políticas de privacidade, ações sugeridas de mascaramento e regras de sanitização de texto livre no **LabTool**.

---

## 1. As 4 Ações de Sanitização (`SanitizationAction`)

O motor do XML Privacy opera com 4 ações fundamentais sobre os nós inspecionados:

| Ação | Comportamento | Quando Usar |
|---|---|---|
| `PRESERVE` | Mantém o conteúdo original exatamente como está. | Tags que não devem ser mascaradas por padrão (ex.: Inscrição Municipal `IM`, Endereços `CEP`, `xLgr`, `nro`, `xBairro`, `cMun`, `UF`). |
| `REPLACE` | Substitui o valor textual por um placeholder sintético sequencial determinístico (ex.: `[CPF_001]`, `[NOME_001]`). | Documentos pessoais (CPF, CNPJ), nomes de pessoas físicas, razões sociais, credenciais. |
| `SCRUB_TEXT` | Mantém a estrutura de texto livre/narrativa, aplicando filtros regex internos para mascarar CPFs, CNPJs, e-mails e telefones contidos na frase. | Campos de observação livre (`xDescServ`, `xObs`, `infCpl`, `xMotivo`, `justificativa`). |
| `REMOVE_SUBTREE` | Remove o nó e todos os seus filhos recursivamente da árvore XML. | Assinaturas digitais (`<Signature>`, `<dsig:Signature>`), metadados binários desnecessários para homologação. |

---

## 2. Como Mudar a Ação Sugerida de uma Tag no Catálogo

### Exemplo Prático: Preservar uma Tag que Antes era Mascarada
Caso você queira que uma tag deixe de ser substituída automaticamente (como foi feito com `IM` e `ENDERECO`):

1. Abra [`src/features/xml-privacy/catalog/sensitive-tags.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/catalog/sensitive-tags.ts);
2. Altere a `suggestedAction` da tag para `"PRESERVE"`:
   ```typescript
   export const SENSITIVE_TAGS = {
     // ...
     im: { category: "INSCRICAO", suggestedAction: "PRESERVE" },
     cep: { category: "ENDERECO", suggestedAction: "PRESERVE" },
     xlgr: { category: "ENDERECO", suggestedAction: "PRESERVE" },
   } as const;
   ```
3. Certifique-se de que a categoria **não** está presente no array de seleção padrão:
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
     // NOTA: INSCRICAO e ENDERECO ficam de fora para não virem marcados
   ] as const;
   ```

4. No XML Comparator, abra [`src/features/xml-comparator/catalog/export-sensitive-fields.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/catalog/export-sensitive-fields.ts) e ajuste a função `shouldSanitizeByDefault()`:
   ```typescript
   export function shouldSanitizeByDefault(category: ComparisonFieldCategory): boolean {
     switch (category) {
       case "ENDERECO":
       case "INSCRICAO":
       case "OUTRO":
         return false; // Não sanitizar na exportação Markdown
       // ...
     }
   }
   ```

---

## 3. Como Funciona a Substituição Sintética (`ReplacementGenerator`)

A classe `ReplacementGenerator` em [`src/features/xml-privacy/application/xml-sanitizer.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/application/xml-sanitizer.ts) garante consistência e determinismo:

```typescript
// Regra de geração:
// [CATEGORIA_001], [CATEGORIA_002]
```

### Propriedades Inegociáveis do Gerador:
1. **Determinismo**: Se o valor `"123.456.789-00"` aparecer 5 vezes no documento na categoria `CPF`, todas as 5 ocorrências receberão o mesmo identificador `[CPF_001]`.
2. **Isolamento de Categoria**: Um mesmo valor numérico associado a categorias diferentes gerará identificadores independentes (`[CPF_001]` vs `[DOCUMENTO_001]`).
3. **Reset por Execução**: Cada novo processamento de arquivo instancia um novo `ReplacementGenerator`, reiniciando a contagem a partir de `001`.

---

## 4. Como Alterar as Regras de Regex no Texto Livre (`text-scrub.ts`)

A higienização de campos com ação `SCRUB_TEXT` é governada por [`src/features/xml-privacy/application/text-scrub.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-privacy/application/text-scrub.ts).

### Ordem Estrita de Execução dos Regex:
A ordem é crucial para evitar que regexes de números mascarem partes de e-mails ou CNPJs antes da hora:

```text
1. E-mails        ──► Regex de e-mail substitui por replaceCallback("CONTATO", ...)
        │
2. CNPJs          ──► Regex de CNPJ (com ou sem máscara) substitui por replaceCallback("CNPJ", ...)
        │
3. CPFs           ──► Regex de CPF (com ou sem máscara) substitui por replaceCallback("CPF", ...)
        │
4. Telefones      ──► Regex de telefones substitui por replaceCallback("CONTATO", ...)
```

Para adicionar um novo padrão de regex em `text-scrub.ts` (ex.: placa de veículo, conta bancária):
```typescript
// Exemplo: Adicionando máscara para número de processo
export function scrubFreeText(
  text: string,
  replaceCallback: (category: FieldCategory, originalValue: string) => string
): string {
  let result = text;

  // 1. E-mails
  // 2. CNPJs
  // 3. CPFs
  // 4. Telefones
  
  // 5. Novo Padrão: Processo Judicial (ex: 0000000-00.0000.0.00.0000)
  const PROCESSO_REGEX = /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g;
  result = result.replace(PROCESSO_REGEX, (match) => {
    return replaceCallback("DOCUMENTO", match);
  });

  return result;
}
```

---

## 5. Testes e Validação

Após alterar qualquer regra de sanitização:

1. Atualize o arquivo de testes de sanitização:
   [`tests/features/xml-privacy/xml-sanitizer.test.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/tests/features/xml-privacy/xml-sanitizer.test.ts)
2. Atualize o teste de scrub de texto livre:
   [`tests/features/xml-privacy/text-scrub.test.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/tests/features/xml-privacy/text-scrub.test.ts)
3. Execute a suíte de testes no terminal:
   ```bash
   npm test
   ```
