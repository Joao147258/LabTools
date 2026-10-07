/**
 * XML Privacy — Domain Types
 *
 * Define o vocabulário, tipos de dados e contratos fundamentais para
 * o domínio de privacidade, inspeção e sanitização de XMLs.
 *
 * Não depende de frameworks visuais, APIs externas ou bibliotecas de terceiros.
 */

/**
 * Classificação semântica de um campo ou tag encontrada no documento XML.
 *
 * Descreve a natureza da informação contida (ex.: documento pessoal, contato,
 * credencial, endereço ou texto livre), permitindo aplicar políticas declarativas
 * de privacidade sem acoplar a lógica ao algoritmo de sanitização.
 */
export type FieldCategory =
  | "CPF"
  | "CNPJ"
  | "DOCUMENTO"
  | "CREDENCIAIS"
  | "NOME"
  | "RAZAO_SOCIAL"
  | "CONTATO"
  | "INSCRICAO"
  | "ENDERECO"
  | "TEXTO_LIVRE"
  | "IDENTIFICADOR_DPS"
  | "ASSINATURA"
  | "OUTRO";

/**
 * Ação de transformação ou mascaramento que será aplicada sobre um campo sensível.
 *
 * - PRESERVE: Mantém o valor original inalterado.
 * - REPLACE: Substitui integralmente o valor por um dado sintético/mascarado.
 * - SCRUB_TEXT: Preserva a estrutura do texto, anonimizando apenas padrões sensíveis internos (ex.: CPFs em observações).
 * - REMOVE_SUBTREE: Remove o nó e todos os seus elementos filhos da árvore XML.
 */
export type SanitizationAction =
  | "PRESERVE"
  | "REPLACE"
  | "SCRUB_TEXT"
  | "REMOVE_SUBTREE";

/**
 * Natureza estrutural do nó identificado dentro da hierarquia do XML.
 *
 * - element: Nó de elemento XML padrão (<tag>conteúdo</tag>).
 * - attribute: Atributo pertencente a um elemento (<tag atributo="valor"/>).
 * - text: Bloco de nó textual ou conteúdo de texto misto.
 * - comment: Bloco de comentário XML (<!-- comentário -->).
 * - cdata: Seção CDATA contendo texto não escapado (<![CDATA[...]]>).
 */
export type XmlFieldKind =
  | "element"
  | "attribute"
  | "text"
  | "comment"
  | "cdata";

/**
 * Representa um campo ou nó inspecionado no documento XML.
 *
 * Consolida as informações estruturais do nó, sua categoria de sensibilidade inferida
 * pelo catálogo/contexto, a ação de sanitização atribuída, seu namespace e se está selecionado
 * para participar do processo de higienização.
 */
export interface XmlField {
  /** Identificador determinístico único derivado da posição estrutural */
  id: string;
  /** Nome da tag XML, atributo (@nome) ou identificador especial (#text, #comment, #cdata) */
  tag: string;
  /** Caminho semântico e legível no documento (ex.: /nfeProc[1]/NFe[1]/infNFe[1]/emit[1]/CNPJ[1]) */
  path: string;
  /** Valor textual contido no nó ou resumo sintético para nós estruturais */
  value: string;
  /** Namespace URI associado ao elemento ou atributo, se existir */
  namespaceUri: string | null;
  /** Categoria de privacidade atribuída */
  category: FieldCategory;
  /** Tipo estrutural do nó na árvore XML */
  kind: XmlFieldKind;
  /** Ação de sanitização sugerida ou atribuída */
  action: SanitizationAction;
  /** Indica se o campo está marcado para sanitização */
  selected: boolean;
  /** Indica se o elemento possui outros elementos filhos na hierarquia */
  hasElementChildren: boolean;
  /** Representação operacional posicional baseada em índices dos childNodes */
  position: number[];
}

/**
 * Métricas quantitativas consolidadas da operação de sanitização.
 */
export interface SanitizationSummary {
  /** Total de campos sensíveis identificados na inspeção */
  fieldsFound: number;
  /** Total de campos que sofreram intervenção de sanitização */
  fieldsSanitized: number;
  /** Quantidade de valores integralmente substituídos */
  fieldsReplaced: number;
  /** Quantidade de ocorrências anonimizadas via scrub em textos livres */
  fieldsScrubbed: number;
  /** Quantidade de subárvores/elementos completamente removidos */
  subtreesRemoved: number;
}

/**
 * Resultado completo retornado pela execução do motor de sanitização do XML Privacy.
 */
export interface SanitizationResult {
  /** Indica se o processo de parsing e sanitização foi concluído com sucesso */
  success: boolean;
  /** String contendo o documento XML higienizado e serializado */
  sanitizedXml: string;
  /** Resumo quantitativo das transformações aplicadas */
  summary: SanitizationSummary;
  /** Coleção detalhada dos campos inspecionados e seus estados */
  fields: XmlField[];
  /** Lista de mensagens de erro encontradas durante o processamento */
  errors: string[];
}
