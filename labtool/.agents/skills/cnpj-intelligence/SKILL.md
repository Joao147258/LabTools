# LabTool — CNPJ Intelligence Skill

## Estado

CONSOLIDATED

---

## Responsabilidade

Orientar o desenvolvimento, manutenção e evolução da ferramenta **CNPJ Intelligence** no LabTool.

A skill abrange a modelagem do domínio de CNPJ, normalização de caracteres, validação algorítmica de dígitos verificadores, orquestração de casos de uso de consulta cadastral, definição de contratos de gateway, implementação de adaptadores de infraestrutura para fontes externas (BrasilAPI v1), mapeamento defensivo de dados, route handlers Next.js e apresentação em conformidade com o Design System Catppuccin Mocha.

---

## Escopo

Esta skill pertence exclusivamente à feature `cnpj-intelligence` do LabTool (`./src/features/cnpj-intelligence/`).

---

## Fluxo Conceitual da Feature

O fluxo de processamento e consulta de CNPJ segue a sequência estrita da Clean Architecture:

```text
entrada
 ↓
normalização (domain)
 ↓
validação (domain)
 ↓
caso de uso (application)
 ↓
contrato (CnpjGateway interface)
 ↓
infraestrutura (BrasilApiClient)
 ↓
fonte externa (BrasilAPI v1)
 ↓
mapeamento (CompanyApiMapper)
 ↓
modelo de domínio (Company)
 ↓
apresentação (CnpjIntelligenceView)
```

1. **Entrada**: String fornecida pelo usuário ou parâmetro de busca (`?cnpj=...`).
2. **Normalização**: Limpeza de pontuação e caracteres não numéricos (`normalizeCnpj`).
3. **Validação**: Verificação de tamanho (14 dígitos), sequências repetidas e cálculo dos dígitos verificadores (DV1 e DV2).
4. **Caso de Uso**: `consultCnpjUseCase` / `getCompanyByCnpj` orquestra a validação defensiva e aciona o contrato.
5. **Contrato**: Interface `CnpjGateway` desacopla a aplicação do provedor externo.
6. **Infraestrutura**: `BrasilApiClient` executa a requisição HTTP com timeout de 10s e tradução de status.
7. **Fonte Externa**: API pública `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`.
8. **Mapeamento**: `CompanyApiMapper.toDomain` converte o payload bruto para o modelo interno.
9. **Modelo**: Entidade `Company` com endereço consolidado, CNAEs e quadro societário sanitizado.
10. **Apresentação**: `CnpjIntelligenceView` gerencia estados (`idle`, `loading`, `success`, `not-found`, `error`) e renderiza os blocos modulares.

---

## Princípios Fundamentais

- **Separação entre Normalização e Validação**: Normalizar (transformar a entrada em 14 dígitos canônicos) e validar (calcular DVs e rejeitar repetidos) são operações distintas.
- **Isolamento do Domínio**: O domínio não conhece `fetch`, URLs externas, Next.js ou React.
- **Inversão de Dependência**: A aplicação depende da interface `CnpjGateway`. A infraestrutura implementa a interface.
- **Fidelidade aos Dados da Fonte**: Dados ausentes não são inventados nem renderizados como `undefined` ou `null`.
- **Tratamento Seguro de Erros**: Erros HTTP (404, 400, 429, 500, timeout) são mapeados para códigos de erro da aplicação (`CnpjConsultError`), sem expor stack traces ao usuário.
- **Design System Catppuccin Mocha**: Interface sóbria, blocos semânticos, tipografia técnica com JetBrains Mono e paleta de cores canônica.

---

## Contratos Consolidados

```ts
export type CnpjConsultErrorCode =
  | "INVALID_CNPJ"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT"
  | "NETWORK_ERROR"
  | "INTERNAL_ERROR";

export class CnpjConsultError extends Error {
  public readonly code: CnpjConsultErrorCode;
  public readonly originalError?: unknown;
}

export interface CnpjGateway {
  findByCnpj(cnpj: string, signal?: AbortSignal): Promise<Company>;
}
```

---

## Modelos Confirmados

- `Company`: Entidade central com CNPJ normalizado e formatado, Razão Social, Nome Fantasia, Situação Cadastral, Data de Abertura, Natureza Jurídica, Porte, Capital Social formatado, Endereço, Atividade Principal, Atividades Secundárias e Quadro Societário.
- `CompanyAddress`: Logradouro, número, complemento, bairro, CEP formatado, município, UF e endereço completo consolidado.
- `CompanyActivity`: Código CNAE formatado (`XXXX-X/XX`) e descrição textual.
- `CompanyPartner`: Nome do integrante, qualificação, data de entrada na sociedade, faixa etária e representante legal (nome e qualificação).

---

## Invariantes Confirmados

- **Validação de DV**: Algoritmo oficial de módulo 11 da Receita Federal para os pesos do 1º dígito `[5,4,3,2,9,8,7,6,5,4,3,2]` e 2º dígito `[6,5,4,3,2,9,8,7,6,5,4,3,2]`.
- **Rejeição de Sequências**: Sequências de 14 dígitos idênticos (`00000000000000` a `99999999999999`) são terminantemente inválidas.
- **Segurança e Privacidade**: Nenhuma persistência local (sem salvar histórico ou dados cadastrais em localStorage).

---

## Testes Consolidados

Suíte automatizada em `./tests/features/cnpj-intelligence/`:
- `cnpj.test.ts`: 19 testes cobrindo validação algorítmica de CNPJ, normalização, formatação e helpers utilitários.
- `consult-cnpj.usecase.test.ts`: 5 testes cobrindo orquestração, bloqueio prévio de inválidos e tratamento de erros.
- `company-api.mapper.test.ts`: 3 testes cobrindo conversão de payloads completos, parciais e listas vazias da BrasilAPI.
- `company-api.client.test.ts`: 7 testes cobrindo respostas 200, 404, 400, 429, 500, timeouts e erros de rede com mocks.
- `presentation.test.tsx`: Testes de componentes React cobrindo estados `idle`, `loading`, `success`, `not-found`, `error`, digitação com máscara e blocos modulares.

---

## Decisões Técnicas Consolidadas

1. **Fonte de Dados Pública (BrasilAPI v1)**:
   - *Decisão*: Utilizar a BrasilAPI v1 (`https://brasilapi.com.br/api/cnpj/v1/{cnpj}`) como provedor de dados cadastrais públicos da Receita Federal.
   - *Motivo*: Serviço gratuito, aberto, sem necessidade de credenciais ou chaves privadas.
   - *Consequência*: Isolado via `CompanyApiClient` e mapeado via `CompanyApiMapper`, permitindo substituição transparente de provedor caso necessário.

2. **Route Handler Next.js (`/api/cnpj/[cnpj]`)**:
   - *Decisão*: Expor um endpoint server-side no App Router e permitir consulta client-side ou server-side direta.
   - *Motivo*: Facilita proxying, previne potenciais bloqueios de CORS e encapsula tratamento de status HTTP.

3. **Arquitetura em Blocos Visuais Sóbrios**:
   - *Decisão*: Dividir os resultados em blocos semânticos (`CompanyOverview`, `CompanyRegistration`, `CompanyActivities`, `CompanyAddress`, `CompanyPartners`) em vez de dezenas de pequenos cards soltos.
   - *Motivo*: Seguir as diretrizes do Design System Catppuccin Mocha e facilitar leitura técnica e rápida dos dados.
