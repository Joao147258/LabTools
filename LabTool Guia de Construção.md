# LabTool — Guia de Construção

## 1. Finalidade

Este documento orienta a construção do LabTool a partir do zero.

A construção deve avançar de forma incremental, partindo dos conceitos e contratos até chegar à interface.

O foco é compreender e implementar:

- arquitetura;
- responsabilidades das camadas;
- contratos;
- modelos;
- fluxo de dados;
- motores independentes;
- regras de segurança;
- regras de privacidade;
- testes;
- integração entre aplicação e apresentação.

A implementação existente pode ser utilizada como referência de comportamento, mas a nova construção deve seguir sua própria sequência de implementação.

A ordem geral será:

```text
CONCEITO
   ↓
MODELO
   ↓
CONTRATO
   ↓
REGRA
   ↓
IMPLEMENTAÇÃO
   ↓
TESTE
   ↓
APRESENTAÇÃO
```

---

# 2. Escopo do LabTool

O LabTool é uma aplicação Next.js organizada como monólito modular.

Inicialmente contém três ferramentas independentes:

```text
LabTool
│
├── XML Privacy
│   └── inspeção e sanitização de XML
│
├── XML Comparator
│   └── comparação estrutural de XML
│
└── CNPJ Intelligence
    └── consulta e normalização de dados cadastrais
```

Cada ferramenta possui seu próprio fluxo e suas próprias regras.

---

# 3. Princípios arquiteturais

## 3.1 Monólito modular

Existe uma única aplicação.

As funcionalidades são separadas em features.

```text
src/
├── app/
├── features/
│   ├── xml-privacy/
│   ├── xml-comparator/
│   └── cnpj-intelligence/
└── shared/
```

Cada feature deve possuir fronteiras claras.

---

## 3.2 Um motor por ferramenta

Cada ferramenta possui seu próprio motor.

```text
XML Privacy
     ↓
Privacy Engine


XML Comparator
     ↓
Comparator Engine


CNPJ Intelligence
     ↓
CNPJ Flow
```

O XML Comparator não deve utilizar internamente o motor do XML Privacy.

O XML Privacy não deve conhecer o XML Comparator.

Comportamentos parecidos podem existir de forma independente quando pertencem a responsabilidades diferentes.

---

## 3.3 Lógica antes da interface

A interface não deve ser o local principal das regras.

A construção deve seguir preferencialmente:

```text
domain
   ↓
application
   ↓
infrastructure
   ↓
presentation
```

A existência de `infrastructure` depende da necessidade da feature.

Ferramentas totalmente locais podem não precisar dessa camada.

---

## 3.4 TypeScript

A lógica principal será implementada em TypeScript.

O código deve priorizar:

- tipos explícitos;
- contratos claros;
- funções determinísticas;
- responsabilidades pequenas;
- entradas e saídas conhecidas;
- tratamento explícito de erros;
- ausência de efeitos colaterais desnecessários.

---

## 3.5 Processamento local dos XMLs

As ferramentas:

```text
XML Privacy
XML Comparator
```

processam documentos localmente no navegador.

O fluxo deve permanecer:

```text
arquivo local
    ↓
File API
    ↓
string
    ↓
DOMParser
    ↓
motor da ferramenta
    ↓
resultado local
```

O XML original não deve depender de envio para API externa.

---

## 3.6 Determinismo

Os motores de XML são baseados em regras.

Não utilizam IA para determinar:

- classificação;
- sanitização;
- diferenças;
- estrutura;
- conteúdo exportado.

A mesma entrada e a mesma configuração devem produzir o mesmo resultado.

---

# 4. Regra de construção

Cada parte deve passar por cinco estágios:

```text
ENTENDER
   ↓
MODELAR
   ↓
IMPLEMENTAR
   ↓
TESTAR
   ↓
INTEGRAR
```

### Entender

Definir qual problema a parte resolve.

### Modelar

Definir os tipos e conceitos necessários.

### Implementar

Criar o comportamento em TypeScript.

### Testar

Validar comportamento normal, limites e casos adversariais.

### Integrar

Somente depois conectar a implementação à camada seguinte.

---

# 5. Etapa 0 — Inicialização

## Objetivo

Criar o projeto mínimo necessário para iniciar a implementação.

Estrutura inicial:

