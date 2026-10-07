# Guia de Engenharia e Funcionamento — XML Privacy

> **Módulo**: `src/features/xml-sanitizer/`  
> **Rota Next.js**: `/xml-sanitizer`  
> **Papel**: Motor e Interface de Inspeção, Classificação, Privacidade e Sanitização Local de Documentos XML Fiscais.

---

## 1. Visão Geral e Propósito

O **XML Privacy** é a funcionalidade do LabTool projetada para higienizar, mascarar e remover informações de identificação pessoal (PII) e dados fiscais sensíveis contidos em documentos XML (como NF-e, CT-e, NFS-e, MDF-e, eventos e cadastros fiscais).

### Por Que Foi Criado?

- **Compartilhamento Seguro**: Permitir que desenvolvedores, contadores e analistas de suporte compartilhem arquivos XML para depuração e testes sem expor dados reais de clientes, parceiros ou fornecedores.
- **Conformidade com LGPD**: Anonimizar CPFs, CNPJs, razões sociais, nomes, credenciais, e-mails, telefones e identificadores contidos em estruturas fiscais.
- **Privacidade Soberana no Cliente**: O processamento é **100% executado no navegador do usuário (Client-Side)**. Nenhum byte de XML é enviado para a internet ou para servidores externos.

---

## 2. A Filosofia Central de Engenharia

O motor do XML Privacy opera estritamente sob o seguinte princípio arquitetural:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Inspector descobre.                                                        │
│  Catalog classifica.                                                        │
│  Usuário decide.                                                            │
│  Sanitizer executa.                                                         │
│  Parser protege.                                                            │
│  Text Scrub sanitiza conteúdo livre.                                        │
│  Domain define contratos.                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Regras Fundamentais de Separação:

1. **O Inspector não altera XML**: Ele apenas lê o documento parseado e produz uma lista estruturada de campos (`XmlField[]`).
2. **O Sanitizer não classifica tags**: Ele apenas recebe o XML original e a lista de `XmlField[]` decidida pelo usuário/catálogo e aplica as transformações.
3. **Inspector e Sanitizer não dependem um do outro**: A comunicação entre eles é desacoplada e mediada exclusivamente pelos contratos do **Domain** e orquestrada pela camada de **Presentation** (React).
4. **Imutabilidade**: O XML original nunca é mutado in-place; o Sanitizer cria uma nova árvore DOM em memória para aplicar as transformações.

---

## 3. Arquitetura Modular em Camadas

O módulo é organizado em quatro camadas bem delimitadas:

```text
src/features/xml-privacy/
├── domain/                    → Contratos puros, tipos, interfaces e invariantes
│   ├── index.ts
│   └── sanitization.types.ts
│
├── catalog/                   → Dicionário declarativo e regras estáticas de classificação
│   ├── index.ts
│   └── sensitive-tags.ts
│
├── application/               → Casos de uso, parsers, orquestradores e algoritmos
│   ├── index.ts               (Fachada pública: inspectXml, sanitizeXml, parseSafeDocument)
│   ├── xml-parser.ts          (Guards defensivos 20MB & bloqueio de XXE)
│   ├── xml-inspector.ts       (Percurso recursivo e inspeção estrutural da árvore DOM)
│   ├── text-scrub.ts          (Regex ordenada para scrubbing de PII em texto livre)
│   └── xml-sanitizer.ts       (Aplicação determinística de mutações e serialização)
│
└── presentation/              → Interface do usuário em React (Next.js)
    ├── index.ts
    ├── XmlPrivacyView.tsx      (Componente principal e orquestrador de estado)
    ├── XmlUploadDropzone.tsx   (Área de arrastar e soltar com validação)
    ├── XmlFieldsTable.tsx      (Tabela interativa de campos e ações)
    ├── XmlSummaryMetrics.tsx   (Cards de métricas quantitativas de sanitização)
    └── XmlCodeViewer.tsx       (Visualizador e exportador do XML higienizado)
```

---

## 4. Responsabilidade Detalhada dos Componentes

