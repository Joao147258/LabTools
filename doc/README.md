# LabTool — Manuais Operacionais e Guia de Engenharia

Esta pasta reúne a documentação técnica e os manuais operacionais passo a passo para manutenção, evolução, adição de novas tags, grupos semânticos, regras de anonimização e classificação estrutural no **LabTool**.

---

## 📚 Índice de Manuais

| Manual | Assunto Principal | Descrição |
|---|---|---|
| **[01. Adição de Nova Tag](./01-adicao-nova-tag.md)** | `Tags XML` | Guia completo para cadastrar uma nova tag nos catálogos do XML Privacy e XML Comparator. |
| **[02. Adição de Novo Grupo / Categoria](./02-adicao-novo-grupo-categoria.md)** | `Grupos & Categorias` | Como criar uma nova categoria semântica no modelo de domínio e integrá-la às ferramentas. |
| **[03. Remoção de Tag ou Grupo](./03-remocao-tag-grupo.md)** | `Depreciação & Limpeza` | Procedimento seguro para descontinuar ou remover tags e categorias sem quebrar contratos. |
| **[04. Alteração de Regras de Sanitização](./04-alteracao-regras-sanitizacao.md)** | `Sanitização & Anonimização` | Como alterar a política padrão de uma tag (PRESERVE, REPLACE, SCRUB_TEXT, REMOVE_SUBTREE). |
| **[05. Alteração de Regras de Classificação no Comparador](./05-alteracao-regras-classificacao-diff.md)** | `Classificador de Diff` | Como alterar as regras de precedência e os escopos do `diff-classifier` (Tomador vs Prestador vs Fiscal). |
| **[06. Quality Gates e Testes Automatizados](./06-quality-gates-e-testes.md)** | `Testes & Homologação` | Como escrever testes unitários/integrados e rodar a suíte Vitest, typecheck, lint e build. |

---

## 🏛️ Princípios Arquiteturais das Ferramentas

Ao realizar qualquer alteração, lembre-se das três regras fundamentais do LabTool:

1. **Motores 100% Independentes**: O `xml-privacy` e o `xml-comparator` possuem seus próprios catálogos, tipos e sanitizadores. Nunca crie acoplamento direto entre as duas ferramentas.
2. **Processamento 100% Client-Side**: Nenhuma informação fiscal é enviada para APIs externas; o parsing e a mutação ocorrem integralmente no navegador via `DOMParser`.
3. **Testes como Evidência**: Qualquer alteração em catálogo ou regra deve vir acompanhada do respectivo teste automatizado em `tests/features/`.
