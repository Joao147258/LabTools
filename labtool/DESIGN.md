# LabTool — Design System

Documento canônico de diretrizes visuais, tokens, componentes, comportamentos de interface e padrões de design para a plataforma **LabTool**.

---

## 1. Fundamentos Visuais Globais

### 1.1 Objetivo e Natureza do Produto
O **LabTool** é uma plataforma técnica e modular de ferramentas para processamento local de arquivos XML, privacidade de dados fiscais, comparação estrutural e inteligência cadastral.

O Design System serve como guia normativo para a implementação da interface do usuário (UI), garantindo:
- **Autossuficiência**: Todas as diretrizes visuais, tokens e regras estão consolidadas neste documento.
- **Precisão Técnica**: Foco na manipulação de arquivos XML extensos, árvores de dados, relatórios de divergências (diff) e consultas cadastrais estruturadas.
- **Consistência Visual**: Aplicação rigorosa de cores, tipografia, espaçamento, geometria e estados interativos em todas as ferramentas.

### 1.2 Princípios de Design
1. **Ferramenta Técnica, Não Dashboard Decorativo**: A interface prioriza a operação eficiente de dados técnicos, eliminando ornamentos visuais desnecessários, gradientes saturados, elementos Web3 ou cards de estilo marketplace.
2. **Alta Densidade com Conforto Visual**: Layouts densos e informativos, com alinhamento rigoroso em grid de 4px, permitindo inspeção de grandes volumes de dados com máxima clareza.
3. **Hierarquia Tipográfica Funcional**: Separação estrita entre a linguagem de interface geral (Geist) e o conteúdo técnico/código/documentos (JetBrains Mono).
4. **Semântica Cromática Rígida**: Cores vibrantes são reservadas exclusivamente para significados funcionais (sucesso, erro, atenção, seleção). Elementos neutros e estruturais ancoram a interface.
5. **Acessibilidade por Padrão**: Alto contraste (WCAG AA), indicadores de foco explícitos (`focus-visible`) e estados não dependentes exclusivamente de cor.

### 1.3 Identidade Visual
A identidade visual do LabTool é estruturada sobre a paleta **Catppuccin Mocha** com destaque primário em **Blue Accent**:

```text
Catppuccin Mocha
       +
Blue Accent (#89b4fa)
       +
Interface Técnica e Sóbria
       +
Geometria Não-Pill
       +
Alta Densidade e Legibilidade
```

### 1.4 Superfície e Fundo
- **Fundo**: Base escura sóbria com iluminação radial azulada extremamente sutil no plano de fundo, transmitindo ambiente técnico e focado.
- **Superfície Acrílica / Glass**: O acabamento de acrílico fumê e leve blur é tratado como **detalhe de acabamento de superfície**, e nunca como elemento protagonista. A **legibilidade do texto e o contraste sempre prevalecem** sobre qualquer efeito de transparência.

---

## 2. Tokens Canônicos

### 2.1 Paleta Oficial (Catppuccin Mocha)

| Grupo | Token Canônico | Valor Hex | Papel e Aplicação |
|---|---|---|---|
| **Background** | `--color-crust` | `#11111b` | Fundo mais profundo da aplicação (app shell exterior, backdrop). |
| **Background** | `--color-mantle` | `#181825` | Superfície secundária (toolbars, painéis de fundo, cabeçalhos de tabela). |
| **Background** | `--color-base` | `#1e1e2e` | Fundo principal da área de trabalho e editores de código. |
| **Surface** | `--color-surface0` | `#313244` | Superfície de cartões técnicos, botões secundários, inputs e linhas de tabela. |
| **Surface** | `--color-surface1` | `#45475a` | Elementos de apoio, inputs em repouso, hover em surface0 e divisores. |
| **Surface** | `--color-surface2` | `#585b70` | Bordas destacadas, estados de hover em superfícies e seleção de texto. |
| **Typography** | `--color-text` | `#cdd6f4` | Texto primário, títulos, valores principais e código XML. |
| **Typography** | `--color-subtext1` | `#bac2de` | Texto secundário, labels de formulários e descrições técnicas. |
| **Typography** | `--color-subtext0` | `#a6adc8` | Metadados, legendas e textos de apoio técnico. |
| **Typography** | `--color-overlay0` | `#6c7086` | Placeholders, delimitadores e textos desabilitados. |
| **Accent Primário** | `--color-blue` | `#89b4fa` | **Ação principal**, foco ativo, abas selecionadas, links e badges ativos. |
| **Accent Secundário**| `--color-sapphire`| `#74c7ec` | Realces secundários, seleções contextuais e tags informativas. |
| **Accent Secundário**| `--color-sky` | `#89dceb` | Indicadores de leitura, métricas neutras e caminhos de nós (paths). |
| **Accent Seleção**  | `--color-mauve` | `#cba6f7` | **Seleção ativa de linha espelhada**, realce de foco no diff e chips selecionados. |
| **Accent Auxiliar** | `--color-lavender`| `#b4befe` | Realces adicionais e estados secundários. |
| **Semântico** | `--color-green` | `#a6e3a1` | Sucesso, documento válido, nó adicionado no diff (`ONLY_IN_APPROVED`). |
| **Semântico** | `--color-yellow` | `#f9e2af` | Atenção, pendência, divergência de valor (`VALUE_DIFF`) ou aviso. |
| **Semântico** | `--color-red` | `#f38ba8` | Erro, documento inválido, nó removido no diff (`ONLY_IN_REJECTED`), ação destrutiva. |
| **Semântico** | `--color-peach` | `#fab387` | Aviso operacional relevante, dados sob intervenção de privacidade. |

