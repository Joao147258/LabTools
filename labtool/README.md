# LabTool — Next.js Application

Este diretório contém a implementação da aplicação web **LabTool** construída com Next.js 16 (App Router), React 19, TypeScript e Vitest.

Para a documentação completa do projeto, consulte o [README principal da raiz](../README.md).

---

## 🚀 Comandos Disponíveis

```bash
# Iniciar servidor de desenvolvimento local
npm run dev

# Gerar build de produção otimizado
npm run build

# Iniciar servidor em produção
npm start

# Executar suíte de testes automatizados (181 testes)
npm test

# Executar testes em modo watch
npm run test:watch

# Checagem estrita de tipos TypeScript
npm run typecheck

# Validação de linting com ESLint
npm run lint

# Varredura de segurança de contexto e portabilidade
npm run scan:context

# Pipeline completo de validação (Scan + Typecheck + Lint + Test + Build)
npm run validate
```

---

## 🏛️ Estrutura da Aplicação

- `src/app/`: Rotas Next.js App Router (`/`, `/xml-privacy`, `/xml-comparator`).
- `src/features/`: Módulos independentes com Clean Architecture (`xml-privacy`, `xml-comparator`, `cnpj-intelligence`).
- `src/shared/`: Componentes e utilitários transversais.
- `tests/`: Suíte de testes unitários e de integração organizados por feature.