| Arquivo / Módulo | Camada | O Que FAZ | O Que NÃO FAZ |
| --- | --- | --- | --- |
| `domain/sanitization.types.ts` | **Domain** | Define os tipos `XmlField`, `SanitizationResult`, `FieldCategory`, `SanitizationAction`, `XmlFieldKind`. | Não possui código executável ou dependência de bibliotecas. |
| `catalog/sensitive-tags.ts` | **Catalog** | Mantém dicionário `SENSITIVE_TAGS`, normaliza nomes de tags (`normalizeTagName`), exporta `classifyTag` (incluindo heurísticas robustas de fallback para `RAZAO_SOCIAL`, `NOME`, `INSCRICAO`) e `shouldSelectByDefault`. | Não lê arquivos XML, não inspeciona nós e não altera DOM. |
| `application/xml-parser.ts` | **Application** | Valida limite de tamanho (20MB), bloqueia `<!DOCTYPE` e `<!ENTITY` (XXE fail-stop), invoca `DOMParser` nativo com tratamento rigoroso de erros. | Não inspeciona nem modifica campos. |
| `application/xml-inspector.ts` | **Application** | Percorre recursivamente nós (elementos, atributos `@`, comentários, CDATA, textos mistos), gera caminhos XPath legíveis e posições estruturais determinísticas (`position: number[]`), classifica tags via catálogo e ordena por prioridade. | Não altera o XML, não sanitiza nós e não depende de `xml-sanitizer.ts`. |
| `application/text-scrub.ts` | **Application** | Aplica expressões regulares ordenadas (E-mails -> CNPJs -> CPFs -> Telefones) em strings de texto livre, delegando tokens para callback determinístico. | Não manipula nós DOM nem gerencia estado. |
| `application/xml-sanitizer.ts` | **Application** | Parseia nova árvore DOM limpa, localiza nós pela coordenada `position: number[]`, executa ações `REPLACE`, `SCRUB_TEXT`, `REMOVE_SUBTREE`, gera tokens determinísticos (`[CPF_001]`), serializa via `XMLSerializer` e monta o `SanitizationSummary`. | Não classifica tags e não manipula UI. |
| `presentation/XmlPrivacyView.tsx` | **Presentation** | Coordena o ciclo de vida (Upload -> Inspeção -> Seleção Interativa -> Recálculo reativo em tempo real via `useMemo` -> Download/Cópia). | Não contém lógica de parsing ou manipulação direta de DOM XML. |

---

## 5. Ciclo de Vida do Processamento (Passo a Passo)

O fluxo completo de execução do XML Privacy é estruturado em **7 fases sequenciais e determinísticas**:

```text
[Arquivo .xml local]
       │
       ▼
 1. UPLOAD & GUARDS DEFENSIVOS (xml-parser.ts)
    • Tamanho <= 20MB
    • Bloqueio contra XXE (rejeita <!DOCTYPE e <!ENTITY)
       │
       ▼
 2. PARSING DOM SEGURO (parseSafeDocument)
    • DOMParser nativo → Document em memória
       │
       ▼
 3. INSPEÇÃO ESTATÍSTICA E ESTRUTURAL (xml-inspector.ts)
    • Percurso recursivo de nós (element, attribute, text, comment, cdata)
    • Rastreamento posicional operacional: position: number[]
       │
       ▼
 4. CLASSIFICAÇÃO SEMÂNTICA (sensitive-tags.ts)
    • Consulta catálogo de tags conhecidas (NFe, CTe, NFSe, etc.)
    • Heurísticas de normalização e prefixo (razao, xrazao, nome, fone, etc.)
    • Atribui FieldCategory (RAZAO_SOCIAL, CPF, CNPJ, NOME, CONTATO, etc.)
    • Define ação sugerida (REPLACE, SCRUB_TEXT, REMOVE_SUBTREE)
       │
       ▼
   ┌────────────────────────────────────────────────────────┐
   │ CONTRATO INTERMEDIÁRIO: XmlField[]                    │
   └────────────────────────────────────────────────────────┘
       │
       ▼
 5. INTERVENÇÃO & DECISÃO DO USUÁRIO (XmlPrivacyView.tsx)
    • Tabela interativa com busca e filtros por categoria
    • Usuário ativa/desativa seleções (selected flag)
    • Usuário pode alterar ação de cada campo individual
       │
       ▼
 6. EXECUÇÃO DETERMINÍSTICA DA SANITIZAÇÃO (xml-sanitizer.ts)
    • Cria novo Document DOM a partir da string original
    • Localiza nós pela coordenada position: number[]
    • Aplica mutações:
      ├─ REPLACE        → Substitui valor por token determinístico [CAT_001]
      ├─ SCRUB_TEXT     → Regex scrubbing em conteúdo livre (text-scrub.ts)
      ├─ REMOVE_SUBTREE → Remove nó completo e filhos (ex: <Signature>)
      └─ PRESERVE       → Mantém valor original intacto
       │
       ▼
 7. SERIALIZAÇÃO & RESUMO QUANTITATIVO (XMLSerializer)
    • Serializa DOM higienizado para string
    • Consolida métricas (SanitizationSummary)
       │
       ▼
   ┌────────────────────────────────────────────────────────┐
   │ CONTRATO DE SAÍDA: SanitizationResult                  │
   │ { success, sanitizedXml, summary, fields, errors }     │
   └────────────────────────────────────────────────────────┘
       │
       ▼
 [Visualização, Cópia e Download do XML Sanitizado na UI]
```

