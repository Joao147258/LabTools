import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrasilApiClient } from "@/features/cnpj-intelligence/infrastructure";

describe("CNPJ Intelligence — Infrastructure: BrasilApiClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("deve retornar a empresa mapeada em caso de resposta HTTP 200", async () => {
    const mockApiResponse = {
      cnpj: "19131243000197",
      razao_social: "OPEN KNOWLEDGE BRASIL",
      situacao_cadastral: 2,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(mockApiResponse),
    } as unknown as Response);

    const client = new BrasilApiClient();
    const result = await client.findByCnpj("19131243000197");

    expect(result.cnpj).toBe("19131243000197");
    expect(result.legalName).toBe("OPEN KNOWLEDGE BRASIL");
    expect(result.registrationStatus).toBe("ATIVA");
  });

  it("deve lançar CnpjConsultError com código NOT_FOUND em caso de status 404", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as unknown as Response);

    const client = new BrasilApiClient();

    await expect(client.findByCnpj("19131243000197")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("deve lançar CnpjConsultError com código INVALID_CNPJ em caso de status 400", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    } as unknown as Response);

    const client = new BrasilApiClient();

    await expect(client.findByCnpj("19131243000197")).rejects.toMatchObject({
      code: "INVALID_CNPJ",
    });
  });

  it("deve lançar CnpjConsultError com código RATE_LIMITED em caso de status 429", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
    } as unknown as Response);

    const client = new BrasilApiClient();

    await expect(client.findByCnpj("19131243000197")).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("deve lançar CnpjConsultError com código SERVICE_UNAVAILABLE em caso de status 500", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response);

    const client = new BrasilApiClient();

    await expect(client.findByCnpj("19131243000197")).rejects.toMatchObject({
      code: "SERVICE_UNAVAILABLE",
    });
  });

  it("deve lançar CnpjConsultError com código TIMEOUT em caso de AbortError", async () => {
    const abortError = new Error("The operation was aborted");
    abortError.name = "AbortError";

    global.fetch = vi.fn().mockRejectedValue(abortError);

    const client = new BrasilApiClient();

    await expect(client.findByCnpj("19131243000197")).rejects.toMatchObject({
      code: "TIMEOUT",
    });
  });

  it("deve lançar CnpjConsultError com código NETWORK_ERROR em caso de falha de conexão", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));

    const client = new BrasilApiClient();

    await expect(client.findByCnpj("19131243000197")).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });
});
