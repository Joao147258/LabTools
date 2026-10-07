import { describe, it, expect } from "vitest";
import { inspectXml, sanitizeXml, parseSafeDocument } from "@/features/xml-sanitizer/application";

const E2E_COMPLETE_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35230912345678000195550010000001231234567890" versao="4.00">
      <!-- Comentário com dados confidenciais do auditor fiscal -->
      <emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>DISTRIBUIDORA DE ALIMENTOS EXEMPLO LTDA</xNome>
        <xFant>EXEMPLO DISTRIBUICAO</xFant>
        <enderEmit>
          <xLgr>AVENIDA PAULISTA</xLgr>
          <nro>1578</nro>
          <xCpl>ANDAR 10</xCpl>
          <xBairro>BELA VISTA</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01310200</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>1133334444</fone>
        </enderEmit>
        <IE>123456789110</IE>
        <CRT>3</CRT>
      </emit>
      <dest>
        <CPF>98765432100</CPF>
        <xNome>CARLOS ALBERTO SILVA</xNome>
        <enderDest>
          <xLgr>RUA DAS PALMEIRAS</xLgr>
          <nro>45</nro>
          <xBairro>CENTRO</xBairro>
          <cMun>3550308</cMun>
          <xMun>SAO PAULO</xMun>
          <UF>SP</UF>
          <CEP>01001000</CEP>
        </enderDest>
        <email>carlos.silva@exemplo.com.br</email>
      </dest>
      <det nItem="1">
        <prod>
          <cProd>PROD-001</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>PRODUTO EXEMPLO TESTE</xProd>
          <NCM>84713012</NCM>
          <CFOP>5102</CFOP>
          <uCom>UN</uCom>
          <qCom>10.0000</qCom>
          <vUnCom>150.0000</vUnCom>
          <vProd>1500.00</vProd>
        </prod>
      </det>
      <infAdic>
        <infCpl><![CDATA[Pedido 999. Entregar para Carlos (CPF 987.654.321-00, fone (11) 99876-5432, email contato@cliente.com).]]></infCpl>
      </infAdic>
      <observacoesMistas>
        Texto introdutório com CNPJ 12.345.678/0001-95 da filial
        <chaveInterna>VAL-777</chaveInterna>
        Texto de encerramento com fone (11) 98765-4321
      </observacoesMistas>
    </infNFe>
    <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
      <SignedInfo>
        <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
        <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
        <DigestValue>dGVzdGUxMjM=</DigestValue>
      </SignedInfo>
      <SignatureValue>YXNzaW5hdHVyYXRlc3Rl</SignatureValue>
    </Signature>
  </NFe>