---

## 6. Catálogo de Tags e Heurísticas de Classificação

O arquivo `catalog/sensitive-tags.ts` contém o mapeamento declarativo e as regras de fallback:

### 6.1 Tags de Razão Social e Nomes Empresariais (`RAZAO_SOCIAL`)
Tags mapeadas explicitamente:
- `razaosocial`, `razao_social`, `razaosocialdestinatario`, `razaosocialdestinatariocbsibs`
- `razaosocialprestadorcbsibs`, `razaosocialprestador`, `razaosocialtomador`, `razaosocialintermediario`
- `xnomerec`, `xnomedest`, `razao`, `xrazao`, `razsoc`, `nomeempresarial`, `xnomeemit`, `xnomeresp`

### 6.2 Heurísticas de Fallback (`classifyTag`)
Quando uma tag não possui correspondência exata no dicionário `SENSITIVE_TAGS`:
1. `normalized.startsWith("razao")` ou `normalized.startsWith("xrazao")` ou `normalized.startsWith("nomeempresarial")` ➔ `RAZAO_SOCIAL` (`REPLACE`);
2. `normalized.startsWith("cnpj")` ➔ `CNPJ` (`REPLACE`);
3. `normalized.startsWith("cpf")` ➔ `CPF` (`REPLACE`);
4. `normalized.startsWith("fone")`, `telefone`, `celular`, `email` ➔ `CONTATO` (`REPLACE`);
5. `normalized.startsWith("xnome")` ou `normalized.startsWith("nome")` ➔ `NOME` (`REPLACE`);
6. `normalized.startsWith("ndps")`, `iddps`, `idnfse` ➔ `IDENTIFICADOR_DPS` (`REPLACE`);
7. Proteção contra falso positivo em tipo de pessoa: `<pessoa_destinatario>J</pessoa_destinatario>` é classificado como `OUTRO` (`PRESERVE`).

---

## 7. Demonstração Prática com Exemplo Real

### 7.1 XML de Entrada (Original)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260100000000000191550010000000011000000011" versao="4.00">
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>EMPRESA MODELO DISTRIBUIDORA LTDA</xNome>
        <enderEmit>
          <xLgr>AVENIDA PAULISTA</xLgr>
          <nro>1000</nro>
          <xBairro>BELA VISTA</xBairro>
          <fone>11987654321</fone>
        </enderEmit>
      </emit>
      <dest>
        <CPF>12345678901</CPF>
        <xNome>JOAO DA SILVA</xNome>
        <email>joao.silva@provedor.com.br</email>
      </dest>
      <infAdic>
        <infCpl>Entregar para contato Joao no tel (11) 99888-7766 ou email suporte@empresa.com. Transportar com cuidado.</infCpl>
      </infAdic>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignedInfo>
          <SignatureValue>MIIB...hash...==</SignatureValue>
        </SignedInfo>
      </Signature>
    </infNFe>
  </NFe>