```text
LabTool/
├── src/
│   ├── app/
│   └── features/
│
├── tests/
│
├── package.json
├── tsconfig.json
├── eslint.config.mjs
└── vitest.config.ts
```

Evitar criar antecipadamente uma árvore completa de arquivos vazios.

Os módulos devem aparecer conforme responsabilidades reais forem implementadas.

## Base técnica

Configurar:

- Next.js;
- React;
- TypeScript;
- ESLint;
- Vitest;
- jsdom quando necessário.

## Quality gates iniciais

Devem funcionar:

```bash
npm run dev
npm run typecheck
npm run lint
npm run test
npm run build
```

---

# 6. Etapa 1 — Arquitetura das features

## Estrutura base

```text
features/
└── feature-name/
    ├── domain/
    ├── application/
    ├── infrastructure/
    └── presentation/
```

As pastas só devem existir quando necessárias.

---

## 6.1 Domain

Representa conceitos e regras do problema.

Pode conter:

- tipos;
- interfaces;
- value objects;
- enums;
- validações puras;
- invariantes.

Não deve depender de:

- React;
- Next.js;
- componentes;
- HTTP;
- APIs externas.

---

## 6.2 Application

Contém os comportamentos e casos de uso.

Pode:

- receber entradas;
- coordenar regras;
- transformar dados;
- produzir resultados;
- utilizar contratos definidos pela própria feature.

---

## 6.3 Infrastructure

Responsável por dependências externas.

Exemplos:

```text
HTTP
API externa
filesystem
persistência
serviços externos
```

XML Privacy e XML Comparator não precisam dessa camada para seu processamento principal.

CNPJ Intelligence utiliza infraestrutura para comunicação com a fonte externa.

---

## 6.4 Presentation

Responsável pela interação com a interface.

Inclui:

- React;
- componentes;
- estado visual;
- eventos;
- upload;
- visualização;
- download;
- feedback.

A Presentation chama a Application.

Ela não deve substituir o motor.

---

# 7. Etapa 2 — XML Privacy: modelo de domínio

Criar inicialmente:

```text
src/features/xml-privacy/
└── domain/
    └── sanitization.types.ts
```

## Objetivo

Representar os conceitos necessários para inspeção e sanitização.

Antes do algoritmo existir, devem estar definidos conceitos como:

```ts
XmlField
SensitiveCategory
SanitizationAction
SanitizationResult
SanitizationSummary
```

---

## 7.1 XmlField

Representa algo identificado durante a inspeção.

Pode conter informações como:

```text
id
tag
value
category
action
selected
position
```

O modelo deve permitir identificar de forma estável o local correspondente no documento.

---

## 7.2 SensitiveCategory

Representa a classificação de um campo.

Exemplos:

```text
CPF
CNPJ
DOCUMENTO
NOME
RAZAO_SOCIAL
CONTATO
IDENTIFICADOR_DPS
INSCRICAO
ENDERECO
TEXTO_LIVRE
OUTRO
```

A categoria descreve o tipo de informação.

Ela não executa a sanitização.

---

## 7.3 SanitizationAction

Representa o comportamento que será aplicado.

```text
PRESERVE
REPLACE
SCRUB_TEXT
REMOVE_SUBTREE
```

### PRESERVE

Preserva o valor original exatamente como informado no documento XML (política padrão para `INSCRICAO` e `ENDERECO`).

### REPLACE

Substitui completamente o valor por um token sintético determinístico (`[CNPJ_001]`, `[NOME_001]`).

### SCRUB_TEXT

Mantém o texto, substituindo somente padrões sensíveis encontrados dentro dele (regex ordenada de e-mail, CNPJ, CPF e telefones).

### REMOVE_SUBTREE

Remove determinado nó ou subárvore da árvore XML (utilizado para assinaturas digitais XMLDSig e comentários).

---

# 8. Etapa 3 — XML Privacy: catálogo

Criar:

```text
xml-privacy/
└── catalog/
    └── sensitive-tags.ts
```

## Objetivo

Separar conhecimento declarativo do algoritmo.

O catálogo deve responder:

```text
nome da tag
    ↓
normalização
    ↓
categoria
    ↓
política padrão
    ↓
ação sugerida
```

Exemplo conceitual:

```text
CNPJ
    ↓
CNPJ
    ↓
selected = true
    ↓
REPLACE
```

Outro exemplo:

