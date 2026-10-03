# LabTool — XML Privacy Skill

## Estado

COMPLETED

---

## Responsabilidade

Orientar o desenvolvimento, manutenção e evolução da ferramenta **XML Privacy** no LabTool.

A skill abrange as etapas de parsing de XML, catálogo declarativo de tags, inspeção de campos, classificação de sensibilidade, seleção padrão, sanitização/mascaramento de dados sensíveis, scrub de texto, serialização de saída segura, camada de apresentação (React) e integração com Next.js.

---

## Escopo

Esta skill pertence exclusivamente à feature `xml-privacy` do LabTool (`src/features/xml-privacy/`) e sua respectiva rota no Next.js (`src/app/xml-privacy/page.tsx`).

---

## Fluxo Conceitual Completo (End-to-End)

O ciclo de processamento do XML Privacy segue a sequência estrita:

```text
arquivo XML (.xml local)
 ↓
validação defensiva (extensão e tamanho <= 20MB)
 ↓
leitura local via File API / FileReader
 ↓
inspectXml() [parsing seguro DOMParser & travessia de nós]
 ↓
XmlField[] [classificação declarativa & contextual]
 ↓
usuário revisa seleção de políticas (REPLACE / SCRUB_TEXT / REMOVE_SUBTREE)
 ↓
sanitizeXml() [mutação determinística em DOM novo & tokens sintéticos]
 ↓
SanitizationResult [XML sanitizado + SanitizationSummary]
 ↓
pré-visualização segura contra XSS (Sanitizado / Original)
 ↓
download local do XML sanitizado (<arquivo>-sanitizado.xml)
```

1. **Validação & Parsing Seguro**: Validação prévia de segurança (<= 20MB, bloqueio de `DOCTYPE` e `ENTITY` para XXE prevention) via `parseSafeDocument` (`xml-parser.ts`).
2. **Inspeção & Travessia**: Varredura estrutural completa dos nós DOM (elementos folha, atributos, comentários, CDATA e texto misto) e geração de posições/caminhos indexados (`inspectXml`).
3. **Classificação & Seleção**: Aplicação determinística das regras do catálogo declarativo (`sensitive-tags.ts`) e regras contextuais (ex.: `infDPS/@Id`, XMLDSig).
4. **Sanitização**: Aplicação determinística de mutações (`REPLACE`, `SCRUB_TEXT`, `REMOVE_SUBTREE`) em um novo documento DOM em memória com alvos pré-resolvidos (`sanitizeXml`).
5. **Apresentação & Exportação**: Renderização reativa de métricas, tabela com filtros e seleção em lote, visualizador com proteção contra XSS e download local via Blob.

---

## Princípios Fundamentais

- **Processamento 100% Local**: Todo o parsing, inspeção e sanitização ocorrem localmente no navegador (via File API e DOMParser).
- **Privacidade por Design**: O arquivo XML original ou seu conteúdo nunca é transmitido a APIs externas ou servidores.
- **Isolamento do Motor**: O motor do XML Privacy é completamente independente do XML Comparator.
- **Determinismo Baseado em Regras**: As regras de classificação e substituição são determinísticas. Não se utiliza IA ou heurísticas imprevisíveis para sanitizar documentos fiscais.
- **Catálogo Declarativo**: As regras de tags e sensibilidade residem em catálogo declarativo separado da lógica do algoritmo de sanitização.
- **Segurança contra XSS**: Todo conteúdo renderizado na tela de visualização passa por escape estrito de entidades HTML antes de qualquer inserção ou realce visual.
- **Paridade de Limite de Arquivo**: Application e Presentation compartilham a mesma constante canônica de limite de arquivo (`MAX_XML_SIZE_BYTES = 20 * 1024 * 1024` / 20 MB).

---

## Estrutura de Arquivos da Feature

```text
src/features/xml-privacy/
├── domain/
│   ├── sanitization.types.ts
│   └── index.ts
├── catalog/
│   ├── sensitive-tags.ts
│   └── index.ts
├── application/
│   ├── xml-parser.ts
│   ├── xml-inspector.ts
│   ├── text-scrub.ts
│   ├── xml-sanitizer.ts
│   └── index.ts
├── presentation/
│   ├── XmlPrivacyView.tsx
│   ├── XmlUploadDropzone.tsx
│   ├── XmlFieldsTable.tsx
│   ├── XmlCodeViewer.tsx
│   ├── XmlSummaryMetrics.tsx
│   └── index.ts
└── index.ts
```

---

## Contratos Consolidados

### 1. Camada de Aplicação (`src/features/xml-privacy/application/`)

- **`inspectXml(xml: string): XmlField[]`**: Inspeciona a string XML e retorna a lista ordenada de campos identificados e classificados.
- **`sanitizeXml(xml: string, fields: readonly XmlField[]): SanitizationResult`**: Orquestra a sanitização completa em novo DOM e retorna o resultado estruturado.
- **`parseSafeDocument(xml: string): Document`**: Executa validações defensivas (XXE, tamanho, sintaxe) e retorna o documento parsed.
- **`assertSafeXmlSource(xml: string): void`**: Valida a segurança da string XML antes do envio ao parser.
- **`MAX_XML_SIZE_BYTES: number`**: Constante oficial de limite defensivo de 20MB.