</nfeProc>
```

---

### 7.2 O Que o `Inspector` e o `Catalog` Descobrem

| Tag / Path | Categoria (`FieldCategory`) | Kind | Ação Sugerida | Selecionado Padrão? |
| --- | --- | --- | --- | --- |
| `infNFe/@Id` | `IDENTIFICADOR_DPS` | `attribute` | `REPLACE` | Sim |
| `emit/CNPJ` | `CNPJ` | `element` | `REPLACE` | Sim |
| `emit/xNome` | `RAZAO_SOCIAL` | `element` | `REPLACE` | Sim |
| `emit/enderEmit/fone` | `CONTATO` | `element` | `REPLACE` | Sim |
| `dest/CPF` | `CPF` | `element` | `REPLACE` | Sim |
| `dest/xNome` | `NOME` | `element` | `REPLACE` | Sim |
| `dest/email` | `CONTATO` | `element` | `REPLACE` | Sim |
| `infAdic/infCpl` | `TEXTO_LIVRE` | `element` | `SCRUB_TEXT` | Sim |
| `Signature` | `ASSINATURA` | `element` | `REMOVE_SUBTREE` | Sim |
| `enderEmit/xLgr` | `ENDERECO` | `element` | `REPLACE` | Não (opcional) |

---

### 7.3 A Execução do `Sanitizer`

1. **Tokens Sintéticos Determinísticos (`ReplacementGenerator`)**:
   - Cada valor sensível recebe um token baseado na sua categoria.
   - O mesmo CNPJ ou CPF repetido em diferentes partes do documento recebe **o mesmo token sintético**, preservando a correlação lógica do arquivo.
   - `12345678000195` ➔ `[CNPJ_001]`
   - `12345678901` ➔ `[CPF_001]`
   - `EMPRESA MODELO DISTRIBUIDORA LTDA` ➔ `[RAZAO_SOCIAL_001]`
   - `JOAO DA SILVA` ➔ `[NOME_001]`
   - `joao.silva@provedor.com.br` ➔ `[CONTATO_001]`
2. **Anonimização de Texto Livre (`text-scrub.ts`)**:
   - No campo `<infCpl>`, a estrutura original da frase é mantida, mas os padrões sensíveis internos são substituídos:
   - *"Entregar para contato Joao no tel (11) 99888-7766 ou email suporte@empresa.com. Transportar com cuidado."*  
     ➔ *"Entregar para contato Joao no tel [CONTATO_002] ou email [CONTATO_003]. Transportar com cuidado."*
3. **Remoção de Subárvores de Assinatura (`REMOVE_SUBTREE`)**:
   - Como o XML foi alterado, qualquer assinatura digital original W3C (`<Signature>`) se torna criptograficamente inválida. O nó `<Signature>` completo é removido da árvore.

---

### 7.4 XML de Saída Sanitizado (`sanitizedXml`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="[IDENTIFICADOR_DPS_001]" versao="4.00">
      <emit>
        <CNPJ>[CNPJ_001]</CNPJ>
        <xNome>[RAZAO_SOCIAL_001]</xNome>
        <enderEmit>
          <xLgr>AVENIDA PAULISTA</xLgr>
          <nro>1000</nro>
          <xBairro>BELA VISTA</xBairro>
          <fone>[CONTATO_004]</fone>
        </enderEmit>
      </emit>
      <dest>
        <CPF>[CPF_001]</CPF>
        <xNome>[NOME_001]</xNome>
        <email>[CONTATO_001]</email>
      </dest>
      <infAdic>
        <infCpl>Entregar para contato Joao no tel [CONTATO_002] ou email [CONTATO_003]. Transportar com cuidado.</infCpl>
      </infAdic>
    </infNFe>
  </NFe>
</nfeProc>
```

---

### 7.5 Resumo Quantitativo (`SanitizationSummary`)

```json
{
  "fieldsFound": 10,
  "fieldsSanitized": 9,
  "fieldsReplaced": 7,
  "fieldsScrubbed": 1,
  "subtreesRemoved": 1
}
```

---

## 8. Contratos e Tipos Centrais do Domínio

Os tipos definidos em `domain/sanitization.types.ts` constituem a linguagem única de todo o motor:

### 8.1 Categorias de Sensibilidade (`FieldCategory`)

```typescript
export type FieldCategory =
  | "CPF"               // Cadastro de Pessoa Física (11 dígitos)
  | "CNPJ"              // Cadastro Nacional da Pessoa Jurídica (14 dígitos)
  | "DOCUMENTO"         // RG, CNH, Passaporte, IdEstrangeiro
  | "CREDENCIAIS"       // Senhas, tokens, hashes, access keys
  | "NOME"              // Nomes de pessoas, requerentes e responsáveis
  | "RAZAO_SOCIAL"      // Razão social e nomes empresariais
  | "CONTATO"           // Telefones, celulares e e-mails
  | "INSCRICAO"         // Inscrição Estadual, Municipal ou SUFRAMA
  | "ENDERECO"          // Logradouros, números, complementos e CEPs
  | "TEXTO_LIVRE"       // Observações gerais, dados adicionais e mensagens
  | "IDENTIFICADOR_DPS" // Identificadores estruturados de documentos fiscais
  | "ASSINATURA"        // Blocos W3C XML Signature (<Signature>)
  | "OUTRO";            // Nós não classificados como sensíveis
```

