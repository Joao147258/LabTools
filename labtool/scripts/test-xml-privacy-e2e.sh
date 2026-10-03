#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

# ==============================================================================
# LabTool — Runner E2E de Validação da Feature XML Privacy
# ==============================================================================

SCRIPT_DIR="$(
  cd "$(dirname "${BASH_SOURCE[0]}")"
  pwd -P
)"

PROJECT_ROOT="$(
  cd "${SCRIPT_DIR}/.."
  pwd -P
)"

cd "${PROJECT_ROOT}"

printf '\n'
printf '[INFO] Iniciando validação E2E e testes automatizados da feature XML Privacy...\n'

npm run test:e2e:xml-privacy

printf '[OK] Validação E2E da feature XML Privacy concluída com sucesso.\n\n'
