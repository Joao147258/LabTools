# Guia de Engenharia e Funcionamento — CNPJ Intelligence

> **Módulo**: `src/features/cnpj-intelligence/`  
> **Rota Next.js**: `/cnpj-intelligence`  
> **Papel**: Consulta, Validação Algorítmica, Normalização Cadastral, Inteligência Tributária e Exibição Técnica de Dados Empresariais.

---

## 1. Visão Geral e Propósito

O **CNPJ Intelligence** é o módulo do LabTool desenvolvido para consulta, validação algorítmica e estruturação técnica das informações cadastrais, societárias e fiscais de pessoas jurídicas brasileiras.

### Por Que Foi Criado?

- **Inspeção Cadastral Técnica**: Permitir a consulta rápida e organizada dos dados de uma empresa a partir do CNPJ, transformando respostas brutas de APIs públicas em modelos de domínio limpos, estruturados e tipados.
- **Validação Algorítmica Confiável**: Algoritmo estrito de validação matemática de CNPJ (módulo 11) com rejeição de sequências repetidas e formatação dinâmica de máscara em tempo real.
- **Inteligência de Regime Tributário**: Detecção e consolidação do enquadramento fiscal (Simples Nacional, MEI, Lucro Presumido, Lucro Real, Imune de IRPJ) a partir do cruzamento de dados de opção/exclusão e declarações de ECF/SPED.
- **Zero Poluição / Zero IA**: Aplicação web convencional de alta performance, sem dependência de LLMs ou chatbots, focada em precisão e clareza técnica.
- **Isolamento Total**: Módulo 100% independente dos motores de XML (`xml-privacy` e `xml-comparator`).

---

## 2. Fontes de Dados Utilizadas

O módulo consome informações públicas abertas e oficiais do ecossistema fiscal e tributário brasileiro:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FONTES OFICIAIS DE DADOS                           │
│                                                                             │
│  1. Receita Federal do Brasil (RFB)                                         │
│     • Base pública do Cadastro Nacional da Pessoa Jurídica (CNPJ)           │
│     • Dados cadastrais, situação, natureza jurídica, capital e sócios       │
│                                                                             │
│  2. Sistema Público de Escrituração Digital (SPED / ECF)                    │
│     • Histórico de Escrituração Contábil Fiscal declarada                   │
│     • Apuração de Lucro Real, Lucro Presumido e Imunidade de IRPJ           │
│                                                                             │
│  3. Portal do Simples Nacional / MEI                                        │
│     • Opções vigentes e datas históricas de enquadramento ou exclusão       │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     GATEWAY DE INTEGRAÇÃO (BrasilAPI)                       │
│                                                                             │
│  • Endpoint: https://brasilapi.com.br/api/cnpj/v1/{cnpj}                   │
│  • Provedor público sem fins lucrativos mantido pela comunidade técnica     │
│  • Acesso sem necessidade de CAPTCHA ou chaves pagas/proprietárias          │
│  • Blindagem com User-Agent de navegador e timeout defensivo de 10s         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Por Que a BrasilAPI?
- **Desacoplamento e Disponibilidade**: Agrega as bases abertas da Receita Federal em formato JSON estruturado;
- **Histórico Fiscal Enriquecido**: Retorna o array `regime_tributario` com as declarações de ECF entregues nos últimos anos-calendário;
- **Sem Custos ou Tokens**: Mantém a ferramenta 100% acessível e client-side sem expor chaves privadas de API.

---

## 3. Dados Retornados e Mapeamento de Domínio

Os dados retornados pelo gateway são mapeados para a interface pura de domínio `Company`:

| Bloco de Informação | Campo de Domínio | Tipo | Descrição e Exemplo |
| :--- | :--- | :--- | :--- |
| **Identificação** | `cnpj` | `string` | 14 dígitos numéricos normalizados (`34225881000160`). |
| | `formattedCnpj` | `string` | CNPJ com máscara padrão (`34.225.881/0001-60`). |
| | `legalName` | `string` | Razão Social ou Nome Empresarial registrado. |
| | `tradeName` | `string?` | Nome Fantasia ou Título do Estabelecimento. |
| | `openingDate` | `string?` | Data de início de atividade (`16/07/2019`). |
| | `companySize` | `string?` | Porte da empresa (`ME`, `EPP`, `DEMAIS`). |
| | `legalNature` | `LegalNature?` | Código e descrição (`206-2 - Sociedade Empresária Limitada`). |
| | `shareCapital` | `number?` | Valor numérico do Capital Social (`106410.00`). |
| | `formattedShareCapital` | `string?` | Capital Social formatado em moeda brasileira (`R$ 106.410,00`). |
| **Situação Cadastral** | `registrationStatus` | `RegistrationStatus` | Status normalizado: `ATIVA`, `BAIXADA`, `INAPTA`, `SUSPENSA`, `NULA`. |
| | `registrationStatusDate` | `string?` | Data em que a situação cadastral foi registrada (`16/07/2019`). |
| | `registrationStatusReason` | `string?` | Descrição do motivo da situação cadastral (quando aplicável). |
| | `specialStatus` | `string?` | Situação especial registrada na RFB (ex: Falência, Recuperação). |
| | `specialStatusDate` | `string?` | Data da situação especial. |
| **Regime Tributário** | `taxRegime.name` | `string` | Regime consolidado (ex: `LUCRO PRESUMIDO (2024)`, `Simples Nacional`). |
| | `taxRegime.isSimplesNacional` | `boolean?` | Flag indicando se é optante vigente pelo Simples Nacional. |
| | `taxRegime.simplesOptDate` | `string?` | Data de adesão ao Simples Nacional. |
| | `taxRegime.simplesExcludedDate`| `string?` | Data de exclusão do Simples Nacional (`01/01/2020`). |
| | `taxRegime.isMei` | `boolean?` | Flag indicando se é enquadrado como MEI. |
| | `taxRegime.details` | `string?` | Detalhes contextuais (ex: `"Excluído do Simples em 01/01/2020"`). |
| **Atividades (CNAE)** | `primaryActivity` | `CompanyActivity` | Código CNAE formatado (`6201-5/01`) e descrição da atividade principal. |
| | `secondaryActivities` | `CompanyActivity[]`| Lista ordenada de CNAEs secundários com código e descrição. |
| **Endereço** | `address.street` | `string?` | Logradouro (Rua, Avenida, etc.). |
| | `address.number` | `string?` | Número do imóvel ou `"S/N"`. |
| | `address.complement` | `string?` | Complemento (Sala, Bloco, Andar). |
| | `address.neighborhood` | `string?` | Bairro ou Distrito. |
| | `address.zipCode` | `string?` | CEP formatado com hífen (`01310-100`). |
| | `address.city` | `string?` | Município do estabelecimento. |
| | `address.state` | `string?` | Sigla da Unidade Federativa (UF). |
| | `address.formattedAddress` | `string?` | Linha de endereço consolidada pronta para exibição. |
| **Quadro Societário (QSA)** | `partners[].name` | `string` | Nome completo do sócio ou administrador. |
| | `partners[].qualification` | `string?` | Qualificação societária (ex: `49-Sócio-Administrador`, `22-Sócio`). |
| | `partners[].entryDate` | `string?` | Data de ingresso no quadro societário (`DD/MM/YYYY`). |
| | `partners[].ageRange` | `string?` | Faixa etária estimada do sócio (ex: `41 a 50 anos`). |
| | `partners[].legalRepresentative`| `LegalRep?` | Nome e qualificação do representante legal (quando houver). |

---

## 4. Como os Dados São Tratados e Higienizados

O motor de processamento aplica regras estritas de transformação e sanitização para evitar falhas ou poluição visual na interface:

```text
Payload Bruto (JSON) ──► CompanyApiMapper ──► sanitizeCompanyEntity ──► Interface Limpa
```

### 4.1 Tratamento e Prevenção de Ruídos Visuais
- **Sem `undefined`, `null` ou `NaN`**: Campos ausentes são convertidos para `undefined` e não renderizados na UI, ou substituídos pelo caractere sóbrio `—` apenas quando o layout exige;
- **Trim Geral**: Todos os campos textuais passam por remoção de espaços em branco redundantes nas extremidades.

### 4.2 Normalização de Datas
- Converte padrões ISO retornados pela API (`2019-07-16` ou `2019-07-16T00:00:00.000Z`) para o padrão cronológico brasileiro **`DD/MM/YYYY`** (`16/07/2019`);
- Preserva strings que já se encontrem no formato correto.

### 4.3 Formatação Monetária (Capital Social)
- Converte valores numéricos em ponto flutuante para a moeda padrão brasileira utilizando a API internacional nativa:
  ```typescript
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value)
  // Resultado: R$ 106.410,00
  ```