### 2. Tipos de Domínio (`src/features/xml-privacy/domain/sanitization.types.ts`)

- `XmlFieldKind`: `"element" | "attribute" | "text" | "comment" | "cdata"`
- `FieldCategory`: `"CPF" | "CNPJ" | "DOCUMENTO" | "CREDENCIAIS" | "NOME" | "RAZAO_SOCIAL" | "CONTATO" | "INSCRICAO" | "ENDERECO" | "TEXTO_LIVRE" | "IDENTIFICADOR_DPS" | "ASSINATURA" | "OUTRO"`
- `SanitizationAction`: `"PRESERVE" | "REPLACE" | "SCRUB_TEXT" | "REMOVE_SUBTREE"`
- `XmlField`: Objeto contendo `id`, `tag`, `path`, `value`, `namespaceUri`, `category`, `kind`, `action`, `selected`, `hasElementChildren`, `position`.
- `SanitizationSummary`: Objeto contendo `fieldsFound`, `fieldsSanitized`, `fieldsReplaced`, `fieldsScrubbed`, `subtreesRemoved`.
- `SanitizationResult`: Objeto contendo `success`, `sanitizedXml`, `summary`, `fields`, `errors`.

---

## Invariantes Confirmados

1. **Defesa em Profundidade Pré-Parsing**: Rejeita strings vazias, maiores que 20MB e contendo `<DOCTYPE` ou `<ENTITY` antes de instanciar `DOMParser`.
2. **Encapsulamento de Tipos DOM**: Objetos nativos (`DOMParser`, `XMLDocument`, `Element`, `Node`) pertencem exclusivamente à camada de Application e nunca vazam para `domain/sanitization.types.ts`.
3. **Imutabilidade do XML Original**: O Sanitizer cria uma árvore DOM independente em memória para mutação, sem reutilizar o DOM instanciado no Inspector.
4. **Pré-Resolução de Alvos Posicionais**: Os nós-alvo no Sanitizer são resolvidos a partir de `position: number[]` antes de iniciar as mutações.
5. **Preservação de Estruturas em Texto Misto**: O scrub em nós de texto sob elementos pais com filhos altera apenas o conteúdo textual do nó filho específico, sem corromper ou destruir tags irmãs.
6. **Tokens Determinísticos Estáveis**: O mesmo valor original em uma dada categoria gera rigorosamente o mesmo token sintético em todas as ocorrências na mesma sessão.
7. **Detecção e Remoção Canônica de XMLDSig**: Assinaturas digitais W3C com `REMOVE_SUBTREE` são removidas integralmente da árvore sem deixar nós órfãos.
8. **Resolução Contextual de Atributos Id**: Atributos `@Id` de nós fiscais chave (`infDPS`, `infNFSe`, `infNFe`, etc.) recebem `category="IDENTIFICADOR_DPS"` e `action="REPLACE"`.
9. **Proteção Rigorosa contra XSS**: Todo código XML renderizado na visualização passa por escape prévio de HTML (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&#39;`).

---

## Testes Automatizados e Cobertura

- **Total de Testes**: 52 testes automatizados verdes.
- **Suítes de Teste**:
  1. `tests/features/xml-privacy/xml-inspector.test.ts` (16 testes): Validação defensiva, elementos, atributos, regras contextuais, XMLDSig, nós especiais, indexação de irmãos e ordenação estável.
  2. `tests/features/xml-privacy/text-scrub.test.ts` (12 testes): E-mails, CPFs (formatados e não formatados), CNPJs (formatados e não formatados), telefones, múltiplos PIIs, determinismo e números comuns não PII.
  3. `tests/features/xml-privacy/xml-sanitizer.test.ts` (12 testes): `REPLACE`, `SCRUB_TEXT`, `REMOVE_SUBTREE`, atributos, preservação de texto misto, remoção de assinaturas e comentários, CDATA, determinismo e re-parsing do XML final.
  4. `tests/features/xml-privacy/presentation.test.tsx` (10 testes): Estado inicial, upload válido, arquivo inválido, limites de 20MB, inspeção visual, seleção/desseleção, restauração de padrões, alternância de abas, reset e proteção contra XSS.
  5. `tests/features/xml-privacy/integration-e2e.test.ts` (2 testes): Fluxo E2E do motor com fixture sintética completa e validação de namespace não-XMLDSig.

---

## Comandos Canônicos de Validação

- `npm run test:e2e:xml-privacy` (Executa todas as suítes de teste da feature XML Privacy)
- `npm run validate` (Executa a esteira completa de quality gates: `typecheck`, `lint`, `test`, `build`)
- `bash ./scripts/test-xml-privacy-e2e.sh` (Runner shell portátil com logs padronizados)
