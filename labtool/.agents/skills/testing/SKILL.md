# LabTool — Testing Skill

## Estado

INITIAL

---

## Responsabilidade

Orientar a criação, organização, manutenção e execução de testes automatizados durante a construção incremental do LabTool.

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

## Matriz de Cobertura Confirmada [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Registro de suítes de testes implementadas e executadas com sucesso conforme as etapas avançarem).*

---

## Invariantes Protegidos por Testes [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Tabela de invariantes formais do LabTool protegidos por testes automatizados).*

---

## Decisões de Teste Consolidadas [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Registro de decisões técnicas sobre estratégias de mock, fixtures e runners no formato: Problema -> Decisão -> Motivo -> Consequência).*
