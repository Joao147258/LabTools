# LabTool — Architecture Skill

## Estado

INITIAL

---

## Responsabilidade

Orientar decisões arquiteturais durante a construção do LabTool.

Esta skill registra princípios, fronteiras, responsabilidades das camadas e decisões confirmadas ao longo do desenvolvimento.

Não representa uma arquitetura final pré-fabricada nem deve antecipar abstrações.

---

## Escopo

Esta skill pertence exclusivamente ao LabTool.

Deve ser consultada e atualizada quando houver:

- criação ou alteração de camadas (`domain`, `application`, `infrastructure`, `presentation`);
- definição de estrutura de diretórios e módulos;
- estabelecimento de fronteiras entre features;
- direção de dependências e contratos;
- avaliação de extração de código para `shared`;
- decisões arquiteturais estruturais.

---

## Princípios Fundamentais

### 1. Monólito modular

O LabTool é uma única aplicação Next.js organizada como monólito modular por features.

Estrutura conceitual:

```text
src/
├── app/
├── features/
└── shared/
```

### 2. Features iniciais

As três ferramentas iniciais residem em:

```text
src/features/
├── xml-privacy/
├── xml-comparator/
└── cnpj-intelligence/
```

Cada feature possui fronteiras claras e responsabilidades delimitadas.

### 3. Motor independente por ferramenta

Cada ferramenta possui seu próprio motor ou fluxo de execução:

```text
XML Privacy
    ↓
motor próprio (Privacy Engine)

XML Comparator
    ↓
motor próprio (Comparator Engine)

CNPJ Intelligence
    ↓
fluxo próprio (CNPJ Flow)
```

- O `xml-comparator` não deve depender da implementação interna do `xml-privacy`.
- O `xml-privacy` não deve depender do `xml-comparator`.
- Semelhança de código ou formato de dados (XML) não significa automaticamente responsabilidade compartilhada.
- Motores diferentes atendem a propósitos diferentes e devem evoluir de forma independente.

---

## Responsabilidade das Camadas

As camadas não são obrigatórias em todas as features; elas devem surgir conforme responsabilidades reais demandarem:

```text
domain/
application/
infrastructure/
presentation/
```

### Domain

Representa o núcleo do problema:

- conceitos e modelos puros;
- tipos e interfaces;
- value objects e enums;
- regras de negócio e validações puras;
- invariantes que devem ser preservados.

**Regra estrita**: Não deve depender de React, Next.js, HTTP, APIs externas ou componentes visuais.

### Application

Coordena o fluxo de execução e regras da feature:

- casos de uso e orquestrações de fluxo;
- coordenação entre regras do domínio;
- transformação de dados de entrada em resultados de saída;
- definição de contratos para dependências externas.

**Regra estrita**: Não deve conter lógica visual ou específica de UI.

### Infrastructure

Representa dependências e integrações externas:

- clientes HTTP e chamadas a APIs de terceiros;
- sistemas de arquivos, persistência ou storage;
- serviços externos e adaptadores de rede.

**Regra estrita**: Só deve existir quando estritamente necessária (ex.: consulta à API externa no `cnpj-intelligence`). Ferramentas locais como `xml-privacy` e `xml-comparator` operam no navegador e não necessitam de infraestrutura para seu processamento principal.

### Presentation

Responsável pela interação com o usuário:

- componentes React e páginas;
- estado visual e gerenciamento de formulários/eventos;
- upload, visualização, feedback e download de arquivos.

**Regra estrita**: A Presentation consome os casos de uso da Application ou do motor; ela nunca deve substituir as regras do domínio nem centralizar a lógica de negócio.

---

## Direção de Dependências

O fluxo de dependências segue a direção de fora para dentro:

```text
Presentation
     ↓
Application
     ↓
Domain
```

Quando houver camada de infraestrutura, aplica-se o princípio da inversão de dependência através de contratos:

```text
Application
     ↓
  Contract
     ↑
Infrastructure
```

O domínio e a aplicação nunca dependem diretamente de detalhes da infraestrutura.

---

## Critérios para Uso do `shared`

O diretório `src/shared/` não é um repositório genérico para qualquer código duplicado.

Antes de mover código para `shared`, responder afirmativamente às quatro perguntas:

1. **É exatamente o mesmo conceito?**
2. **Possui a mesma responsabilidade?**
3. **Possui a mesma razão para mudar?**
4. **Pertence genuinamente a mais de uma feature?**

Se houver dúvida ou se os motivos de alteração forem diferentes, o código deve permanecer duplicado ou isolado na feature correspondente.

---

## Proibição de Abstrações Prematuras

É proibido criar estruturas especulativas ou heranças genéricas antes de necessidades concretas, tais como:

```text
BaseEngine
XmlEngine
BaseProcessor
GenericProcessor
EngineFactory
ProcessorFactory
SharedXmlService
GlobalProvider
```

Primeiro implementa-se o comportamento concreto, determinístico e testado. Abstrações só surgem quando a duplicação real e o benefício forem evidentes.

---

## Fluxo de Construção Incremental

Toda funcionalidade deve evoluir sequencialmente no seguinte fluxo:

```text
problema
   ↓
responsabilidade
   ↓
modelo
   ↓
contrato
   ↓
implementação
   ↓
teste
   ↓
decisão consolidada
```

---

## Regra de Portabilidade

É estritamente proibido gravar ou utilizar caminhos absolutos atrelados à máquina do desenvolvedor (ex.: caminhos contendo pastas de usuário do sistema operacional).

Utilizar exclusivamente:

- caminhos relativos ao projeto (`./src/`, `./tests/`, `./.agents/skills/`);
- caminhos relativos ao próprio script/módulo;
- argumentos explícitos e variáveis de ambiente quando aplicável.

---

## Decisões Arquiteturais Consolidadas

Formato para registro de decisões:

```text
Problema
   ↓
Decisão
   ↓
Motivo
   ↓
Consequência
```

*(Seção a ser preenchida incrementalmente conforme decisões forem tomadas durante a construção)*