```text
CEP
    ↓
ENDERECO
    ↓
selected = false
    ↓
PRESERVE
```

Inscrição Municipal (`IM`) e Endereço (`CEP`, `xLgr`, `nro`, `xBairro`, `cMun`, `UF`):

```text
IM / CEP
    ↓
INSCRICAO / ENDERECO
    ↓
selected = false
    ↓
PRESERVE
```

O catálogo não deve:

- percorrer XML;
- modificar XML;
- utilizar React;
- criar elementos DOM.

---

# 9. Etapa 4 — XML Privacy: parsing seguro

O XML passa primeiro por uma etapa de parsing.

Fluxo:

```text
string
   ↓
guardas
   ↓
DOMParser
   ↓
Document
```

## Verificações

Antes ou durante o parse devem ser tratados:

- XML vazio;
- XML malformado;
- `DOCTYPE`;
- `ENTITY`;
- erros retornados pelo `DOMParser`.

## Conceitos necessários

Compreender a diferença entre:

```text
Document
Element
Attr
Text
Comment
CDATASection
Node
```

Também compreender:

```text
children
```

versus:

```text
childNodes
```

O traversal completo deve considerar os tipos de nó relevantes.

---

# 10. Etapa 5 — XML Privacy: inspector

Criar:

```text
application/
└── xml-inspector.ts
```

Primeira responsabilidade:

```ts
inspectXml(xml)
```

Fluxo:

```text
XML
 ↓
parse
 ↓
Document
 ↓
walk
 ↓
classify
 ↓
XmlField[]
```

O inspector apenas observa.

Ele não deve modificar o documento original.

---

## 10.1 Traversal

Percorrer a árvore considerando:

- elementos;
- atributos relevantes;
- texto;
- comentários;
- CDATA;
- texto misto.

---

## 10.2 Classificação

Para cada informação encontrada:

```text
nome
 ↓
normalize
 ↓
catalog
 ↓
SensitiveCategory
```

---

## 10.3 Seleção padrão

A política inicial deve distinguir:

### Selecionados automaticamente

```text
CPF
CNPJ
DOCUMENTO
NOME
RAZAO_SOCIAL
CONTATO
IDENTIFICADOR_DPS
TEXTO_LIVRE
```

### Reconhecidos, mas não selecionados automaticamente

```text
ENDERECO
INSCRICAO
```

### Localização genérica preservada

Exemplos:

```text
cMun
xMun
UF
cPais
xLocEmi
xLocPrestacao
cLocIncid
xLocIncid
```

A simples presença de informação geográfica não torna o campo automaticamente sanitizável.

---

# 11. Etapa 6 — XML Privacy: texto livre

Criar a capacidade de identificar informações sensíveis dentro de textos maiores.

Exemplo:

```xml
<xTexto>
Cliente 11.111.111/0001-11 - contato exemplo@email.com
</xTexto>
```

O texto completo não precisa necessariamente ser substituído.

Pode tornar-se:

```text
Cliente [CNPJ_001] - contato [EMAIL_001]
```

A operação pertence ao comportamento:

```text
SCRUB_TEXT
```

Testar isoladamente:

- CPF;
- CNPJ;
- telefone;
- e-mail;
- múltiplos dados;
- dados repetidos;
- textos sem informação sensível.

---

# 12. Etapa 7 — XML Privacy: sanitização

Após o inspector funcionar, implementar:

```ts
sanitizeXml(xml, fields)
```

Fluxo:

```text
XML original
      +
XmlField[]
      ↓
seleção
      ↓
ações
      ↓
Document modificado
      ↓
XMLSerializer
      ↓
XML sanitizado
```

---

## 12.1 Tokens

Substituições devem utilizar tokens sintéticos.

Exemplo:

```text
[CNPJ_001]
[CPF_001]
[NOME_001]
[EMAIL_001]
```

---

## 12.2 REPLACE

Exemplo:

```xml
<CNPJ>11111111000111</CNPJ>
```

torna-se:

```xml
<CNPJ>[CNPJ_001]</CNPJ>
```

---

## 12.3 SCRUB_TEXT

Substitui somente partes sensíveis.

---

## 12.4 REMOVE_SUBTREE

Remove nós que não devem permanecer no resultado.

Pode ser aplicado, por exemplo, a determinados comentários ou estruturas explicitamente classificadas para remoção.

---

## 12.5 Resumo

