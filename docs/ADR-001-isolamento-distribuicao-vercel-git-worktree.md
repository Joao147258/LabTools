# ADR-001 — Isolamento de Distribuição Vercel com Git Worktree em Diretório Irmão

> **Identificador**: ADR-001  
> **Status**: Proposto — Aprovado para planejamento, pendente de implementação  
> **Data**: 2026-10-15  
> **Contexto Operacional**: `DeveloperLabTools/WorkTools2` (LabTool Monólito Modular)  
> **Escopo**: Infraestrutura de Distribuição, Versionamento Git e Observabilidade  
> **Decisores**: Software Architect, DevOps Engineer, Security Reviewer, Core Maintainer  
> **Documentos Relacionados**:
> - [Git Worktree and Vercel Deployment — Architectural Impact Assessment](../docs/xml-comparator-intelligence-impact-report.md)
> - [`AGENTS.md`](../AGENTS.md) — Governança e Limites do Workspace LabTool
> - [`labtool/DESIGN.md`](../labtool/DESIGN.md) — Design System Canônico
> - [`doc/06-quality-gates-e-testes.md`](../doc/06-quality-gates-e-testes.md) — Quality Gates

---

## 1. Problema Arquitetural

O **LabTool** é uma ferramenta técnica de processamento local (100% *client-side*) de documentos fiscais XML, anonimização de PIIs e comparação estrutural. O código-fonte oficial reside no repositório público do GitHub:
- Repositório Remoto: `git@github.com:Joao147258/LabTools.git` (`Joao147258/LabTools`)
- Aplicação: Subdiretório `labtool/` (Next.js 16.3.8, React 19.2.8)

A distribuição pública em ambiente de nuvem está hospedada na plataforma Vercel sob o projeto existente `lab-tools` (`https://lab-tools-n.vercel.app`). A sincronização automática por webhook entre o GitHub e a Vercel foi intencionalmente desativada para que a esteira de publicação em produção seja estritamente controlada e auditada pelo desenvolvedor.

### 1.1. As Necessidades Concorrentes
1. **Preservação do Produto Público**: O repositório público (`main`) deve representar o software livre canônico, limpo e agnóstico em relação a provedores comerciais de nuvem, livre de acoplamentos proprietários a plataformas de hospedagem.
2. **Instrumentação de Distribuição**: A versão distribuída na Vercel necessita de instrumentação de observabilidade para acompanhamento de experiência de usuário e estabilidade (especificamente **Vercel Web Analytics** e **Vercel Speed Insights**).
3. **Controle de Atualização e Publicação**: As atualizações funcionais, correções e novas features desenvolvidas na `main` pública precisam ser continuamente incorporadas à versão implantada, sem risco de regressão das instrumentações exclusivas da Vercel e sem produzir divergências de código não rastreáveis.
4. **Proteção Contra Vazamentos**: Configurações de distribuição e branches de infraestrutura privada nunca devem ser enviadas ao repositório público no GitHub.

### 1.2. Distinção Crucial entre Conceitos
Para evitar falsas premissas de segurança, este ADR estabelece a distinção formal entre os ativos:
- **Código do Produto**: Regras de parsing XML, sanitização, árvores de nós e componentes de interface do LabTool (públicos).
- **Código de Integração de Infraestrutura**: Componentes de observabilidade (`@vercel/analytics`, `@vercel/speed-insights`) e configurações de roteamento (`vercel.json`).
- **Configurações de Ambiente e Metadados Locais**: `.vercel/project.json`, variáveis injetadas em tempo de build (não sensíveis para analytics client-side).
- **Segredos e Credenciais**: Tokens de deploy, chaves de autenticação de CLI (devem permanecer fora de qualquer branch ou commit).
- **Artefatos de Build**: Bundles estáticos gerados em `.next/` ou `out/`.
- **Deployment**: Instâncias imutáveis publicadas na Vercel a partir de um commit específico.

> [!IMPORTANT]
> A segregação em branch privada **não** é motivada pela necessidade de proteger segredos algorítmicos dessas bibliotecas — códigos de observabilidade client-side são expostos publicamente no bundle do navegador. A decisão é estritamente de **organização arquitetural, governança de distribuição e desacoplamento do produto público**.

---

## 2. Forças e Restrições

