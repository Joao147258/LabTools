# LabTool — Skills Locais

Este diretório contém as **skills locais** do LabTool.

As skills atuam como a base de conhecimento operacional e arquitetural utilizada pelo agente orquestrador ([`agent.md`](file://./agent.md)) durante a construção e evolução incremental da aplicação.

---

## 1. Mapeamento de Skills

| Skill | Responsabilidade Principal | Quando Utilizar |
|---|---|---|
| [`architecture`](file://./architecture/SKILL.md) | Arquitetura, monólito modular, camadas e fronteiras | Criação ou alteração de camadas, decisões estruturais, direção de dependências e avaliação de extração para `shared`. |
| [`xml-privacy`](file://./xml-privacy/SKILL.md) | Motor do XML Privacy | Parsing de XML, inspeção de campos, catálogo declarativo, classificação de sensibilidade, scrub de texto e sanitização. |
| [`xml-comparator`](file://./xml-comparator/SKILL.md) | Motor do XML Comparator | Parsing comparativo de XMLs, árvore de nós normalizada, cálculo de diferenças (diff), contexto e sanitização de exportação Markdown. |
| [`cnpj-intelligence`](file://./cnpj-intelligence/SKILL.md) | Fluxo cadastral do CNPJ | Domínio de CNPJ, normalização de entrada, validação de dígitos verificadores, contratos de gateway e mappers de APIs externas. |
| [`testing`](file://./testing/SKILL.md) | Testes como evidência e proteção de invariantes | Criação de testes unitários, testes de integração, regressões, casos de limite, entradas adversariais de XML e quality gates. |
| [`scripts-automation`](file://./scripts-automation/SKILL.md) | Scripts, automação, runners, quality gates e comandos públicos | Criação ou alteração de scripts shell (.sh), comandos npm no `package.json`, runners de testes, orquestrações E2E, geração de fixtures, setup/build e automações locais. |

---

## 2. Princípio de Evolução das Skills

As skills **não representam uma implementação antecipada** nem devem conter código pré-fabricado ou arquiteturas especulativas.

O ciclo de vida do conhecimento nas skills segue o fluxo:

```text
requisito
   ↓
implementação
   ↓
teste
   ↓
compreensão
   ↓
decisão confirmada
   ↓
skill atualizada
```

À medida que cada funcionalidade é construída, testada e compreendida de acordo com o [`LabTool Guia de Construção.md`](file://./LabTool%20Guia%20de%20Constru%C3%A7%C3%A3o.md), os contratos, invariantes e decisões consolidadas são registrados na respectiva skill.

---

## 3. Regra de Isolamento Estrito

A reconstrução do LabTool é totalmente independente e desacoplada.

- **Proibido carregar contexto externo**: Não consultar versões anteriores do LabTool, códigos legados, ArchitetureHome, agents externos ou outros projetos.
- **Autoridade soberana local**: As únicas fontes de verdade são [`agent.md`](file://./agent.md), [`LabTool Guia de Construção.md`](file://./LabTool%20Guia%20de%20Constru%C3%A7%C3%A3o.md) e as decisões e testes consolidados neste repositório.

---

## 4. Regra de Portabilidade

É terminantemente proibido gravar ou utilizar caminhos absolutos específicos da máquina do desenvolvedor (tais como referências a `/home/...`, `C:\...` ou diretórios de usuário).

Todas as referências, scripts, imports e documentações devem utilizar exclusivamente caminhos relativos à raiz do projeto (`./src/`, `./tests/`, `./.agents/skills/`).

---

## 5. Orquestração e Seleção

O agente orquestrador não carrega todas as skills por padrão. Para cada tarefa específica, apenas o subconjunto necessário de skills deve ser carregado, conforme a matriz de seleção definida em [`agent.md`](file://./agent.md).