### 4.4 Formatação Estruturada de Documentos e Códigos
- **CNPJ**: Aplica a máscara `00.000.000/0000-00` de forma progressiva durante a digitação e estrita na consulta;
- **CEP**: Normaliza para 8 dígitos e aplica a máscara `00000-000`;
- **CNAE**: Normaliza para 7 dígitos e formata no padrão oficial `0000-0/00` (ex: `6201501` ➔ `6201-5/01`).

### 4.5 Normalização Semântica da Situação Cadastral
A função `normalizeRegistrationStatus` mapeia códigos numéricos da RFB e descrições textuais variadas para o enum determinístico `RegistrationStatus`:
- `2` ou `ATIVA` ➔ `"ATIVA"` (Badge verde)
- `8` ou `BAIXADA` ➔ `"BAIXADA"` (Badge vermelho)
- `4` ou `INAPTA` ➔ `"INAPTA"` (Badge pêssego)
- `3` ou `SUSPENSA` ➔ `"SUSPENSA"` (Badge amarelo)
- `1` ou `NULA` ➔ `"NULA"` (Badge cinza)

### 4.6 Inteligência de Regime Tributário (`buildTaxRegime`)
A classificação do regime tributário obedece à seguinte ordem de precedência técnica:
1. **Declarações ECF Mais Recentes**: Se houver registros no array `regime_tributario`, ordena por ano decrescente e extrai a `forma_de_tributacao` (ex: `LUCRO PRESUMIDO (2024)`);
2. **Microempreendedor Individual (MEI)**: Se `opcao_pelo_mei === true`, define como `Microempreendedor Individual (MEI)` e anota a data de início;
3. **Simples Nacional**: Se `opcao_pelo_simples === true`, define como `Simples Nacional` e anota a data de opção;
4. **Exclusão Registrada**: Se possuir `data_exclusao_do_simples` ou `data_exclusao_do_mei`, registra no detalhe (ex: `"Excluído do Simples em 01/01/2020"`);
5. **Regime Normal**: Caso não seja optante pelo Simples e não possua histórico de ECF, classifica como `Regime Normal (Lucro Presumido / Real / Outros)`.

---

## 5. A Filosofia Central de Engenharia

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Domain define contratos puros, invariantes e validação matemática de CNPJ.│
│  Application orquestra casos de uso e contratos de gateway (CnpjGateway).   │
│  Infrastructure implementa a comunicação HTTP resiliente e mapeamento.     │
│  Presentation renderiza uma UI técnica, sóbria e responsiva em Catppuccin.  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Arquitetura Modular em Camadas

O módulo segue rigorosamente a Clean Architecture:

```text
src/features/cnpj-intelligence/
├── domain/                         → Conceitos puros, entidades e validações matemáticas
│   ├── index.ts
│   ├── cnpj.ts                     (Normalização, máscara dinâmica e validação de DV)
│   ├── company.ts                  (Sanitização de entidade, formatação de moeda e regime)
│   ├── company.types.ts            (Interfaces Company, CompanyTaxRegime, RegistrationStatus)
│   ├── company-activity.ts         (CNAE principal e secundários com máscara)
│   ├── company-address.ts          (CEP e consolidação de endereço)
│   └── company-partner.ts          (Estrutura de sócios e administradores - QSA)
│
├── application/                    → Casos de uso e portas de infraestrutura
│   ├── index.ts
│   ├── consult-cnpj.usecase.ts     (Orquestrador da consulta com validação prévia)
│   ├── cnpj-gateway.interface.ts   (Contrato CnpjGateway e classe CnpjConsultError)
│   ├── format-cnpj.ts              (Exportação de conveniência)
│   ├── validate-cnpj.ts            (Exportação de conveniência)
│   ├── normalize-company-data.ts   (Normalização de dados de domínio)
│   └── get-company-by-cnpj.ts      (Alias de caso de uso)
│
├── infrastructure/                 → Adaptadores de rede externos e mappers
│   ├── index.ts
│   ├── brasil-api.client.ts        (Cliente HTTP com timeout defensivo e User-Agent)
│   ├── brasil-api.mapper.ts        (CompanyApiMapper: Raw JSON -> Domain Entity)
│   └── brasil-api.types.ts         (Schema de tipos externos da BrasilAPI)
│
└── presentation/                   → Interface do Usuário (Design System Catppuccin Mocha)
    ├── index.ts
    ├── CnpjIntelligenceView.tsx    (Container principal e máquina de estados da UI)
    ├── CnpjSearch.tsx              (Barra de busca com validação visual e máscara)
    ├── CompanyOverview.tsx         (Header com Razão Social, CNPJ e Status Cadastral)
    ├── CompanyRegistration.tsx     (Dados cadastrais, Porte, Capital e Regime Tributário)
    ├── CompanyActivities.tsx       (CNAE Principal e lista de Atividades Secundárias)
    ├── CompanyAddress.tsx          (Endereço consolidado e campos detalhados)
    └── CompanyPartners.tsx         (Quadro Societário - QSA com representantes legais)
```

