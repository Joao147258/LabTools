#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

# ==============================================================================
# LabTool — Limpeza / Sintetização de XML para Testes
# ==============================================================================
#
# Objetivo:
#   Criar cópias sintéticas de arquivos XML sem alterar os originais.
#
# Características:
#   - percorre diretórios recursivamente;
#   - preserva a estrutura XML;
#   - substitui textos e atributos por dados sintéticos;
#   - remove comentários e processing instructions;
#   - rejeita DTD / ENTITY;
#   - gera relatório sem copiar dados originais;
#   - gera inventário simples de tags e atributos encontrados;
#   - usa apenas Python 3 + biblioteca padrão;
#   - não contém caminhos absolutos específicos da máquina.
#
# Execução:
#
#   bash ./script.sh -d ./xml-input
#
#   bash ./script.sh \
#     -d ./xml-input \
#     -o ./output/xml-limpos
#
# Variáveis opcionais:
#
#   XML_INPUT_DIR
#   XML_OUTPUT_DIR
#
# Os argumentos de CLI têm prioridade sobre as variáveis.
#
# ==============================================================================


# ==============================================================================
# 1. Utilitários
# ==============================================================================

log_info() {
  printf '[INFO] %s\n' "$*"
}

log_ok() {
  printf '[OK] %s\n' "$*"
}

log_warn() {
  printf '[AVISO] %s\n' "$*"
}

log_error() {
  printf '[ERRO] %s\n' "$*" >&2
}


# ==============================================================================
# 2. Descoberta da raiz do projeto
# ==============================================================================
#
# O script funciona tanto na raiz:
#
#   LabTool/script.sh
#
# quanto em:
#
#   LabTool/scripts/script.sh
#
# A execução pelo VS Code não depende do diretório atual do terminal.
#

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd -P
)"

if [[ -f "${SCRIPT_DIR}/package.json" ]]; then
  PROJECT_ROOT="${SCRIPT_DIR}"
elif [[ -f "${SCRIPT_DIR}/../package.json" ]]; then
  PROJECT_ROOT="$(
    cd "${SCRIPT_DIR}/.."
    pwd -P
  )"
else
  log_error "Não foi possível localizar a raiz do LabTool."
  log_error "O script deve estar na raiz do projeto ou em ./scripts/."
  exit 1
fi


# ==============================================================================
# 3. Configuração padrão
# ==============================================================================

DIR_INPUT="${XML_INPUT_DIR:-${PROJECT_ROOT}/xml-input}"
DIR_OUTPUT="${XML_OUTPUT_DIR:-${PROJECT_ROOT}/XML_Models}"

VERBOSE=false


# ==============================================================================
# 4. Ajuda
# ==============================================================================

show_help() {
  cat <<EOF
LabTool — Limpeza / Sintetização de XML

Uso:
  bash ./script.sh [opções]

Opções:
  -d, --dir <diretório>       Pasta de entrada contendo XMLs.
  -o, --output <diretório>    Pasta base para os XMLs limpos.
  -v, --verbose               Exibe cada arquivo processado.
  -h, --help                  Exibe esta ajuda.

Padrões relativos ao projeto:
  Entrada:  ./xml-input
  Saída:    ./XML_Models

Variáveis opcionais:
  XML_INPUT_DIR
  XML_OUTPUT_DIR

Exemplos:
  bash ./script.sh -d ./xml-input

  bash ./script.sh \
    -d ./xml-input \
    -o ./XML_Models
EOF
}


