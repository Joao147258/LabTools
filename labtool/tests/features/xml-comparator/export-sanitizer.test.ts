import { describe, it, expect } from "vitest";
import {
  createSanitizationContext,
  clearSanitizationContext,
  getOrCreateSyntheticValue,
  sanitizeXmlDocument,
  sanitizeJsonDocument,
  sanitizeTextDocument,
  sanitizeErrorDocument,
} from "@/features/xml-comparator/application/export-sanitizer";
import {
  shouldSanitizeByDefault,
  classifyExportField,
} from "@/features/xml-comparator/catalog";

describe("XML Comparator — Export Sanitizer Policy & Enforcement", () => {
  describe("1. shouldSanitizeByDefault & Classificação no Catálogo", () => {
    it("deve retornar false para ENDERECO, INSCRICAO e OUTRO", () => {
      expect(shouldSanitizeByDefault("ENDERECO")).toBe(false);
      expect(shouldSanitizeByDefault("INSCRICAO")).toBe(false);
      expect(shouldSanitizeByDefault("OUTRO")).toBe(false);
    });

    it("deve retornar true para CPF, CNPJ, NOME, RAZAO_SOCIAL, CONTATO, etc.", () => {
      expect(shouldSanitizeByDefault("CPF")).toBe(true);
      expect(shouldSanitizeByDefault("CNPJ")).toBe(true);
      expect(shouldSanitizeByDefault("NOME")).toBe(true);
      expect(shouldSanitizeByDefault("RAZAO_SOCIAL")).toBe(true);
      expect(shouldSanitizeByDefault("CONTATO")).toBe(true);
      expect(shouldSanitizeByDefault("IDENTIFICADOR_DPS")).toBe(true);
      expect(shouldSanitizeByDefault("DOCUMENTO")).toBe(true);
      expect(shouldSanitizeByDefault("ASSINATURA")).toBe(true);
      expect(shouldSanitizeByDefault("TEXTO_LIVRE")).toBe(true);
    });

    it("deve classificar todas as variações de inscrição como INSCRICAO com ação PRESERVE", () => {
      const imTags = [
        "IM",
        "im",
        "InscricaoMunicipal",
        "inscricaoMunicipal",
        "imTomador",
        "imPrestador",
        "inscricaoMunicipalTomador",
        "inscricaoMunicipalPrestador",
        "IE",
        "inscricaoEstadual",
      ];

      for (const tag of imTags) {
        const def = classifyExportField(tag);
        expect(def.category).toBe("INSCRICAO");
        expect(def.suggestedAction).toBe("PRESERVE");
      }
    });

    it("deve classificar todas as variações de endereço como ENDERECO com ação PRESERVE", () => {
      const addressTags = [
        "CEP",
        "xLgr",
        "logradouro",
        "nro",
        "numero",
        "xBairro",
        "bairro",
        "xCpl",
        "complemento",
        "endereco",
        "codigoPostal",
        "cMun",
        "xMun",
        "UF",
        "pais",
        "cPais",
        "xLocEmi",
        "xLocPrestacao",
        "xLocIncid",
        "cLocEmi",
        "cLocPrestacao",
        "cLocIncid",
        "enderNac",
        "endNac",
        "enderEmit",
        "enderDest",
        "enderToma",
        "enderPrest",
      ];

      for (const tag of addressTags) {
        const def = classifyExportField(tag);
        expect(def.category).toBe("ENDERECO");
        expect(def.suggestedAction).toBe("PRESERVE");
      }
    });
  });

  describe("2. SanitizationContext & Contadores de Placeholder", () => {
    it("não deve gerar [ENDERECO_XXX] nem [INSCRICAO_XXX] e nem incrementar contadores no getOrCreateSyntheticValue", () => {
      const context = createSanitizationContext();

      const imValue = getOrCreateSyntheticValue(context, "INSCRICAO", "123456");
      const cepValue = getOrCreateSyntheticValue(context, "ENDERECO", "08700000");

      expect(imValue).toBe("123456");
      expect(cepValue).toBe("08700000");
      expect(context.counters.has("INSCRICAO")).toBe(false);
      expect(context.counters.has("ENDERECO")).toBe(false);

      clearSanitizationContext(context);
    });

    it("deve atribuir o mesmo placeholder para o mesmo valor de CNPJ/CPF", () => {
      const context = createSanitizationContext();

      const placeholder1 = getOrCreateSyntheticValue(
        context,
        "CNPJ",
        "11.111.111/0001-11"
      );
      const placeholder2 = getOrCreateSyntheticValue(
        context,
        "CNPJ",
        "11111111000111"
      );

      expect(placeholder1).toBe("[CNPJ_001]");
      expect(placeholder2).toBe("[CNPJ_001]");
      expect(context.counters.get("CNPJ")).toBe(1);

      clearSanitizationContext(context);
    });
  });

  describe("3. sanitizeXmlDocument — Preservação de IM e Endereço & Sanitização de PIIs", () => {
    it("deve sanitizar CNPJ, CPF, Nomes e Contatos, mas PRESERVAR IM e Endereço integralmente", () => {
      const context = createSanitizationContext();
      const inputXml = `<emit>
  <CNPJ>11111111000111</CNPJ>
  <IM>123456</IM>
  <xNome>EMPRESA TESTE</xNome>

  <enderNac>
    <xLgr>AVENIDA TESTE</xLgr>
    <nro>125</nro>
    <xBairro>CENTRO</xBairro>
    <cMun>3530607</cMun>
    <UF>SP</UF>
    <CEP>08700000</CEP>
  </enderNac>

  <fone>11999999999</fone>
  <email>teste@empresa.com.br</email>
</emit>`;

      const sanitized = sanitizeXmlDocument(inputXml, context);

      // 1. PIIs e Dados Fiscais Sanitizados
      expect(sanitized).toContain("<CNPJ>[CNPJ_001]</CNPJ>");
      expect(sanitized).toContain("<xNome>[NOME_001]</xNome>");
      expect(sanitized).toContain("<fone>[CONTATO_001]</fone>");
      expect(sanitized).toContain("<email>[CONTATO_002]</email>");

      // 2. IM e Endereço PRESERVADOS
      expect(sanitized).toContain("<IM>123456</IM>");
      expect(sanitized).toContain("<xLgr>AVENIDA TESTE</xLgr>");
      expect(sanitized).toContain("<nro>125</nro>");
      expect(sanitized).toContain("<xBairro>CENTRO</xBairro>");
      expect(sanitized).toContain("<cMun>3530607</cMun>");
      expect(sanitized).toContain("<UF>SP</UF>");
      expect(sanitized).toContain("<CEP>08700000</CEP>");

      // 3. Nenhum placeholder [ENDERECO_XXX] ou [INSCRICAO_XXX]
      expect(sanitized).not.toContain("[ENDERECO_");
      expect(sanitized).not.toContain("[INSCRICAO_");
      expect(context.counters.has("ENDERECO")).toBe(false);
      expect(context.counters.has("INSCRICAO")).toBe(false);

      clearSanitizationContext(context);
    });

    it("deve aplicar a política de preservação de endereço e IM uniformemente em emit, prest e toma", () => {
      const context = createSanitizationContext();
      const multiNodeXml = `<NFSe>
  <infDPS>
    <!-- Emitente -->
    <emit>
      <CNPJ>11111111000111</CNPJ>
      <IM>IM_EMIT_111</IM>
      <xNome>EMITENTE LTDA</xNome>
      <enderEmit>
        <xLgr>RUA DO EMITENTE</xLgr>
        <nro>10</nro>
        <xBairro>BAIRRO EMIT</xBairro>
        <cMun>3550308</cMun>
        <UF>SP</UF>
        <CEP>01001000</CEP>
      </enderEmit>
    </emit>

    <!-- Prestador -->
    <prest>
      <CNPJ>22222222000122</CNPJ>
      <InscricaoMunicipal>IM_PREST_222</InscricaoMunicipal>
      <xNome>PRESTADOR SERVICOS SA</xNome>
      <enderPrest>
        <logradouro>AV DOS PRESTADORES</logradouro>
        <numero>200</numero>
        <bairro>JARDINS</bairro>
        <cMun>3304557</cMun>
        <UF>RJ</UF>
        <CEP>20000000</CEP>
      </enderPrest>
    </prest>

    <!-- Tomador -->
    <toma>
      <CPF>12345678901</CPF>
      <imTomador>IM_TOMA_333</imTomador>
      <xNome>TOMADOR PESSOA FISICA</xNome>
      <enderToma>
        <xLgr>PRACA DO TOMADOR</xLgr>
        <nro>300</nro>
        <complemento>APTO 42</complemento>
        <xBairro>CENTRO TOMA</xBairro>
        <cMun>3106200</cMun>
        <UF>MG</UF>
        <CEP>30000000</CEP>
      </enderToma>
    </toma>
  </infDPS>
</NFSe>`;

      const sanitized = sanitizeXmlDocument(multiNodeXml, context);

      // Verificação de CNPJ / CPF / Nomes Sanitizados
      expect(sanitized).toContain("<CNPJ>[CNPJ_001]</CNPJ>");
      expect(sanitized).toContain("<CNPJ>[CNPJ_002]</CNPJ>");
      expect(sanitized).toContain("<CPF>[CPF_001]</CPF>");
      expect(sanitized).toContain("<xNome>[NOME_001]</xNome>");
      expect(sanitized).toContain("<xNome>[NOME_002]</xNome>");
      expect(sanitized).toContain("<xNome>[NOME_003]</xNome>");

      // Verificação de IMs preservadas em emit, prest e toma
      expect(sanitized).toContain("<IM>IM_EMIT_111</IM>");
      expect(sanitized).toContain("<InscricaoMunicipal>IM_PREST_222</InscricaoMunicipal>");
      expect(sanitized).toContain("<imTomador>IM_TOMA_333</imTomador>");

      // Verificação de Endereços preservados em emit, prest e toma
      expect(sanitized).toContain("<xLgr>RUA DO EMITENTE</xLgr>");
      expect(sanitized).toContain("<nro>10</nro>");
      expect(sanitized).toContain("<xBairro>BAIRRO EMIT</xBairro>");
      expect(sanitized).toContain("<cMun>3550308</cMun>");
      expect(sanitized).toContain("<UF>SP</UF>");
      expect(sanitized).toContain("<CEP>01001000</CEP>");

      expect(sanitized).toContain("<logradouro>AV DOS PRESTADORES</logradouro>");
      expect(sanitized).toContain("<numero>200</numero>");
      expect(sanitized).toContain("<bairro>JARDINS</bairro>");
      expect(sanitized).toContain("<cMun>3304557</cMun>");
      expect(sanitized).toContain("<UF>RJ</UF>");
      expect(sanitized).toContain("<CEP>20000000</CEP>");

      expect(sanitized).toContain("<xLgr>PRACA DO TOMADOR</xLgr>");
      expect(sanitized).toContain("<nro>300</nro>");
      expect(sanitized).toContain("<complemento>APTO 42</complemento>");
      expect(sanitized).toContain("<xBairro>CENTRO TOMA</xBairro>");
      expect(sanitized).toContain("<cMun>3106200</cMun>");
      expect(sanitized).toContain("<UF>MG</UF>");
      expect(sanitized).toContain("<CEP>30000000</CEP>");

      // Zero tokens de endereço ou inscrição gerados
      expect(sanitized).not.toContain("[ENDERECO_");
      expect(sanitized).not.toContain("[INSCRICAO_");

      clearSanitizationContext(context);
    });

    it("deve remover bloco <Signature>", () => {
      const context = createSanitizationContext();
      const xml = `<NFSe><infDPS Id="1"/><Signature><SignedInfo><DigestValue>HASH</DigestValue></SignedInfo></Signature></NFSe>`;

      const sanitized = sanitizeXmlDocument(xml, context);
      expect(sanitized).not.toContain("Signature");
      expect(sanitized).not.toContain("HASH");

      clearSanitizationContext(context);
    });
  });

  describe("4. sanitizeJsonDocument & sanitizeTextDocument", () => {
    it("deve preservar campos de endereço e inscrição em documentos JSON sem aplicar fallback indevido", () => {
      const context = createSanitizationContext();
      const json = JSON.stringify({
        cnpj: "11111111000111",
        im: "123456",
        inscricaoMunicipal: "987654",
        logradouro: "Rua das Flores",
        numero: "123",
        cep: "01001000",
        cMun: "3550308",
        uf: "SP",
        mensagem: "Erro ao consultar CNPJ 11111111000111",
      });

      const sanitized = sanitizeJsonDocument(json, context);
      const parsed = JSON.parse(sanitized);

      expect(parsed.cnpj).toBe("[CNPJ_001]");
      expect(parsed.im).toBe("123456");
      expect(parsed.inscricaoMunicipal).toBe("987654");
      expect(parsed.logradouro).toBe("Rua das Flores");
      expect(parsed.numero).toBe("123");
      expect(parsed.cep).toBe("01001000");
      expect(parsed.cMun).toBe("3550308");
      expect(parsed.uf).toBe("SP");
      expect(parsed.mensagem).toContain("[CNPJ_001]");

      clearSanitizationContext(context);
    });

    it("deve sanitizar PIIs em mensagens de texto simples via regex defensivo", () => {
      const context = createSanitizationContext();
      const rawText = "Rejeicao: CNPJ 11.111.111/0001-11 ou CPF 123.456.789-01 com email suporte@teste.com";

      const sanitized = sanitizeTextDocument(rawText, context);
      expect(sanitized).toContain("[CNPJ_001]");
      expect(sanitized).toContain("[CPF_001]");
      expect(sanitized).toContain("[CONTATO_001]");

      clearSanitizationContext(context);
    });
  });

  describe("5. detectDocumentFormat & sanitizeErrorDocument", () => {
    it("deve detectar e sanitizar adequadamente documentos de erro", () => {
      const context = createSanitizationContext();

      const xmlErr = `<erro><CNPJ>11111111000111</CNPJ><IM>12345</IM></erro>`;
      const resXml = sanitizeErrorDocument(xmlErr, context);
      expect(resXml.format).toBe("xml");
      expect(resXml.content).toContain("[CNPJ_001]");
      expect(resXml.content).toContain("<IM>12345</IM>");

      const jsonErr = `{"cnpj": "11111111000111", "im": "12345"}`;
      const resJson = sanitizeErrorDocument(jsonErr, context);
      expect(resJson.format).toBe("json");
      expect(resJson.content).toContain("[CNPJ_001]");
      expect(resJson.content).toContain('"im": "12345"');

      clearSanitizationContext(context);
    });
  });
});
