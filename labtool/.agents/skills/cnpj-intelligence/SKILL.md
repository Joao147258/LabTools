# LabTool — CNPJ Intelligence Skill

## Estado

INITIAL

---

## Responsabilidade

Orientar o desenvolvimento, manutenção e evolução da ferramenta **CNPJ Intelligence** no LabTool.

A skill abrange a modelagem do domínio de CNPJ, normalização de caracteres, validação algorítmica de dígitos verificadores, orquestração de casos de uso de consulta cadastral, definição de contratos de gateway, implementação de adaptadores de infraestrutura para fontes externas (ex.: BrasilAPI), mapeamento de dados e apresentação.

---

## Escopo

Esta skill pertence exclusivamente à feature `cnpj-intelligence` do LabTool (`src/features/cnpj-intelligence/`).

O conteúdo evolui conforme cada etapa da ferramenta for modelada, implementada e comprovada por testes.

Não antecipar código, gateways concretos ou contratos antes da respectiva fase de construção.

---

## Fluxo Conceitual da Feature

O fluxo de processamento e consulta de CNPJ segue a sequência:

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
 ↓
apresentação
```

1. **Entrada**: String fornecida pelo usuário ou interface (formatada ou não).
2. **Normalização**: Limpeza e padronização (remoção de pontuação, espaços, caracteres não numéricos).
3. **Validação**: Verificação de tamanho (14 dígitos), padrão e cálculo dos dígitos verificadores (DV).
4. **Caso de Uso**: Orquestrador da aplicação que executa a validação e aciona o contrato de busca cadastral.
5. **Contrato**: Interface (porta) que desacopla a aplicação do provedor externo.
6. **Infraestrutura**: Cliente HTTP responsável pela comunicação de rede com a fonte externa.
7. **Fonte Externa**: API pública ou serviço provedor dos dados cadastrais (ex.: BrasilAPI).
8. **Mapeamento**: Tradução da resposta do provedor externo para o modelo de domínio do LabTool.
9. **Modelo**: Entidade de domínio enriquecida e segura com os dados da empresa.
10. **Apresentação**: Exibição formatada e organizada dos dados na interface com o usuário.

---

## Princípios Fundamentais

- **Separação entre Normalização e Validação**: Normalizar (transformar a entrada em formato canônico) e validar (verificar se é um CNPJ válido e calcular DVs) são responsabilidades distintas e independentes.
- **Isolamento do Domínio**: O domínio do CNPJ não deve conhecer endpoints, schemas de transporte, headers HTTP ou peculiaridades da API externa.
- **Uso de Infraestrutura e Contratos**: A integração com serviços remotos pertence à camada de `infrastructure`. A `application` consome apenas o contrato (interface) abstrato, garantindo a inversão de dependência.
- **Fidelidade aos Dados da Fonte**: Dados ausentes na resposta da API externa nunca devem ser inventados silenciosamente; campos nulos ou inexistentes devem ser representados com precisão.
- **Tratamento e Isolamento de Erros**: Erros de transporte/rede, timeouts e falhas de provedores devem ser traduzidos em erros de aplicação claros, sem vazar exceções cruas ou detalhes sensíveis para a UI.
- **Independência de Apresentação**: A interface visual apenas solicita a consulta e renderiza o resultado; as regras cadastrais e de validação residem estritamente no domínio e na aplicação.

---

## Ordem de Construção (Guia de Construção)

A construção da feature deve seguir progressivamente os estágios:

```text
domain
 ↓
normalizer
 ↓
validator
 ↓
use case
 ↓
contract
 ↓
infrastructure (client + mapper)
 ↓
route handler
 ↓
tests
 ↓
presentation
```

---

## Regra de Portabilidade

É expressamente proibido registrar ou utilizar caminhos absolutos atrelados à máquina local (`/home/...`, `C:\...`). Utilizar apenas caminhos relativos ao projeto (`./src/features/cnpj-intelligence/`, `./tests/features/cnpj-intelligence/`).

---

## Contratos [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Os contratos de entrada/saída, interfaces de Gateway e tipos de erros serão registrados nesta seção conforme forem implementados).*

---

## Modelos Confirmados [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Modelos como `Cnpj`, `CompanyProfile`, `CnpjAddress` serão registrados após modelagem e validação).*

---

## Invariantes Confirmados [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Invariantes como integridade do algoritmo de dígitos verificadores e regras de normalização serão registrados após consolidação).*

---

## Testes Consolidados [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Registro de suítes de teste de dígitos verificadores, normalizadores, mappers de API e casos de erro/timeout).*

---

## Decisões Consolidadas [A CONSOLIDAR DURANTE A CONSTRUÇÃO]

*(Registro de decisões técnicas consolidadas no formato: Problema -> Decisão -> Motivo -> Consequência).*
