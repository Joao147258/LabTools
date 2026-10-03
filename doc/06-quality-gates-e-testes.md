# Manual 06 — Quality Gates e Testes Automatizados

Este manual define o padrão de qualidade, homologação e execução de testes automatizados no **LabTool**, garantindo que nenhuma alteração quebre as invariantes do sistema.

---

## 1. Os 4 Quality Gates Obrigatórios

Antes de considerar qualquer alteração como concluída, os seguintes 4 gates devem ser validados com 100% de sucesso:

```text
┌─────────────────────────┬────────────────────────────┬──────────────────────────────────────┐
│ Gate                    │ Comando                    │ Critério de Sucesso                  │
├─────────────────────────┼────────────────────────────┼──────────────────────────────────────┤
│ 1. Testes Automatizados │ npm test                   │ 100% dos testes passando sem falhas. │
│ 2. Tipagem Estrita      │ npx tsc --noEmit           │ Zero erros de compilação TypeScript. │
│ 3. Linting de Código    │ npm run lint               │ Zero avisos ou erros de linting.     │
│ 4. Build de Produção    │ npm run build              │ Compilação Next.js concluída com ok. │
└─────────────────────────┴────────────────────────────┴──────────────────────────────────────┘
```

---

## 2. Estrutura dos Testes no Workspace

Os testes ficam localizados em `labtool/tests/features/`, espelhando a arquitetura em camadas do código-fonte:

```text
labtool/tests/features/
├── xml-privacy/
│   ├── sensitive-tags.test.ts       → Testes do catálogo declarativo e heurísticas
│   ├── xml-parser.test.ts           → Testes de segurança XXE e parsing defensivo
│   ├── xml-inspector.test.ts        → Testes de percurso recursivo e detecção de campos
│   ├── xml-sanitizer.test.ts        → Testes de substituição determinística e remoção de nós
│   ├── text-scrub.test.ts           → Testes de regex e higienização em texto livre
│   └── presentation.test.tsx        → Testes dos componentes React (tabela, chips, busca)
│
├── xml-comparator/
│   ├── comparator-parser.test.ts    → Testes de parsing em árvore normalizada XmlNode
│   ├── xml-differ.test.ts           → Testes do algoritmo de diff e detecção de nós
│   ├── diff-classifier.test.ts      → Testes do classificador semântico de 8 níveis
│   ├── diff-context.test.ts         → Testes de resolução de linha e contexto de seleção
│   ├── mirrored-rows.test.ts        → Testes do alinhamento LCS e geração de linhas espelhadas
│   ├── export-sanitizer.test.ts     → Testes de anonimização da exportação de diffs
│   ├── markdown-exporter.test.ts    → Testes do gerador de relatório Markdown
│   └── presentation.test.tsx        → Testes dos componentes React do viewer espelhado
│
└── cnpj-intelligence/
    ├── cnpj-normalization.test.ts   → Testes de sanitização e validação de DV
    └── cnpj-flow.test.ts            → Testes do caso de uso e contratos de gateway
```

---

## 3. Padrões de Escrita de Testes

### 3.1. Testes Unitários de Domínio e Aplicação
- Devem ser determinísticos, rápidos e sem efeitos colaterais.
- Testam comportamento e invariantes de negócio, e não detalhes de implementação.

```typescript
// Exemplo em tests/features/xml-comparator/diff-classifier.test.ts
import { describe, it, expect } from "vitest";
import { classifyValueDiff } from "@/features/xml-comparator/application/diff-classifier";

describe("diff-classifier: isolamento do tomador", () => {
  it("deve classificar xNome do tomador como divergência contextual", () => {
    const kind = classifyValueDiff("xNome", "/NFSe[1]/infDPS[1]/toma[1]/xNome[1]");
    expect(kind).toBe("CONTEXTUAL_DIFF");
  });

  it("deve classificar xNome do prestador como divergência principal de valor", () => {
    const kind = classifyValueDiff("xNome", "/NFSe[1]/infDPS[1]/prest[1]/xNome[1]");
    expect(kind).toBe("VALUE_DIFF");
  });
});
```

### 3.2. Testes de Componentes React (Presentation)
- Utilizam `@testing-library/react` e `@testing-library/user-event`.
- Devem envolver interações assíncronas com `act()` para garantir a atualização síncrona do estado do React.

```typescript
// Exemplo em tests/features/xml-comparator/presentation.test.tsx
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MirroredXmlViewer } from "@/features/xml-comparator/presentation/MirroredXmlViewer";

describe("MirroredXmlViewer", () => {
  it("deve alternar a seleção ao clicar duas vezes na mesma linha", async () => {
    const user = userEvent.setup();
    const onSelectRow = vi.fn();

    render(
      <MirroredXmlViewer
        rows={mockRows}
        selectedLineIndex={null}
        onSelectRow={onSelectRow}
      />
    );

    const firstRow = screen.getByTestId("mirrored-row-0");

    await act(async () => {
      await user.click(firstRow);
    });

    expect(onSelectRow).toHaveBeenCalledWith(0);
  });
});
```

---

## 4. Executando os Testes e Comandos Úteis

No diretório `labtool/`:

```bash
# Executar toda a suíte de testes em modo run (uma única vez)
npm test

# Executar testes em modo watch (desenvolvimento contínuo)
npx vitest

# Executar um arquivo de teste específico
npm test tests/features/xml-comparator/diff-classifier.test.ts

# Executar com cobertura de código (coverage)
npx vitest run --coverage
```