### 2.1. Forças Impulsionadoras
- **Desacoplamento de Fornecedor**: O repositório público no GitHub mantém-se puro, portável e independente de fornecedores específicos de nuvem.
- **Rastreabilidade Determinística**: Cada deployment produtivo na Vercel deve estar amarrado a um commit local explícito com proveniência comprovada da `main`.
- **Deploy Manual Controlado**: Deployments de Preview e Produção acionados exclusivamente via Vercel CLI com validação humana prévia.
- **Simplicidade de Manutenção**: O código da aplicação possui Clean Architecture com isolamento rígido entre Domain, Application e Presentation.
- **Não Concorrência de Workspace**: O desenvolvedor pode alternar entre desenvolvimento público e homologação de deploy sem operações disruptivas de troca de branch no mesmo diretório.

### 2.2. Restrições e Custos
- **Custo Operacional de Sincronização**: Manter duas branches exige disciplina operacional para executar merges regulares (`main → vercel-local`).
- **Duplicação de Espaço em Disco**: O worktree irmão requer sua própria cópia de `node_modules` e caches de build.
- **Governança Estrita de Workspace**: O projeto adota política de confinamento (`WORKSPACE_BOUND_STRICT` em `AGENTS.md`), exigindo autorização explícita e controlada para operar no diretório irmão.
- **Risco de Push Acidental**: O Git nativamente permite enviar qualquer branch para um remote com permissão de escrita se comandos explícitos forem disparados sem proteção em camadas.

---

## 3. Alternativas Consideradas

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ Alternativas Avaliadas                                                   │
├───────────────────────────────┬──────────────────────────────────────────┤
│ A. Integração Direta na main  │ Rejeitada (Acopla código público)        │
│ B. Configuração Só no Painel  │ Rejeitada (Inviável p/ Next.js App Router)│
│ C. Branch Local no Mesmo Dir  │ Rejeitada (Poluição de workspace/stash)  │
│ D. Worktree em Subdiretório   │ Rejeitada (Risco de indexação e tracking) │
│ E. Worktree em Dir Irmão      │ SELECIONADA (Isolamento total e limpo)   │
│ F. Repositório Independente   │ Rejeitada (Quebra histórico Git comum)   │
└───────────────────────────────┴──────────────────────────────────────────┘
```

### Alternativa A — Integração Direta na Branch `main`
- *Descrição*: Adicionar `@vercel/analytics` e `@vercel/speed-insights` diretamente no `layout.tsx` e `package.json` da `main`.
- *Vantagens*: Simplicidade máxima (única branch, zero overhead de merge).
- *Desvantagens*: Polui o código público com bibliotecas proprietárias de um provedor específico; força usuários que clonarem o projeto a carregarem scripts de rastreamento de terceiros.
- *Decisão*: **Rejeitada**.

### Alternativa B — Configuração Exclusiva no Painel da Vercel
- *Descrição*: Ativar Analytics/Speed Insights via toggle no dashboard da Vercel sem alterar código.
- *Vantagens*: Zero modificação no repositório.
- *Desvantagens*: Tecnicamente inviável para Next.js no modelo App Router; as métricas de Core Web Vitals e pageviews no cliente requerem obrigatoriamente a presença dos nós React no layout raiz.
- *Decisão*: **Rejeitada**.

### Alternativa C — Branch Local no Mesmo Diretório de Trabalho
- *Descrição*: Criar a branch `vercel-local` no mesmo diretório `WorkTools2` e alternar via `git switch`.
- *Vantagens*: Não consome disco adicional.
- *Desvantagens*: Risco extremo de carregar arquivos modificados não commitados (`git stash` constante); `.vercel/project.json` e `node_modules` precisariam ser constantemente revalidados; risco elevado de commitar na branch errada.
- *Decisão*: **Rejeitada**.

### Alternativa D — Git Worktree em Subdiretório (`.worktrees/vercel-local/`)
- *Descrição*: Criar o worktree dentro da própria raiz do repositório, em diretório ignorado.
- *Vantagens*: Mantém tudo dentro do caminho do workspace.
- *Desvantagens*: Ferramentas de busca recursiva (ex.: `find`, TypeScript, linters globais, IDEs) tendem a indexar subdiretórios aninhados se não configuradas com precisão cirúrgica; risco de referências relativas confusas.
- *Decisão*: **Rejeitada**.

### Alternativa E — Git Worktree em Diretório Irmão (`WorkTools2-vercel/`) — DECISÃO SELECIONADA
- *Descrição*: Criar o worktree em diretório paralelo (`DeveloperLabTools/WorkTools2-vercel`) apontando para a branch local `vercel-local`.
- *Vantagens*: Isolamento absoluto de arquivos de trabalho, staging e compilação; preservação do histórico de commits compartilhado via `.git`; zero risco de arquivos temporários de deploy sujarem o repositório principal; permite abrir ambos os ambientes simultaneamente.
- *Desvantagens*: Requer exceção explícita de governança para navegação controlada no diretório irmão.
- *Decisão*: **Adotada como decisão oficial**.

### Alternativa F — Repositório Privado Independente no GitHub
- *Descrição*: Criar um repositório Git completamente separado no GitHub e fazer re-push manual.
- *Vantagens*: Separação remota física.
- *Desvantagens*: Quebra a cadeia de hashes Git nativa; exige configurar remotos múltiplos ou scripts de espelhamento; perda da facilidade de `git merge main` determinístico.
- *Decisão*: **Rejeitada**.

---

## 4. Decisão Adotada

Formaliza-se a arquitetura de **dois ambientes locais vinculados pelo mesmo repositório Git através de Git Worktree em diretórios irmãos**:

```text
<WORKSPACE_ROOT>/
│
├── WorkTools2/                       ──► [Ambiente A: Público / Desenvolvimento]
│   ├── .git/                         ──► Repositório Git Central (Banco de Objetos & Refs)
│   ├── labtool/                      ──► Aplicação Next.js (Clean, Agnóstica)
│   ├── AGENTS.md                     ──► Governança do Workspace
│   └── (Branch: main)               ──► Rastreia origin/main (GitHub Público)
│
└── WorkTools2-vercel/                ──► [Ambiente B: Distribuição / Vercel]
    ├── .git                          ──► Ponte de Worktree (Aponta para WorkTools2/.git)
    ├── labtool/                      ──► Aplicação com Instrumentação Vercel
    │   ├── src/app/layout.tsx        ──► Com <Analytics /> e <SpeedInsights />
    │   └── .vercel/                  ──► Metadados locais de link (Ignorado)
    └── (Branch: vercel-local)        ──► Local Only (Bloqueada para Push Remoto)