</nfeProc>`;

describe("XML Privacy — End-to-End Motor Integration", () => {
  it("deve executar o fluxo completo de inspeção, sanitização determinística e validação de documento", () => {
    // 1. Inspecionar XML
    const fields = inspectXml(E2E_COMPLETE_FIXTURE);
    expect(fields.length).toBeGreaterThan(0);

    // Validar classificação dos principais nós
    const cnpjField = fields.find((f) => f.tag === "CNPJ");
    expect(cnpjField?.category).toBe("CNPJ");
    expect(cnpjField?.action).toBe("REPLACE");
    expect(cnpjField?.selected).toBe(true);

    const cpfField = fields.find((f) => f.tag === "CPF");
    expect(cpfField?.category).toBe("CPF");
    expect(cpfField?.action).toBe("REPLACE");

    const emailField = fields.find((f) => f.tag === "email");
    expect(emailField?.category).toBe("CONTATO");

    const infCplField = fields.find((f) => f.tag === "infCpl");
    expect(infCplField?.category).toBe("TEXTO_LIVRE");
    expect(infCplField?.action).toBe("SCRUB_TEXT");

    const signatureField = fields.find((f) => f.tag === "Signature");
    expect(signatureField?.category).toBe("ASSINATURA");
    expect(signatureField?.action).toBe("REMOVE_SUBTREE");

    // 2. Sanitizar XML com seleção padrão
    const result = sanitizeXml(E2E_COMPLETE_FIXTURE, fields);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);

    const sanitized = result.sanitizedXml;

    // 3. Garantir que dados sensíveis originais foram removidos
    expect(sanitized).not.toContain("12345678000195");
    expect(sanitized).not.toContain("98765432100");
    expect(sanitized).not.toContain("987.654.321-00");
    expect(sanitized).not.toContain("DISTRIBUIDORA DE ALIMENTOS EXEMPLO LTDA");
    expect(sanitized).not.toContain("CARLOS ALBERTO SILVA");
    expect(sanitized).not.toContain("carlos.silva@exemplo.com.br");
    expect(sanitized).not.toContain("contato@cliente.com");
    expect(sanitized).not.toContain("99876-5432");
    expect(sanitized).not.toContain("98765-4321");
    expect(sanitized).not.toContain("Comentário com dados confidenciais");
    expect(sanitized).not.toContain("SignatureValue");
    expect(sanitized).not.toContain("DigestValue");

    // 4. Garantir que a integridade estrutural, endereços, inscrições e dados fiscais foram preservados
    expect(sanitized).toContain("<cProd>PROD-001</cProd>");
    expect(sanitized).toContain("<cEAN>7891234567890</cEAN>");
    expect(sanitized).toContain("<vProd>1500.00</vProd>");
    expect(sanitized).toContain("<xLgr>AVENIDA PAULISTA</xLgr>");
    expect(sanitized).toContain("<nro>1578</nro>");
    expect(sanitized).toContain("<xBairro>BELA VISTA</xBairro>");
    expect(sanitized).toContain("<CEP>01310200</CEP>");
    expect(sanitized).toContain("<IE>123456789110</IE>");
    expect(sanitized).toContain("<cMun>3550308</cMun>");
    expect(sanitized).toContain("<xMun>SAO PAULO</xMun>");
    expect(sanitized).toContain("<UF>SP</UF>");
    expect(sanitized).toContain("<chaveInterna>VAL-777</chaveInterna>");
    expect(sanitized).toContain("<?xml version=\"1.0\" encoding=\"UTF-8\"?>");

    // 5. Garantir que os tokens determinísticos foram gerados
    expect(sanitized).toContain("[CNPJ_001]");
    expect(sanitized).toContain("[CPF_001]");
    expect(sanitized).toContain("[NOME_001]");
    expect(sanitized).toContain("[NOME_002]");
    expect(sanitized).toContain("[CONTATO_001]");

    // 6. Garantir que o XML final sanitizado é 100% válido e parseável
    const parsedDoc = parseSafeDocument(sanitized);
    expect(parsedDoc.documentElement).not.toBeNull();
    expect(parsedDoc.documentElement.localName).toBe("nfeProc");

    // 7. Validar contadores do sumário
    expect(result.summary.fieldsFound).toBe(fields.length);
    expect(result.summary.fieldsSanitized).toBeGreaterThan(0);
    expect(result.summary.fieldsReplaced).toBeGreaterThan(0);
    expect(result.summary.fieldsScrubbed).toBeGreaterThan(0);
    expect(result.summary.subtreesRemoved).toBeGreaterThanOrEqual(2); // Comentário + Signature
  });

  it("não deve remover uma tag Signature pertencente a namespace customizado não-W3C", () => {
    const customXml = `<root xmlns="urn:custom-service">
      <Signature>
        <data>Preservado</data>
      </Signature>
    </root>`;

    const fields = inspectXml(customXml);
    const sigField = fields.find((f) => f.tag === "Signature");
    expect(sigField?.action).not.toBe("REMOVE_SUBTREE");

    const result = sanitizeXml(customXml, fields);
    expect(result.success).toBe(true);
    expect(result.sanitizedXml).toContain("<Signature>");
    expect(result.sanitizedXml).toContain("<data>Preservado</data>");
  });
});