### 2.2 Espaçamento (Grid Base 4px)

| Token | Dimensão | Uso Recomendado |
|---|---|---|
| `--space-2xs` | `2px` | Micro-ajustes de alinhamento, gaps internos em badges. |
| `--space-xs` | `4px` | Espaçamento interno mínimo, gaps em grupos de botões compactos. |
| `--space-sm` | `8px` | Padding interno de inputs, botões e células de tabela técnica. |
| `--space-md` | `12px` | Gaps entre campos de formulário, padding de containers compactos. |
| `--space-lg` | `16px` | Padding padrão de containers e painéis de ferramentas. |
| `--space-xl` | `20px` | Gutter entre colunas de comparação (side-by-side). |
| `--space-2xl` | `24px` | Separação entre grandes blocos funcionais na área de trabalho. |
| `--space-3xl` | `32px` | Margem superior de páginas e separação de seções mestras. |
| `--space-4xl` | `48px` | Margens externas do shell da aplicação em viewports amplos. |

### 2.3 Geometria e Radius

O LabTool adota uma estética geométrica e sóbria. É expressamente proibido o uso de botões ou containers estilo *pill* (totalmente arredondados):

| Token | Valor | Aplicação |
|---|---|---|
| `--radius-2xs` | `2px` | Checkboxes, indicadores de linha em diffs, barras de progresso. |
| `--radius-xs` | `4px` | Badges técnicos, tags de categorias, inputs, botões compactos. |
| `--radius-sm` | `6px` | Botões padrão, cards compactos, tooltips. |
| `--radius-md` | `8px` | Painéis principais, caixas de diálogo modais, visualizadores de código. |
| `--radius-lg` | `12px` | Dropzones de arquivos e containers de visualização ampla. |
| `--radius-full`| `9999px`| **Restrito**: Exclusivamente para avatares ou contadores circulares autônomos. |

### 2.4 Bordas, Sombras e Elevação Tonal

- **Espessura Padrão**: `1px` sólido.
- **Borda Estrutural Padrão**: `--color-surface0` ou `--color-surface1` sobre fundos `base` ou `mantle`.
- **Borda de Hover**: `--color-surface2` para sinalizar interatividade.
- **Borda de Foco**: `--color-blue` com anel de foco explícito (`outline: 2px solid var(--color-blue)` e `outline-offset: 2px`).
- **Hierarquia Tonal por Camadas**:
  ```text
  Camada 0 (Fundo Geral)     → Crust (#11111b)
        ↓
  Camada 1 (Shell Exterior)  → Mantle (#181825)
        ↓
  Camada 2 (Área de Trabalho) → Base (#1e1e2e)
        ↓
  Camada 3 (Superfícies)     → Surface0 (#313244)
        ↓
  Camada 4 (Overlays/Modais) → Surface1 (#45475a) + Sombra ambiente suave
  ```
- **Sombra para Overlays e Modais**: `0 8px 24px rgba(0, 0, 0, 0.45)`.

### 2.5 Contrato de Variáveis CSS (`globals.css`)