A sanitização deve retornar também informações sobre sua execução.

Exemplo conceitual:

```ts
{
  xml,
  summary
}
```

O resumo pode conter:

```text
campos encontrados
campos selecionados
substituições
remoções
```

---

# 13. Etapa 8 — XML Privacy: testes do motor

Antes da interface, testar:

- XML válido;
- XML inválido;
- XML vazio;
- CNPJ;
- CPF;
- nome;
- razão social;
- telefone;
- e-mail;
- identificadores;
- endereço;
- inscrição;
- localização;
- atributo;
- comentário;
- CDATA;
- texto misto;
- texto livre;
- tags repetidas;
- namespaces;
- `DOCTYPE`;
- `ENTITY`.

Também validar que campos não selecionados permanecem intactos.

---

# 14. Etapa 9 — XML Privacy: Presentation

Criar:

```text
presentation/
└── XmlSanitizer.tsx
```

Fluxo:

```text
upload
 ↓
leitura
 ↓
inspectXml()
 ↓
campos encontrados
 ↓
seleção
 ↓
sanitizeXml()
 ↓
preview
 ↓
download
```

A UI não deve recriar regras já existentes no motor.

---

# 15. Etapa 10 — XML Comparator: domínio

Iniciar uma nova feature:

```text
features/
└── xml-comparator/
```

Criar seus próprios modelos.

Estrutura inicial:

```text
xml-comparator/
└── domain/
    ├── comparison.types.ts
    └── export.types.ts
```

Conceitos principais:

```text
XmlNode
XmlTree
XmlAttribute
XmlDifference
DifferenceType
ComparisonResult
```

---

# 16. Etapa 11 — XML Comparator: árvore

O comparador precisa transformar XML em uma representação própria.

Fluxo:

```text
XML
 ↓
DOMParser
 ↓
Document
 ↓
tree builder
 ↓
XmlTree
```

Cada nó deve possuir informação suficiente para comparação.

Exemplo:

```text
name
value
attributes
children
path
```

---

## 16.1 Path

O caminho permite identificar a posição estrutural.

Exemplo:

```text
NFSe[0]
infNFSe[0]
emit[0]
CNPJ[0]
```

Tags repetidas precisam de identificação consistente.

---

# 16. Etapa 11 — XML Comparator: parser e árvore normalizada

Criar:

```text
application/
└── comparator-parser.ts
```

Fluxo:

```text
XML string
    ↓
assertSafeXmlSource (limite 20MB e bloqueio rigoroso contra XXE)
    ↓
DOMParser
    ↓
buildComparatorTree
    ↓
ComparatorXmlNode
```

Cada nó normalizado possui informação suficiente para comparação estrutural determinística:

```ts
export interface ComparatorXmlNode {
  tag: string;
  path: string;
  attributes: ComparatorXmlAttribute[];
  text: string | null;
  children: ComparatorXmlNode[];
  hasElementChildren: boolean;
}
```

---

# 17. Etapa 12 — XML Comparator: comparação estrutural (`xml-differ.ts`)

Criar:

```text
application/
└── xml-differ.ts
```

Operação principal:

```ts
compareXmlTrees(approvedTree, rejectedTree)
```

O retorno descreve as divergências estruturais e de valores através do contrato `XmlComparisonResult`.

Tipos de divergência (`DiffKind`):

```text
ONLY_IN_APPROVED   → Elemento presente apenas no XML aprovado
ONLY_IN_REJECTED   → Elemento presente apenas no XML rejeitado
VALUE_DIFF         → Divergência de valor principal em elemento folha
ATTRIBUTE_DIFF     → Divergência em atributo principal
STRUCTURE_DIFF     → Incompatibilidade de hierarquia (folha vs container ou tags divergentes)
CONTEXTUAL_DIFF    → Divergência contextual (dados cadastrais do tomador ou identificadores de documento)
```

---

# 18. Etapa 13 — XML Comparator: classificador semântico (`diff-classifier.ts`)

Criar:

```text
application/
└── diff-classifier.ts
```

## Responsabilidade

Distingue semanticamente diferenças contextuais de identificação/endereço do cliente e identificadores técnicos de divergências fiscais/operacionais principais.

## Pipeline Arquitetural

