# LabTool — Scripts & Automation Skill

## Estado

INITIAL

---

## Responsabilidade

Orientar a criação, organização, execução, composição, portabilidade e manutenção de scripts, automações locais, runners de testes, quality gates e integração com `package.json` no LabTool.

Esta skill atua como guia técnico para garantir que todas as automações e rotinas do projeto sejam:
- seguras e determinísticas;
- portáteis (sem dependências de caminhos de máquina);
- fail-fast com exit codes padronizados;
- orquestradoras (delegando regras de negócio e execução de testes para TypeScript e runners do projeto);
- acessíveis através de uma interface pública simples e unificada via `package.json` (`npm run <comando>`).

Esta skill **não contém regras de negócio** do LabTool. As regras específicas de cada ferramenta pertencem soberanamente às suas respectivas features (`xml-privacy`, `xml-comparator`, `cnpj-intelligence`).

---

## Escopo

Esta skill deve ser consultada e aplicada quando a tarefa envolver:

- criação ou alteração de scripts shell (`.sh`) ou outros executáveis locais;
- criação ou alteração de comandos no `package.json`;
- criação ou ajuste de runners de testes e orquestrações E2E;
- criação de quality gates mecânicos e rotinas de validação pré-commit / CI;
- automações de geração de fixtures sintéticas a partir de `./XML_Models/`;
- automações de setup, bootstrap, build, limpeza ou diagnósticos;
- composição de múltiplos scripts em fluxos consolidados;
- execução de fluxos automatizados através de terminal, VS Code ou CI.

---

## Princípios Fundamentais

### 1. Camadas de Invocação e Fachada Pública

A automação do LabTool segue um modelo de camadas claro:

```text
Usuário / VS Code / CI
        ↓
   npm run ...          ← Interface pública amigável (package.json)
        ↓
   scripts/*.sh         ← Implementação e orquestração da automação
        ↓
 ferramentas reais      ← Vitest / Next.js / TypeScript (tsc) / ESLint
        ↓
    Aplicação           ← Motores, casos de uso e regras em TypeScript
```

- **`package.json` como Fachada Pública**: O usuário ou ambiente não deve precisar memorizar caminhos internos (como `bash ./scripts/algum-script-interno.sh`). Os comandos recorrentes e principais devem ser expostos via `npm run <comando>`.
- **`scripts/` como Implementação**: A pasta `scripts/` contém a implementação detalhada e orquestração dos fluxos.
- **Ferramentas Reais**: Os scripts delegam a execução para os runners e ferramentas do ecossistema do projeto.

---

### 2. Separação Estrita: Shell Orquestra, TypeScript Executa

Scripts shell **nunca devem implementar regras de negócio ou lógicas de domínio**.

```text
PROIBIDO:
script.sh ──→ Regex própria para CPF ──→ Sanitiza XML diretamente em shell

CORRETO:
script.sh ──→ Executa runner Vitest / Script TS ──→ Application / Domain real do LabTool
```

- **Shell**: Responsável pelo fluxo, variáveis de ambiente, checagem de parâmetros, pipes, fail-fast e status de saída.
- **TypeScript**: Responsável por parsing de XML, validações fiscais, algoritmo de diff, consulta de CNPJ e sanitização.

---

### 3. Portabilidade Obrigatória e Descoberta Dinâmica de Raiz

É terminantemente proibido utilizar caminhos absolutos hardcoded atrelados à máquina local (ex.: `/home/...`, `/Users/...`, `C:\...`).

Todo script deve descobrir dinamicamente o diretório onde reside e a raiz do projeto:

```bash
#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd -P
)"

PROJECT_ROOT="$(
  cd "${SCRIPT_DIR}/.."
  pwd -P
)"
```

- **Proibido**: Usar `PROJECT_ROOT="$(pwd)"` assumindo que o script sempre será executado a partir da raiz.
- **Garantia**: O script deve funcionar identicamente quando disparado da raiz, de dentro de `scripts/`, via `npm run`, pelo VS Code ou por um runner de CI.

---

### 4. Shell Seguro e Defensivo

Salvo justificativa técnica explícita e documentada, todo script Bash deve iniciar com:

```bash
#!/usr/bin/env bash

set -Eeuo pipefail
```

- `-e`: Encerra a execução imediatamente se qualquer comando retornar status diferente de zero.
- `-u`: Trata variáveis não definidas como erro fatal.
- `-o pipefail`: Propaga o status de erro em pipelines (se o primeiro comando falhar, a pipeline inteira falha).
- `-E`: Garante que a trap `ERR` seja herdada por funções e subshells.

Quando o script manipular arquivos sensíveis, temporários ou processamento seguro de XMLs, aplicar:

```bash
umask 077
```

---

### 5. Fail-Fast e Exit Codes

- **Fail-Fast**: A automação deve interromper a execução no primeiro passo que falhar. Não continuar para etapas posteriores (ex.: não tentar `build` se `typecheck` ou `test` falharam).
- **Sem Mascaramento**: É proibido utilizar `|| true` para silenciar erros sem tratamento e justificativa explícita.
- **Exit Codes Padronizados**:
  - Sucesso: `exit 0`
  - Falha: `exit 1` (ou status retornado pela ferramenta subjacente).
  - Permite integração confiável com `npm`, VS Code, CI e scripts orquestradores compostos.