```css
:root {
  /* Cores — Catppuccin Mocha */
  --color-crust: #11111b;
  --color-mantle: #181825;
  --color-base: #1e1e2e;
  --color-surface0: #313244;
  --color-surface1: #45475a;
  --color-surface2: #585b70;

  --color-text: #cdd6f4;
  --color-subtext1: #bac2de;
  --color-subtext0: #a6adc8;
  --color-overlay0: #6c7086;

  --color-blue: #89b4fa;
  --color-sapphire: #74c7ec;
  --color-sky: #89dceb;
  --color-mauve: #cba6f7;
  --color-lavender: #b4befe;
  --color-green: #a6e3a1;
  --color-yellow: #f9e2af;
  --color-red: #f38ba8;
  --color-peach: #fab387;

  /* Tipografia */
  --font-family-ui: var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-family-code: var(--font-jetbrains-mono), "Fira Code", monospace;

  /* Escala de UI (Geist) */
  --font-size-ui-2xs: 10px;
  --line-height-ui-2xs: 14px;
  --font-size-ui-xs: 11px;
  --line-height-ui-xs: 16px;
  --font-size-ui-sm: 13px;
  --line-height-ui-sm: 20px;
  --font-size-ui-base: 15px;
  --line-height-ui-base: 24px;
  --font-size-ui-lg: 18px;
  --line-height-ui-lg: 26px;
  --font-size-ui-xl: 22px;
  --line-height-ui-xl: 30px;
  --font-size-ui-2xl: 28px;
  --line-height-ui-2xl: 36px;

  /* Escala Técnica (JetBrains Mono) */
  --font-size-code-sm: 11px;
  --line-height-code-sm: 16px;
  --font-size-code-md: 13px;
  --line-height-code-md: 20px;
  --font-size-code-lg: 14px;
  --line-height-code-lg: 22px;
  --font-size-label-sm: 10px;
  --line-height-label-sm: 14px;
  --font-size-label-md: 12px;
  --line-height-label-md: 16px;

  /* Espaçamento */
  --space-2xs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 12px;
  --space-lg: 16px;
  --space-xl: 20px;
  --space-2xl: 24px;
  --space-3xl: 32px;
  --space-4xl: 48px;

  /* Geometria */
  --radius-2xs: 2px;
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-full: 9999px;

  /* Bordas e Sombras */
  --border-width: 1px;
  --border-color-default: var(--color-surface0);
  --border-color-active: var(--color-surface1);
  --border-color-highlight: var(--color-surface2);
  --shadow-overlay: 0 8px 24px rgba(0, 0, 0, 0.45);
}
```

---

## 3. Tipografia & Escalas

### 3.1 Famílias Tipográficas
```text
Interface Geral (UI):
  Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif

Código, XML e Dados Técnicos:
  "JetBrains Mono", "Fira Code", monospace
```

### 3.2 Regras de Aplicação
- **Geist (UI)**: Títulos de seções, textos de navegação, botões de ação geral, labels de formulários e mensagens de feedback.
- **JetBrains Mono (Código & Dados)**: Conteúdo XML, nomes de tags/atributos, caminhos de nós (XPath/JSONPath), números de linha, valores cadastrais estruturados (CNPJ, CPF, Inscrição Estadual, Chave de Acesso), relatórios de diff e logs.

### 3.3 Tabelas de Escala

#### Escala de Interface (Geist)
| Token | Tamanho | Line Height | Peso | Aplicação Típica |
|---|---|---|---|---|
| `--font-size-ui-2xs` | `10px` | `14px` | Regular (400) / Medium (500) | Badges compactos, micro-metadados. |
| `--font-size-ui-xs` | `11px` | `16px` | Regular (400) / Medium (500) | Micro-labels, legendas secundárias. |
| `--font-size-ui-sm` | `13px` | `20px` | Regular (400) / Medium (500) | Labels de formulário, botões compactos. |
| `--font-size-ui-base`| `15px` | `24px` | Regular (400) / Medium (500) | Corpo de texto padrão, botões principais. |
| `--font-size-ui-lg` | `18px` | `26px` | SemiBold (600) | Subtítulos de seções, cabeçalhos de painel. |
| `--font-size-ui-xl` | `22px` | `30px` | SemiBold (600) | Título de ferramentas nos workspaces. |
| `--font-size-ui-2xl`| `28px` | `36px` | Bold (700) | Título principal da marca (**LabTools**). |

#### Escala Técnica (JetBrains Mono)
| Token | Tamanho | Line Height | Peso | Aplicação Típica |
|---|---|---|---|---|
| `--font-size-code-sm`| `11px` | `16px` | Regular (400) | Atributos XML densos e caminhos inline. |
| `--font-size-code-md`| `13px` | `20px` | Regular (400) | Corpo de visualização XML e diffs. |
| `--font-size-code-lg`| `14px` | `22px` | Regular (400) / Medium (500) | Snippets de código e exportação Markdown. |
| `--font-size-label-sm`| `10px` | `14px` | Medium (500) / SemiBold (600) | Badges de nós (`[BLOCO]`, `[INDIVIDUAL]`). |
| `--font-size-label-md`| `12px` | `16px` | Medium (500) / SemiBold (600) | Contadores de diferenças, tags de status. |

---

## 4. Layout, Responsividade e Shell

### 4.1 Arquitetura Macro da Aplicação
O LabTool é organizado em duas experiências de layout distintas e objetivas:

1. **Home (Launcher)**: Um shell centralizado e compacto, concebido exclusivamente como **menu inicial / lançador de ferramentas**. Não possui sidebar, navbar pesada ou dashboards.
2. **Workspaces das Ferramentas (`/xml-privacy`, `/xml-comparator`)**: Áreas de trabalho completas e dedicadas para manipulação e visualização técnica, dotadas de um link de retorno discreto (`← LabTools`) no cabeçalho superior esquerdo.

### 4.2 Breakpoints Canônicos

