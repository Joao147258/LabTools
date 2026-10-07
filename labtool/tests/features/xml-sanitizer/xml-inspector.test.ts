import { describe, it, expect } from "vitest";
import { inspectXml } from "@/features/xml-sanitizer/application/xml-inspector";
import {
  classifyTag,
  shouldSelectByDefault,
} from "@/features/xml-sanitizer/catalog/sensitive-tags";

describe("XML Privacy — XML Inspector", () => {
  describe("Classificação de Tags e Catálogo de Privacidade", () => {
    it("deve classificar todas as variações de Razão Social como RAZAO_SOCIAL e REPLACE", () => {
      const razaoTags = [
        "razao_social",
        "razao_social_destinatario",
        "razao_social_destinatario_cbsibs",
        "razao_social_prestador",
        "razao_social_prestador_cbsibs",
        "razaoSocialTomador",
        "razaoSocialIntermediario",
        "xRazaoSocial",
        "xrazao",
        "razsoc",
        "nome_empresarial",
        "nome_empresarial_destinatario",
        "xnomerec",
        "xnomedest",
      ];

      for (const tag of razaoTags) {
        const classification = classifyTag(tag);
        expect(classification).toEqual({
          category: "RAZAO_SOCIAL",
          suggestedAction: "REPLACE",
        });
      }

      expect(shouldSelectByDefault("RAZAO_SOCIAL")).toBe(true);
    });

    it("deve classificar variações de Nome Pessoal como NOME e REPLACE", () => {
      const nomeTags = [
        "nome",
        "xNome",
        "nome_destinatario",
        "nome_tomador",
        "nome_prestador",
        "nome_responsavel",
        "nome_representante",
        "nome_contato",
        "nome_cliente",
        "nome_completo",
        "nome_pessoa",
      ];

      for (const tag of nomeTags) {
        const classification = classifyTag(tag);
        expect(classification).toEqual({
          category: "NOME",
          suggestedAction: "REPLACE",
        });
      }

      expect(shouldSelectByDefault("NOME")).toBe(true);
    });

    it("NÃO deve classificar pessoa_destinatario como NOME (proteção contra falso positivo)", () => {
      const classification = classifyTag("pessoa_destinatario");
      expect(classification.category).toBe("OUTRO");
      expect(classification.suggestedAction).toBe("PRESERVE");
      expect(shouldSelectByDefault("OUTRO")).toBe(false);

      const classificationCbsibs = classifyTag("pessoa_destinatario_cbsibs");
      expect(classificationCbsibs.category).toBe("OUTRO");
      expect(classificationCbsibs.suggestedAction).toBe("PRESERVE");
    });

    it("deve classificar campos de documento e contato combinados", () => {
      expect(classifyTag("cnpj_cpf_destinatario")).toEqual({
        category: "CPF",
        suggestedAction: "REPLACE",
      });
      expect(classifyTag("cnpj_cpf_prestador")).toEqual({
        category: "CPF",
        suggestedAction: "REPLACE",
      });
      expect(classifyTag("cnpj_cpf_destinatario_cbsibs")).toEqual({
        category: "CPF",
        suggestedAction: "REPLACE",
      });

      expect(classifyTag("fone_destinatario")).toEqual({
        category: "CONTATO",
        suggestedAction: "REPLACE",
      });
      expect(classifyTag("email_destinatario")).toEqual({
        category: "CONTATO",
        suggestedAction: "REPLACE",
      });
    });

    it("deve manter ENDERECO e INSCRICAO como PRESERVE e não selecionados por padrão", () => {
      const addressTags = [
        "CEP",
        "logradouro",
        "numero",
        "nro",
        "complemento",
        "bairro",
        "municipio",
        "UF",
        "pais",
      ];
      for (const tag of addressTags) {
        const classification = classifyTag(tag);
        expect(classification.category).toBe("ENDERECO");
        expect(classification.suggestedAction).toBe("PRESERVE");
      }
      expect(shouldSelectByDefault("ENDERECO")).toBe(false);

      const inscricaoTags = [
        "IM",
        "IE",
        "InscricaoMunicipal",
        "InscricaoEstadual",
        "im_destinatario",
        "ie_destinatario",
      ];
      for (const tag of inscricaoTags) {
        const classification = classifyTag(tag);
        expect(classification.category).toBe("INSCRICAO");
        expect(classification.suggestedAction).toBe("PRESERVE");
      }
      expect(shouldSelectByDefault("INSCRICAO")).toBe(false);
    });
  });

  describe("Validações Defensivas de Entrada", () => {
    it("deve rejeitar XML vazio ou composto apenas por espaços", () => {
      expect(() => inspectXml("")).toThrow("XML vazio ou inválido.");
      expect(() => inspectXml("   \n\t  ")).toThrow("XML vazio ou inválido.");
    });

    it("deve rejeitar XML que contenha declarações DOCTYPE", () => {
      const xml = `<?xml version="1.0"?>
      <!DOCTYPE root [ <!ELEMENT root ANY > ]>
      <root><data>123</data></root>`;
      expect(() => inspectXml(xml)).toThrow(
        "Declarações de DOCTYPE não são permitidas por motivos de segurança."
      );
    });

    it("deve rejeitar XML que contenha declarações ENTITY", () => {
      const xml = `<?xml version="1.0"?>
      <!ENTITY test "payload">
      <root><data>&test;</data></root>`;
      expect(() => inspectXml(xml)).toThrow(
        "Declarações de ENTITY não são permitidas por motivos de segurança."
      );
    });

    it("deve rejeitar XML malformado ou com erros de sintaxe", () => {
      const malformedXml = `<nfeProc><NFe><infNFe></NFe></nfeProc>`;
      expect(() => inspectXml(malformedXml)).toThrow(/XML malformado/i);
    });
  });

  describe("Parsing de Elementos e Atributos Básicos", () => {
    it("deve inspecionar corretamente elementos folha e suas categorias de catálogo", () => {
      const xml = `<emit>
        <CNPJ>12345678000195</CNPJ>
        <xNome>EMPRESA MODELO LTDA</xNome>
        <xFant>MODELO TECH</xFant>
        <IE>123456789</IE>
      </emit>`;

      const fields = inspectXml(xml);

      const cnpjField = fields.find((f) => f.tag === "CNPJ");
      expect(cnpjField).toBeDefined();
      expect(cnpjField?.category).toBe("CNPJ");
      expect(cnpjField?.kind).toBe("element");
      expect(cnpjField?.action).toBe("REPLACE");
      expect(cnpjField?.selected).toBe(true);
      expect(cnpjField?.value).toBe("12345678000195");
      expect(cnpjField?.hasElementChildren).toBe(false);

      const nomeField = fields.find((f) => f.tag === "xNome");
      expect(nomeField).toBeDefined();
      expect(nomeField?.category).toBe("NOME");
      expect(nomeField?.selected).toBe(true);

      const ieField = fields.find((f) => f.tag === "IE");
      expect(ieField?.category).toBe("INSCRICAO");
      expect(ieField?.action).toBe("PRESERVE");
      expect(ieField?.selected).toBe(false);
    });

    it("deve representar elementos estruturais sem selecioná-los para substituição", () => {
      const xml = `<infNFe Id="NFe123"><emit><CNPJ>12345678000195</CNPJ></emit></infNFe>`;
      const fields = inspectXml(xml);

      const structField = fields.find((f) => f.tag === "emit");
      expect(structField).toBeDefined();
      expect(structField?.hasElementChildren).toBe(true);
      expect(structField?.selected).toBe(false);
      expect(structField?.action).toBe("PRESERVE");
      expect(structField?.value).toContain("[ESTRUTURA:");
    });

    it("deve inspecionar atributos de elementos e ignorar declarações xmlns", () => {
      const xml = `<infNFe xmlns="http://www.portalfiscal.inf.br/nfe" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" versao="4.00" Id="NFe35230912345678000195550010000001231234567890">
        <CNPJ>12345678000195</CNPJ>
      </infNFe>`;

      const fields = inspectXml(xml);

      // Não deve gerar campo para declarações xmlns
      const xmlnsFields = fields.filter((f) => f.tag.includes("xmlns"));
      expect(xmlnsFields).toHaveLength(0);

      // Deve gerar campo para versao e Id
      const versaoAttr = fields.find((f) => f.tag === "@versao");
      expect(versaoAttr).toBeDefined();
      expect(versaoAttr?.kind).toBe("attribute");
      expect(versaoAttr?.value).toBe("4.00");

      const idAttr = fields.find((f) => f.tag === "@Id");
      expect(idAttr).toBeDefined();
      expect(idAttr?.kind).toBe("attribute");
    });

    it("deve preservar o namespaceUri de elementos e atributos quando presente", () => {
      const xml = `<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe"><CNPJ>12345678000195</CNPJ></nfeProc>`;
      const fields = inspectXml(xml);

      const cnpjField = fields.find((f) => f.tag === "CNPJ");
      expect(cnpjField?.namespaceUri).toBe("http://www.portalfiscal.inf.br/nfe");
    });
  });

  describe("Regras Contextuais de Atributos Id", () => {
    it("deve classificar infDPS/@Id e infNFSe/@Id como IDENTIFICADOR_DPS com REPLACE", () => {
      const xml = `<root>
        <infDPS Id="DPS12345"><xNome>Teste</xNome></infDPS>
        <infNFSe Id="NFSE99999"><xNome>Teste 2</xNome></infNFSe>
        <outroElemento Id="OUTRO_ID"><xNome>Teste 3</xNome></outroElemento>
      </root>`;

      const fields = inspectXml(xml);

      const dpsId = fields.find((f) => f.path.includes("/infDPS[1]/@Id"));
      expect(dpsId).toBeDefined();
      expect(dpsId?.category).toBe("IDENTIFICADOR_DPS");
      expect(dpsId?.action).toBe("REPLACE");
      expect(dpsId?.selected).toBe(true);

      const nfseId = fields.find((f) => f.path.includes("/infNFSe[1]/@Id"));
      expect(nfseId).toBeDefined();
      expect(nfseId?.category).toBe("IDENTIFICADOR_DPS");
      expect(nfseId?.action).toBe("REPLACE");
      expect(nfseId?.selected).toBe(true);

      const outroId = fields.find((f) => f.path.includes("/outroElemento[1]/@Id"));
      expect(outroId).toBeDefined();
      expect(outroId?.category).not.toBe("IDENTIFICADOR_DPS");
    });
  });

  describe("Reconhecimento de Assinatura Digital XMLDSig", () => {
    it("deve reconhecer Signature com namespace XMLDSig como ASSINATURA e REMOVE_SUBTREE", () => {
      const xml = `<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
        <infNFe Id="NFe123"><CNPJ>12345678000195</CNPJ></infNFe>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo><DigestValue>xyz123==</DigestValue></SignedInfo>
          <SignatureValue>abc456==</SignatureValue>
        </Signature>
      </NFe>`;

      const fields = inspectXml(xml);

      const signatureField = fields.find((f) => f.tag === "Signature");
      expect(signatureField).toBeDefined();
      expect(signatureField?.category).toBe("ASSINATURA");
      expect(signatureField?.kind).toBe("element");
      expect(signatureField?.action).toBe("REMOVE_SUBTREE");
      expect(signatureField?.selected).toBe(true);
      expect(signatureField?.namespaceUri).toBe("http://www.w3.org/2000/09/xmldsig#");
    });

    it("não deve classificar como XMLDSig uma tag Signature pertencente a outro namespace", () => {
      const xml = `<root xmlns="http://exemplo.com/custom">
        <Signature>
          <customValue>123</customValue>
        </Signature>
      </root>`;

      const fields = inspectXml(xml);
      const signatureField = fields.find((f) => f.tag === "Signature");

      expect(signatureField).toBeDefined();
      expect(signatureField?.namespaceUri).toBe("http://exemplo.com/custom");
      expect(signatureField?.action).not.toBe("REMOVE_SUBTREE");
    });
  });

  describe("Nós Especiais: Comentários, CDATA e Texto Misto", () => {
    it("deve detectar nós de comentário com kind='comment' e action='REMOVE_SUBTREE'", () => {
      const xml = `<root>
        <!-- Comentário com CPF 111.222.333-44 do cliente -->
        <CNPJ>12345678000195</CNPJ>
      </root>`;

      const fields = inspectXml(xml);
      const commentField = fields.find((f) => f.kind === "comment");

      expect(commentField).toBeDefined();
      expect(commentField?.tag).toBe("#comment");
      expect(commentField?.value).toContain("Comentário com CPF");
      expect(commentField?.action).toBe("REMOVE_SUBTREE");
      expect(commentField?.selected).toBe(true);
    });

    it("deve inspecionar elemento folha contendo seção CDATA com o valor textual e categoria da tag", () => {
      const xml = `<root>
        <xNome><![CDATA[EMPRESA TESTE EM CDATA LTDA]]></xNome>
        <infCpl><![CDATA[Observações com telefone (11) 99999-8888]]></infCpl>
      </root>`;

      const fields = inspectXml(xml);

      const nomeField = fields.find((f) => f.tag === "xNome");
      expect(nomeField).toBeDefined();
      expect(nomeField?.kind).toBe("element");
      expect(nomeField?.category).toBe("NOME");
      expect(nomeField?.value).toBe("EMPRESA TESTE EM CDATA LTDA");

      const infCplField = fields.find((f) => f.tag === "infCpl");
      expect(infCplField).toBeDefined();
      expect(infCplField?.category).toBe("TEXTO_LIVRE");
      expect(infCplField?.action).toBe("SCRUB_TEXT");
      expect(infCplField?.value).toContain("Observações com telefone");
    });

    it("deve detectar texto misto sob elementos estruturais com kind='text' e action='SCRUB_TEXT'", () => {
      const xml = `<Descricao>
        Texto introdutório com cliente João
        <Codigo>100</Codigo>
        Texto conclusivo com CPF 123.456.789-00
      </Descricao>`;

      const fields = inspectXml(xml);

      const textFields = fields.filter((f) => f.kind === "text");
      expect(textFields.length).toBeGreaterThanOrEqual(1);

      for (const textField of textFields) {
        expect(textField.tag).toBe("#text");
        expect(textField.category).toBe("TEXTO_LIVRE");
        expect(textField.action).toBe("SCRUB_TEXT");
        expect(textField.selected).toBe(true);
      }
    });
  });

  describe("Diferenciação de Irmãos de Mesmo Nome e Paths", () => {
    it("deve indexar corretamente elementos irmãos repetidos no path", () => {
      const xml = `<root>
        <item><CNPJ>11111111000111</CNPJ></item>
        <item><CNPJ>22222222000122</CNPJ></item>
        <item><CNPJ>33333333000133</CNPJ></item>
      </root>`;

      const fields = inspectXml(xml);

      const cnpjFields = fields.filter((f) => f.tag === "CNPJ");
      expect(cnpjFields).toHaveLength(3);

      expect(cnpjFields[0].path).toBe("/root[1]/item[1]/CNPJ[1]");
      expect(cnpjFields[0].value).toBe("11111111000111");

      expect(cnpjFields[1].path).toBe("/root[1]/item[2]/CNPJ[1]");
      expect(cnpjFields[1].value).toBe("22222222000122");

      expect(cnpjFields[2].path).toBe("/root[1]/item[3]/CNPJ[1]");
      expect(cnpjFields[2].value).toBe("33333333000133");
    });
  });

  describe("Ordenação por Prioridade Funcional", () => {
    it("deve posicionar campos selecionados e assinaturas antes de estruturas", () => {
      const xml = `<root>
        <estrutura>
          <xNome>Teste</xNome>
          <campoDesconhecido>Valor</campoDesconhecido>
        </estrutura>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#"><SignedInfo/></Signature>
      </root>`;

      const fields = inspectXml(xml);

      // O primeiro campo deve ser xNome (selecionado por padrão)
      expect(fields[0].tag).toBe("xNome");
      expect(fields[0].selected).toBe(true);

      // Signature deve estar entre as prioridades iniciais
      const sigIndex = fields.findIndex((f) => f.tag === "Signature");
      expect(sigIndex).toBeGreaterThanOrEqual(0);

      // Elementos estruturais devem vir por último
      const lastField = fields[fields.length - 1];
      expect(lastField.hasElementChildren).toBe(true);
    });
  });
});