```

### Princípios da Decisão
1. **Unidirecionalidade Obrigatória**: O fluxo principal de código é sempre `main → vercel-local`. Nunca haverá merge reverso total de `vercel-local` para a `main`.
2. **Isolamento de Segredos e Metadados**: A pasta `.vercel/` e arquivos de ambiente permanecem restritos ao diretório irmão e cobertos pelo `.gitignore`.
3. **Imutabilidade do Repositório Público**: Nenhum commit originário de `WorkTools2-vercel` deverá ser publicado em `origin/main` ou qualquer branch pública do GitHub.
4. **Deploy Manual e Verificável**: A publicação em produção na Vercel ocorre exclusivamente por comando manual explícito (`vercel --prod`) executado dentro do worktree, após verificação bem-sucedida de Preview.

---

## 5. Funcionamento Operacional

### 5.1. Fluxo de Desenvolvimento Público (Ambiente A)
```text
Desenvolvimento de Feature / Fix
             ↓
Validação de Quality Gates (npm run validate)
             ↓
Commit na branch main
             ↓
Push para o GitHub público (git push origin main)
```

### 5.2. Fluxo de Distribuição e Atualização (Ambiente B)
```text
(No diretório WorkTools2-vercel)
             ↓
Obter atualizações da main: git fetch origin && git merge main
             ↓
Auditar integridade de layout.tsx e package.json
             ↓
Executar Quality Gates: npm run test && npm run build
             ↓
Deploy de Pré-visualização: vercel (Preview URL gerada)
             ↓
Homologação Manual de UI e Comportamento
             ↓