---

### 6. Composição Limpa de Scripts

Scripts de escopo amplo podem compor scripts de escopo menor, desde que:
1. Cada script mantenha responsabilidade única e bem definida;
2. Não haja execução redundante ou duplicada da mesma suíte dentro do mesmo fluxo consolidado;
3. A chamada entre scripts seja explícita.

Exemplo conceitual:

```text
test-all.sh (Validação Geral)
    ├── quality-gates.sh (typecheck + lint + test)
    └── test-xml-privacy-e2e.sh (E2E específico do motor)
```

---

### 7. Execução Explícita vs Descoberta Mágica

- **Proibido**: Loops dinâmicos cegos como `for script in *.sh; do ./$script; done`. Nem todo script é um teste executável e essa prática introduz não-determinismo.
- **Recomendado**: Invocação explícita com função de passo padronizada para feedback claro:

```bash
run_step() {
  local name="$1"
  shift

  printf '\n'
  printf '==> %s\n' "$name"

  "$@"

  printf '[OK] %s\n' "$name"
}
```

- Não criar frameworks complexos de bash (`scripts/lib/`, `TaskRegistry`, etc.) enquanto uma estrutura simples for suficiente.

---

### 8. Logs e Observabilidade

- **Prefixos Padronizados**:
  - `[INFO]`: Informações de contexto e início de operações.
  - `[OK]`: Conclusão bem-sucedida de um passo.
  - `[AVISO]`: Alertas que não interrompem a execução.
  - `[ERRO]`: Falhas críticas e causas de encerramento.
- **Privacidade de Logs**: Nunca despejar conteúdo de XMLs reais ou dados sensíveis em logs por padrão.

---

### 9. Fixtures e Base Canônica (`./XML_Models/`)

- Toda automação de geração ou consumo de fixtures XML deve utilizar exclusivamente os modelos em `./XML_Models/` como referência taxonômica e fiscal.
- As fixtures devem ser sintéticas, mantidas dentro do repositório (`tests/fixtures/` ou local da feature) e nunca conter dados reais de clientes ou caminhos de diretórios pessoais.
- Scripts de fixtures devem ser expostos via `npm run fixtures:...` quando recorrentes.

---

### 10. Scripts Destrutivos e Arquivos Temporários

- **Scripts Destrutivos** (limpeza, exclusão, recriação de diretórios):
  - Devem validar explicitamente os caminhos de destino antes de executar `rm -rf`.
  - Devem garantir que o destino está restrito a subdiretórios esperados dentro de `PROJECT_ROOT`.
  - Proibido aceitar caminhos vazios, `/`, ou a própria raiz do projeto como alvo de exclusão acidental.
- **Arquivos Temporários**:
  - Utilizar sempre `mktemp` ou `mktemp -d`.
  - Limpar obrigatoriamente através de `trap` na saída do script:
    ```bash
    TMP_DIR="$(mktemp -d)"
    trap 'rm -rf "${TMP_DIR}"' EXIT INT TERM
    ```

---

### 11. Dependências e Python

- Preferir sempre as dependências e ferramentas já instaladas no projeto (`node`, `npm`, `vitest`, `tsc`, `eslint`).
- Não adicionar ferramentas externas como pré-requisitos (`jq`, `xmllint`, `tsx`, etc.) sem necessidade evidente e aprovação.
- Se scripts auxiliares em Python forem estritamente necessários, utilizar `python3` com a biblioteca padrão (`sys`, `os`, `json`, `xml.etree.ElementTree`), sem exigir pacotes externos via `pip`.

---

### 12. Execução Não-Interativa (CI e VS Code)

- Automações e scripts de validação devem operar em modo estritamente não-interativo.
- Proibido o uso de `read`, prompts manuais ou confirmações bloqueantes em scripts chamados por validações automatizadas.
- Se uma funcionalidade interativa for necessária para uso manual, fornecer flag não-interativa (ex.: `--ci`, `--yes`, `-y`).

---

### 13. Idempotência

- Automações de setup, preparação de ambiente e geração de fixtures devem ser idempotentes: rodar o script múltiplas vezes consecutivas deve produzir o mesmo estado válido sem corromper arquivos ou falhar.

---

### 14. Preferência por Operações Canônicas Consolidadas

Quando existir um comando público consolidado que represente a validação ou operação oficial (ex.: `npm run validate` ou `npm run quality`):
- O agente e o desenvolvedor devem **preferir invocar a operação canônica existente** em vez de executar manualmente uma sequência avulsa de comandos isolados.
- Isso padroniza o ciclo de validação e previne divergências entre execuções manuais e automatizadas.

```text
Preferência de Execução:
1. Existe comando consolidado? → Use-o (ex: npm run validate)
2. Não existe e é recorrente? → Crie a automação e exponha no package.json
3. Tarefa pontual e trivial?  → Execute diretamente
```

---

## Categorias de Scripts Reconhecidas