```text
xml-differ
    descobre QUE algo mudou
        ↓
diff-classifier
    determina QUE TIPO de diferença é (CONTEXTUAL_DIFF vs VALUE_DIFF / ATTRIBUTE_DIFF)
        ↓
diff-context
    determina ONDE posicionar a diferença nas linhas formatadas
        ↓
presentation
    determina COMO renderizar visualmente
```

## Ordem de Precedência Rigorosa

1. **Diferenças Estruturais / Ausência**: Sempre principais (`STRUCTURE_DIFF`, `ONLY_IN_APPROVED`, `ONLY_IN_REJECTED`).
2. **Localização Fiscal / Município / UF / País**: `cMun`, `UF`, `cLocPrestacao`, `cLocIncid` são **sempre principais (`VALUE_DIFF`)**, mesmo dentro de blocos de endereço do tomador.
3. **Escopo Emitente / Prestador**: `CNPJ`, `IM`, `xNome`, telefones, e-mails e endereços sob `emit`/`prest` são **sempre principais (`VALUE_DIFF`)**.
4. **Campos Fiscais Conhecidos / Descrições**: `cTribNac`, `CST`, `cNBS`, `vBC`, `pAliqAplic`, `xDescServ` são **sempre principais (`VALUE_DIFF`)**.
5. **Identificadores Documentais**: `serie`, `nDPS`, `nNFSe`, `dhEmi`, `dCompet` e atributos `Id` em `infDPS`/`infNFSe` configuram **`CONTEXTUAL_DIFF`**.
6. **Campos Cadastrais do Tomador / Destinatário**: `CNPJ`, `CPF`, `xNome`, `IM`, `IE`, `fone`, `email`, `CEP`, `xLgr`, `nro`, `xBairro`, `xCpl` sob `toma`/`dest` configuram **`CONTEXTUAL_DIFF`**.
7. **Tags Explícitas de Tomador**: `cnpjTomador`, `xNomeTomador`, `cepTomador`, etc., configuram **`CONTEXTUAL_DIFF`**.
8. **Demais Divergências**: Configuram divergência principal (`VALUE_DIFF`).

---

# 19. Etapa 14 — XML Comparator: contexto posicional (`diff-context.ts`)

Criar:

```text
application/
└── diff-context.ts
```

Localiza o contexto posicional e de linhas visuais para a divergência selecionada:
- Mapeia `approvedLineIndex` e `rejectedLineIndex` a partir de `FormattedLine[]`;
- Resolve o caminho do nó pai (`parentPath`) para navegação hierárquica;
- Não armazena estado visual (papel exclusivo da camada de apresentação).

---

# 20. Etapa 15 — XML Comparator: sanitização própria com preservação

Criar:

```text
catalog/
└── export-sensitive-fields.ts

application/
└── export-sanitizer.ts
```

Esse sanitizador pertence exclusivamente ao XML Comparator e não depende do motor do XML Privacy:
- **Preservação**: Inscrição Municipal (`IM`, `InscricaoMunicipal`, `IE`) e dados de endereço/localização (`CEP`, `xLgr`, `nro`, `xBairro`, `cMun`, `UF`, `cPais`) **não são mascarados**, preservando seus valores originais para análise técnica no relatório.
- **Anonimização**: Apenas PIIs sensíveis (como `CNPJ`, `CPF`, `NOME`, `CONTATO`) recebem substituição determinística relacional (`[CNPJ_001]`).
- **Contexto Temporário (`SanitizationContext`)**: Garante consistência de tokens entre XML Aprovado, XML Rejeitado e Arquivo de Erro complementar (JSON, XML ou Texto Livre).

---

# 21. Etapa 16 — Contexto de sanitização

A exportação mantém consistência relacional entre documentos durante a mesma execução:

```text
Documento A: 11.111.111/0001-11 ➔ [CNPJ_001]
Documento B: 11.111.111/0001-11 ➔ [CNPJ_001]
Arquivo Erro: CNPJ 11.111.111/0001-11 inválido ➔ CNPJ [CNPJ_001] inválido
```

O contexto é limpo e liberado ao término da exportação (`finally`).

---

# 22. Etapa 17 — Sanitização de diferentes formatos de retorno de erro

O motor trata defensivamente o arquivo de retorno de erro opcional:
- **XML**: Percurso DOM seguro com categorização de nós;
- **JSON**: Percurso recursivo de nós, chaves, arrays e valores;
- **Texto Livre**: Varredura regex controlada e ordenada contra padrões sensíveis.

