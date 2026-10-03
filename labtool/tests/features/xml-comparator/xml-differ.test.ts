import { describe, it, expect } from "vitest";
import { loadComparatorTree } from "@/features/xml-comparator/application/comparator-parser";
import { compareXmlTrees } from "@/features/xml-comparator/application/xml-differ";

describe("XML Comparator — Differ Engine (xml-differ)", () => {
  it("deve identificar documentos idênticos sem produzir diferenças (identical === true)", () => {
    const xml = `<NFSe versao="1.00">
      <infDPS Id="DPS001">
        <xNome>Empresa Modelo</xNome>
        <CEP>85900000</CEP>
      </infDPS>
    </NFSe>`;

    const appTree = loadComparatorTree(xml);
    const rejTree = loadComparatorTree(xml);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.diffs).toHaveLength(0);
    expect(result.summary.identical).toBe(true);
    expect(result.summary.totalDiffs).toBe(0);
    expect(result.summary.valueDiffs).toBe(0);
    expect(result.summary.attributeDiffs).toBe(0);
    expect(result.summary.onlyInApproved).toBe(0);
    expect(result.summary.onlyInRejected).toBe(0);
  });

  it("deve detectar VALUE_DIFF quando elementos fiscais/operacionais correspondentes possuem valores diferentes", () => {
    const xmlApproved = `<NFSe><serv><cTribNac>010701</cTribNac></serv></NFSe>`;
    const xmlRejected = `<NFSe><serv><cTribNac>020101</cTribNac></serv></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.diffs).toHaveLength(1);
    expect(result.summary.identical).toBe(false);
    expect(result.summary.valueDiffs).toBe(1);
    expect(result.summary.totalDiffs).toBe(1);

    const diff = result.diffs[0];
    expect(diff.kind).toBe("VALUE_DIFF");
    expect(diff.path).toBe("/NFSe[1]/serv[1]/cTribNac[1]");
    expect(diff.tag).toBe("cTribNac");
    expect(diff.approvedValue).toBe("010701");
    expect(diff.rejectedValue).toBe("020101");
    expect(diff.id).toBe("VALUE_DIFF:/NFSe[1]/serv[1]/cTribNac[1]");
  });

  it("deve detectar CONTEXTUAL_DIFF quando campos cadastrais do tomador possuem valores diferentes", () => {
    const xmlApproved = `<NFSe><toma><CEP>85900000</CEP></toma></NFSe>`;
    const xmlRejected = `<NFSe><toma><CEP>85900100</CEP></toma></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.diffs).toHaveLength(1);
    expect(result.summary.identical).toBe(false);
    expect(result.summary.contextualDiffs).toBe(1);
    expect(result.summary.totalDiffs).toBe(0);
    expect(result.summary.hasOnlyContextualDiffs).toBe(true);

    const diff = result.diffs[0];
    expect(diff.kind).toBe("CONTEXTUAL_DIFF");
    expect(diff.path).toBe("/NFSe[1]/toma[1]/CEP[1]");
    expect(diff.tag).toBe("CEP");
    expect(diff.approvedValue).toBe("85900000");
    expect(diff.rejectedValue).toBe("85900100");
    expect(diff.id).toBe("CONTEXTUAL_DIFF:/NFSe[1]/toma[1]/CEP[1]");
  });

  it("não deve gerar divergência para diferenças que são apenas formatação de whitespace", () => {
    const xmlApproved = `<NFSe><xNome>Empresa Modelo Ltda</xNome></NFSe>`;
    const xmlRejected = `<NFSe>
      <xNome>
        Empresa   Modelo
        Ltda
      </xNome>
    </NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.diffs).toHaveLength(0);
    expect(result.summary.identical).toBe(true);
    expect(result.summary.totalDiffs).toBe(0);
  });

  it("deve detectar ATTRIBUTE_DIFF quando atributo principal possui valor divergente", () => {
    const xmlApproved = `<NFSe versao="1.00"><vServ>100.00</vServ></NFSe>`;
    const xmlRejected = `<NFSe versao="2.00"><vServ>100.00</vServ></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.diffs).toHaveLength(1);
    expect(result.summary.attributeDiffs).toBe(1);
    expect(result.summary.totalDiffs).toBe(1);

    const diff = result.diffs[0];
    expect(diff.kind).toBe("ATTRIBUTE_DIFF");
    expect(diff.path).toBe("/NFSe[1]");
    expect(diff.attributes).toEqual([
      {
        name: "versao",
        approvedValue: "1.00",
        rejectedValue: "2.00",
      },
    ]);
  });

  it("deve detectar CONTEXTUAL_DIFF quando atributo Id de infDPS possui valor divergente", () => {
    const xmlApproved = `<NFSe><infDPS Id="DPS001"><vServ>100.00</vServ></infDPS></NFSe>`;
    const xmlRejected = `<NFSe><infDPS Id="DPS002"><vServ>100.00</vServ></infDPS></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.diffs).toHaveLength(1);
    expect(result.summary.contextualDiffs).toBe(1);
    expect(result.summary.totalDiffs).toBe(0);

    const diff = result.diffs[0];
    expect(diff.kind).toBe("CONTEXTUAL_DIFF");
    expect(diff.path).toBe("/NFSe[1]/infDPS[1]");
    expect(diff.attributes).toEqual([
      {
        name: "Id",
        approvedValue: "DPS001",
        rejectedValue: "DPS002",
      },
    ]);
  });

  it("deve detectar ATTRIBUTE_DIFF quando atributo está ausente em um dos lados", () => {
    const xmlApproved = `<NFSe><infDPS versao="1.00"><vServ>100.00</vServ></infDPS></NFSe>`;
    const xmlRejected = `<NFSe><infDPS><vServ>100.00</vServ></infDPS></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.summary.attributeDiffs).toBe(1);
    expect(result.diffs[0].attributes).toEqual([
      {
        name: "versao",
        approvedValue: "1.00",
        rejectedValue: null,
      },
    ]);
  });

  it("deve detectar ONLY_IN_APPROVED quando um elemento existe apenas no documento aprovado", () => {
    const xmlApproved = `<NFSe><emit><CNPJ>123</CNPJ><cMun>3550308</cMun></emit></NFSe>`;
    const xmlRejected = `<NFSe><emit><CNPJ>123</CNPJ></emit></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.summary.onlyInApproved).toBe(1);
    expect(result.summary.totalDiffs).toBe(1);

    const diff = result.diffs[0];
    expect(diff.kind).toBe("ONLY_IN_APPROVED");
    expect(diff.path).toBe("/NFSe[1]/emit[1]/cMun[1]");
    expect(diff.tag).toBe("cMun");
    expect(diff.approvedValue).toBe("3550308");
    expect(diff.rejectedValue).toBeNull();
  });

  it("deve detectar ONLY_IN_REJECTED quando um elemento existe apenas no documento rejeitado", () => {
    const xmlApproved = `<NFSe><emit><CNPJ>123</CNPJ></emit></NFSe>`;
    const xmlRejected = `<NFSe><emit><CNPJ>123</CNPJ><xObs>Observação</xObs></emit></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.summary.onlyInRejected).toBe(1);
    expect(result.summary.totalDiffs).toBe(1);

    const diff = result.diffs[0];
    expect(diff.kind).toBe("ONLY_IN_REJECTED");
    expect(diff.path).toBe("/NFSe[1]/emit[1]/xObs[1]");
    expect(diff.tag).toBe("xObs");
    expect(diff.approvedValue).toBeNull();
    expect(diff.rejectedValue).toBe("Observação");
  });

  it("deve detectar STRUCTURE_DIFF quando há incompatibilidade de hierarquia (folha vs container)", () => {
    const xmlApproved = `<NFSe><campo><valor>123</valor></campo></NFSe>`;
    const xmlRejected = `<NFSe><campo>123</campo></NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.summary.structureDiffs).toBe(1);
    expect(result.diffs[0].kind).toBe("STRUCTURE_DIFF");
    expect(result.diffs[0].path).toBe("/NFSe[1]/campo[1]");
  });

  it("deve diferenciar elementos repetidos através de paths posicionais independentes", () => {
    const xmlApproved = `<Itens>
      <Item><Codigo>A</Codigo><Valor>10</Valor></Item>
      <Item><Codigo>B</Codigo><Valor>20</Valor></Item>
    </Itens>`;

    const xmlRejected = `<Itens>
      <Item><Codigo>A</Codigo><Valor>10</Valor></Item>
      <Item><Codigo>B</Codigo><Valor>99</Valor></Item>
    </Itens>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.diffs).toHaveLength(1);
    expect(result.diffs[0].kind).toBe("VALUE_DIFF");
    expect(result.diffs[0].path).toBe("/Itens[1]/Item[2]/Valor[1]");
    expect(result.diffs[0].approvedValue).toBe("20");
    expect(result.diffs[0].rejectedValue).toBe("99");
  });

  it("deve registrar divergência estrutural quando as tags raiz forem diferentes", () => {
    const xmlApproved = `<NFSe><id>1</id></NFSe>`;
    const xmlRejected = `<NFe><id>1</id></NFe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    expect(result.summary.structureDiffs).toBe(1);
    expect(result.diffs[0].kind).toBe("STRUCTURE_DIFF");
    expect(result.diffs[0].tag).toBe("NFSe / NFe");
  });

  it("deve calcular corretamente o summary com múltiplas divergências de tipos variados", () => {
    const xmlApproved = `<NFSe versao="1.00">
      <infDPS Id="DPS001">
        <emit><CNPJ>11111111000111</CNPJ><cMun>3550308</cMun></emit>
        <toma><CEP>85900000</CEP></toma>
      </infDPS>
    </NFSe>`;

    const xmlRejected = `<NFSe versao="2.00">
      <infDPS Id="DPS001">
        <emit><CNPJ>11111111000111</CNPJ></emit>
        <toma><CEP>85900100</CEP><xEmail>email@teste.com</xEmail></toma>
      </infDPS>
    </NFSe>`;

    const appTree = loadComparatorTree(xmlApproved);
    const rejTree = loadComparatorTree(xmlRejected);

    const result = compareXmlTrees(appTree, rejTree);

    // Esperado:
    // 1 ATTRIBUTE_DIFF (versao="1.00" vs "2.00")
    // 1 ONLY_IN_APPROVED (<cMun>)
    // 1 CONTEXTUAL_DIFF (<CEP> do tomador)
    // 1 ONLY_IN_REJECTED (<xEmail>)
    expect(result.summary.attributeDiffs).toBe(1);
    expect(result.summary.onlyInApproved).toBe(1);
    expect(result.summary.contextualDiffs).toBe(1);
    expect(result.summary.valueDiffs).toBe(0);
    expect(result.summary.onlyInRejected).toBe(1);
    expect(result.summary.totalDiffs).toBe(3);
    expect(result.summary.identical).toBe(false);
  });

  describe("25. Teste Integrado Completo (Prestador, Tomador, Localização e Fiscal)", () => {
    it("deve classificar rigorosamente divergências simultâneas de todas as naturezas", () => {
      const approvedXml = `<NFSe versao="1.00">
        <infDPS Id="DPS001">
          <dhEmi>2026-09-01T10:00:00</dhEmi>
          <prest>
            <CNPJ>11111111000111</CNPJ>
            <IM>123456</IM>
            <fone>11999991111</fone>
            <email>prestador1@empresa.com</email>
          </prest>
          <toma>
            <CNPJ>22222222000122</CNPJ>
            <xNome>CLIENTE A</xNome>
            <end>
              <endNac>
                <cMun>3550308</cMun>
                <CEP>01001000</CEP>
              </endNac>
              <xLgr>RUA A</xLgr>
              <nro>10</nro>
              <xBairro>BAIRRO A</xBairro>
            </end>
          </toma>
          <serv>
            <cTribNac>010701</cTribNac>
            <CST>00</CST>
            <cNBS>101010</cNBS>
            <xDescServ>SERVICO A</xDescServ>
          </serv>
          <valores>
            <pAliqAplic>2.00</pAliqAplic>
            <vBC>1000.00</vBC>
          </valores>
        </infDPS>
      </NFSe>`;

      const rejectedXml = `<NFSe versao="1.00">
        <infDPS Id="DPS002">
          <dhEmi>2026-09-01T12:00:00</dhEmi>
          <prest>
            <CNPJ>99999999000199</CNPJ>
            <IM>654321</IM>
            <fone>11999999999</fone>
            <email>prestador2@empresa.com</email>
          </prest>
          <toma>
            <CNPJ>33333333000133</CNPJ>
            <xNome>CLIENTE B</xNome>
            <end>
              <endNac>
                <cMun>3530607</cMun>
                <CEP>08700000</CEP>
              </endNac>
              <xLgr>RUA B</xLgr>
              <nro>20</nro>
              <xBairro>BAIRRO B</xBairro>
            </end>
          </toma>
          <serv>
            <cTribNac>020101</cTribNac>
            <CST>01</CST>
            <cNBS>202020</cNBS>
            <xDescServ>SERVICO B</xDescServ>
          </serv>
          <valores>
            <pAliqAplic>5.00</pAliqAplic>
            <vBC>2000.00</vBC>
          </valores>
        </infDPS>
      </NFSe>`;

      const appTree = loadComparatorTree(approvedXml);
      const rejTree = loadComparatorTree(rejectedXml);

      const result = compareXmlTrees(appTree, rejTree);

      // 1. Prestador (Divergências Principais)
      const prestCnpj = result.diffs.find((d) => d.path.includes("/prest[1]/CNPJ[1]"));
      expect(prestCnpj?.kind).toBe("VALUE_DIFF");
      const prestIm = result.diffs.find((d) => d.path.includes("/prest[1]/IM[1]"));
      expect(prestIm?.kind).toBe("VALUE_DIFF");
      const prestFone = result.diffs.find((d) => d.path.includes("/prest[1]/fone[1]"));
      expect(prestFone?.kind).toBe("VALUE_DIFF");
      const prestEmail = result.diffs.find((d) => d.path.includes("/prest[1]/email[1]"));
      expect(prestEmail?.kind).toBe("VALUE_DIFF");

      // 2. Tomador (Divergências Contextuais)
      const tomaCnpj = result.diffs.find((d) => d.path.includes("/toma[1]/CNPJ[1]"));
      expect(tomaCnpj?.kind).toBe("CONTEXTUAL_DIFF");
      const tomaNome = result.diffs.find((d) => d.path.includes("/toma[1]/xNome[1]"));
      expect(tomaNome?.kind).toBe("CONTEXTUAL_DIFF");
      const tomaCep = result.diffs.find((d) => d.path.includes("/toma[1]/end[1]/endNac[1]/CEP[1]"));
      expect(tomaCep?.kind).toBe("CONTEXTUAL_DIFF");
      const tomaLgr = result.diffs.find((d) => d.path.includes("/toma[1]/end[1]/xLgr[1]"));
      expect(tomaLgr?.kind).toBe("CONTEXTUAL_DIFF");
      const tomaNro = result.diffs.find((d) => d.path.includes("/toma[1]/end[1]/nro[1]"));
      expect(tomaNro?.kind).toBe("CONTEXTUAL_DIFF");
      const tomaBairro = result.diffs.find((d) => d.path.includes("/toma[1]/end[1]/xBairro[1]"));
      expect(tomaBairro?.kind).toBe("CONTEXTUAL_DIFF");

      // 3. Localização Fiscal (Divergência Principal)
      const tomaMun = result.diffs.find((d) => d.path.includes("/toma[1]/end[1]/endNac[1]/cMun[1]"));
      expect(tomaMun?.kind).toBe("VALUE_DIFF");

      // 4. Fiscal e Descrição (Divergências Principais)
      const servTrib = result.diffs.find((d) => d.path.includes("/serv[1]/cTribNac[1]"));
      expect(servTrib?.kind).toBe("VALUE_DIFF");
      const servCst = result.diffs.find((d) => d.path.includes("/serv[1]/CST[1]"));
      expect(servCst?.kind).toBe("VALUE_DIFF");
      const servNbs = result.diffs.find((d) => d.path.includes("/serv[1]/cNBS[1]"));
      expect(servNbs?.kind).toBe("VALUE_DIFF");
      const servDesc = result.diffs.find((d) => d.path.includes("/serv[1]/xDescServ[1]"));
      expect(servDesc?.kind).toBe("VALUE_DIFF");
      const valAliq = result.diffs.find((d) => d.path.includes("/valores[1]/pAliqAplic[1]"));
      expect(valAliq?.kind).toBe("VALUE_DIFF");
      const valBc = result.diffs.find((d) => d.path.includes("/valores[1]/vBC[1]"));
      expect(valBc?.kind).toBe("VALUE_DIFF");

      // 5. Identificadores Documentais (Contextual)
      const docId = result.diffs.find((d) => d.path.includes("/infDPS[1]") && d.tag === "infDPS");
      expect(docId?.kind).toBe("CONTEXTUAL_DIFF");
      const docDhEmi = result.diffs.find((d) => d.path.includes("/infDPS[1]/dhEmi[1]"));
      expect(docDhEmi?.kind).toBe("CONTEXTUAL_DIFF");

      // 6. Resumo e Métricas
      // Contextuais: Id(1) + dhEmi(1) + Toma(CNPJ, xNome, CEP, xLgr, nro, xBairro = 6) = 8
      expect(result.summary.contextualDiffs).toBe(8);
      // Principais: Prestador (4) + Localização cMun (1) + Fiscal/Desc (cTribNac, CST, cNBS, xDescServ, pAliqAplic, vBC = 6) = 11
      expect(result.summary.valueDiffs).toBe(11);
      expect(result.summary.totalDiffs).toBe(11);
      expect(result.summary.identical).toBe(false);
    });
  });
});