| Breakpoint | Faixa de Resolução | Dispositivo / Modo | Comportamento de Layout |
|---|---|---|---|
| **Mobile** | `< 768px` | Smartphones (`~390px`) | Coluna única; inputs e botões empilhados; rolagem horizontal contida em blocos XML. |
| **Tablet** | `768px – 1023px` | Tablets / Telas verticais | Painéis empilhados; abas unificadas para diffs. |
| **Desktop** | `1024px – 1439px` | Laptops / Desktops padrão | Home centralizada (`640px–760px`); workspaces com layout side-by-side. |
| **Desktop Wide** | `≥ 1440px` | Monitores amplos | Workspaces expandidos com largura total para inspeção de arquivos XML densos. |

### 4.3 Navegação de Retorno Discreta
Nos workspaces internos (`/xml-privacy` e `/xml-comparator`), a navegação de retorno à Home é realizada através de um elemento discreto:

```text
← LabTools
```

- **Estilo**: Texto em `--color-subtext0`, com hover clareando para `--color-blue`.
- **Posição**: Canto superior esquerdo da página da ferramenta.
- **Comportamento**: Link nativo Next.js (`<Link href="/">`) que retorna à Home sem recarregar o estado desnecessariamente.

---

## 5. Home — Menu de Ferramentas (Launcher)

### 5.1 Definição Conceitual
A página inicial do LabTool é categoricamente um **MENU INICIAL / LAUNCHER DE FERRAMENTAS**.

A Home **NÃO É**:
- ❌ Dashboard;
- ❌ Workspace de edição;
- ❌ Página de análise ou central de métricas;
- ❌ Página de documentação;
- ❌ Catálogo complexo de ferramentas ou marketplace;
- ❌ Conjunto de cards descritivos informativos;
- ❌ Hero de landing page comercial.

Ao acessar a aplicação, o usuário deve compreender em poucos segundos:
> *"Tenho três ferramentas técnicas disponíveis."*

### 5.2 Fluxo Conceitual da Home

```text
LabTools
   │
   ├── [ Privacy ]  ─────────────→  /xml-privacy (Workspace de Sanitização)
   │
   ├── [ Comparer ]  ────────────→  /xml-comparator (Workspace de Comparação)
   │
   └── [ CNPJ ________________ ] [ Consultar ]  ──→  Consulta Imediata (Modal/Resultado)
```

### 5.3 Estrutura Canônica da Home
A Home deve seguir rigorosamente a composição:

```text
<Home>
    <Brand />
    
    <ToolLauncher>
        <PrivacyAction />
        <ComparatorAction />
    </ToolLauncher>

    <CnpjQuickSearch />
</Home>
```

### 5.4 Diagrama Canônico da Interface

```text
┌─────────────────────────────────────────────┐
│                  LabTools                   │
│                                             │
│ Privacy                                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Abrir Privacy                         → │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Comparer                                    │
│ ┌─────────────────────────────────────────┐ │
│ │ Abrir Comparer                        → │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Consultar CNPJ                              │
│ ┌─────────────────────────────┬───────────┐ │
│ │ 00.000.000/0000-00          │ Consultar │ │
│ └─────────────────────────────┴───────────┘ │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.5 Especificação das Três Entradas Funcionais

#### 1. Privacy (Ação de Navegação)
- **Destino**: `/xml-privacy`
- **Componente**: `ToolAction`
- **Texto Principal**: `Abrir Privacy` (ou `Privacy`) com seta indicativa à direita (`→`).
- **Comportamento**: Ação direta de navegação para a rota do workspace de privacidade.
- **Geometria**: Botão full-width, altura `48px`, alinhamento horizontal com padding `--space-lg`.

#### 2. Comparer (Ação de Navegação)
- **Destino**: `/xml-comparator`
- **Componente**: `ToolAction`
- **Texto Principal**: `Abrir Comparer` (ou `Comparer`) com seta indicativa à direita (`→`).
- **Comportamento**: Ação direta de navegação para a rota do workspace de comparação.
- **Paridade**: Possui **exatamente a mesma altura, largura, hierarquia visual, tipografia e estilo interativo** da entrada Privacy. Nenhuma das duas possui dominância visual sobre a outra.

#### 3. Consultar CNPJ (Input com Ação Imediata)
- **Comportamento**: Diferente de Privacy e Comparer (`clique → navegação`), a consulta de CNPJ é de natureza `digitação → validação → ação imediata`. O usuário não precisa abrir uma página intermediária apenas para digitar um número de documento.
- **Componente**: `CnpjQuickSearch`
- **Estrutura**: Formulário semântico contendo campo de input com máscara e botão `Consultar` associado.
- **Layout Desktop (`≥ 768px`)**: Input e botão dispostos lado a lado na mesma linha:
  ```text
  ┌─────────────────────────────────────────────┬────────────┐
  │ 00.000.000/0000-00                          │ Consultar  │
  └─────────────────────────────────────────────┴────────────┘
  ```
- **Layout Mobile (`< 768px`)**: Input e botão empilhados verticalmente:
  ```text
  ┌──────────────────────────────────────────┐
  │ 00.000.000/0000-00                       │
  └──────────────────────────────────────────┘
  ┌──────────────────────────────────────────┐
  │ Consultar                                │
  └──────────────────────────────────────────┘
  ```
- **Resultado**: A consulta exibe os dados cadastrais retornados em um modal ou painel de diálogo técnico sobre a Home, sem abandonar a tela inicial.

### 5.6 Dimensões e Posicionamento do Shell da Home
- **Container Central Único**: Uma superfície central única em `--color-surface0` ou com acabamento acrílico sutil, delimitada por borda de `1px` em `--color-surface1`.
- **Largura Máxima**: Entre `640px` e `760px` para o conteúdo interno.
- **Densidade Vertical**: Altura compacta projetada para visualização completa **sem necessidade de rolagem vertical (scroll)** em resoluções desktop padrão (`1080p` ou laptops comuns).
- **Proibição de Cards Informativos**: É expressamente proibido renderizar cards com parágrafos descritivos, listas de recursos ou botões secundários para cada ferramenta na Home. A intenção é um **launcher utilitário rápido**.

---

## 6. XML Privacy

### 6.1 Identidade Funcional
Ferramenta especializada em inspeção determinística, anonimização e sanitização de documentos fiscais XML (NF-e, NFC-e, NFS-e, CT-e, MDF-e), operando 100% no cliente (browser) via DOMParser e XMLSerializer.

### 6.2 Fluxo de Trabalho no Workspace
```text
Upload XML local
      ↓