Deploy Definitivo: vercel --prod
```

### 5.3. Fluxo de Correções (Bug Fixes)
- **Erros de Produto (Parsing XML, Sanitizer, Diff)**: Nascem e são corrigidos obrigatoriamente no **Ambiente A (`main`)**. Após teste e commit na `main`, a correção é incorporada ao Ambiente B via merge convencional.
- **Erros Exclusivos de Hospedagem / Observabilidade**: São corrigidos diretamente no **Ambiente B (`vercel-local`)** e commitados exclusivamente na branch local.

### 5.4. Estratégia de Rollback
O rollback é tratado em duas camadas completamente desacopladas:
1. **Rollback de Infraestrutura (Vercel)**:
   - Em caso de falha pós-deploy de produção, o operador não precisa reverter código no Git de imediato.
   - Executa-se `vercel rollback <deployment-id>` ou aciona-se o *Instant Rollback* no painel da Vercel para restaurar instantaneamente a versão estável anterior.
2. **Rollback de Código (Git)**:
   - Se o merge recente da `main` introduziu um problema na distribuição, executa-se `git revert -m 1 HEAD` no worktree `WorkTools2-vercel`.

### 5.5. Recuperação em Caso de Perda do Diretório Irmão
Como o histórico de commits da branch `vercel-local` reside no banco de objetos central (`WorkTools2/.git`), a exclusão acidental do diretório `WorkTools2-vercel` **não acarreta perda de histórico**:
```bash
# Recuperação a partir de WorkTools2:
git worktree prune
git worktree add ../WorkTools2-vercel vercel-local
```

---

## 6. Governança e Segurança em Camadas

Para garantir que a branch `vercel-local` nunca seja enviada ao GitHub público, são instituídos controles técnicos preventivos em 4 camadas:

```text
┌────────────────────────────────────────────────────────┐
│ Camadas de Proteção Contra Push Acidental              │
├────────────────────────────────────────────────────────┤
│ Camada 1: Configuração Git de PushRemote Inválido      │
│ Camada 2: Hook Local pre-push Determinístico           │
│ Camada 3: Proteção Nativa de Branch no GitHub          │
│ Camada 4: Auditoria Operacional em Checklist           │
└────────────────────────────────────────────────────────┘
```

### Camada 1 — Configuração Git de PushRemote
No repositório Git, vincula-se um remote inexistente especificamente à branch:
```bash
git config branch.vercel-local.pushRemote no_push
git config branch.vercel-local.remote no_push
```
*Efeito*: Qualquer comando comum `git push` executado na branch `vercel-local` falhará imediatamente informando que o remote `no_push` não existe.

> [!WARNING]
> **Ressalva de Segurança Obrigatória**: O `pushRemote` **não** impede a execução de um push forçado e explícito com destino explícito (ex.: `git push origin vercel-local`). Por essa razão, a Camada 2 é obrigatória.

### Camada 2 — Hook Local `pre-push`
Instalação de script executável em `.git/hooks/pre-push` contendo bloqueio programático:
```bash
#!/bin/sh
while read local_ref local_sha remote_ref remote_sha; do
  if [ "$local_ref" = "refs/heads/vercel-local" ]; then
    echo "ERRO CRÍTICO DE SEGURANÇA: A branch 'vercel-local' é estritamente privada de distribuição e não pode ser enviada a nenhum remote."
    exit 1
  fi