### 8.2 Ações de Sanitização (`SanitizationAction`)

```typescript
export type SanitizationAction =
  | "PRESERVE"        // Mantém o valor original inalterado
  | "REPLACE"         // Substitui integralmente pelo token sintético [CATEGORIA_XXX]
  | "SCRUB_TEXT"      // Anonimiza apenas padrões PII internos dentro do texto
  | "REMOVE_SUBTREE"; // Remove o nó e todos os seus filhos da árvore XML
```

### 8.3 Interface do Campo Inspecionado (`XmlField`)

```typescript
export interface XmlField {
  id: string;                  // Hash determinístico da posição na árvore
  tag: string;                 // Nome da tag ou @atributo
  path: string;                // Caminho XPath legível (ex: /nfeProc[1]/NFe[1]/infNFe[1]/emit[1]/CNPJ[1])
  value: string;               // Valor textual atual ou resumo do container
  namespaceUri: string | null; // URI do namespace XML (se houver)
  category: FieldCategory;     // Categoria atribuída
  kind: XmlFieldKind;          // element, attribute, text, comment, cdata
  action: SanitizationAction;  // Ação a ser aplicada
  selected: boolean;           // Flag de ativação pelo usuário
  hasElementChildren: boolean; // Indica se possui filhos
  position: number[];          // Coordenada posicional determinística na árvore
}
```

---

## 9. Segurança e Invariantes do Sistema

1. **Prevenção Ativa Contra XXE (XML External Entity)**:
   - A função `assertSafeXmlSource` analisa a string de entrada via regex antes de invocar qualquer parser, bloqueando sumariamente qualquer declaração `<!DOCTYPE` ou `<!ENTITY`.
2. **Proteção de Memória (DoS Prevention)**:
   - O tamanho máximo defensivo permitido para processamento no cliente é de **20MB** (`MAX_XML_SIZE_BYTES = 20 * 1024 * 1024`).
3. **Consistência de Identificadores (Hash Determinístico)**:
   - Os tokens são gerados de forma sequencial e determinística dentro da sessão através de `ReplacementGenerator`, garantindo integridade referencial em documentos complexos.
4. **Isolamento de Efeitos Colaterais**:
   - As funções de negócio em `application/` são funções puras em relação ao ambiente (não usam `window`, `localStorage`, rede ou cookies).

---

## 10. Como Testar e Validar o Módulo

O XML Privacy conta com cobertura integral de testes unitários e de integração através do **Vitest**:

```bash
# Executar todos os testes do módulo XML Privacy
npm test tests/features/xml-privacy
```

### Suíte de Testes:

- `tests/features/xml-privacy/privacy-invariants.test.ts`: **Invariantes Fundamentais de Privacidade** — Garante que razões sociais fiscais (`razao_social_destinatario`, `razao_social_destinatario_cbsibs`, `nome_empresarial`, etc.) e dados PII nunca vazem sem anonimização, validando também que flags de pessoa jurídica (`<pessoa_destinatario>J</pessoa_destinatario>`) não gerem falsos positivos.
- `tests/features/xml-privacy/xml-inspector.test.ts`: Valida parsing seguro, percurso DOM, detecção de atributos, comentários e priorização.
- `tests/features/xml-privacy/xml-sanitizer.test.ts`: Valida geração de tokens, mutações `REPLACE`, `SCRUB_TEXT`, `REMOVE_SUBTREE` e cálculo de métricas.
- `tests/features/xml-privacy/text-scrub.test.ts`: Valida regex de CPFs, CNPJs, e-mails e telefones em textos livres.
- `tests/features/xml-privacy/presentation.test.tsx`: Valida upload, transição de estado da UI, toggles e reatividade.
- `tests/features/xml-privacy/integration-e2e.test.ts`: Valida o pipeline completo de ponta a ponta com fixtures fiscais reais.