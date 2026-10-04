import { NextRequest, NextResponse } from "next/server";
import { consultCnpjUseCase, CnpjConsultError } from "@/features/cnpj-intelligence/application";
import { BrasilApiClient } from "@/features/cnpj-intelligence/infrastructure";

interface RouteParams {
  params: Promise<{
    cnpj: string;
  }>;
}

export async function GET(
  _request: NextRequest,
  context: RouteParams
) {
  const { cnpj } = await context.params;

  try {
    const gateway = new BrasilApiClient();
    const company = await consultCnpjUseCase({
      cnpj,
      gateway,
    });

    return NextResponse.json(company, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof CnpjConsultError) {
      const statusMap: Record<string, number> = {
        INVALID_CNPJ: 400,
        NOT_FOUND: 404,
        RATE_LIMITED: 429,
        SERVICE_UNAVAILABLE: 503,
        TIMEOUT: 504,
        NETWORK_ERROR: 502,
        INTERNAL_ERROR: 500,
      };

      const statusCode = statusMap[err.code] || 500;
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "Não foi possível consultar os dados cadastrais.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