done
exit 0
```

### Camada 3 — Auditoria e Ignoração de Metadados
- O arquivo `.gitignore` do projeto já ignora `.vercel` e `.env*`.
- No Ambiente B, o arquivo `.vercel/project.json` gerado pelo `vercel link` permanece isolado localmente.
- O token da Vercel CLI reside na home do usuário (`~/.local/share/com.vercel.cli` ou cache nvm), nunca sendo incluído na árvore do repositório.

### Camada 4 — Backup Privado dos Commits de Distribuição
Como a branch `vercel-local` não é enviada ao GitHub, o histórico local deve ser protegido contra corrupção do disco local:
- Criação periódica de bundle Git local protegido ou exportação de patch:
  ```bash
  git bundle create /backup/labtool-vercel-local.bundle main..vercel-local
  ```

---

## 7. Governança dos Agentes de IA (Exceção de Escopo)

O projeto é regido soberanamente pelo `AGENTS.md` com a regra `WORKSPACE_BOUND_STRICT`. Para operacionalizar o worktree sem violar a integridade de segurança, define-se a seguinte **Exceção de Escopo de Governança Controlada**:

1. **Escopo Físico Autorizado**: O agente está autorizado a operar **exclusivamente** dentro dos seguintes caminhos lógicos:
   - Primário (`PUBLIC_REPOSITORY`): `.` (Raiz do Workspace Principal `WorkTools2`)
   - Distribuição Secundária (`VERCEL_WORKTREE`): `../WorkTools2-vercel` (Diretório Irmão de Distribuição)
2. **Proibição Estrita de Expansão**: Fica terminantemente proibido acessar qualquer outro diretório no host ou na máquina do desenvolvedor.
3. **Preservação de Portabilidade**: Nenhum caminho absoluto de máquina local (`/home/...`, `C:\...`) poderá ser gravado em código-fonte, scripts de build, dependências ou documentação pública.
4. **Acionamento Condicionado**: A alteração formal nos arquivos de governança (`AGENTS.md`) para registrar este escopo expandido ocorrerá somente no início da fase de implementação, mediante autorização humana explícita.

---

## 8. Consequências da Decisão

### Consequências Positivas
- ✅ **Pureza do Código Aberto**: O repositório público não contém referências a fornecedores de hospedagem ou scripts de telemetria.
- ✅ **Isolamento Completo**: Nenhuma poluição de build, stash ou staging entre desenvolvimento e publicação.
- ✅ **Homologação Estável**: Possibilidade de manter o ambiente de preview da Vercel ativo enquanto a `main` recebe novos commits em andamento.
- ✅ **Zero Impacto no Domínio e Aplicação**: As regras fiscais, parsing XML e cálculo de diffs permanecem intocadas e 100% puras.

### Consequências Negativas e Mitigações
- ⚠️ **Necessidade de Merges Manuais Recorrentes**:
  - *Mitigação*: Como as únicas alterações na `vercel-local` são em `layout.tsx` e `package.json`, conflitos de merge são raros e facilmente resolvidos.
- ⚠️ **Risco de Divergência Prolongada**:
  - *Mitigação*: Adotar a política de que todo ciclo de deploy inicia obrigatoriamente com `git merge main`.
- ⚠️ **Consumo Adicional de Armazenamento**:
  - *Mitigação*: O workspace Next.js ocupa aproximadamente ~300MB de `node_modules`, plenamente aceitável para máquinas de desenvolvimento modernas.

---

## 9. Critérios de Aceite Verificáveis

A implementação deste ADR será considerada homologada e concluída quando todos os 10 critérios forem satisfeitos:

1. [ ] O diretório original `WorkTools2` permanece na branch `main` e sincronizado com `origin/main`.
2. [ ] O diretório irmão `WorkTools2-vercel` é criado e aponta para a branch `vercel-local`.
3. [ ] `git branch -vv` no Ambiente B confirma que a branch não possui tracking remoto de push.
4. [ ] O hook `pre-push` bloqueia com erro qualquer tentativa de `git push origin vercel-local`.
5. [ ] O comando `git merge main` dentro de `WorkTools2-vercel` incorpora alterações sem destruir os nós de Analytics no `layout.tsx`.
6. [ ] A suíte de testes existente (`npm test`) é executada no worktree com 100% de sucesso.
7. [ ] O comando `vercel link` vincula o worktree ao projeto existente `lab-tools` sem criar novo projeto.
8. [ ] O comando `vercel` gera uma URL de Preview funcional exibindo as ferramentas ativas.
9. [ ] A inspeção do console/rede no navegador no ambiente de Preview confirma o carregamento dos scripts Vercel Analytics sem erros.
10. [ ] A branch `origin/main` no GitHub é inspecionada e atesta ausência total de commits de instrumentação Vercel.

---

## 10. Plano de Implantação em Fases (Execução Futura)

> [!NOTE]
> Este plano descreve os procedimentos a serem executados na tarefa seguinte, após aprovação humana formal deste ADR.

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FASE 1     │ ──► │   FASE 2     │ ──► │   FASE 3     │ ──► │   FASE 4     │
│ Preparação   │     │  Isolamento  │     │  Segurança   │     │  Vercel CLI  │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   FASE 5     │ ──► │   FASE 6     │ ──► │   FASE 7     │ ──► │   FASE 8     │
│Observabilidad│     │  Validação   │     │  Publicação  │     │Manutenção Con│
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

### Fase 1 — Preparação e Revalidação do Estado Git
- **Pré-requisitos**: Análise das 42 alterações pendentes identificadas no relatório anterior no working tree da `main`.
- **Procedimento**:
  1. Revalidar o estado Git atual: `git status --short`.
  2. Submeter decisão humana para commitar as alterações na `main` ou colocá-las em stash temporário.
  3. Definir o commit-base exato para a ramificação (ex.: `33b8fd0`).
- **Critério de Saída**: Working tree da `main` em estado consistente e commit-base documentado.

### Fase 2 — Criação da Branch e do Worktree Irmão
- **Pré-requisitos**: Fase 1 concluída.
- **Procedimento**:
  ```bash
  # Criar branch local a partir da base validada
  git branch vercel-local main
  # Adicionar o worktree no diretório irmão
  git worktree add ../WorkTools2-vercel vercel-local
  # Instalar dependências no worktree
  cd ../WorkTools2-vercel/labtool && npm install
  ```
- **Critério de Saída**: `git worktree list` listando ambos os diretórios.

### Fase 3 — Configuração de Segurança e Travas de Push
- **Pré-requisitos**: Fase 2 concluída.
- **Procedimento**:
  ```bash
  # Configurar remotos inválidos de proteção
  git config branch.vercel-local.pushRemote no_push
  git config branch.vercel-local.remote no_push
  # Criar e dar permissão de execução ao hook pre-push
  chmod +x .git/hooks/pre-push
  # Testar falha intencional de push
  git push origin vercel-local --dry-run # DEVE FALHAR
  ```
- **Critério de Saída**: Bloqueio mecânico comprovado.

### Fase 4 — Vinculação da Vercel CLI ao Projeto Existente
- **Pré-requisitos**: Fase 3 concluída; Vercel CLI autenticada (`joaovitordantas93-9050`).
- **Procedimento**:
  ```bash
  cd ../WorkTools2-vercel/labtool
  vercel link
  # Selecionar time joaovitordantas93-9050s-projects e projeto existente 'lab-tools'
  ```
- **Auditoria**: Confirmar geração de `.vercel/project.json` e garantir que está coberto por `.gitignore`.
- **Critério de Saída**: Projeto vinculado sem criação de nova aplicação.

### Fase 5 — Instrumentação Exclusiva de Observabilidade
- **Pré-requisitos**: Fase 4 concluída.
- **Procedimento**:
  ```bash
  cd ../WorkTools2-vercel/labtool
  npm install @vercel/analytics @vercel/speed-insights
  ```
  Modificar `src/app/layout.tsx` adicionando `<Analytics />` e `<SpeedInsights />`.
  Commitar na branch local:
  ```bash
  git commit -m "chore(distribution): instrumentar vercel analytics e speed insights"
  ```
- **Critério de Saída**: Modificação presente unicamente no histórico da `vercel-local`.

### Fase 6 — Quality Gates e Validação Local
- **Pré-requisitos**: Fase 5 concluída.
- **Procedimento**:
  ```bash
  npm run typecheck
  npm run lint
  npm test
  npm run build
  ```
- **Critério de Saída**: 100% de aprovação nos 4 gates em `WorkTools2-vercel/labtool`.

### Fase 7 — Homologação em Preview e Deploy de Produção
- **Pré-requisitos**: Fase 6 aprovada.
- **Procedimento**:
  ```bash
  # Gerar Preview
  vercel
  # Inspecionar Preview URL no navegador
  # Solicitar aprovação humana formal
  # Deploy de Produção
  vercel --prod
  ```
- **Critério de Saída**: Produção ativa e validada em `https://lab-tools-n.vercel.app`.