# ==============================================================================
# 5. Argumentos
# ==============================================================================

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h|--help)
      show_help
      exit 0
      ;;

    -d|--dir)
      if [[ $# -lt 2 ]]; then
        log_error "A opção $1 exige um diretório."
        exit 1
      fi
      DIR_INPUT="$2"
      shift 2
      ;;

    -o|--output)
      if [[ $# -lt 2 ]]; then
        log_error "A opção $1 exige um diretório."
        exit 1
      fi
      DIR_OUTPUT="$2"
      shift 2
      ;;

    -v|--verbose)
      VERBOSE=true
      shift
      ;;

    *)
      log_error "Argumento desconhecido: $1"
      printf '\n'
      show_help
      exit 1
      ;;
  esac
done


# ==============================================================================
# 6. Normalização de caminhos
# ==============================================================================

resolve_from_project() {
  local value="$1"

  if [[ "${value}" = /* ]]; then
    printf '%s\n' "${value}"
  else
    printf '%s\n' "${PROJECT_ROOT}/${value#./}"
  fi
}

DIR_INPUT="$(resolve_from_project "${DIR_INPUT}")"
DIR_OUTPUT="$(resolve_from_project "${DIR_OUTPUT}")"


# ==============================================================================
# 7. Validações
# ==============================================================================

if [[ ! -d "${DIR_INPUT}" ]]; then
  log_error "Pasta de entrada não encontrada:"
  log_error "  ${DIR_INPUT}"
  printf '\n'
  log_info "Crie ./xml-input ou informe outra pasta com -d."
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  log_error "python3 não encontrado."
  log_error "Este script usa somente a biblioteca padrão do Python."
  exit 1
fi

mkdir -p "${DIR_OUTPUT}"

DIR_INPUT="$(
  cd "${DIR_INPUT}"
  pwd -P
)"

DIR_OUTPUT="$(
  cd "${DIR_OUTPUT}"
  pwd -P
)"

# Nunca permitir saída dentro da entrada.
if [[ "${DIR_OUTPUT}" == "${DIR_INPUT}" || "${DIR_OUTPUT}" == "${DIR_INPUT}/"* ]]; then
  log_error "A pasta de saída não pode ser igual ou ficar dentro da pasta de entrada."
  exit 1
fi


# ==============================================================================
# 8. Execução
# ==============================================================================

log_info "Entrada: ${DIR_INPUT}"
log_info "Saída base: ${DIR_OUTPUT}"

python3 - "${DIR_INPUT}" "${DIR_OUTPUT}" "${VERBOSE}" <<'PY'
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
import json
import re
import secrets
import sys
import xml.etree.ElementTree as ET


# =============================================================================
# 1. Argumentos
# =============================================================================

source_dir = Path(sys.argv[1]).resolve()
output_dir = Path(sys.argv[2]).resolve()
verbose = sys.argv[3].lower() == "true"

output_dir.mkdir(mode=0o755, parents=True, exist_ok=True)


# =============================================================================
# 2. Descoberta dos XMLs
# =============================================================================

files = sorted(
    path
    for path in source_dir.rglob("*")
    if path.is_file()
    and not path.is_symlink()
    and path.suffix.lower() == ".xml"
)

if not files:
    print("[AVISO] Nenhum arquivo XML encontrado na pasta de entrada.")
    raise SystemExit(0)


# =============================================================================
# 3. Contadores e inventário
# =============================================================================

summary = Counter()
problems: list[dict[str, str | int]] = []

tag_stats: dict[str, Counter] = defaultdict(Counter)
attribute_stats: Counter[str] = Counter()


# =============================================================================
# 4. Helpers
# =============================================================================

def local_name(name: str) -> str:
    """Remove namespace/prefixo e normaliza para comparação."""
    return name.rsplit("}", 1)[-1].rsplit(":", 1)[-1].lower()


def register_namespaces(raw: bytes) -> None:
    """
    Registra namespaces encontrados para reduzir mudanças artificiais
    de prefixo durante a serialização.
    """
    try:
        for _, namespace in ET.iterparse(BytesIO(raw), events=("start-ns",)):
            prefix, uri = namespace
            # Prefixos reservados ou inválidos podem gerar ValueError.
            try:
                ET.register_namespace(prefix or "", uri)
            except ValueError:
                pass
    except ET.ParseError:
        # O parse definitivo produzirá o erro apropriado.
        pass


def synthetic_text(tag: str, value: str, serial: int) -> str:
    """
    Produz conteúdo sintético sem reutilizar o valor original.
    """
    key = tag.lower()
    stripped = value.strip()

    # Casos de controle / formatos conhecidos.
    if key == "senha":
        return "TESTE123"

    if key == "xlocemi":
        return "CIDADE TESTE"

    if key == "homologa":
        return "0"

    if key == "ndps":
        return f"{serial:015d}"

    if key == "cnpj":
        return "12345678000195"

    if key == "cpf":
        return "12345678909"

    if key in {"email", "e-mail"}:
        return "teste@example.invalid"

    if key in {"telefone", "fone", "celular"}:
        return "11999999999"

    if key in {"cep"}:
        return "01001000"

    # Datas.
    if re.fullmatch(r"\d{4}-\d{2}-\d{2}", stripped):
        return "2026-01-01"

    if re.fullmatch(r"\d{4}-\d{2}-\d{2}T.*", stripped):
        return "2026-01-01T00:00:00-03:00"

    # Inteiros.
    if re.fullmatch(r"[+-]?\d+", stripped):
        return "0" * max(1, len(stripped.lstrip("+-")))

    # Decimais.
    if re.fullmatch(r"[+-]?\d+[.,]\d+", stripped):
        return "0.00"

    return "DADO_TESTE"


def synthetic_attribute(
    element: str,
    attribute: str,
    serial: int,
) -> str:
    """
    Produz atributo sintético sem reutilizar o valor original.
    """
    element = element.lower()
    attribute = attribute.lower()

    if attribute == "id" and element == "infnfse":
        return f"NFS{serial:047d}"

    if attribute == "id" and element == "infdps":
        return f"DPS{serial:047d}"

    if attribute == "id":
        return f"IDTESTE{serial:08d}"

    if attribute == "uri":
        return "#IDTESTE"

    if attribute == "versao":
        return "1.00"

    if attribute == "nil":
        return "false"

    if attribute in {
        "algorithm",
        "schemalocation",
        "nonamespaceschemalocation",
    }:
        return "urn:labtool:teste"

    return f"ATRIBUTO_TESTE_{serial}"


def remove_non_data_nodes(parent: ET.Element) -> int:
    """
    Remove comentários e processing instructions preservados pelo parser.
    """
    removed = 0

    for child in list(parent):
        # Tags de comentários/PIs não são strings no ElementTree.
        if not isinstance(child.tag, str):
            parent.remove(child)
            removed += 1
            continue

        removed += remove_non_data_nodes(child)

    return removed


def classify_structure(root: ET.Element) -> None:
    """
    Coleta estatísticas simples de tags:
      - BLOCO: possui elementos filhos;
      - INDIVIDUAL: não possui elementos filhos.
    """
    for element in root.iter():
        if not isinstance(element.tag, str):
            continue

        name = local_name(element.tag)

        child_elements = [
            child
            for child in list(element)
            if isinstance(child.tag, str)
        ]

        if child_elements:
            tag_stats[name]["bloco"] += 1
        else:
            tag_stats[name]["individual"] += 1

        tag_stats[name]["total"] += 1

        for attr_name in element.attrib:
            attribute_stats[local_name(attr_name)] += 1


# =============================================================================
# 5. Processamento
# =============================================================================

for index, source_path in enumerate(files, start=1):
    relative_path = source_path.relative_to(source_dir)

    if verbose:
        print(f"[INFO] Processando: {relative_path}")

    try:
        raw = source_path.read_bytes()

        # Bloqueio explícito antes do parser.
        if re.search(
            br"<!\s*(?:DOCTYPE|ENTITY)\b",
            raw,
            re.IGNORECASE,
        ):
            raise ValueError("DTD/ENTITY não permitido")

        register_namespaces(raw)

        parser = ET.XMLParser(
            target=ET.TreeBuilder(
                insert_comments=True,
                insert_pis=True,
            )
        )

        root = ET.fromstring(raw, parser=parser)

        classify_structure(root)

        removed_nodes = remove_non_data_nodes(root)
        summary["comentarios_ou_pi_removidos"] += removed_nodes

        serial = 0
        file_counter = Counter()

        for element in root.iter():
            if not isinstance(element.tag, str):
                continue

            element_name = local_name(element.tag)

            # Conteúdo direto do elemento.
            if element.text and element.text.strip():
                serial += 1
                element.text = synthetic_text(
                    element_name,
                    element.text,
                    serial,
                )

                file_counter["textos"] += 1
                summary["textos_substituidos"] += 1

            # Texto fora de tags (tail).
            if element.tail and element.tail.strip():
                element.tail = "TEXTO_TESTE"
                file_counter["tails"] += 1
                summary["textos_fora_de_tags_substituidos"] += 1

            # Atributos.
            for attr_name in list(element.attrib):
                serial += 1

                attr = local_name(attr_name)

                element.set(
                    attr_name,
                    synthetic_attribute(
                        element_name,
                        attr,
                        serial,
                    ),
                )

                file_counter["atributos"] += 1
                summary["atributos_substituidos"] += 1

        # Preserva a árvore relativa para evitar colisões entre nomes.
        destination = output_dir / relative_path
        destination.parent.mkdir(
            mode=0o700,
            parents=True,
            exist_ok=True,
        )

        tree = ET.ElementTree(root)
        tree.write(
            destination,
            encoding="UTF-8",
            xml_declaration=True,
        )

        # Validação simples da saída.
        ET.parse(destination)

        destination.chmod(0o600)

        summary["arquivos_gerados"] += 1

    except (OSError, ValueError, ET.ParseError) as exc:
        problems.append(
            {
                "arquivo": relative_path.as_posix(),
                "erro": type(exc).__name__,
                "motivo": str(exc),
            }
        )
        summary["arquivos_ignorados"] += 1

        print(
            f"[AVISO] Ignorado: {relative_path} "
            f"({type(exc).__name__}: {exc})"
        )


# =============================================================================
# 6. Inventário de tags
# =============================================================================

tags = []

for name, counts in sorted(tag_stats.items()):
    bloco = counts["bloco"]
    individual = counts["individual"]

    if bloco > 0 and individual == 0:
        tag_type = "BLOCO"
    elif individual > 0 and bloco == 0:
        tag_type = "INDIVIDUAL"
    else:
        tag_type = "MISTO"

    tags.append(
        {
            "tag": name,
            "tipo": tag_type,
            "ocorrencias": counts["total"],
            "comoBloco": bloco,
            "comoIndividual": individual,
        }
    )

attributes = [
    {
        "atributo": name,
        "ocorrencias": count,
    }
    for name, count in sorted(attribute_stats.items())
]


# =============================================================================
# 7. Relatórios
# =============================================================================

report = {
    "tipo": "xml_sintetico_para_testes",
    "geradoEm": datetime.now(timezone.utc).isoformat(),
    "nota": (
        "Os arquivos gerados são cópias sintéticas para teste. "
        "Não devem ser tratados como documentos fiscalmente válidos. "
        "Assinaturas digitais e referências criptográficas podem deixar "
        "de ser válidas após a transformação."
    ),
    "arquivosOrigemEncontrados": len(files),
    "contagens": dict(summary),
    "erros": problems,
}

report_path = output_dir / "relatorio.json"
report_path.write_text(
    json.dumps(
        report,
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
report_path.chmod(0o600)

tags_path = output_dir / "tags-encontradas.json"
tags_path.write_text(
    json.dumps(
        {
            "tags": tags,
            "atributos": attributes,
        },
        ensure_ascii=False,
        indent=2,
    ),
    encoding="utf-8",
)
tags_path.chmod(0o600)

unique_tags_path = output_dir / "tags-unicas.txt"
unique_tags_path.write_text(
    "\n".join(
        f"{item['tag']} [{item['tipo']}]"
        for item in tags
    )
    + ("\n" if tags else ""),
    encoding="utf-8",
)
unique_tags_path.chmod(0o600)


# =============================================================================
# 8. Limpeza da pasta de entrada
# =============================================================================

deleted_count = 0
for item in sorted(source_dir.glob("**/*"), reverse=True):
    if item.is_file() or item.is_symlink():
        try:
            item.unlink()
            deleted_count += 1
        except OSError as e:
            print(f"[AVISO] Não foi possível remover {item.name}: {e}")
    elif item.is_dir() and not any(item.iterdir()):
        try:
            item.rmdir()
        except OSError:
            pass


# =============================================================================
# 9. Resultado
# =============================================================================

print()
print("[OK] Limpeza e sintetização concluídas.")
print(f"Saída: {output_dir}")
print(f"XMLs encontrados: {len(files)}")
print(f"XMLs gerados: {summary['arquivos_gerados']}")
print(f"XMLs ignorados: {summary['arquivos_ignorados']}")
print(f"Textos substituídos: {summary['textos_substituidos']}")
print(f"Atributos substituídos: {summary['atributos_substituidos']}")
print(
    "Comentários/PIs removidos: "
    f"{summary['comentarios_ou_pi_removidos']}"
)
print(f"Arquivos removidos da entrada: {deleted_count}")
print("Relatório: relatorio.json")
print("Inventário: tags-encontradas.json")
print("Tags únicas: tags-unicas.txt")

PY

log_ok "Processamento finalizado."