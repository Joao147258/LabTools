# LabTool — Testing Skill

## Estado

COMPLETED

---

## Responsabilidade

Orientar a criação, organização, manutenção e execução de testes automatizados durante a construção incremental e sustentação do LabTool.

Esta skill define as categorias de testes, as regras para validação de comportamentos e as diretrizes para garantir que testes atuem como especificação viva e evidência inegociável de conformidade.

---

## Escopo

Esta skill abrange todo o escopo de testes do LabTool (`tests/`).

A skill de testing **não substitui** a skill específica de cada feature (`xml-privacy`, `xml-comparator`, `cnpj-intelligence`), mas atua como guia transversal e complementar para a garantia da qualidade e validação de invariantes.

---

## Princípio Fundamental: Teste como Evidência

Código compilando ou typecheck sem erros não é evidência suficiente de comportamento correto.

Toda regra implementada ou refatorada deve seguir o fluxo:

```text
regra
  ↓
teste
  ↓
evidência
```

---

## Categorias de Testes

### 1. Testes Unitários

- Validam funções puras, algoritmos isolados, invariantes de domínio e casos de uso sem dependências externas.
- Devem ser rápidos, determinísticos e não depender de rede ou IO real.

### 2. Testes de Integração

- Validam a cooperação entre diferentes módulos, camadas e adaptadores (ex.: caso de uso consumindo gateway com mock de transporte HTTP).
- Asseguram que os contratos entre camadas funcionam conforme o esperado.

### 3. Testes de Regressão

- Criados para proteger correções de bugs identificados.
- Garantem que um comportamento já corrigido nunca volte a falhar em refatorações futuras.

### 4. Casos de Limite (Edge Cases)

- Validam comportamentos em cenários extremos:
  - strings vazias ou compostas exclusivamente por espaços;
  - documentos XML mínimos válidos ou nós profundamente aninhados;
  - CNPJs com sequências repetidas (ex.: `00000000000000`, `11111111111111`);
  - limites de tamanho e tipos numéricos/textuais.

### 5. Testes Adversariais e de Segurança

Validam a robustez das ferramentas diante de entradas maliciosas, malformadas ou imprevisíveis.

No processamento de XML, as entradas adversariais incluem:

- XML malformado ou truncado;
- Injeção de `DOCTYPE` e declarações `ENTITY` (vetores XXE);
- Comentários XML inseridos no meio de nós ou valores sensíveis;
- Blocos `CDATA` contendo tags ou dados que deveriam ser sanitizados;
- Estruturas de texto misto (*mixed content*);
- Dados sensíveis posicionados dentro de atributos em vez de texto de nós;
- Tentativas de injeção de script (XSS) no conteúdo de nós ou atributos;
- Identificadores pessoais (PII) ou dados sensíveis em nós customizados ou imprevistos.

---

## O que os Testes Devem Proteger

Os testes automatizados devem atuar como guardiões de:

- **Contratos**: Tipos de entrada e saída, schemas e payloads;
- **Invariantes**: Garantias que nunca podem ser violadas (ex.: um XML sanitizado nunca deve conter CPFs visíveis);
- **Regras de Negócio**: Algoritmos de validação (dígitos de CNPJ, cálculos, mappers);
- **Correções de Defeitos**: Toda correção deve vir acompanhada do teste que reproduzia o bug;
- **Refatorações**: O comportamento observado deve permanecer inalterado durante melhorias de design.

---

## Regras de Conduta para Testes

- **Nunca antecipar testes**: Não criar testes para funcionalidades ou contratos que ainda não foram construídos no escopo atual.
- **Evidência real de execução**: Nunca afirmar que um teste passou sem antes executá-lo de fato no ambiente.
- **Preservação da arquitetura**: Nunca alterar a arquitetura ou o código de produção apenas para tornar um teste artificialmente mais fácil, se isso comprometer o isolamento ou o design limpo.
- **Proximidade da responsabilidade**: Manter o teste o mais próximo e focado possível da unidade ou camada que está sendo validada.
- **Determinismo estrito**: Testes não devem depender de ordem de execução, tempo de máquina, timezone ou rede externa não mockada.