### Fase 8 — Rotina Contínua de Operação e Manutenção
- **Procedimento Periódico**:
  ```bash
  cd ../WorkTools2-vercel
  git fetch origin
  git merge main -m "chore(distribution): sincronizar atualizacoes da main"
  npm test
  vercel --prod
  ```

---

## 11. Pendências e Decisões Humanas Necessárias

Antes de disparar a Fase 1 de execução, o desenvolvedor deve deliberar sobre:

1. **Destino das Alterações Existentes no Working Tree**:
   - Atualmente, 42 arquivos constam como modificados na `main`. Decidir se devem ser commitados na `main` antes da criação da branch ou temporariamente guardados via `git stash`.
2. **Autorização Formal para Criação do Diretório Irmão**:
   - Aprovação explícita da criação física do diretório irmão de distribuição (`../WorkTools2-vercel`).
3. **Auditoria Prévia da Configuração de Root Directory no Dashboard da Vercel**:
   - Confirmar no painel web da Vercel se o projeto `lab-tools` está configurado com Root Directory apontando para `labtool`.

---

## 12. Conclusão

A formalização deste ADR consolida a melhor solução de engenharia para o LabTool: preserva o código público limpo e sustentável no GitHub, isola as ferramentas de telemetria no provedor de hospedagem, estabelece proteções ativas contra erros operacionais e garante um ciclo de vida ágil e seguro para o produto.
