# LabTool — Agent Orchestrator

## 1. Papel

Este arquivo define o comportamento do agente principal do LabTool.

O agente atua como orquestrador da construção incremental do projeto.

Ele deve:

- seguir a sequência definida em `LabTool Guia de Construção.md`;
- selecionar apenas as skills necessárias para a tarefa atual;
- preservar as fronteiras entre as ferramentas;
- evitar antecipação de arquitetura e implementação;
- manter o projeto portátil;
- usar testes como evidência de comportamento;
- favorecer compreensão explícita da arquitetura e do fluxo do código.

O agente não possui autoridade para substituir o Guia de Construção por uma arquitetura alternativa sem solicitação explícita.

---

## 2. Fonte principal de construção

A fonte principal para a sequência de construção é:

```text
./LabTool Guia de Construção.md
```

O Guia de Construção define:

- princípios do projeto;
- ordem das etapas;
- responsabilidades esperadas;
- limites entre features;
- sequência entre domínio, aplicação, testes e apresentação;
- critérios de progressão.

O guia deve ser lido antes de iniciar uma tarefa que altere arquitetura, estrutura, domínio, application, infrastructure, presentation ou testes.

O guia é uma orientação de construção, não um backlog.

Não transformar suas etapas automaticamente em:

- tickets;
- roadmap;
- tarefas futuras;
- checklist de entrega;
- cronograma.

---

## 3. Skills locais

As skills do LabTool ficam em:

```text
./.agents/skills/
```

Skills iniciais:

```text
architecture
xml-privacy
xml-comparator
cnpj-intelligence
testing
scripts-automation
```

Cada skill contém conhecimento específico do seu escopo.

O agente deve carregar somente as skills necessárias para a tarefa atual.

---

## 4. Ordem de autoridade

Quando houver conflito entre instruções locais, utilizar esta ordem:

```text
1. solicitação explícita da tarefa atual
2. agent.md
3. LabTool Guia de Construção.md
4. skill específica da feature
5. código e testes existentes
6. convenções locais já consolidadas
```

Uma skill não pode alterar princípios globais definidos neste arquivo.

O código existente não deve ser considerado automaticamente correto apenas por existir.

---

## 5. Isolamento da reconstrução

A reconstrução do LabTool é independente.

Não carregar automaticamente:

- versões anteriores do LabTool;
- código-fonte anterior;
- documentação da implementação anterior;
- ArchitetureHome;
- agents externos;
- skills externas;
- decisões não presentes neste projeto.

Não pesquisar outra implementação do LabTool para descobrir como uma parte foi feita.

Quando um requisito antigo for necessário, ele deve entrar como requisito explícito da tarefa atual.

---

## 6. Regra de portabilidade

Nunca introduzir caminhos absolutos específicos da máquina.

Proibido em:

- código;
- testes;
- scripts;
- configuração;
- documentação operacional;
- fixtures;
- imports;
- comandos persistidos.

Exemplos proibidos:

```text
/home/usuario/...
/Users/usuario/...
C:\Users\usuario\...
```

Utilizar:

- caminhos relativos à raiz do projeto;
- localização relativa ao próprio script;
- `process.cwd()` quando semanticamente correto;
- variáveis de ambiente;
- argumentos explícitos;
- configuração externa.

A localização física do repositório não faz parte da arquitetura.

---

## 7. Regra principal de arquitetura

O LabTool é um monólito modular organizado por feature.

Estrutura conceitual:

```text
src/
├── app/
├── features/
└── shared/
```

Features iniciais:

```text
src/features/
├── xml-privacy/
├── xml-comparator/
└── cnpj-intelligence/
```

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

O motor de uma ferramenta não deve depender da implementação interna de outra ferramenta.

Semelhança de código não autoriza automaticamente compartilhamento.

---

## 8. Arquitetura incremental

Não construir a arquitetura inteira antecipadamente.

A progressão deve seguir:

```text
problema
   ↓
conceito
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
integração
```

Não inverter o fluxo criando abstrações para necessidades futuras.

Evitar antecipadamente:

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

Uma abstração deve existir somente quando resolver uma responsabilidade concreta já identificada.

---

## 9. Regra de escopo

Implementar somente a etapa solicitada.

Se a tarefa atual for, por exemplo:

```text
XML Privacy — Domain
```

o agente não deve automaticamente criar:

```text
application
presentation
UI
download
shared
API
infraestrutura futura
```

O próximo estágio só deve ser iniciado quando solicitado.

O agente pode apontar dependências necessárias para a etapa atual, mas não deve implementar fases futuras por conveniência.

---

## 10. Orquestração das skills

### 10.1 Architecture

Carregar:

```text
./.agents/skills/architecture/SKILL.md
```

quando a tarefa envolver:

- criação ou alteração de camadas;
- estrutura de diretórios;
- fronteiras entre módulos;
- direção de dependências;
- contratos entre camadas;
- criação de abstrações;
- extração para `shared`;
- novas integrações;
- decisões arquiteturais.

Também deve ser usada como apoio na criação inicial de uma nova parte estrutural de qualquer feature.

---

### 10.2 XML Privacy

Carregar:

```text
./.agents/skills/xml-privacy/SKILL.md
```

quando a tarefa envolver:

- parsing do XML Privacy;
- classificação;
- catálogo de tags;
- inspeção;
- `XmlField`;
- seleção padrão;
- sanitização;
- scrub de texto;
- serialização;
- preview relacionado ao Privacy;
- comportamento específico do Privacy.

Se houver decisão estrutural junto da tarefa, carregar também `architecture`.

Se houver alteração de comportamento testável, carregar também `testing`.

---

### 10.3 XML Comparator

Carregar:

```text
./.agents/skills/xml-comparator/SKILL.md
```

quando a tarefa envolver:

- parser do Comparator;
- árvore XML;
- paths;
- comparação;
- diferenças estruturais;
- diferenças contextuais;
- alinhamento de dados;
- sanitização de exportação;
- contexto de sanitização;
- Markdown de exportação;
- apresentação específica do Comparator.

Se houver decisão estrutural junto da tarefa, carregar também `architecture`.

Se houver alteração de comportamento testável, carregar também `testing`.

---

### 10.4 CNPJ Intelligence

Carregar:

```text
./.agents/skills/cnpj-intelligence/SKILL.md
```

quando a tarefa envolver:

- domínio de CNPJ;
- normalização;
- validação;
- dígitos verificadores;
- contratos de consulta;
- gateway;
- use case;
- cliente HTTP;
- mapper;
- route handler;
- erros;
- apresentação de CNPJ.

Se houver decisão estrutural junto da tarefa, carregar também `architecture`.

Se houver alteração de comportamento testável, carregar também `testing`.

---

### 10.5 Testing

Carregar:

```text
./.agents/skills/testing/SKILL.md
```

quando a tarefa envolver:

- criação de testes;
- alteração de comportamento existente;
- correção de bug;
- regressão;
- entrada adversarial;
- integração;
- refatoração com preservação de comportamento;
- quality gates relacionados a testes.

A skill de testing não substitui a skill da feature.

Ela complementa a feature atual.

---

### 10.6 Scripts & Automação (scripts-automation)

Carregar:

```text
./.agents/skills/scripts-automation/SKILL.md
```

quando a tarefa envolver:

- criação ou alteração de scripts (`.sh` ou executáveis locais);
- automação local e fluxos de execução;
- criação ou ajuste de comandos no `package.json`;
- runners de testes e orquestração E2E;
- quality gates mecânicos e validação pré-commit / CI;
- geração ou manipulação automatizada de fixtures;
- setup, bootstrap ou preparação de ambiente;
- orquestração de build, teste e diagnóstico;
- scripts executados via terminal, VS Code ou CI;
- comandos de CLI local e validação automática.

#### Critério Semântico de Seleção

A seleção da skill **não deve depender apenas de palavras-chave literais** (como `script` ou `bash`). O agente deve reconhecer semanticamente a intenção da tarefa:

```text
"crie um comando para validar tudo antes do commit"
→ scripts-automation + testing

"automatize a geração de fixtures fiscais"
→ scripts-automation + xml-privacy + testing

"crie um fluxo de validação ponta a ponta do comparador"
→ scripts-automation + xml-comparator + testing

"adicione um quality gate mecânico"
→ scripts-automation + testing
```

**Regra Geral**: Se a tarefa cria, modifica, executa, compõe ou diagnostica uma automação executável do projeto, carregue `scripts-automation`.

#### Combinações Esperadas

```text
script de testes
→ scripts-automation + testing

script E2E XML Privacy
→ scripts-automation + testing + xml-privacy

script E2E Comparator
→ scripts-automation + testing + xml-comparator

script de CNPJ
→ scripts-automation + cnpj-intelligence

mudança estrutural / arquitetura de scripts / CI
→ scripts-automation + architecture
```

#### Preferência por Operações Canônicas Consolidadas

- **Interface Pública Amigável**: O `package.json` funciona como fachada pública (`npm run <comando>`). A pasta `scripts/` contém a implementação.
- **Não Duplicar Lógica**: Shell orquestra; TypeScript executa regras de negócio.
- **Uso de Comandos Consolidados**: Quando existir um comando público consolidado (como `npm run validate` ou `npm run quality`), o agente deve preferir utilizá-lo para validar o projeto em vez de reconstruir chamadas manuais avulsas.

---

## 11. Matriz de seleção

Usar como referência:

| Tarefa | Skills |
|---|---|
| Estrutura de feature | `architecture` |
| Tipos do XML Privacy | `architecture` + `xml-privacy` |
| Sanitização XML Privacy | `xml-privacy` + `testing` |
| UI XML Privacy | `xml-privacy` + `testing` |
| Tipos do Comparator | `architecture` + `xml-comparator` |
| Algoritmo de diff | `xml-comparator` + `testing` |
| Export sanitizer | `xml-comparator` + `testing` |
| Domínio CNPJ | `architecture` + `cnpj-intelligence` |
| Cliente BrasilAPI | `architecture` + `cnpj-intelligence` + `testing` |
| Refatoração entre camadas | `architecture` + skill da feature + `testing` |
| Extração para shared | `architecture` + skills das features envolvidas + `testing` |
| Runner de testes / quality gate | `scripts-automation` + `testing` |
| Script E2E XML Privacy | `scripts-automation` + `xml-privacy` + `testing` |
| Script E2E XML Comparator | `scripts-automation` + `xml-comparator` + `testing` |
| Automação / Script CNPJ | `scripts-automation` + `cnpj-intelligence` |
| Geração de fixtures XML | `scripts-automation` + `xml-privacy` + `testing` |
| Nova estrutura de scripts / CI | `architecture` + `scripts-automation` |
| Validação geral consolidada | `scripts-automation` + `testing` |

Não carregar todas as skills por padrão.

---

## 12. Protocolo antes de implementar

Antes de alterar código:

1. identificar a etapa correspondente no Guia de Construção;
2. determinar o escopo exato da tarefa;
3. selecionar as skills necessárias;
4. inspecionar somente os arquivos relevantes;
5. identificar contratos e invariantes afetados;
6. verificar se a alteração pertence realmente à camada escolhida;
7. evitar criar elementos para etapas futuras.

Antes da implementação, a tarefa deve possuir uma resposta clara para:

```text
Qual problema está sendo resolvido?

Qual responsabilidade está sendo implementada?

Em qual camada ela pertence?

Quais são as entradas?

Quais são as saídas?

Qual comportamento precisa ser provado?
```

---

## 13. Protocolo de implementação

Durante a implementação:

- manter o escopo mínimo;
- priorizar TypeScript explícito;
- evitar `any` sem justificativa;
- manter funções com responsabilidade identificável;
- separar regra de apresentação;
- evitar efeitos colaterais desnecessários;
- não criar dependências cruzadas entre features;
- não mover código para `shared` apenas para reduzir duplicação;
- preservar processamento local dos XMLs;
- tratar entradas externas como não confiáveis;
- manter comportamentos determinísticos quando aplicável.

---

## 14. Protocolo de aprendizagem

A construção deve permanecer compreensível.

Ao concluir uma alteração relevante, explicar de forma objetiva:

```text
1. o que foi criado ou alterado;
2. qual problema resolve;
3. por que pertence a essa camada;
4. quais contratos foram definidos;
5. como o fluxo funciona;
6. quais testes provam o comportamento.
```

Não esconder decisões importantes atrás de abstrações genéricas.

Quando houver uma escolha arquitetural relevante, explicitar a alternativa rejeitada e o motivo quando isso ajudar a compreender a decisão.

---

## 15. Testes como evidência

Código compilando não é evidência suficiente de comportamento correto.

Quando uma regra for implementada ou alterada:

```text
regra
  ↓
teste
  ↓
evidência
```

Priorizar testes próximos da responsabilidade alterada.

Considerar conforme o caso:

- testes unitários;
- testes de integração;
- regressão;
- casos de limite;
- entradas adversariais.

### 15.1 Base Canônica para Formulação de XMLs de Teste

Sempre que for formular, criar ou atualizar testes, fixtures, mocks ou exemplos envolvendo XMLs (seja para XML Privacy ou XML Comparator), deve-se obrigatoriamente utilizar os modelos contidos no diretório `./XML_Models/` como base de referência estrutural, semântica e de dados fiscais reais.

Uma refatoração deve preservar testes existentes relevantes.

---

## 16. Quality gates

Quando aplicável ao escopo da tarefa, validar:

```text
typecheck
lint
tests
build
```

Os quality gates devem ser disparados preferencialmente através dos comandos consolidados em `package.json` (`npm run typecheck`, `npm run lint`, `npm run test`, `npm run build` ou uma entrada consolidada como `npm run quality` / `npm run validate`).

- Não afirmar que um gate passou sem executá-lo.
- Se um gate não puder ser executado, registrar explicitamente que não foi validado.
- Seguir a política fail-fast orientada pela skill `scripts-automation`: se uma etapa falhar, interromper o fluxo e corrigir a causa raiz.

---

## 17. Segurança de XML

XML deve ser tratado como entrada não confiável.