---

## Base Canônica para Formulação de XMLs de Teste (`./XML_Models/`)

Sempre que for formular, criar, atualizar ou derivar testes, fixtures, mocks ou exemplos envolvendo documentos XML (tanto para o `xml-privacy` quanto para o `xml-comparator`), deve-se **obrigatoriamente utilizar os modelos contidos em `./XML_Models/` como base canônica de referência**.

### Diretrizes de Uso dos Modelos:
- **Estruturas Fiscais Reais**: Os arquivos presentes em `./XML_Models/` contêm a taxonomia, tags, namespaces e hierarquias reais de documentos fiscais eletrônicos brasileiros (NF-e, NFC-e, CT-e, etc.).
- **Geração de Fixtures e Variações**: Para criar testes unitários, testes de integração ou casos adversariais (como injeção de DOCTYPE, CDATA ou comentários), utilize como ponto de partida as estruturas e campos canônicos dos modelos em `./XML_Models/`.
- **Fidelidade de Domínio**: Garante que o motor de privacidade e o motor de comparação sejam sempre validados contra padrões de XML autênticos, e não contra estruturas artificiais ou simplistas demais.

---

## Regra de Portabilidade

É terminantemente proibido utilizar caminhos absolutos específicos da máquina em arquivos de teste, fixtures, mocks ou configurações. Utilizar sempre caminhos relativos ao projeto (`./tests/`, `./src/`, `./XML_Models/`).

---

## Matriz de Cobertura Confirmada

| Suíte de Teste | Arquivo | Testes | Responsabilidade Validada |
|---|---|---|---|
| **XML Privacy — Inspector** | `tests/features/xml-privacy/xml-inspector.test.ts` | 16 | Defesa em profundidade, detecção recursiva de nós DOM, extração de posições e tags contextuais. |
| **XML Privacy — Text Scrub** | `tests/features/xml-privacy/text-scrub.test.ts` | 12 | Higienização regex de e-mails, CPFs, CNPJs, telefones e preservação de números comuns em texto livre. |
| **XML Privacy — Sanitizer** | `tests/features/xml-privacy/xml-sanitizer.test.ts` | 12 | Mutação determinística, tokens `[CATEGORIA_001]`, remoção de XMLDSig e sanitização de CDATA. |
| **XML Privacy — Presentation** | `tests/features/xml-privacy/presentation.test.tsx` | 10 | Componentes React de upload, tabela interativa, filtros de categorias, badges e escape contra XSS. |
| **XML Privacy — Integration E2E** | `tests/features/xml-privacy/integration-e2e.test.ts` | 2 | Fluxo end-to-end do motor de privacidade com fixtures completas e namespaces customizados. |
| **XML Comparator — Parser** | `tests/features/xml-comparator/comparator-parser.test.ts` | 8 | Leitura de XMLs, normalização de atributos, estruturação em `XmlTreeNode` e caminhos XPath. |
| **XML Comparator — Differ** | `tests/features/xml-comparator/xml-differ.test.ts` | 14 | Detecção determinística de adições, remoções, alterações de texto, atributos e geração de resumo. |
| **XML Comparator — Classifier** | `tests/features/xml-comparator/diff-classifier.test.ts` | 33 | Esteira semântica de 8 níveis, distinção entre divergências de tomador (contextual) e prestador/fiscais (principal). |
| **XML Comparator — Context** | `tests/features/xml-comparator/diff-context.test.ts` | 7 | Localização de linha, resolução de seleção e contexto visual para exibição. |
| **XML Comparator — Mirrored Comparison** | `tests/features/xml-comparator/mirrored-comparison.test.tsx` | 16 | Alinhamento estrutural LCS, slots vazios, layout em 2 colunas CSS Grid, seleção em roxo e toggle. |
| **XML Comparator — Presentation** | `tests/features/xml-comparator/presentation.test.tsx` | 17 | Interface React completa do comparador, upload de arquivos, navegação entre diffs e download. |
| **XML Comparator — Export Sanitizer** | `tests/features/xml-comparator/export-sanitizer.test.ts` | 12 | Preservação de Inscrição Municipal e Endereços na exportação, mascaramento de PIIs e texto livre. |
| **XML Comparator — Markdown Exporter** | `tests/features/xml-comparator/markdown-exporter.test.ts` | 7 | Geração de relatório técnico em Markdown com seções de resumo, diffs e arquivos originais sanitizados. |