| Categoria | Finalidade | Cuidados Especiais |
|---|---|---|
| `quality-gate` | Validação mecânica integrada (typecheck, lint, test, build) | Fail-fast, logs limpos, sem efeitos colaterais. |
| `test-runner` | Execução de suítes de testes unitários ou de integração | Delegar para Vitest, repassar argumentos e filtros. |
| `e2e-runner` | Execução de fluxos ponta a ponta dos motores/aplicação | Garantir fixtures sintéticas válidas e asserções reais. |
| `fixture-generator` | Criação de documentos XML sintéticos de teste | Basear-se em `./XML_Models/`, garantir idempotência. |
| `setup` / `bootstrap` | Inicialização de ambiente e dependências locais | Idempotência (`mkdir -p`), não sobrescrever arquivos sem aviso. |
| `build` | Orquestração de compilação ou empacotamento | Validar pré-requisitos antes de compilar. |
| `cleanup` | Limpeza de diretórios de build, cache ou temporários | Validação estrita de caminhos antes de `rm -rf`. |
| `diagnostic` | Coleta de informações do ambiente para resolução de problemas | Somente leitura, não expor segredos ou dados sensíveis. |
| `utility` | Tarefas utilitárias pontuais de apoio ao desenvolvimento | Argumentos documentados e ajuda com `--help`. |

---

## Relação com Outras Skills

### `scripts-automation` vs `testing`
- **`testing`**: Define **o que testar**, quais invariantes proteger, estratégias de mocks, casos adversariais e evidências de comportamento.
- **`scripts-automation`**: Define **como executar, compor e orquestrar** esses testes em pipelines, runners locais, comandos npm e quality gates.
- *Quando carregar ambas*: Criação ou alteração de runners de teste, automação de testes E2E, scripts de quality gates com execução de suítes.

### `scripts-automation` vs `architecture`
- **`architecture`**: Define limites de módulos, direção de dependências e fronteiras arquiteturais.
- **`scripts-automation`**: Implementa a automação de processos respeitando as fronteiras.
- *Quando carregar ambas*: Criação de novas estruturas de automação, mudanças na API pública de comandos do projeto, extração de bibliotecas de scripts, integração com CI.

---

## Comandos Públicos

Inventário dos comandos públicos gerenciados via `package.json`:

| Comando | Descrição | Ferramenta Subjacente |
|---|---|---|
| `npm run dev` | Inicia o servidor de desenvolvimento Next.js | Next.js CLI |
| `npm run build` | Compila a aplicação para produção | Next.js CLI |
| `npm run start` | Inicia a aplicação compilada | Next.js CLI |
| `npm run lint` | Executa a verificação estática de código com ESLint | ESLint |
| `npm run typecheck` | Executa a verificação de tipos TypeScript sem emitir arquivos | TypeScript (`tsc --noEmit`) |
| `npm run test` | Executa a suíte de testes automatizados em modo run único | Vitest (`vitest run`) |
| `npm run test:e2e:xml-privacy` | Executa a suíte completa de testes da feature XML Privacy | Vitest (`vitest run tests/features/xml-privacy/`) |
| `npm run validate` | Executa todos os quality gates mecânicos (`typecheck`, `lint`, `test`, `build`) | NPM Composite |

---

## Automação Consolidada

Inventário dos scripts e executáveis sob `./scripts/`:

| Script | Finalidade | Invocação Pública | Dependências |
|---|---|---|---|
| `./scripts/test-xml-privacy-e2e.sh` | Runner E2E de validação e testes da feature XML Privacy | `npm run test:e2e:xml-privacy` | `vitest`, `npm` |

---

## Decisões de Automação Consolidadas

### 1. Interface Pública via `package.json`
- **Problema**: Complexidade de memorização de caminhos de scripts internos (`./scripts/foo.sh`).
- **Decisão**: Toda automação relevante deve possuir entrada correspondente em `package.json` (`npm run <comando>`).
- **Motivo**: Padronização ergonômica para desenvolvedor, VS Code e esteiras de CI.
- **Consequência**: `package.json` atua como API pública e `scripts/` como implementação.

### 2. Descoberta Dinâmica de Raiz em Shell
- **Problema**: Quebra de execução quando scripts são disparados de subpastas ou via extensões de IDE.
- **Decisão**: Scripts derivam `SCRIPT_DIR` via `BASH_SOURCE[0]` e `PROJECT_ROOT` via `${SCRIPT_DIR}/..`.
- **Motivo**: Garantir portabilidade total sem supor que o diretório de trabalho atual seja a raiz.
- **Consequência**: Execução determinística independente de onde o script foi invocado.

### 3. Não Duplicação de Regras em Shell
- **Problema**: Risco de regras de negócio divergentes entre a aplicação TypeScript e scripts de automação.
- **Decisão**: Shell é estritamente limitado à orquestração; regras de negócio e asserções ficam em TypeScript.
- **Motivo**: Preservação da verdade canônica do monólito modular e reutilização dos casos de uso reais.
- **Consequência**: Automações leves, manuteníveis e sem lógica de negócio paralela.