---

# 23. Etapa 18 — Markdown Exporter

Criar:

```text
application/
└── markdown-exporter.ts
```

Orquestra a sanitização defensiva dos três documentos e monta o relatório técnico estruturado:
- Metadados e data da exportação;
- Sumário quantitativo consolidado de divergências;
- Tabela de divergências detalhadas com caminhos e valores;
- Blocos de código protegidos contra quebra acidental de Markdown;
- Retorno de contrato `ComparisonExportResult` de sucesso ou erro (fail-stop).

---

# 24. Etapa 19 — XML Comparator: visualização espelhada (`presentation`)

Criar:

```text
presentation/
├── mirrored-rows.ts           → Reconciliação estrutural por LCS de nós XML
├── MirroredXmlViewer.tsx       → Grade única de visualização com scroll vertical compartilhado
├── MirroredXmlRow.tsx          → Linha lógica em CSS Grid (2 colunas) com altura compartilhada
├── ComparatorSummary.tsx       → Resumo de métricas e chips de navegação
├── ComparatorDiffDetails.tsx   → Painel inferior de detalhes estruturais
├── ComparatorUploadArea.tsx    → Dropzones triplas de ingestão com validação
└── XmlComparatorView.tsx       → Orquestrador React de estado do workspace
```

## Características Visuais Obrigatórias
1. **XML Aprovado à esquerda, XML Rejeitado à direita**.
2. **Grade Única Compartilhada**: Cada linha lógica (`MirroredXmlRow`) reside sob um grid de 2 colunas, garantindo a mesma altura vertical mesmo quando houver quebra de linha.
3. **Quebra Segura de Linha**: `white-space: pre-wrap` e `overflow-wrap: anywhere`, sem desalinhar a linha seguinte.
4. **Scroll Vertical Único**: Container central com scroll sincronizado para eliminação de desvios.
5. **Seleção em Roxo / Mauve (`var(--color-mauve)`)**: Linha selecionada destacada com fundo `rgba(203, 166, 247, 0.22)`, bordas laterais `3px solid var(--color-mauve)` e contorno `1px solid var(--color-mauve)`.
6. **Alternância por Toggle**: Clicar em uma linha já selecionada executa **deseleção imediata**, retornando o painel de detalhes ao estado neutro.

---

# 25. Etapa 20 — XML Comparator: suíte de testes como evidência

Cobrir integralmente:
- Validação algorítmica do parser, limite de 20MB e proteção contra XXE;
- Comparação estrutural de nós idênticos, divergências de valor, atributo e estrutura;
- Classificação semântica em `diff-classifier.test.ts` (33 testes cobrindo tomador, prestador, fiscal, localização e identificadores);
- Reconciliação de linhas espelhadas por LCS e suporte a slots vazios;
- Interatividade de seleção em roxo/mauve, toggle de deseleção e navegação entre divergências;
- Sanitização de exportação com preservação de IM/endereço e geração de relatório Markdown.

---

# 26. Etapa 21 — Segurança da renderização

XML é conteúdo externo.

Qualquer texto apresentado como HTML deve ser tratado como não confiável.

Fluxo obrigatório quando existir syntax highlighting baseado em HTML:

```text
conteúdo externo
     ↓
escape
     ↓
highlight
     ↓
HTML controlado
     ↓
render
```

Nunca:

```text
conteúdo externo
     ↓
regex de highlight
     ↓
dangerouslySetInnerHTML
```

Testar entradas como:

```html
<script>
<img onerror>
atributos malformados
tags incompletas
entidades XML
```

---

# 27. Etapa 22 — CNPJ Intelligence: domínio

Criar:

```text
features/
└── cnpj-intelligence/
    └── domain/
        ├── cnpj.types.ts
        └── cnpj-validator.ts
```

Começar pela representação e validação do CNPJ.

O domínio não deve conhecer BrasilAPI.

---

# 28. Etapa 23 — Normalização de CNPJ

Implementar explicitamente:

```text
entrada
 ↓
normalização
 ↓
validação
```

A validação deve tratar os formatos suportados pelo projeto.

Separar:

```text
normalizeCnpj()
validateCnpj()
```

Normalizar não significa validar.

---

# 29. Etapa 24 — Algoritmo de validação

Implementar e testar o algoritmo correspondente aos formatos suportados.

Separar:

