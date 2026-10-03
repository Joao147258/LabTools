"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-base)",
        padding: "var(--space-xl)",
      }}
    >
      <main
        style={{
          width: "100%",
          maxWidth: "680px",
          backgroundColor: "var(--color-surface0)",
          border: "1px solid var(--color-surface1)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-2xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-xl)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.35)",
        }}
      >
        {/* Brand / Cabeçalho */}
        <header style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xs)", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "var(--font-size-ui-2xl)",
              lineHeight: "var(--line-height-ui-2xl)",
              fontWeight: 700,
              color: "var(--color-text)",
              letterSpacing: "-0.5px",
            }}
          >
            LabTools
          </h1>
          <p
            style={{
              fontSize: "var(--font-size-ui-sm)",
              color: "var(--color-subtext0)",
            }}
          >
            Plataforma técnica modular para processamento, privacidade e análise de dados.
          </p>
        </header>

        {/* ToolLauncher — Ferramentas de Navegação */}
        <nav
          aria-label="Ferramentas do LabTools"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-md)",
          }}
        >
          {/* Privacy Action */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            <span
              style={{
                fontSize: "var(--font-size-ui-xs)",
                fontWeight: 600,
                color: "var(--color-subtext1)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Privacy
            </span>
            <Link
              href="/xml-privacy"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 var(--space-lg)",
                height: "48px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-base)",
                border: "1px solid var(--color-surface1)",
                color: "var(--color-text)",
                fontSize: "var(--font-size-ui-base)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <span style={{ color: "var(--color-blue)", fontSize: "18px" }}>&#9670;</span>
                <span>Abrir Privacy</span>
              </div>
              <span style={{ color: "var(--color-blue)", fontSize: "18px" }}>&rarr;</span>
            </Link>
          </div>

          {/* Comparer Action */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-xs)" }}>
            <span
              style={{
                fontSize: "var(--font-size-ui-xs)",
                fontWeight: 600,
                color: "var(--color-subtext1)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Comparer
            </span>
            <Link
              href="/xml-comparator"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 var(--space-lg)",
                height: "48px",
                borderRadius: "var(--radius-sm)",
                backgroundColor: "var(--color-base)",
                border: "1px solid var(--color-surface1)",
                color: "var(--color-text)",
                fontSize: "var(--font-size-ui-base)",
                fontWeight: 600,
                textDecoration: "none",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                <span style={{ color: "var(--color-sapphire)", fontSize: "18px" }}>&#9670;</span>
                <span>Abrir Comparer</span>
              </div>
              <span style={{ color: "var(--color-sapphire)", fontSize: "18px" }}>&rarr;</span>
            </Link>
          </div>
        </nav>

        {/* CnpjQuickSearch — Consulta Direta */}
        <section
          aria-label="Consulta rápida de CNPJ"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-xs)",
            borderTop: "1px solid var(--color-surface1)",
            paddingTop: "var(--space-md)",
          }}
        >
          <span
            style={{
              fontSize: "var(--font-size-ui-xs)",
              fontWeight: 600,
              color: "var(--color-subtext1)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Consultar CNPJ
          </span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--space-xs)",
            }}
          >
            <input
              type="text"
              placeholder="00.000.000/0000-00"
              style={{
                flex: "1 1 240px",
                height: "44px",
                padding: "0 var(--space-md)",
                backgroundColor: "var(--color-base)",
                border: "1px solid var(--color-surface1)",
                borderRadius: "var(--radius-sm)",
                color: "var(--color-text)",
                fontFamily: "var(--font-family-code)",
                fontSize: "var(--font-size-ui-sm)",
                outline: "none",
              }}
            />
            <button
              type="submit"
              style={{
                height: "44px",
                padding: "0 var(--space-lg)",
                backgroundColor: "var(--color-blue)",
                color: "var(--color-crust)",
                border: "none",
                borderRadius: "var(--radius-sm)",
                fontSize: "var(--font-size-ui-sm)",
                fontWeight: 600,
                cursor: "pointer",
                transition: "opacity 0.15s ease",
              }}
            >
              Consultar
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
