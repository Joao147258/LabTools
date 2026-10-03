import { describe, it, expect } from "vitest";
import {
  assertSafeXmlSource,
  parseXml,
  loadComparatorTree,
  normalizeForComparison,
  formatXmlToLines,
  countXmlElements,
  MAX_XML_LENGTH,
} from "@/features/xml-comparator/application/comparator-parser";

describe("XML Comparator — Parser (comparator-parser)", () => {
  describe("assertSafeXmlSource & Proteções de Segurança", () => {
    it("deve rejeitar string XML vazia ou composta apenas por espaços", () => {
      expect(() => assertSafeXmlSource("")).toThrow("O arquivo XML está vazio.");
      expect(() => assertSafeXmlSource("   \n\t  ")).toThrow("O arquivo XML está vazio.");
    });

    it("deve rejeitar XMLs que excedem o tamanho máximo permitido", () => {
      const hugeXml = "<root>" + "A".repeat(MAX_XML_LENGTH + 1) + "</root>";
      expect(() => assertSafeXmlSource(hugeXml)).toThrow(
        `O arquivo XML excede o tamanho máximo permitido de ${MAX_XML_LENGTH.toLocaleString("pt-BR")} caracteres.`
      );
    });

    it("deve bloquear declarações de DOCTYPE (prevenção contra XXE)", () => {
      const xmlWithDoctype = `<?xml version="1.0"?>
<!DOCTYPE note SYSTEM "note.dtd">
<note><to>Tove</to></note>`;

      expect(() => assertSafeXmlSource(xmlWithDoctype)).toThrow(
        "Declarações de DTD/DOCTYPE ou ENTITY não são permitidas por motivos de segurança."
      );
    });

    it("deve bloquear declarações de ENTITY (prevenção contra XXE / Billion Laughs)", () => {
      const xmlWithEntity = `<?xml version="1.0"?>
<!ENTITY xxe SYSTEM "file:///etc/passwd">
<data>&xxe;</data>`;

      expect(() => assertSafeXmlSource(xmlWithEntity)).toThrow(
        "Declarações de DTD/DOCTYPE ou ENTITY não são permitidas por motivos de segurança."
      );
    });
  });

  describe("parseXml & Manipulação de Sintaxe DOM", () => {
    it("deve lançar erro explicativo para XML com erro de sintaxe", () => {
      const malformedXml = `<NFSe><infDPS><CPF>12345678901</infDPS></NFSe>`;
      expect(() => parseXml(malformedXml)).toThrow(/Erro ao processar estrutura XML/);
    });

    it("deve processar XML válido e retornar XMLDocument estruturado", () => {
      const validXml = `<NFSe versao="1.00"><infDPS Id="DPS001"><xNome>Empresa Teste</xNome></infDPS></NFSe>`;
      const doc = parseXml(validXml);

      expect(doc).toBeDefined();
      expect(doc.documentElement.nodeName).toBe("NFSe");
      expect(doc.documentElement.getAttribute("versao")).toBe("1.00");
    });
  });

  describe("normalizeForComparison", () => {
    it("deve remover espaços no início/fim e colapsar quebras de linha e espaços múltiplos", () => {
      const raw = `
        Empresa    XYZ
        Ltda
      `;
      expect(normalizeForComparison(raw)).toBe("Empresa XYZ Ltda");
      expect(normalizeForComparison("")).toBe("");
    });
  });

  describe("buildComparatorTree & loadComparatorTree", () => {
    it("deve extrair atributos preservando nomes, valores e namespaces", () => {
      const xml = `<root xmlns:ds="http://www.w3.org/2000/09/xmldsig#" id="ROOT1" versao="2.0">
        <item code="A123">Conteúdo</item>
      </root>`;

      const tree = loadComparatorTree(xml);

      expect(tree.tag).toBe("root");
      expect(tree.path).toBe("/root[1]");
      expect(tree.attributes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "id", value: "ROOT1" }),
          expect.objectContaining({ name: "versao", value: "2.0" }),
        ])
      );
      expect(tree.hasElementChildren).toBe(true);
      expect(tree.children).toHaveLength(1);

      const itemChild = tree.children[0];
      expect(itemChild.tag).toBe("item");
      expect(itemChild.path).toBe("/root[1]/item[1]");
      expect(itemChild.attributes).toEqual([
        expect.objectContaining({ name: "code", value: "A123" }),
      ]);
      expect(itemChild.text).toBe("Conteúdo");
      expect(itemChild.hasElementChildren).toBe(false);
    });

    it("deve construir paths posicionais 1-based para elementos repetidos com mesmo nome", () => {
      const xml = `<Itens>
        <Item><Codigo>A</Codigo></Item>
        <Item><Codigo>B</Codigo></Item>
        <Item><Codigo>C</Codigo></Item>
      </Itens>`;

      const tree = loadComparatorTree(xml);

      expect(tree.path).toBe("/Itens[1]");
      expect(tree.children).toHaveLength(3);

      expect(tree.children[0].path).toBe("/Itens[1]/Item[1]");
      expect(tree.children[0].children[0].path).toBe("/Itens[1]/Item[1]/Codigo[1]");
      expect(tree.children[0].children[0].text).toBe("A");

      expect(tree.children[1].path).toBe("/Itens[1]/Item[2]");
      expect(tree.children[1].children[0].path).toBe("/Itens[1]/Item[2]/Codigo[1]");
      expect(tree.children[1].children[0].text).toBe("B");

      expect(tree.children[2].path).toBe("/Itens[1]/Item[3]");
      expect(tree.children[2].children[0].path).toBe("/Itens[1]/Item[3]/Codigo[1]");
      expect(tree.children[2].children[0].text).toBe("C");
    });

    it("deve processar seções CDATA como conteúdo textual direto", () => {
      const xml = `<Mensagem><![CDATA[Texto especial com <tags> e & caracteres]]></Mensagem>`;
      const tree = loadComparatorTree(xml);

      expect(tree.tag).toBe("Mensagem");
      expect(tree.text).toBe("Texto especial com <tags> e & caracteres");
      expect(tree.hasElementChildren).toBe(false);
    });

    it("deve lidar corretamente com tags self-closing / vazias", () => {
      const xml = `<root><vazio/><nulo></nulo></root>`;
      const tree = loadComparatorTree(xml);

      expect(tree.children[0].tag).toBe("vazio");
      expect(tree.children[0].text).toBe("");
      expect(tree.children[0].hasElementChildren).toBe(false);

      expect(tree.children[1].tag).toBe("nulo");
      expect(tree.children[1].text).toBe("");
    });
  });

  describe("formatXmlToLines", () => {
    it("deve gerar FormattedLine[] mapeando cada linha estrutural ao seu path posicional", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<NFSe>
  <infDPS Id="123">
    <xNome>Cliente ABC</xNome>
  </infDPS>
</NFSe>`;

      const lines = formatXmlToLines(xml);

      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0].text).toContain("<?xml");
      expect(lines[0].path).toBeNull();

      const nfseLine = lines.find((l) => l.text.includes("<NFSe>"));
      expect(nfseLine?.path).toBe("/NFSe[1]");

      const xNomeLine = lines.find((l) => l.text.includes("<xNome>"));
      expect(xNomeLine?.path).toBe("/NFSe[1]/infDPS[1]/xNome[1]");
      expect(xNomeLine?.text).toContain("Cliente ABC");
    });
  });

  describe("countXmlElements & Contagem Estrutural de Nós Elemento", () => {
    it("deve contar 1 para elemento raiz isolado", () => {
      expect(countXmlElements("<root></root>")).toBe(1);
    });

    it("deve contar 1 para elemento folha self-closing", () => {
      expect(countXmlElements("<campo/>")).toBe(1);
      expect(countXmlElements("<campo />")).toBe(1);
    });

    it("deve contar 2 para pai + filho", () => {
      expect(countXmlElements("<root><child/></root>")).toBe(2);
      expect(countXmlElements("<root><child>valor</child></root>")).toBe(2);
    });

    it("atributos não devem alterar a contagem", () => {
      const xml = `<root attr1="v1" attr2="v2" id="123"><child type="A" status="OK">1</child></root>`;
      expect(countXmlElements(xml)).toBe(2);
    });

    it("namespaces e prefixos não devem alterar a contagem", () => {
      const xml = `<nfse:root xmlns:nfse="http://exemplo.com"><nfse:child/></nfse:root>`;
      expect(countXmlElements(xml)).toBe(2);
    });

    it("comentários não devem alterar a contagem", () => {
      const xml = `<root><!-- comentário --><child/><!-- outro comentário --></root>`;
      expect(countXmlElements(xml)).toBe(2);
    });

    it("seções CDATA não devem alterar a contagem", () => {
      const xml = `<root><child><![CDATA[<tagFake>nao eh elemento</tagFake>]]></child></root>`;
      expect(countXmlElements(xml)).toBe(2);
    });

    it("texto e quebras de linha não devem alterar a contagem", () => {
      const xml = `
        <root>
          Texto solto
          <child>Mais texto</child>
        </root>
      `;
      expect(countXmlElements(xml)).toBe(2);
    });

    it("declaração XML não deve alterar a contagem", () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<root>
  <a/>
  <b>
    <c>1</c>
  </b>
</root>`;
      expect(countXmlElements(xml)).toBe(4); // root, a, b, c
    });

    it("elementos repetidos devem contar individualmente", () => {
      const xml = `<root><item>1</item><item>2</item><item>3</item></root>`;
      expect(countXmlElements(xml)).toBe(4); // root + 3 items
    });

    it("deve contar a partir de ComparatorXmlNode", () => {
      const xml = `<root><a/><b><c>1</c></b></root>`;
      const tree = loadComparatorTree(xml);
      expect(countXmlElements(tree)).toBe(4);
    });

    it("deve retornar 0 para string vazia ou inválida", () => {
      expect(countXmlElements("")).toBe(0);
      expect(countXmlElements("   ")).toBe(0);
    });
  });
});
