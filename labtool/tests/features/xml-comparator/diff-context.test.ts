import { describe, it, expect } from "vitest";
import type { FormattedLine, XmlComparisonDiff } from "@/features/xml-comparator/domain";
import {
  getParentPath,
  findLineIndexByPath,
  resolveDiffContext,
} from "@/features/xml-comparator/application/diff-context";

describe("XML Comparator — Diff Context Resolver (diff-context)", () => {
  describe("getParentPath", () => {
    it("deve retornar o path do elemento pai para nós aninhados", () => {
      expect(getParentPath("/NFSe[1]/infDPS[1]/emit[1]/CNPJ[1]")).toBe(
        "/NFSe[1]/infDPS[1]/emit[1]"
      );
      expect(getParentPath("/NFSe[1]/infDPS[1]")).toBe("/NFSe[1]");
    });

    it("deve retornar null para o elemento raiz ou paths inválidos", () => {
      expect(getParentPath("/NFSe[1]")).toBeNull();
      expect(getParentPath("")).toBeNull();
      expect(getParentPath("invalid")).toBeNull();
    });
  });

  describe("findLineIndexByPath", () => {
    const lines: FormattedLine[] = [
      { text: "<?xml version=\"1.0\"?>", path: null },
      { text: "<NFSe>", path: "/NFSe[1]" },
      { text: "  <infDPS Id=\"1\">", path: "/NFSe[1]/infDPS[1]" },
      { text: "    <xNome>Teste</xNome>", path: "/NFSe[1]/infDPS[1]/xNome[1]" },
      { text: "  </infDPS>", path: "/NFSe[1]/infDPS[1]" },
      { text: "</NFSe>", path: "/NFSe[1]" },
    ];

    it("deve encontrar o índice correto da primeira linha com o path correspondente", () => {
      expect(findLineIndexByPath(lines, "/NFSe[1]")).toBe(1);
      expect(findLineIndexByPath(lines, "/NFSe[1]/infDPS[1]/xNome[1]")).toBe(3);
    });

    it("deve retornar null para paths inexistentes na lista", () => {
      expect(findLineIndexByPath(lines, "/NFSe[1]/toma[1]")).toBeNull();
      expect(findLineIndexByPath([], "/NFSe[1]")).toBeNull();
      expect(findLineIndexByPath(lines, "")).toBeNull();
    });
  });

  describe("resolveDiffContext", () => {
    const approvedLines: FormattedLine[] = [
      { text: "<NFSe>", path: "/NFSe[1]" },
      { text: "  <CEP>85900000</CEP>", path: "/NFSe[1]/CEP[1]" },
      { text: "  <cMun>3550308</cMun>", path: "/NFSe[1]/cMun[1]" },
      { text: "</NFSe>", path: "/NFSe[1]" },
    ];

    const rejectedLines: FormattedLine[] = [
      { text: "<NFSe>", path: "/NFSe[1]" },
      { text: "  <CEP>85900100</CEP>", path: "/NFSe[1]/CEP[1]" },
      { text: "  <xObs>Extra</xObs>", path: "/NFSe[1]/xObs[1]" },
      { text: "</NFSe>", path: "/NFSe[1]" },
    ];

    it("deve resolver o contexto com linhas encontradas em ambos os lados", () => {
      const diff: XmlComparisonDiff = {
        id: "VALUE_DIFF:/NFSe[1]/CEP[1]",
        kind: "VALUE_DIFF",
        path: "/NFSe[1]/CEP[1]",
        tag: "CEP",
        approvedValue: "85900000",
        rejectedValue: "85900100",
        detail: "Valor divergente",
      };

      const context = resolveDiffContext(diff, approvedLines, rejectedLines);

      expect(context.approvedLineIndex).toBe(1);
      expect(context.rejectedLineIndex).toBe(1);
      expect(context.approvedLine?.text).toContain("85900000");
      expect(context.rejectedLine?.text).toContain("85900100");
      expect(context.parentPath).toBe("/NFSe[1]");
    });

    it("deve resolver contexto para elemento presente apenas no aprovado (ONLY_IN_APPROVED)", () => {
      const diff: XmlComparisonDiff = {
        id: "ONLY_IN_APPROVED:/NFSe[1]/cMun[1]",
        kind: "ONLY_IN_APPROVED",
        path: "/NFSe[1]/cMun[1]",
        tag: "cMun",
        approvedValue: "3550308",
        rejectedValue: null,
        detail: "Exclusivo no aprovado",
      };

      const context = resolveDiffContext(diff, approvedLines, rejectedLines);

      expect(context.approvedLineIndex).toBe(2);
      expect(context.rejectedLineIndex).toBeNull();
      expect(context.approvedLine?.text).toContain("3550308");
      expect(context.rejectedLine).toBeNull();
    });

    it("deve resolver contexto para elemento presente apenas no rejeitado (ONLY_IN_REJECTED)", () => {
      const diff: XmlComparisonDiff = {
        id: "ONLY_IN_REJECTED:/NFSe[1]/xObs[1]",
        kind: "ONLY_IN_REJECTED",
        path: "/NFSe[1]/xObs[1]",
        tag: "xObs",
        approvedValue: null,
        rejectedValue: "Extra",
        detail: "Exclusivo no rejeitado",
      };

      const context = resolveDiffContext(diff, approvedLines, rejectedLines);

      expect(context.approvedLineIndex).toBeNull();
      expect(context.rejectedLineIndex).toBe(2);
      expect(context.approvedLine).toBeNull();
      expect(context.rejectedLine?.text).toContain("Extra");
    });
  });
});