**Total Consolidado**: **181 testes automatizados** em 13 arquivos (100% de aprovação na suíte Vitest).

---

## Invariantes Protegidos por Testes

| Feature | Invariante Protegido | Suíte de Teste Guardiã |
|---|---|---|
| **XML Privacy** | Bloqueio rigoroso de XXE (`<!DOCTYPE` e `<!ENTITY`) antes de instanciar o parser | `xml-inspector.test.ts` |
| **XML Privacy** | Limite máximo estrito de tamanho de arquivo de 20MB | `presentation.test.tsx` |
| **XML Privacy** | Imutabilidade do documento XML original durante a sanitização | `xml-sanitizer.test.ts` |
| **XML Privacy** | Determinismo de substituição sintética (`[CATEGORIA_001]`) | `xml-sanitizer.test.ts`, `text-scrub.test.ts` |
| **XML Privacy** | Preservação obrigatória por padrão de Inscrição Municipal (`IM`) e Endereço (`CEP`, `xLgr`, `nro`, `xBairro`, `cMun`, `UF`) | `xml-sanitizer.test.ts`, `xml-inspector.test.ts` |
| **XML Privacy** | Remoção integral de assinaturas digitais W3C (`<Signature>`) sem deixar nós órfãos | `xml-sanitizer.test.ts` |
| **XML Privacy** | Escape total contra vulnerabilidades XSS na visualização de código | `presentation.test.tsx` |
| **XML Comparator** | Comparação puramente estrutural em memória via `XmlTreeNode` sem acoplamento a DOM | `comparator-parser.test.ts`, `xml-differ.test.ts` |
| **XML Comparator** | Precedência estrita de 8 níveis: divergências em dados cadastrais do tomador são contextuais (`CONTEXTUAL_DIFF`), enquanto prestador e dados fiscais/municipais são principais (`VALUE_DIFF`) | `diff-classifier.test.ts` |
| **XML Comparator** | Alinhamento espelhado estrito com linhas correspondentes em altura compartilhada (LCS) | `mirrored-comparison.test.tsx` |
| **XML Comparator** | Alternância de seleção (toggle) no mesmo clique e destaque visual em roxo (`var(--color-mauve)`) | `mirrored-comparison.test.tsx`, `presentation.test.tsx` |
| **XML Comparator** | Preservação obrigatória de Inscrição Municipal e Endereço no relatório Markdown de exportação | `export-sanitizer.test.ts`, `markdown-exporter.test.ts` |

---

## Decisões de Teste Consolidadas

```text
Problema: Como testar parsers XML e componentes React de forma rápida e isolada sem depender de navegador real
Decisão: Utilizar Vitest com ambiente JSDOM configurado em vitest.config.mts
Motivo: Fornece implementações leves de DOMParser, XMLSerializer e APIs de nós DOM no runtime Node.js com alta performance
Consequência: Testes de unidade e apresentação executam em menos de 10 segundos para toda a suíte

Problema: Como garantir que os testes representem XMLs fiscais brasileiros autênticos
Decisão: Manter a pasta ./XML_Models/ como repositório canônico de fixtures fiscais (NFe, NFSe, CTe)
Motivo: Evita testes com XMLs artificiais ou simplistas que mascaram bugs de namespaces e hierarquias reais
Consequência: Assegura que o motor foi validado contra padrões reais de documentos fiscais

Problema: Como testar a interação visual espelhada de duas colunas, sincronização e seleção de linhas no comparador
Decisão: Criar suíte dedicada tests/features/xml-comparator/mirrored-comparison.test.tsx combinando @testing-library/react, userEvent e act()
Motivo: Valida os eventos de clique, alternância de seleção em roxo e sincronização de estado com o painel inferior de detalhes
Consequência: Blindagem formal do comportamento de UI sem necessidade de runners lentos de browser (como Cypress/Playwright) para a suíte interna
```
