import { describe, it, expect } from "vitest";
import {
  normalizeTagOrSegment,
  extractPathSegments,
  isInsidePrestadorScope,
  isInsideTomadorScope,
  isContextualTag,
  isContextualAttribute,
  classifyValueDiff,
  classifyAttributeDiff,
} from "@/features/xml-comparator/application/diff-classifier";

describe("XML Comparator — Semantic Diff Classifier (diff-classifier)", () => {
  describe("Normalização de Tags e Segmentos de Path", () => {
    it("deve normalizar tags com caixa mista, pontuações, namespaces e índices xpath", () => {
      expect(normalizeTagOrSegment("nfe:xNome[1]")).toBe("xnome");
      expect(normalizeTagOrSegment("inf_DPS[2]")).toBe("infdps");
      expect(normalizeTagOrSegment("toma-servico")).toBe("tomaservico");
      expect(normalizeTagOrSegment("  cMun.FG  ")).toBe("cmunfg");
    });

    it("deve extrair segmentos de caminho posicional estrutural normalizados", () => {
      const path = "/NFSe[1]/infNFSe[1]/DPS[1]/infDPS[1]/toma[1]/end[1]/xLgr[1]";
      expect(extractPathSegments(path)).toEqual([
        "nfse",
        "infnfse",
        "dps",
        "infdps",
        "toma",
        "end",
        "xlgr",
      ]);
    });
  });

  describe("Detecção de Escopo Estrutural (Tomador vs Prestador)", () => {
    it("deve identificar corretamente caminhos no escopo do tomador / destinatário", () => {
      expect(isInsideTomadorScope("/NFSe[1]/infDPS[1]/toma[1]/CNPJ[1]")).toBe(true);
      expect(isInsideTomadorScope("/NFe[1]/infNFe[1]/dest[1]/enderDest[1]/xLgr[1]")).toBe(true);
      expect(isInsideTomadorScope("/root[1]/tomadorServico[1]/xNome[1]")).toBe(true);
      expect(isInsideTomadorScope("/root[1]/identificacaoTomador[1]/email[1]")).toBe(true);
    });

    it("não deve considerar o próprio nó folha como escopo pai se não tiver ancestral tomador", () => {
      // Se for /root[1]/toma[1], o pai é /root[1] que não é tomador
      expect(isInsideTomadorScope("/root[1]/toma[1]")).toBe(false);
    });

    it("deve identificar corretamente caminhos no escopo do prestador / emitente", () => {
      expect(isInsidePrestadorScope("/NFSe[1]/infDPS[1]/prest[1]/CNPJ[1]")).toBe(true);
      expect(isInsidePrestadorScope("/NFe[1]/infNFe[1]/emit[1]/enderEmit[1]/xLgr[1]")).toBe(true);
      expect(isInsidePrestadorScope("/root[1]/prestadorServico[1]/IM[1]")).toBe(true);
      expect(isInsidePrestadorScope("/root[1]/emitente[1]/fone[1]")).toBe(true);
    });
  });

  describe("21. Testes Obrigatórios — Tomador / Destinatário", () => {
    const tomaPath = (tag: string) => `/NFSe[1]/infDPS[1]/toma[1]/${tag}[1]`;
    const tomaEndPath = (tag: string) => `/NFSe[1]/infDPS[1]/toma[1]/end[1]/${tag}[1]`;

    it("deve classificar CNPJ do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("CNPJ", tomaPath("CNPJ"))).toBe("CONTEXTUAL_DIFF");
      expect(isContextualTag("CNPJ", tomaPath("CNPJ"))).toBe(true);
    });

    it("deve classificar CPF do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("CPF", tomaPath("CPF"))).toBe("CONTEXTUAL_DIFF");
      expect(isContextualTag("CPF", tomaPath("CPF"))).toBe(true);
    });

    it("deve classificar xNome do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("xNome", tomaPath("xNome"))).toBe("CONTEXTUAL_DIFF");
      expect(isContextualTag("xNome", tomaPath("xNome"))).toBe(true);
    });

    it("deve classificar IM do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("IM", tomaPath("IM"))).toBe("CONTEXTUAL_DIFF");
      expect(isContextualTag("IM", tomaPath("IM"))).toBe(true);
    });

    it("deve classificar IE do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("IE", tomaPath("IE"))).toBe("CONTEXTUAL_DIFF");
      expect(isContextualTag("IE", tomaPath("IE"))).toBe(true);
    });

    it("deve classificar fone / telefone do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("fone", tomaPath("fone"))).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("telefone", tomaPath("telefone"))).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar email do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("email", tomaPath("email"))).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar CEP do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("CEP", tomaEndPath("CEP"))).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar logradouro / xLgr do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("xLgr", tomaEndPath("xLgr"))).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("logradouro", tomaEndPath("logradouro"))).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar número / nro do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("nro", tomaEndPath("nro"))).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("numero", tomaEndPath("numero"))).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar bairro / xBairro do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("xBairro", tomaEndPath("xBairro"))).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("bairro", tomaEndPath("bairro"))).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar complemento / xCpl do tomador como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("xCpl", tomaEndPath("xCpl"))).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("complemento", tomaEndPath("complemento"))).toBe("CONTEXTUAL_DIFF");
    });
  });

  describe("22. Testes Obrigatórios — Localização Fiscal (Precedência Principal)", () => {
    it("deve classificar cMun como VALUE_DIFF mesmo dentro do endereço do tomador", () => {
      const path = "/NFSe[1]/infDPS[1]/toma[1]/end[1]/endNac[1]/cMun[1]";
      expect(classifyValueDiff("cMun", path)).toBe("VALUE_DIFF");
      expect(isContextualTag("cMun", path)).toBe(false);
    });

    it("deve classificar UF como VALUE_DIFF mesmo dentro do endereço do tomador", () => {
      const path = "/NFSe[1]/infDPS[1]/toma[1]/end[1]/endNac[1]/UF[1]";
      expect(classifyValueDiff("UF", path)).toBe("VALUE_DIFF");
      expect(isContextualTag("UF", path)).toBe(false);
    });

    it("deve classificar cLocPrestacao e cLocIncid como VALUE_DIFF", () => {
      expect(classifyValueDiff("cLocPrestacao", "/NFSe[1]/infDPS[1]/serv[1]/locPrest[1]/cLocPrestacao[1]")).toBe("VALUE_DIFF");
      expect(classifyValueDiff("cLocIncid", "/NFSe[1]/infDPS[1]/cLocIncid[1]")).toBe("VALUE_DIFF");
      expect(classifyValueDiff("xLocPrestacao", "/NFSe[1]/infDPS[1]/xLocPrestacao[1]")).toBe("VALUE_DIFF");
      expect(classifyValueDiff("xLocIncid", "/NFSe[1]/infDPS[1]/xLocIncid[1]")).toBe("VALUE_DIFF");
    });
  });

  describe("23. Testes Obrigatórios — Prestador / Emitente (Precedência Principal)", () => {
    const prestPath = (tag: string) => `/NFSe[1]/infDPS[1]/prest[1]/${tag}[1]`;

    it("deve classificar CNPJ do prestador como VALUE_DIFF", () => {
      expect(classifyValueDiff("CNPJ", prestPath("CNPJ"))).toBe("VALUE_DIFF");
      expect(isContextualTag("CNPJ", prestPath("CNPJ"))).toBe(false);
    });

    it("deve classificar IM do prestador como VALUE_DIFF", () => {
      expect(classifyValueDiff("IM", prestPath("IM"))).toBe("VALUE_DIFF");
      expect(isContextualTag("IM", prestPath("IM"))).toBe(false);
    });

    it("deve classificar xNome do prestador como VALUE_DIFF", () => {
      expect(classifyValueDiff("xNome", prestPath("xNome"))).toBe("VALUE_DIFF");
      expect(isContextualTag("xNome", prestPath("xNome"))).toBe(false);
    });

    it("deve classificar telefone / fone do prestador como VALUE_DIFF", () => {
      expect(classifyValueDiff("fone", prestPath("fone"))).toBe("VALUE_DIFF");
      expect(isContextualTag("fone", prestPath("fone"))).toBe(false);
    });

    it("deve classificar email do prestador como VALUE_DIFF", () => {
      expect(classifyValueDiff("email", prestPath("email"))).toBe("VALUE_DIFF");
      expect(isContextualTag("email", prestPath("email"))).toBe(false);
    });

    it("deve classificar logradouro / endereço do prestador como VALUE_DIFF", () => {
      const endPrestPath = `/NFSe[1]/infDPS[1]/prest[1]/enderPrest[1]/xLgr[1]`;
      expect(classifyValueDiff("xLgr", endPrestPath)).toBe("VALUE_DIFF");
    });
  });

  describe("24. Testes Obrigatórios — Campos Fiscais / Operacionais (Precedência Principal)", () => {
    const servPath = (tag: string) => `/NFSe[1]/infDPS[1]/serv[1]/${tag}[1]`;
    const valPath = (tag: string) => `/NFSe[1]/infDPS[1]/valores[1]/${tag}[1]`;

    it("deve classificar códigos tributários como VALUE_DIFF", () => {
      expect(classifyValueDiff("cTribNac", servPath("cTribNac"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("CST", servPath("CST"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("cClassTrib", servPath("cClassTrib"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("cIndOp", servPath("cIndOp"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("cNBS", servPath("cNBS"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("tribISSQN", servPath("tribISSQN"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("tpRetISSQN", servPath("tpRetISSQN"))).toBe("VALUE_DIFF");
    });

    it("deve classificar valores e alíquotas como VALUE_DIFF", () => {
      expect(classifyValueDiff("pAliqAplic", valPath("pAliqAplic"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("vBC", valPath("vBC"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("vISSQN", valPath("vISSQN"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("vLiq", valPath("vLiq"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("vTotalRet", valPath("vTotalRet"))).toBe("VALUE_DIFF");
    });

    it("deve classificar descrições de serviço como VALUE_DIFF", () => {
      expect(classifyValueDiff("xDescServ", servPath("xDescServ"))).toBe("VALUE_DIFF");
      expect(classifyValueDiff("xTribNac", servPath("xTribNac"))).toBe("VALUE_DIFF");
    });
  });

  describe("Identificadores Técnicos do Documento e Atributos", () => {
    it("deve classificar identificadores de documento como CONTEXTUAL_DIFF", () => {
      expect(classifyValueDiff("serie", "/NFSe[1]/infDPS[1]/serie[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("nDPS", "/NFSe[1]/infDPS[1]/nDPS[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("nNFSe", "/NFSe[1]/infNFSe[1]/nNFSe[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("dhEmi", "/NFSe[1]/infDPS[1]/dhEmi[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("dCompet", "/NFSe[1]/infDPS[1]/dCompet[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("chave", "/NFSe[1]/chave[1]")).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar atributo Id de infDPS/infNFSe como CONTEXTUAL_DIFF", () => {
      expect(classifyAttributeDiff("infDPS", "Id", "/NFSe[1]/infDPS[1]")).toBe("CONTEXTUAL_DIFF");
      expect(isContextualAttribute("infDPS", "Id", "/NFSe[1]/infDPS[1]")).toBe(true);
      expect(classifyAttributeDiff("infNFSe", "Id", "/NFSe[1]/infNFSe[1]")).toBe("CONTEXTUAL_DIFF");
    });

    it("deve classificar outros atributos (versao, nItem) como ATTRIBUTE_DIFF principal", () => {
      expect(classifyAttributeDiff("NFSe", "versao", "/NFSe[1]")).toBe("ATTRIBUTE_DIFF");
      expect(classifyAttributeDiff("det", "nItem", "/NFe[1]/infNFe[1]/det[1]")).toBe("ATTRIBUTE_DIFF");
      expect(isContextualAttribute("NFSe", "versao", "/NFSe[1]")).toBe(false);
    });

    it("deve classificar tags explícitas de tomador como CONTEXTUAL_DIFF mesmo fora de wrapper", () => {
      expect(classifyValueDiff("cnpjTomador", "/root[1]/cnpjTomador[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("xNomeTomador", "/root[1]/xNomeTomador[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("cepTomador", "/root[1]/cepTomador[1]")).toBe("CONTEXTUAL_DIFF");
      expect(classifyValueDiff("destinatarioCnpj", "/root[1]/destinatarioCnpj[1]")).toBe("CONTEXTUAL_DIFF");
    });
  });
});