Inspeção e parsing defensivo (inspectXml)
      ↓
Classificação declarativa e catalogação
      ↓
Seleção de políticas (REPLACE / SCRUB_TEXT / REMOVE_SUBTREE / PRESERVE)
      ↓
Sanitização determinística (sanitizeXml)
      ↓
Visualização comparativa (Original vs. Sanitizado)
      ↓
Download do XML higienizado
```

### 6.3 Políticas de Higienização e Preservação de Dados
- **Preservação Padrão (`PRESERVE`)**: Inscrição Municipal (`IM`, `InscricaoMunicipal`, `IE`) e Endereço/Localização (`CEP`, `xLgr`, `nro`, `xBairro`, `cMun`, `xMun`, `UF`, `cPais`, etc.) mantêm a ação sugerida `PRESERVE` e permanecem intactos por padrão. Suas categorias semânticas (`INSCRICAO` e `ENDERECO`) são mantidas no domínio para fins de categorização.
- **Anonimização Ativa Padrão (`REPLACE`)**: Dados pessoais identificáveis (`CNPJ`, `CPF`, `xNome`, `RAZAO_SOCIAL`, `CONTATO`, `IDENTIFICADOR_DPS`) são anonimizados com tokens determinísticos relacionais (`[CNPJ_001]`, `[CPF_001]`, `[NOME_001]`).
- **Anonimização em Texto Livre (`SCRUB_TEXT`)**: Varredura regex ordenada em blocos informativos e observações (`infCpl`, `infAdic`, nós de texto livre).
- **Remoção de Assinaturas (`REMOVE_SUBTREE`)**: Subárvores de assinatura digital XMLDSig (`<Signature xmlns="...xmldsig#">`) e nós de comentário sensíveis são purgados integralmente.

### 6.4 Componentes do Workspace
- **Header da Ferramenta**: Link discreto `← LabTools` + título `XML Privacy`.
- **Upload Dropzone**: Área para seleção de arquivo com validação defensiva de 20MB e bloqueio rigoroso contra XXE (`DOCTYPE`/`ENTITY`).
- **Tabela Técnica de Inspeção**: Grid com tag, caminho XPath posicional, categoria semântica, valor original, ação atribuída e checkbox de seleção.
- **Ações em Lote**: Controles para *Selecionar Todos*, *Desmarcar Todos* e *Restaurar Padrões*.
- **Painel de Sumário & Exportação**: Métricas quantitativas de campos substituídos, scrubbed e subárvores removidas, com botão primário para download.

---

## 7. XML Comparator

### 7.1 Identidade Funcional
Ferramenta técnica especializada na comparação estrutural, hierárquica e semântica entre dois documentos XML (Documento Aprovado vs. Documento Rejeitado/Modificado), com suporte a anexo opcional de arquivo de erro, visualização espelhada em grade única sincronizada, classificação semântica de divergências e geração de relatório em Markdown com sanitização relacional.

### 7.2 Fluxo de Trabalho e Pipeline de Comparação
```text
Upload XML A (Aprovado) + Upload XML B (Rejeitado) [+ Arquivo de Retorno]
      ↓
Construção da árvore de nós normalizada (ComparatorXmlNode)
      ↓
Detecção estrutural profunda (xml-differ / compareXmlTrees)
      ↓
Classificação semântica contextual (diff-classifier)
      ↓
Resolução de linhas e contexto posicional (diff-context / buildMirroredRows)
      ↓
Visualizador Espelhado Grid Side-by-Side (MirroredXmlViewer / MirroredXmlRow)
      ↓
Sanitização de exportação com preservação de IM/endereço (export-sanitizer)
      ↓