---

## 7. Validação Algorítmica de CNPJ

A função `domain/cnpj.ts` implementa o cálculo oficial de validação em 5 etapas:

1. **Normalização**: Remove todos os caracteres não numéricos (`value.replace(/\D/g, "")`);
2. **Tamanho Exato**: Rejeita qualquer entrada com número de dígitos diferente de 14;
3. **Sequências Repetidas**: Rejeita números falsos com dígitos idênticos (`00000000000000`, `11111111111111`, etc.);
4. **Primeiro Dígito Verificador (DV1)**:
   - Pesos: `[5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]`
   - `Soma = Σ (dígito[i] * peso[i])`
   - `DV1 = Soma % 11 < 2 ? 0 : 11 - (Soma % 11)`
5. **Segundo Dígito Verificador (DV2)**:
   - Pesos: `[6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]`
   - `Soma = Σ (dígito[i] * peso[i])`
   - `DV2 = Soma % 11 < 2 ? 0 : 11 - (Soma % 11)`

---

## 8. Resiliência do Gateway de Infraestrutura (`BrasilApiClient`)

O cliente HTTP `infrastructure/brasil-api.client.ts` possui mecanismos de proteção para estabilidade operacional:

1. **Timeout Defensivo**: Limite padrão de 10 segundos controlado via `AbortController`;
2. **Prevenção de Bloqueio por Bot**: Envio de cabeçalho `User-Agent` com formato de navegador padrão para evitar bloqueios automáticos (HTTP 403) por provedores de borda/Cloudflare;
3. **Tradução Tipada de Erros (`CnpjConsultError`)**:
   - `404 Not Found` ➔ `NOT_FOUND` ("Nenhuma empresa foi encontrada para este CNPJ.")
   - `400 Bad Request` ➔ `INVALID_CNPJ` ("CNPJ inválido ou rejeitado pelo provedor.")
   - `429 Too Many Requests` ➔ `RATE_LIMITED` ("Limite de requisições excedido. Aguarde alguns segundos.")
   - `500+ Server Error` ➔ `SERVICE_UNAVAILABLE` ("Serviço temporariamente indisponível.")
   - `AbortError` ➔ `TIMEOUT` ("A consulta demorou mais que o tempo limite de 10s.")
   - `Network Failures` ➔ `NETWORK_ERROR` ("Falha de conexão com o serviço.")

---

## 9. Apresentação e Estados Visuais (Design System Catppuccin)

A interface em `presentation/CnpjIntelligenceView.tsx` gerencia 5 estados visuais determinísticos:

- `idle`: Estado inicial neutro antes de qualquer busca;
- `loading`: Indicador visual de progresso com spinner animado e mensagem descritiva;
- `success`: Apresentação completa dos cards estruturados da empresa;
- `not-found`: Alerta informativo de CNPJ não cadastrado;
- `error`: Card de erro com mensagens claras e orientações de retry.

---

## 10. Suíte de Testes Automatizados

O CNPJ Intelligence possui cobertura completa com testes unitários e de integração via **Vitest**:

```bash
# Executar todos os testes do módulo CNPJ Intelligence
npm test tests/features/cnpj-intelligence
```

### Principais Testes da Suíte:

- `tests/features/cnpj-intelligence/cnpj.test.ts`: Valida normalização numérica, máscara dinâmica progressiva, cálculo de DV1 e DV2, rejeição de sequências repetidas e sanitização de entidade.
- `tests/features/cnpj-intelligence/consult-cnpj.usecase.test.ts`: Valida a orquestração do caso de uso, chamadas ao gateway e tratamento de erros.
- `tests/features/cnpj-intelligence/company-api.mapper.test.ts`: Valida o mapeamento do payload da BrasilAPI, tratamento de regimes tributários (Simples, MEI, ECF Lucro Presumido/Real), conversão de datas e formatação de capital social.
- `tests/features/cnpj-intelligence/company-api.client.test.ts`: Valida o comportamento do cliente HTTP, cabeçalhos, tradução de códigos de status e controle de timeout.
- `tests/features/cnpj-intelligence/presentation.test.tsx`: Valida os componentes React, ciclo de busca, transição de estados visuais e renderização sem ruídos visuais (`undefined`, `null`, `NaN`).
