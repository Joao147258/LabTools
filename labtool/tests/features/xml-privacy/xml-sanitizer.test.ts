import { describe, it, expect } from "vitest";
import { inspectXml } from "@/features/xml-privacy/application/xml-inspector";
import { sanitizeXml } from "@/features/xml-privacy/application/xml-sanitizer";

describe("XML Privacy — XML Sanitizer", () => {
  it("deve retornar erro em SanitizationResult caso o XML seja inválido ou vazio", () => {
    const result = sanitizeXml("", []);
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.sanitizedXml).toBe("");
  });

  it("deve preservar campos não selecionados ou com ação PRESERVE", () => {
    const xml = `<root>
      <CNPJ>12345678000195</CNPJ>
      <xNome>EMPRESA TESTE</xNome>
    </root>`;

    const fields = inspectXml(xml);
    // Desmarcar todos os campos
    const unselectedFields = fields.map((f) => ({ ...f, selected: false }));

    const result = sanitizeXml(xml, unselectedFields);
    expect(result.success).toBe(true);
    expect(result.sanitizedXml).toContain("12345678000195");
    expect(result.sanitizedXml).toContain("EMPRESA TESTE");
    expect(result.summary.fieldsSanitized).toBe(0);
  });

  it("deve aplicar REPLACE em elementos folha com tokens determinísticos", () => {
    const xml = `<emit>
      <CNPJ>12345678000195</CNPJ>
      <xNome>EMPRESA TESTE</xNome>
    </emit>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).not.toContain("12345678000195");
    expect(result.sanitizedXml).not.toContain("EMPRESA TESTE");
    expect(result.sanitizedXml).toContain("<CNPJ>[CNPJ_001]</CNPJ>");
    expect(result.sanitizedXml).toContain("<xNome>[NOME_001]</xNome>");
    expect(result.summary.fieldsReplaced).toBeGreaterThanOrEqual(2);
  });

  it("deve aplicar REPLACE em atributos identificadores como infDPS/@Id", () => {
    const xml = `<root>
      <infDPS Id="DPS123456789">
        <CNPJ>12345678000195</CNPJ>
      </infDPS>
    </root>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).not.toContain("DPS123456789");
    expect(result.sanitizedXml).toContain('Id="[IDENTIFICADOR_DPS_001]"');
  });

  it("deve aplicar SCRUB_TEXT em elementos de texto livre e observações", () => {
    const xml = `<root>
      <infCpl>Entrega autorizada por João, CPF 123.456.789-00, contato joao@empresa.com</infCpl>
    </root>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).not.toContain("123.456.789-00");
    expect(result.sanitizedXml).not.toContain("joao@empresa.com");
    expect(result.sanitizedXml).toContain("[CPF_001]");
    expect(result.sanitizedXml).toContain("[CONTATO_001]");
    expect(result.summary.fieldsScrubbed).toBeGreaterThanOrEqual(1);
  });

  it("deve preservar a integridade estrutural ao sanitizar texto misto com tags filhas", () => {
    const xml = `<Descricao>
      Texto inicial com CPF 111.222.333-44
      <CodigoItem>XYZ-999</CodigoItem>
      Texto final com telefone (11) 98888-7777
    </Descricao>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    // As tags filhas não podem ser destruídas
    expect(result.sanitizedXml).toContain("<CodigoItem>XYZ-999</CodigoItem>");
    expect(result.sanitizedXml).not.toContain("111.222.333-44");
    expect(result.sanitizedXml).not.toContain("98888-7777");
    expect(result.sanitizedXml).toContain("[CPF_001]");
  });

  it("deve aplicar REMOVE_SUBTREE para assinaturas digitais XMLDSig", () => {
    const xml = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
      <infNFe Id="NFe123">
        <CNPJ>12345678000195</CNPJ>
      </infNFe>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignedInfo><DigestValue>xyz==</DigestValue></SignedInfo>
        <SignatureValue>abc==</SignatureValue>
      </Signature>
      <dadosComplementares>preservado</dadosComplementares>
    </NFe>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).not.toContain("Signature");
    expect(result.sanitizedXml).not.toContain("SignedInfo");
    expect(result.sanitizedXml).toContain("<dadosComplementares>preservado</dadosComplementares>");
    expect(result.summary.subtreesRemoved).toBeGreaterThanOrEqual(1);
  });

  it("deve remover nós de comentário selecionados para REMOVE_SUBTREE", () => {
    const xml = `<root>
      <!-- Comentário com dados sensíveis do cliente -->
      <item>10</item>
    </root>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).not.toContain("Comentário com dados sensíveis");
    expect(result.sanitizedXml).toContain("<item>10</item>");
    expect(result.summary.subtreesRemoved).toBeGreaterThanOrEqual(1);
  });

  it("deve sanitizar conteúdo contido em seções CDATA", () => {
    const xml = `<root>
      <xNome><![CDATA[EMPRESA TESTE EM CDATA LTDA]]></xNome>
      <infCpl><![CDATA[Nota com telefone (11) 97777-6666 e CPF 333.444.555-66]]></infCpl>
    </root>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).not.toContain("EMPRESA TESTE EM CDATA LTDA");
    expect(result.sanitizedXml).not.toContain("97777-6666");
    expect(result.sanitizedXml).not.toContain("333.444.555-66");
    expect(result.sanitizedXml).toContain("[NOME_001]");
    expect(result.sanitizedXml).toContain("[CONTATO_001]");
    expect(result.sanitizedXml).toContain("[CPF_001]");
  });

  it("deve gerar o mesmo token sintético para o mesmo valor original na mesma execução", () => {
    const xml = `<root>
      <dest><CPF>12345678909</CPF></dest>
      <autXML><CPF>12345678909</CPF></autXML>
      <outro><CPF>98765432100</CPF></outro>
    </root>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    const countFirstToken = (result.sanitizedXml.match(/\[CPF_001\]/g) || []).length;
    expect(countFirstToken).toBe(2);
    expect(result.sanitizedXml).toContain("[CPF_002]");
  });

  it("não deve substituir o conteúdo de containers com filhos acidentalmente", () => {
    const xml = `<root>
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>Nome Empresa</xNome>
      </emit>
    </root>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).toContain("<emit>");
    expect(result.sanitizedXml).toContain("</emit>");
    expect(result.sanitizedXml).toContain("<CNPJ>[CNPJ_001]</CNPJ>");
    expect(result.sanitizedXml).toContain("<xNome>[NOME_001]</xNome>");
  });

  it("deve produzir um documento XML final válido e parseável", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
      <NFe>
        <infNFe Id="NFe35230912345678000195550010000001231234567890" versao="4.00">
          <emit>
            <CNPJ>12345678000195</CNPJ>
            <xNome>EMPRESA TESTE SA</xNome>
          </emit>
        </infNFe>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo/>
        </Signature>
      </NFe>
    </nfeProc>`;

    const fields = inspectXml(xml);
    const result = sanitizeXml(xml, fields);

    expect(result.success).toBe(true);
    expect(result.sanitizedXml).toContain("<?xml");

    // Reinspecionar o XML sanitizado para comprovar que é válido e não contém dados originais
    const reinspected = inspectXml(result.sanitizedXml);
    expect(reinspected.length).toBeGreaterThan(0);

    const cnpjAfter = reinspected.find((f) => f.tag === "CNPJ");
    expect(cnpjAfter?.value).toBe("[CNPJ_001]");
  });
});