Geração e download de relatório em Markdown (markdown-exporter)
```

### 7.3 Arquitetura de Visualização Espelhada (Mirrored Comparison)
O comparador adota arquitetura de renderização espelhada de linha única:
- **Alinhamento Estrutural por LCS**: As linhas de exibição são construídas a partir da reconciliação de maior subsequência comum (LCS) dos nós XML.
- **CSS Grid de 2 Colunas Compartilhadas**: Cada linha lógica (`MirroredXmlRow`) une o lado aprovado e o lado rejeitado sob a mesma linha de grid, garantindo **rigorosamente a mesma altura visual** mesmo quando houver quebra de linha.
- **Quebra de Linha Segura**: Strings longas quebram com `white-space: pre-wrap`, `overflow-wrap: anywhere` e `word-break: break-word`, sem deslocar ou dessincronizar as linhas subsequentes.
- **Scroll Vertical Único Compartilhado**: Um único container de rolagem vertical gerencia ambos os painéis, eliminando qualquer risco de dessincronização por eventos de scroll assíncronos.
- **Suporte a Slots Vazios**: Elementos presentes exclusivamente em um documento ocupam a mesma linha lógica com um slot vazio demarcado no lado oposto.
- **Seleção e Toggle**: O clique em qualquer célula ou slot seleciona a linha completa simultaneamente nos dois lados. Clicar em uma linha já selecionada executa **deseleção imediata (toggle)**, retornando o painel de detalhes ao estado neutro.

### 7.4 Semântica Cromática de Diferenças (Diff)
A interface distingue claramente as naturezas de divergência:
- **Adição (`ONLY_IN_APPROVED`)**: Fundo translúcido verde (`rgba(166, 227, 161, 0.12)`), borda lateral `3px solid var(--color-green)`, badge `+ Aprovado`.
- **Remoção (`ONLY_IN_REJECTED`)**: Fundo translúcido vermelho (`rgba(243, 139, 168, 0.12)`), borda lateral `3px solid var(--color-red)`, badge `- Rejeitado`.
- **Divergência de Valor Principal (`VALUE_DIFF`)**: Fundo translúcido amarelo (`rgba(249, 226, 175, 0.12)`), borda lateral `3px solid var(--color-yellow)`, badge `Valor`.
- **Divergência de Atributos (`ATTRIBUTE_DIFF`)**: Fundo translúcido pêssego (`rgba(250, 179, 135, 0.12)`), borda lateral `3px solid var(--color-peach)`, badge `Atributo`.
- **Divergência Estrutural (`STRUCTURE_DIFF`)**: Fundo translúcido safira (`rgba(116, 199, 236, 0.12)`), borda lateral `3px solid var(--color-sapphire)`, badge `Estrutura`.
- **Divergência Contextual (`CONTEXTUAL_DIFF`)**: Fundo translúcido sky (`rgba(137, 220, 235, 0.10)`), borda lateral `3px solid var(--color-sky)`, badge `Contexto`.
- **Linha Selecionada (Foco Ativo)**: Fundo roxo/mauve (`rgba(203, 166, 247, 0.22)`), bordas de destaque `3px solid var(--color-mauve)` e contorno `1px solid var(--color-mauve)`.

### 7.5 Regras de Precedência do Classificador Semântico (`diff-classifier.ts`)
O classificador semântico opera antes da exibição visual respeitando a seguinte ordem de precedência:
1. **Diferenças Estruturais / Tags Ausentes**: Sempre tratadas como divergências principais (`STRUCTURE_DIFF`, `ONLY_IN_APPROVED`, `ONLY_IN_REJECTED`).
2. **Localização Fiscal / Município / UF / País**: `cMun`, `UF`, `cLocPrestacao`, `cLocIncid`, etc., permanecem **sempre como divergências principais (`VALUE_DIFF`)**, mesmo que estejam dentro do endereço do tomador.
3. **Escopo do Prestador / Emitente**: `CNPJ`, `IM`, `xNome`, `fone`, `email` e endereço dentro de `emit`/`prest` permanecem **sempre como divergências principais (`VALUE_DIFF`)**.
4. **Campos Fiscais e Descrições de Serviço**: `cTribNac`, `CST`, `cNBS`, `vBC`, `pAliqAplic`, `xDescServ`, etc., permanecem **sempre como divergências principais (`VALUE_DIFF`)**.
5. **Identificadores Documentais**: `serie`, `nDPS`, `nNFSe`, `dhEmi`, `dCompet` e atributos `Id` em contêineres documentais (`infDPS`, `infNFSe`) configuram **`CONTEXTUAL_DIFF`**.
6. **Campos Cadastrais do Tomador / Destinatário**: `CNPJ`, `CPF`, `xNome`, `IM`, `IE`, `fone`, `email`, `CEP`, `xLgr`, `nro`, `xBairro` dentro de `toma`/`dest` configuram **`CONTEXTUAL_DIFF`**.
7. **Tags Explícitas de Tomador**: `cnpjTomador`, `xNomeTomador`, `cepTomador`, etc., configuram **`CONTEXTUAL_DIFF`**.
8. **Demais Casos**: Configuram divergência principal (`VALUE_DIFF`).

### 7.6 Política de Sanitização da Exportação Markdown
A geração do relatório Markdown segue política estrita:
- Inscrições Municipais e dados de endereço/localização **não são mascarados**, preservando seus valores originais para análise técnica.
- Apenas PIIs sensíveis (como CNPJ, CPF e nomes de clientes) recebem substituição determinística relacional (`[CNPJ_001]`).
- O relatório inclui cabeçalho com metadados, sumário de métricas, tabela de divergências e seções com os XMLs sanitizados.

---

## 8. CNPJ Intelligence

### 8.1 Identidade Funcional
Serviço de validação algorítmica de dígitos verificadores, normalização e consulta cadastral de empresas brasileiras junto à BrasilAPI através de Route Handler seguro.

### 8.2 Fluxo de Execução
```text
Entrada na Home (CnpjQuickSearch)
      ↓
