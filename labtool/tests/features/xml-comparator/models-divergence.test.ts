import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  loadComparatorTree,
  compareXmlTrees,
  type ComparatorXmlNode,
} from "@/features/xml-comparator/application";

describe("XML Comparator — Testes de Modelos e Identificação de Divergências", () => {
  const modelsDir = path.resolve(process.cwd(), "XML_Models");

  function readXml(fileName: string): string {
    const filePath = path.join(modelsDir, fileName);
    return fs.readFileSync(filePath, "utf-8");
  }

  describe("1. Identificação de Divergências em Modelos Fiscais Reais", () => {
    it("Caso 1: EnviarLoteRps (Lote 5837 vs 5838) - Detecta divergências fiscais de cTribNac, cTribMun e cNBS", () => {
      const xmlA = readXml("EnviarLoteRps_L0000005837_Ri0000050214_Rf0000050214_SRPS_E0003.xml");
      const xmlB = readXml("EnviarLoteRps_L0000005838_Ri0000050214_Rf0000050214_SRPS_E0003.xml");

      const treeA = loadComparatorTree(xmlA);
      const treeB = loadComparatorTree(xmlB);
      const result = compareXmlTrees(treeA, treeB);

      expect(result.summary.identical).toBe(false);
      expect(result.summary.valueDiffs).toBe(1);
      expect(result.summary.onlyInApproved).toBe(1);
      expect(result.summary.onlyInRejected).toBe(1);

      // Divergência de Código Tributário Nacional
      const cTribNacDiff = result.diffs.find((d) => d.tag === "ns0:cTribNac");
      expect(cTribNacDiff).toBeDefined();
      expect(cTribNacDiff?.kind).toBe("VALUE_DIFF");
      expect(cTribNacDiff?.approvedValue).toBe("0.00");
      expect(cTribNacDiff?.rejectedValue).toBe("000000");

      // cTribMun exclusivo no Aprovado
      const cTribMunDiff = result.diffs.find((d) => d.tag === "ns0:cTribMun");
      expect(cTribMunDiff).toBeDefined();
      expect(cTribMunDiff?.kind).toBe("ONLY_IN_APPROVED");
      expect(cTribMunDiff?.approvedValue).toBe("DADO_TESTE");

      // cNBS exclusivo no Rejeitado
      const cNbsDiff = result.diffs.find((d) => d.tag === "ns0:cNBS");
      expect(cNbsDiff).toBeDefined();
      expect(cNbsDiff?.kind).toBe("ONLY_IN_REJECTED");
      expect(cNbsDiff?.rejectedValue).toBe("000000000");
    });

    it("Caso 2: EnviarLoteRpsSincrono (Lote 17368 vs 17369) - Detecta retenção de CSLL exclusiva e divergência contextual de endereço", () => {
      const xmlA = readXml("EnviarLoteRpsSincrono_L0000017368_Ri0000014170_Rf0000014170_S900_E0001.xml");
      const xmlB = readXml("EnviarLoteRpsSincrono_L0000017369_Ri0000014171_Rf0000014171_S900_E0001.xml");

      const treeA = loadComparatorTree(xmlA);
      const treeB = loadComparatorTree(xmlB);
      const result = compareXmlTrees(treeA, treeB);

      expect(result.summary.identical).toBe(false);
      expect(result.summary.onlyInRejected).toBe(1);
      expect(result.summary.contextualDiffs).toBe(1);

      // Retenção de CSLL presente apenas no segundo documento
      const csllDiff = result.diffs.find((d) => d.tag === "ns0:vRetCSLL");
      expect(csllDiff).toBeDefined();
      expect(csllDiff?.kind).toBe("ONLY_IN_REJECTED");
      expect(csllDiff?.rejectedValue).toBe("0.00");

      // Divergência contextual no número do endereço
      const nroDiff = result.diffs.find((d) => d.tag === "ns0:nro");
      expect(nroDiff).toBeDefined();
      expect(nroDiff?.kind).toBe("CONTEXTUAL_DIFF");
      expect(nroDiff?.approvedValue).toBe("000");
      expect(nroDiff?.rejectedValue).toBe("0000");
    });

    it("Caso 3: NFSe Padrão Nacional (Aprovado vs Rejeitado) - Detecta 22 divergências fiscais e 15 contextuais", () => {
      const xmlA = readXml("xml-aprovado-teste (1).xml");
      const xmlB = readXml("xml-rejeitado-teste.xml");

      const treeA = loadComparatorTree(xmlA);
      const treeB = loadComparatorTree(xmlB);
      const result = compareXmlTrees(treeA, treeB);

      expect(result.summary.identical).toBe(false);
      expect(result.summary.valueDiffs).toBe(21);
      expect(result.summary.onlyInApproved).toBe(1);
      expect(result.summary.contextualDiffs).toBe(15);

      // Alíquota de ISS
      const aliqDiff = result.diffs.find((d) => d.tag === "pAliqAplic");
      expect(aliqDiff).toBeDefined();
      expect(aliqDiff?.approvedValue).toBe("2.00");
      expect(aliqDiff?.rejectedValue).toBe("5.00");

      // Valor do ISSQN
      const issDiff = result.diffs.find((d) => d.tag === "vISSQN");
      expect(issDiff).toBeDefined();
      expect(issDiff?.approvedValue).toBe("174.04");
      expect(issDiff?.rejectedValue).toBe("435.10");

      // Classificação Tributária IBS/CBS
      const classTribDiff = result.diffs.find((d) => d.tag === "cClassTrib");
      expect(classTribDiff).toBeDefined();
      expect(classTribDiff?.approvedValue).toBe("000001");
      expect(classTribDiff?.rejectedValue).toBe("000002");
    });
  });

  describe("2. Robustez de Parsing sobre todos os modelos fiscais disponíveis", () => {
    it("deve carregar com sucesso a árvore normalizada de todos os XMLs em XML_Models", () => {
      const allFiles = fs.readdirSync(modelsDir).filter((f) => f.endsWith(".xml"));
      expect(allFiles.length).toBeGreaterThan(20);

      for (const file of allFiles) {
        const content = readXml(file);
        const tree: ComparatorXmlNode = loadComparatorTree(content);

        expect(tree).toBeDefined();
        expect(tree.tag).toBeTruthy();
        expect(tree.path).toBeTruthy();
      }
    });
  });
});