```text
estrutura
 ↓
caracteres permitidos
 ↓
tamanho
 ↓
sequências inválidas
 ↓
dígitos verificadores
```

Os testes devem existir antes da integração com rede.

---

# 30. Etapa 25 — Contrato de consulta

Criar um contrato para a fonte cadastral.

Exemplo conceitual:

```ts
interface CnpjGateway {
  findByCnpj(cnpj: string): Promise<CnpjCompany>
}
```

Application depende do contrato.

Infrastructure implementa o contrato.

Fluxo:

```text
Application
    ↓
CnpjGateway
    ↑
Infrastructure
```

---

# 31. Etapa 26 — Caso de uso

Criar:

```text
application/
└── consult-cnpj.usecase.ts
```

Responsabilidade:

```text
entrada
 ↓
normalização
 ↓
validação
 ↓
gateway
 ↓
resultado de domínio
```

O caso de uso não deve depender diretamente de detalhes HTTP específicos da fonte externa.

---

# 32. Etapa 27 — Infrastructure CNPJ

Criar:

```text
infrastructure/
├── brasil-api.client.ts
├── brasil-api.mapper.ts
└── brasil-api.types.ts
```

---

## 32.1 Client

Responsável por:

- HTTP;
- timeout;
- status;
- erros de rede;
- resposta externa.

---

## 32.2 Types

Representa o contrato recebido da API externa.

Esses tipos não são necessariamente os mesmos utilizados pelo domínio.

---

## 32.3 Mapper

Transforma:

```text
BrasilAPI response
       ↓
domain model
```

O mapper não deve inventar fatos ausentes.

Dado ausente deve permanecer ausente ou explicitamente identificado como não informado.

---

# 33. Etapa 28 — Route Handler

Criar a rota Next.js responsável por expor o caso de uso.

Fluxo:

```text
browser
 ↓
GET /api/cnpj/{cnpj}
 ↓
route
 ↓
use case
 ↓
gateway
 ↓
BrasilAPI
```

A rota não deve conter o algoritmo de validação do CNPJ.

---

# 34. Etapa 29 — Tratamento de erros

Definir erros conhecidos.

Exemplos:

```text
INVALID_CNPJ
NOT_FOUND
RATE_LIMITED
SERVICE_UNAVAILABLE
TIMEOUT
NETWORK_ERROR
INTERNAL_ERROR
```

Separar:

```text
erro interno
```

de:

```text
mensagem retornada ao cliente
```

Detalhes internos não devem ser enviados diretamente na resposta HTTP.

---

# 35. Etapa 30 — CNPJ Presentation

Somente depois do fluxo completo funcionar criar:

```text
presentation/
├── ConsultCnpjSection.tsx
└── ConsultCnpjDialog.tsx
```

Fluxo:

```text
input
 ↓
normalização local
 ↓
validação local
 ↓
request
 ↓
API Route
 ↓
resultado
 ↓
dialog
```

---

# 36. Etapa 31 — Integração das ferramentas

A aplicação passa a possuir:

```text
src/
├── app/
│   ├── page.tsx
│   ├── xml-privacy/
│   ├── xml-comparator/
│   └── api/
│
└── features/
    ├── xml-privacy/
    ├── xml-comparator/
    └── cnpj-intelligence/
```

As ferramentas continuam independentes.

A Home apenas permite acesso a elas.

---

# 37. Etapa 32 — Shared

Não criar abstrações compartilhadas antecipadamente.

```text
src/shared/
```

só deve receber código quando houver um conceito realmente genérico.

Critério:

```text
Mesmo código?
```

não é suficiente.

A pergunta deve ser:

```text
É o mesmo conceito
+
possui a mesma responsabilidade
+
possui a mesma razão para mudar?
```

Somente então considerar `shared`.

---

# 38. Estratégia de testes

Os testes devem acompanhar cada motor.

Estrutura possível:

```text
tests/
├── xml-privacy.test.ts
├── xml-comparator.test.ts
├── xml-comparator-export.test.ts
├── integration/
└── unit/
```

---

## 38.1 Testes unitários

Validam funções isoladas.

Exemplo:

```text
classificação
normalização
validação
scrub
mapper
```

---

## 38.2 Testes de integração

Validam fluxos entre componentes.

Exemplo:

```text
route
 ↓
usecase
 ↓
gateway
```

---