Normalização e validação local imediata
      ↓
Requisição HTTP (GET /api/cnpj/{cnpj})
      ↓
Consulta ao Gateway / BrasilAPI
      ↓
Mapeamento para modelo de domínio (CnpjCompany)
      ↓
Apresentação em Modal/Dialog Cadastral na Home
```

### 8.3 Apresentação Cadastral
O resultado da consulta é exibido em um componente modal/dialog de alta densidade técnica contendo:
- **Cabeçalho**: Razão Social, Nome Fantasia, CNPJ formatado e Badge de Situação Cadastral (Ativa = Verde, Inapta/Baixada = Vermelho/Amarelo).
- **Dados Cadastrais**: Data de Abertura, Natureza Jurídica, Capital Social e Porte.
- **Atividades Econômicas**: CNAE Principal e CNAEs Secundários formatados em JetBrains Mono.
- **Endereço**: Logradouro, Número, Complemento, Bairro, Município, UF e CEP.
- **Quadro de Sócios e Administradores (QSA)**: Lista de sócios com qualificação e faixa etária.

---

## 9. Componentes Compartilhados & Padrões de Interface

### 9.1 `ToolAction` (Ação de Navegação do Launcher)
- **Finalidade**: Componente de navegação das ferramentas na Home (`Privacy` e `Comparer`).
- **Anatomia**:
  ```text
  ┌───────────────────────────────────────────────────────────┐
  │ ◇  Nome da Ferramenta                                   → │
  └───────────────────────────────────────────────────────────┘
  ```
- **Estilo Padrão**: Fundo `--color-surface0`, borda `1px solid var(--color-surface1)`, texto `--color-text` em Geist SemiBold `15px`.
- **Hover**: Fundo `--color-surface1`, borda `--color-surface2`, ícone de seta deslocando sutilmente `2px` à direita.
- **Foco**: `outline: 2px solid var(--color-blue)`, `outline-offset: 2px`.
- **Altura**: `48px` fixos.

### 9.2 `CnpjQuickSearch` (Formulário de Consulta Rápida)
- **Finalidade**: Formulário de entrada direta para CNPJ na Home.
- **Input**:
  - Fundo `--color-surface0`, borda `1px solid var(--color-surface1)`, texto em `JetBrains Mono 14px`.
  - Placeholder: `00.000.000/0000-00` em `--color-overlay0`.
  - Máscara dinâmica aplicada durante a digitação.
- **Botão `Consultar`**:
  - Fundo `--color-blue`, texto `--color-crust` em Geist SemiBold `14px`.
  - Estado *Loading*: Spinner sutil ou texto `Consultando...` com `disabled`.
  - Estado *Disabled*: Opacidade `0.5` quando o input não contiver 14 dígitos válidos.

### 9.3 `Button` (Botão Padrão)
- **Primário**: Fundo `--color-blue`, texto `--color-crust`, peso SemiBold.
- **Secundário**: Fundo `--color-surface0`, borda `--color-surface1`, texto `--color-text`.
- **Destrutivo**: Fundo `--color-red`, texto `--color-crust`.
- **Ghost**: Fundo transparente, hover em `--color-surface0`, texto `--color-subtext1`.

### 9.4 `Dropzone` & `UploadArea`
- Borda tracejada de `1px` em `--color-surface2` com radius `--radius-lg`.
- Fundo `--color-surface0` com transição para `--color-surface1` em hover/drag ativo.
- Suporte a arrastar e soltar (drag & drop) e seletor de arquivos nativo.

### 9.5 `Table` Técnica de Inspeção
- Cabeçalhos em `--color-mantle` com texto em `--color-subtext1` em `JetBrains Mono 12px`.
- Linhas com divisores de `1px` em `--color-surface0`.
- Padding compacto de célula (`--space-sm` / `8px`).

---

## 10. Estados Interativos e Acessibilidade

### 10.1 Matriz de Estados Interativos

| Componente | Default | Hover | Focus-Visible | Active | Disabled / Loading |
|---|---|---|---|---|---|
| **`ToolAction`** | Fundo Surface0, Borda Surface1, Texto Text | Fundo Surface1, Borda Surface2 | Anel Blue 2px (offset 2px) | Fundo Surface0, leve recuo | Opacidade 0.4, cursor not-allowed |
| **`Input CNPJ`** | Fundo Surface0, Borda Surface1 | Borda Surface2 | Anel Blue 2px, Borda Blue | — | Fundo Mantle, cursor not-allowed |
| **`Button Blue`** | Fundo Blue, Texto Crust | Fundo Sapphire | Anel Blue 2px (offset 2px) | Fundo Blue escurecido | Opacidade 0.5, cursor not-allowed |
| **`Checkbox`** | Borda Surface2, Fundo Surface0 | Borda Blue | Anel Blue 2px | Fundo Blue | Opacidade 0.4 |

### 10.2 Diretrizes de Acessibilidade (a11y)
- **Contraste WCAG AA**: Todos os textos (`--color-text` `#cdd6f4`, `--color-subtext1` `#bac2de`) sobre fundos escuros (`base`, `surface0`) mantêm taxa de contraste mínima superior a `4.5:1`.
- **Navegação por Teclado**: Todo componente interativo possui tabulação lógica (`tabIndex={0}`) e anel de foco evidente (`--color-blue`).
- **Ação por Teclado no CNPJ**: A tecla `Enter` no input de CNPJ submete automaticamente a consulta quando o valor for válido.
- **Rótulos e Semântica**:
  - Botões utilizam `<button>` nativo com `type="button"` ou `type="submit"`.
  - Links utilizam `<Link>` ou `<a>` nativo.
  - Inputs possuem `<label>` associado ou `aria-label` explícito.