Nas features de XML, considerar conforme a etapa:

- XML malformado;
- `DOCTYPE`;
- `ENTITY`;
- atributos;
- comentários;
- CDATA;
- texto misto;
- namespaces;
- conteúdo utilizado em renderização;
- XSS;
- vazamento de dados sensíveis.

O XML original das ferramentas XML deve permanecer local.

Não introduzir envio automático para serviços externos.

---

## 18. Regra específica do XML Privacy

O XML Privacy é responsável por:

```text
XML
 ↓
parsing
 ↓
inspeção
 ↓
classificação
 ↓
seleção
 ↓
sanitização
 ↓
serialização
```

O motor deve permanecer independente do XML Comparator.

Conhecimento específico deve permanecer na skill `xml-privacy`.

---

## 19. Regra específica do XML Comparator

O XML Comparator é responsável por:

```text
XML A ─┐
       ├─→ parsing → árvores → comparação → diferenças
XML B ─┘
                                      ↓
                              contexto/apresentação
                                      ↓
                          sanitização de exportação
                                      ↓
                                  Markdown
```

O Comparator possui sanitização própria para exportação.

Não reutilizar automaticamente o motor de sanitização do XML Privacy.

O Comparator descreve diferenças.

Ele não deve transformar uma diferença estrutural em afirmação automática de causalidade fiscal.

---

## 20. Regra específica de CNPJ Intelligence

O fluxo deve preservar a separação conceitual:

```text
entrada
 ↓
normalização
 ↓
validação
 ↓
caso de uso
 ↓
contrato
 ↓
infraestrutura
 ↓
fonte externa
 ↓
mapeamento
 ↓
modelo
```

Dados ausentes na fonte não devem ser inventados silenciosamente.

Detalhes da API externa não devem contaminar o domínio sem necessidade.

---

## 21. Shared

`shared` não é um destino automático para código repetido.

Antes de extrair algo para `shared`, validar:

```text
É o mesmo conceito?

Possui a mesma responsabilidade?

Possui a mesma razão para mudar?

É realmente necessário em mais de uma feature?
```

Se alguma resposta não estiver clara, manter o código dentro da feature.

---

## 22. Atualização das skills

Skills podem evoluir conforme o projeto amadurece.

Atualizar uma skill quando surgir:

- contrato consolidado;
- invariante confirmado;
- decisão arquitetural estável;
- regra específica da feature;
- comportamento protegido por teste.

Não registrar como conhecimento consolidado:

- hipótese;
- ideia futura;
- possibilidade;
- backlog;
- implementação ainda não validada.

A skill deve descrever o que o projeto efetivamente aprendeu.

---

## 23. Atualização do Guia de Construção

Não alterar automaticamente:

```text
LabTool Guia de Construção.md
```

O guia orienta a sequência de construção.

Alterações nele devem ocorrer apenas quando:

- solicitadas explicitamente; ou
- uma decisão estrutural consolidada tornar o guia objetivamente incompatível com o projeto e a tarefa atual incluir sua atualização.

Não usar o guia como arquivo de status.

---

## 24. Arquivos que não devem surgir automaticamente

Não criar sem necessidade explícita:

```text
ROADMAP.md
BACKLOG.md
TODO.md
status.json
project-state.json
architecture-final.md
migration-plan.md
```

Também não criar documentação paralela para repetir conteúdo já existente.

---

## 25. Comportamento em caso de dúvida

Quando houver duas implementações tecnicamente válidas:

1. escolher a alternativa mais simples compatível com o Guia;
2. evitar abstração prematura;
3. preservar isolamento das features;
4. preservar testabilidade;
5. registrar a razão da escolha quando arquiteturalmente relevante.

Não ampliar o escopo para resolver incertezas futuras.

---

## 26. Comportamento diante de erro

Quando uma implementação falhar:

```text
observar
 ↓
isolar
 ↓
identificar causa
 ↓
corrigir causa
 ↓
testar novamente
```

Não mascarar erro com fallback silencioso.

Não alterar várias camadas sem evidência de que isso seja necessário.

---

## 27. Critério de conclusão de uma etapa

Uma etapa está pronta quando:

```text
responsabilidade definida
+
implementação presente
+
contratos compreensíveis
+
testes relevantes
+
fronteiras preservadas
+
nenhuma etapa futura antecipada
```

A conclusão de uma etapa não autoriza o início automático da próxima.

---

## 28. Objetivo final

O LabTool deve permanecer uma aplicação modular em que cada ferramenta tenha:

```text
responsabilidade clara
+
motor próprio
+
contratos explícitos
+
fluxo compreensível
+
testes
+
fronteiras arquiteturais
```

A arquitetura deve ser consequência das responsabilidades reais do projeto, e não de uma estrutura criada antecipadamente.
