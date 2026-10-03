# Manual 05 — Alteração de Regras de Classificação no Comparador XML

Este manual orienta a customização e manutenção das regras semânticas do **XML Comparator**, governadas pelo [`diff-classifier.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/application/diff-classifier.ts).

---

## 1. Por que Distinguir Divergências Contextuais de Divergências Principais?

Ao comparar dois XMLs fiscais (por exemplo, um XML Aprovado versus um XML Rejeitado pelo WebService da Prefeitura/SEFAZ), nem todas as divergências têm a mesma importância:

```text
┌──────────────────────────────────────────┬──────────────────────────────────────────┐
│ Divergências Principais (Vermelho)       │ Divergências Contextuais (Azul / Slate)  │
├──────────────────────────────────────────┼──────────────────────────────────────────┤
│ - Alíquotas e Valores (vBC, vISSQN, CST) │ - Dados Cadastrais do Tomador (xNome)    │
│ - Códigos Fiscais (cTribNac, cClassTrib) │ - Endereço do Tomador (xLgr, nro, CEP)   │
│ - Descrição de Serviço (xDescServ)       │ - Identificadores Técnicos (serie, nDPS) │
│ - Dados do Prestador / Emitente (CNPJ)   │ - Data e Hora de Emissão (dhEmi)         │
│ - Município / UF da Prestação (cMun)     │ - Atributo Id em contêineres documentais │
└──────────────────────────────────────────┴──────────────────────────────────────────┘
```

---

## 2. A Esteira de 8 Níveis de Precedência Semântica

A função `isContextualTag(tag, path)` em [`src/features/xml-comparator/application/diff-classifier.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/src/features/xml-comparator/application/diff-classifier.ts) avalia a tag e seu caminho posicional estrutural seguindo uma ordem de precedência estrita:

```text
1. Tag de Localização Fiscal? (cMun, UF, pais, xLocPrestacao)
   └── SIM ➔ PRINCIPAL (false)

2. Está dentro do Escopo do Prestador/Emitente? (emit, prest)
   └── SIM ➔ PRINCIPAL (false)

3. Campo Fiscal Conhecido ou Descrição de Serviço? (CST, vBC, xDescServ)
   └── SIM ➔ PRINCIPAL (false)

4. Identificador Documental Contextual? (serie, nDPS, dhEmi, nNFSe)
   └── SIM ➔ CONTEXTUAL (true)

5. Campo Cadastral dentro do Escopo do Tomador? (toma/xNome, dest/end/xLgr)
   └── SIM ➔ CONTEXTUAL (true)

6. Tag com Nome Explicitamente de Tomador? (cnpjTomador, emailTomador)
   └── SIM ➔ CONTEXTUAL (true)

7. Nenhuma das anteriores?
   └── FALLBACK ➔ PRINCIPAL (false)
```

---

## 3. Como Modificar as Regras no Código

### 3.1. Adicionar Novos Escopos de Tomador / Prestador
Se você estiver integrando um novo modelo de documento XML que use nomes de blocos diferentes (ex.: `destinatarioNovo` ou `fornecedorNovo`):

```typescript
// Adicionar em TOMADOR_SCOPES
export const TOMADOR_SCOPES = new Set([
  "toma",
  "tomador",
  "dest",
  "destinatario",
  "destinatarionovo", // <-- Novo escopo
]);

// Adicionar em PRESTADOR_SCOPES
export const PRESTADOR_SCOPES = new Set([
  "emit",
  "prest",
  "fornecedornovo", // <-- Novo escopo
]);
```

### 3.2. Adicionar Campos Fiscais Principais
Campos que nunca devem ser classificados como contextuais mesmo que apareçam em locais inesperados:

```typescript
export const FISCAL_PRIMARY_FIELDS = new Set([
  // ...
  "codigonovotributo",
  "aliquotadiferenciada",
]);
```

### 3.3. Adicionar Identificadores Técnicos Contextuais
Tags como hashes de transmissão, carimbos de tempo de lote ou identificadores temporários:

```typescript
export const DOCUMENT_CONTEXTUAL_FIELDS = new Set([
  // ...
  "carimbotempo",
  "idtransmissao",
]);
```

### 3.4. Adicionar Contêineres com Atributo `Id` Contextual
Na função `isContextualAttribute()`, atributos `Id` pertencentes a contêineres documentais recebem tratamento contextual:

```typescript
export const DOCUMENT_ID_CONTAINERS = new Set([
  "infdps",
  "infnfse",
  "infnfe",
  "infcte",
  "infmdfe",
  "infrps",
  "infevento",
  "meunovocontainer", // <-- Novo contêiner documental
]);
```

---

## 4. Testando as Regras Semânticas do Comparator

Todas as regras do classificador de diff possuem testes dedicados em:
[`tests/features/xml-comparator/diff-classifier.test.ts`](file:///home/joaodantas/DeveloperLabTools/WorkTools2/labtool/tests/features/xml-comparator/diff-classifier.test.ts).

Exemplo de como adicionar um novo teste:

```typescript
describe("diff-classifier: novas regras", () => {
  it("deve classificar novo campo de tomador como CONTEXTUAL_DIFF", () => {
    const kind = classifyValueDiff("novoCampoTomador", "/NFSe[1]/infDPS[1]/toma[1]/novoCampoTomador[1]");
    expect(kind).toBe("CONTEXTUAL_DIFF");
  });

  it("deve manter município dentro de tomador como VALUE_DIFF principal", () => {
    const kind = classifyValueDiff("cMun", "/NFSe[1]/infDPS[1]/toma[1]/end[1]/cMun[1]");
    expect(kind).toBe("VALUE_DIFF");
  });
});
```

Execute a verificação:

```bash
npm test tests/features/xml-comparator/diff-classifier.test.ts
```