- **Não Dependência Exclusiva de Cor**: Erros, avisos e status de diffs sempre incluem ícones ou rótulos textuais explícitos junto à cor semântica.

---

## 11. Decisões Consolidadas e Nomenclatura

### 11.1 Tabela Canônica de Nomenclatura

Para evitar variações e ambiguidades entre as telas, a nomenclatura do LabTool fica consolidada como:

| Entidade / Ferramenta | Nome Canônico do Módulo | Rótulo de Navegação na Home | Rota / Localização | Descrição Funcional |
|---|---|---|---|---|
| **Produto** | `LabTools` (ou `LabTool`) | — | `/` | Plataforma técnica modular. |
| **Ferramenta 1** | `XML Privacy` | `Privacy` / `Abrir Privacy →` | `/xml-privacy` | Inspeção e sanitização determinística de XML. |
| **Ferramenta 2** | `XML Comparator` | `Comparer` / `Abrir Comparer →` | `/xml-comparator` | Comparação estrutural e diff lado a lado de XML. |
| **Ferramenta 3** | `CNPJ Intelligence` | `Consultar CNPJ` / `Consultar` | `/api/cnpj/[cnpj]` + Dialog na Home | Validação e consulta cadastral de CNPJ. |

> [!IMPORTANT]
> **Consistência**: Não utilizar termos alternativos como *"Sanitizador"*, *"Comparador"* ou *"Consultor"* na interface da Home. Adotar rigorosamente os rótulos consolidados na tabela acima.

### 11.2 Decisões de Design Consolidadas
1. **Home como Launcher Puro**: A página inicial é exclusivamente um menu compacto com três ações diretas, sem cards de marketplace, dashboards ou métricas.
2. **Workspaces Próprios**: XML Privacy e XML Comparator possuem rotas e telas dedicadas de alta densidade técnica com navegação de retorno discreta (`← LabTools`).
3. **Consulta CNPJ Direta**: O CNPJ é a única ferramenta com formulário ativo na Home para evitar navegação intermediária desnecessária.
4. **Paleta Catppuccin Mocha**: Uso rigoroso dos tokens oficiais de cores e acento Blue (`#89b4fa`).
5. **Tipografia Geist + JetBrains Mono**: Geist para toda a UI e JetBrains Mono para código XML, diffs, dados fiscais e números estruturados.

### 11.3 Decisões Locais Ainda Abertas
As seguintes decisões pontuais permanecem abertas para refinamento na etapa de implementação dos componentes:

#### DD-006 — Densidade Tipográfica do Botão de Ação Primária
- **Alternativa A**: Tipografia `Geist 15px` com padding confortável (`--space-md`), conferindo maior destaque às ações executáveis.
- **Alternativa B**: Tipografia `JetBrains Mono 12px` com altura compacta de `32px`, favorecendo densidade técnica em barras de ferramentas.

#### DD-007 — Fundo Estrutural de Containers
- **Alternativa A**: Fundo em **`Mantle (#181825)`** para gerar contraste rebaixado contra o `Base (#1e1e2e)`.
- **Alternativa B**: Fundo em **`Base (#1e1e2e)`** com borda em `Surface0/Surface1`, mantendo a área de trabalho uniforme em um único plano de base.