## 38.3 Testes adversariais

Validam entradas projetadas para quebrar garantias.

Exemplos:

```text
XSS
PII em comentários
CDATA
texto misto
JSON numérico
DOCTYPE
ENTITY
XML malformado
falsos positivos
```

---

# 39. Quality gates

O projeto deve possuir pelo menos:

```text
Typecheck
Lint
Tests
Build
```

Pipeline conceitual:

```text
source
 ↓
tsc
 ↓
eslint
 ↓
vitest
 ↓
next build
```

Uma alteração só deve ser considerada tecnicamente válida quando os gates relevantes permanecerem verdes.

---

# 40. Fluxo completo — XML Privacy

```text
arquivo
 ↓
File.text()
 ↓
inspectXml()
 ↓
parse
 ↓
walk
 ↓
classify
 ↓
XmlField[]
 ↓
seleção
 ↓
sanitizeXml()
 ↓
ações
 ↓
XMLSerializer
 ↓
XML sanitizado
 ↓
preview/download
```

---

# 41. Fluxo completo — XML Comparator

```text
XML aprovado ──┐
               ├─→ parse → tree ─┐
XML rejeitado ─┘                  │
                                  ↓
                           compareXmlTrees()
                                  ↓
                           XmlDifference[]
                                  ↓
                           contextual diff
                                  ↓
                             visualização
                                  ↓
                    sanitização de exportação
                                  ↓
                              Markdown
                                  ↓
                              download
```

---

# 42. Fluxo completo — CNPJ Intelligence

```text
CNPJ
 ↓
normalize
 ↓
validate
 ↓
route
 ↓
usecase
 ↓
gateway
 ↓
BrasilAPI client
 ↓
response
 ↓
mapper
 ↓
domain model
 ↓
response HTTP
 ↓
presentation
```

---

# 43. Dependências esperadas

Direção conceitual:

```text
Presentation
     ↓
Application
     ↓
Domain
```

Quando existir infraestrutura:

```text
Infrastructure
      ↑
contract
      ↓
Application
```

O domínio permanece no centro.

---

# 44. Regras que devem permanecer durante toda a construção

1. XML Privacy possui motor próprio.

2. XML Comparator possui motor próprio.

3. O sanitizador do Comparator não depende do Privacy Engine.

4. XML original é processado localmente.

5. A UI não é responsável pelas regras centrais.

6. Nenhuma diferença encontrada pelo Comparator é automaticamente tratada como causa de rejeição.

7. Informação fiscal ausente não deve ser inventada.

8. Conteúdo de XML deve ser tratado como entrada não confiável durante renderização.

9. Parsing, classificação, transformação e apresentação devem permanecer distinguíveis.

10. Compartilhamento só ocorre quando existir responsabilidade realmente compartilhada.

---

# 45. Ordem resumida de construção

```text
01. Projeto base
02. Quality gates
03. Arquitetura das features

04. XML Privacy Domain
05. XML Privacy Catalog
06. XML Privacy Parser
07. XML Privacy Inspector
08. XML Privacy Text Scrubber
09. XML Privacy Sanitizer
10. XML Privacy Tests
11. XML Privacy UI

12. Comparator Domain
13. Comparator Parser
14. Comparator Tree
15. Comparator Diff
16. Contextual Diff
17. Export Sanitizer
18. Sanitization Context
19. Markdown Export
20. Comparator Tests
21. Comparator UI
22. Render Security

23. CNPJ Domain
24. CNPJ Normalization
25. CNPJ Validation
26. Gateway
27. Use Case
28. BrasilAPI Client
29. BrasilAPI Mapper
30. API Route
31. Error Handling
32. CNPJ Tests
33. CNPJ UI

34. Integração das ferramentas
35. Shared somente quando necessário
36. Quality gates completos
```

---

# 46. Critério final

O LabTool deve terminar organizado em três módulos principais:

```text
XML Privacy
    └── interpreta e sanitiza XML


XML Comparator
    └── compara XML e produz exportação sanitizada


CNPJ Intelligence
    └── valida, consulta, normaliza e apresenta dados cadastrais
```

Cada módulo possui:

```text
responsabilidade conhecida
+
contratos conhecidos
+
fluxo conhecido
+
testes
+
fronteiras arquiteturais
```

O resultado é uma aplicação única, modular, determinística e com motores independentes para cada ferramenta.
